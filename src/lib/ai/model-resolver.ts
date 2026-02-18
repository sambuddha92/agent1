/**
 * Model Resolver
 *
 * Middleware layer between the chat API and the existing model-router.
 * Resolves the final Bedrock model to use based on:
 *   1. User's explicit model preference (fast / balanced / best / auto)
 *   2. User's subscription tier (free vs paid) — access control
 *   3. Task complexity — used when preference is 'auto'
 *
 * SAFETY GUARANTEE:
 *   If ANY part of resolution fails, this function falls back to the existing
 *   selectModel() call — the pipeline is NEVER broken.
 *
 * The existing selectModel() / classifyTier() logic in model-router.ts is
 * completely untouched.
 */

import { bedrock } from '@ai-sdk/amazon-bedrock';
import { google } from '@ai-sdk/google';
import { selectModel } from './model-router';
import { MODEL_TIER_CONFIG, canAccessPreference } from './model-tier.config';
import type { ModelPreference, UserTier } from './model-tier.config';
import type { Message, ModelSelection, ModelTier } from '@/types';

// ============================================
// Types
// ============================================

export interface ResolveModelInput {
  /** User's chosen preference from the UI selector */
  preference: ModelPreference;
  /** User's subscription tier — defaults to 'free' if unknown */
  userTier: UserTier;
  /** Full message array — passed to selectModel() for AUTO mode */
  messages: Message[];
}

export interface ResolvedModel extends ModelSelection {
  /** Whether this was an AUTO-mode selection */
  isAuto: boolean;
  /** The effective preference used (may differ from input if access was denied) */
  effectivePreference: ModelPreference;
  /** Whether the user's original preference was overridden due to access control */
  wasOverridden: boolean;
}

// ============================================
// User Tier Resolution
// ============================================

/**
 * Determine a user's subscription tier from their Supabase user metadata.
 * Defaults to 'free' if metadata is absent or unrecognized.
 * Future-ready: when a billing system is added, wire it here.
 */
export function resolveUserTier(
  userMetadata: Record<string, unknown> | null | undefined,
): UserTier {
  if (!userMetadata) return 'free';
  const plan = userMetadata['plan'];
  if (plan === 'paid' || plan === 'pro' || plan === 'premium') return 'paid';
  return 'free';
}

// ============================================
// selectAutoModel — explicit export as per spec
// ============================================

/**
 * Selects the best model for AUTO mode based on task heuristics.
 * Delegates entirely to the existing classifyTier() + selectModel() logic
 * in model-router.ts to preserve all existing behavior.
 *
 * Free users can access T1-T3 via AUTO mode.
 * Only T4-T5 (hidden tiers) are restricted to paid users.
 *
 * @param params - User tier and messages for context
 * @returns A ModelSelection using the existing router
 */
export function selectAutoModel(params: {
  userTier: UserTier;
  messages: Message[];
}): ModelSelection & { isFallback: boolean; fallbackLevel: number } {
  // Fully delegates to existing selectModel() — pass userTier for T4/T5 escalation
  const result = selectModel(params.messages, [], params.userTier);

  // Access control: only restrict T4 and T5 for free users (not T3)
  // T1-T3 are available to all users in AUTO mode
  if (params.userTier === 'free' && (result.tier === 'T4' || result.tier === 'T5')) {
    const t3Config = MODEL_TIER_CONFIG['best'];
    console.log(
      `[model-resolver] AUTO override: free user got ${result.tier}, downgrading to T3 (${t3Config.googleModelId})`,
    );
    // Use correct provider based on model type
    const isGoogleModel = t3Config.googleModelId.toLowerCase().includes('gemini');
    const model = isGoogleModel ? google(t3Config.googleModelId) : bedrock(t3Config.googleModelId);
    
    return {
      model,
      tier: 'T3' as ModelTier,
      modelId: t3Config.googleModelId,
      isFallback: false,
      fallbackLevel: 0,
    };
  }

  return result;
}

// ============================================
// canAccessTier — explicit export as per spec
// ============================================

/**
 * Access control check: can this user tier access the given model preference?
 */
export function canAccessTier(
  userTier: UserTier,
  preference: ModelPreference,
): boolean {
  return canAccessPreference(userTier, preference);
}

// ============================================
// Core Resolver
// ============================================

/**
 * Resolve the final model to use for inference.
 *
 * This is the primary entry point. It wraps the existing selectModel()
 * as a safe middleware — any failure falls back to the original behavior.
 *
 * Priority order:
 *   1. If preference === 'auto' → delegate to selectAutoModel()
 *   2. If user lacks access to preference → downgrade to 'balanced' (T2)
 *   3. If preference is 'fast'/'balanced'/'best' → use MODEL_TIER_CONFIG mapping
 *   4. On any error → fall back to existing selectModel()
 */
export function resolveModel(input: ResolveModelInput): ResolvedModel {
  const { preference, userTier, messages } = input;

  try {
    // ---- AUTO mode: fully delegate to existing router ----
    if (preference === 'auto') {
      const autoResult = selectAutoModel({ userTier, messages });
      return {
        ...autoResult,
        isAuto: true,
        effectivePreference: 'auto',
        wasOverridden: false,
      };
    }

    // ---- Access control check ----
    let effectivePreference = preference;
    let wasOverridden = false;

    if (!canAccessPreference(userTier, preference)) {
      console.warn(
        `[model-resolver] User (${userTier}) attempted to access locked preference "${preference}". Downgrading to "balanced".`,
      );
      effectivePreference = 'balanced';
      wasOverridden = true;
    }

    // ---- Explicit preference → tier config lookup ----
    const tierEntry = MODEL_TIER_CONFIG[effectivePreference as Exclude<ModelPreference, 'auto'>];

    if (!tierEntry) {
      // Unknown preference — fall back to auto
      console.warn(
        `[model-resolver] Unknown preference "${effectivePreference}", falling back to AUTO`,
      );
      const fallbackResult = selectModel(messages);
      return {
        ...fallbackResult,
        isAuto: true,
        effectivePreference: 'auto',
        wasOverridden: true,
      };
    }

    // Use Google provider for Google models, Bedrock for fallbacks
    const modelId = tierEntry.googleModelId;
    const isGoogleModel = modelId.toLowerCase().includes('gemini');
    
    // Mark known deprecated models for tracking
    const deprecatedModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    const isDeprecated = deprecatedModels.includes(modelId);
    
    if (isDeprecated) {
      console.warn(
        `[model-resolver] Model ${modelId} is known to be deprecated. Will use Bedrock fallback if API fails.`
      );
    }

    const model = isGoogleModel ? google(modelId as Parameters<typeof google>[0]) : bedrock(modelId);

    console.log(
      `[model-resolver] Resolved: preference=${preference} → effectivePreference=${effectivePreference} → modelId=${modelId} (tier=${tierEntry.internalTier}, provider=${isGoogleModel ? 'google' : 'bedrock'}, deprecated=${isDeprecated})`
    );

    return {
      model,
      tier: tierEntry.internalTier as ModelTier,
      modelId,
      isAuto: false,
      effectivePreference,
      wasOverridden,
    };
  } catch (error) {
    // ---- SAFETY FALLBACK: never break the pipeline ----
    console.error(
      '[model-resolver] Resolution failed, falling back to selectModel():',
      error
    );
    const fallbackResult = selectModel(messages);
    return {
      ...fallbackResult,
      isAuto: true,
      effectivePreference: 'auto',
      wasOverridden: true,
    };
  }
}

/**
 * Check if error is a 404 (model not found)
 * Used to detect deprecated models at runtime
 */
export function is404Error(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as Record<string, unknown>).statusCode === 404
  ) {
    return true;
  }
  return false;
}

// ============================================
// Preference Parsing (from FormData string)
// ============================================

/**
 * Safely parse a modelPreference string from FormData.
 * Returns 'auto' if the value is missing or unrecognized.
 */
export function parseModelPreference(value: string | null | undefined): ModelPreference {
  const valid: ModelPreference[] = ['auto', 'fast', 'balanced', 'best'];
  if (value && valid.includes(value as ModelPreference)) {
    return value as ModelPreference;
  }
  return 'auto';
}
