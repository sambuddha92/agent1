/**
 * AI Gateway
 *
 * High-level orchestration layer that:
 * 1. Resolves user capabilities (Capability Resolver)
 * 2. Routes to appropriate model (Model Router)
 * 3. Executes via provider adapter
 * 4. Returns optimized response
 */

import type { UserTier } from '../router/capabilityResolver';
import type { ModalityType } from '../router/modelRouter';
import type { ModelDefinition } from '../registry/modelRegistry';

import { resolveUserTier } from '../router/capabilityResolver';
import { selectModel, detectModality, getFallbackModel } from '../router/modelRouter';
import { isModelAvailable as checkModelAvailability, getAvailableModels as fetchAvailableModels } from '../router/modelRouter';

// ============================================
// Gateway Input
// ============================================

export interface GatewayInput {
  /**
   * User's tier or metadata to resolve tier
   */
  userTier?: UserTier;
  userMetadata?: Record<string, unknown>;

  /**
   * The prompt/message content
   */
  prompt?: string;

  /**
   * Explicit modality if known
   */
  modality?: ModalityType;

  /**
   * Preferred provider
   */
  preferredProvider?: string;

  /**
   * Model preference (auto, fast, balanced, best)
   */
  preference?: 'auto' | 'fast' | 'balanced' | 'best';

  /**
   * Custom weights for model scoring
   */
  weights?: {
    quality?: number;
    speed?: number;
    cost?: number;
  };
}

// ============================================
// Gateway Output
// ============================================

export interface GatewayOutput {
  /**
   * Selected model definition
   */
  model: ModelDefinition;

  /**
   * Resolved user tier
   */
  userTier: UserTier;

  /**
   * Detected or specified modality
   */
  modality: ModalityType;

  /**
   * Whether this is a free model
   */
  isFree: boolean;

  /**
   * Score of selected model
   */
  score: number;

  /**
   * Fallback model IDs if primary fails
   */
  failoverChain: string[];

  /**
   * Model ID for execution
   */
  modelId: string;

  /**
   * Provider ID for execution
   */
  providerId: string;
}

// ============================================
// Weight Presets
// ============================================

const WEIGHT_PRESETS = {
  auto: { quality: 0.5, speed: 0.3, cost: 0.2 },
  fast: { quality: 0.3, speed: 0.6, cost: 0.1 },
  balanced: { quality: 0.5, speed: 0.3, cost: 0.2 },
  best: { quality: 0.8, speed: 0.1, cost: 0.1 },
};

// ============================================
// Main Gateway Function
// ============================================

/**
 * Main entry point for AI requests
 * Orchestrates capability resolution and model routing
 */
export function createGateway(input: GatewayInput): GatewayOutput {
  // 1. Resolve user tier
  const userTier = input.userTier ?? resolveUserTier(input.userMetadata ?? null);

  // 2. Get weights based on preference
  const preference = input.preference ?? 'auto';
  const weights = input.weights ?? WEIGHT_PRESETS[preference];

  // 3. Detect modality from prompt
  const modality = input.modality ?? detectModality(input.prompt);

  // 4. Select model using router
  const selection = selectModel({
    userTier,
    modality,
    prompt: input.prompt,
    preferredProvider: input.preferredProvider,
    prioritizeFree: userTier !== 'paid', // Free users always prioritize free
    weights,
  });

  // 5. Return gateway output
  return {
    model: selection.model,
    userTier,
    modality: selection.modality,
    isFree: selection.isFree,
    score: selection.score,
    failoverChain: selection.failoverChain,
    modelId: selection.model.id,
    providerId: selection.provider,
  };
}

// ============================================
// Error Handling Support
// ============================================

/**
 * Get fallback selection when primary model fails
 */
export function getFallback(
  currentModelId: string,
  userTier: UserTier,
  modality?: ModalityType
): GatewayOutput | null {
  const fallbackModel = getFallbackModel(currentModelId, userTier, modality);

  if (!fallbackModel) {
    return null;
  }

  return {
    model: fallbackModel,
    userTier,
    modality: modality ?? 'text',
    isFree: fallbackModel.cost === 'free',
    score: 0,
    failoverChain: [],
    modelId: fallbackModel.id,
    providerId: fallbackModel.provider,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a model is available for a user
 */
export function isModelAvailable(modelId: string, userTier: UserTier): boolean {
  return checkModelAvailability(modelId, userTier);
}

/**
 * Get all available models for a user tier
 */
export function getAvailableModels(userTier: UserTier): ModelDefinition[] {
  return fetchAvailableModels(userTier);
}

// ============================================
// Gateway Helpers
// ============================================

/**
 * Get the effective tier for a user based on metadata
 */
export function resolveEffectiveTier(
  userMetadata: Record<string, unknown> | null | undefined
): UserTier {
  return resolveUserTier(userMetadata);
}

/**
 * Get user tier display name
 */
export function getTierDisplayName(tier: UserTier): string {
  const names: Record<UserTier, string> = {
    guest: 'Guest',
    free: 'Free',
    paid: 'Premium',
  };
  return names[tier] ?? 'Free';
}

/**
 * Check if user can access premium features
 */
export function canAccessPremiumFeatures(tier: UserTier): boolean {
  return tier === 'paid';
}

/**
 * Get recommended preference for user tier
 */
export function getRecommendedPreference(tier: UserTier): 'auto' | 'fast' | 'balanced' | 'best' {
  switch (tier) {
    case 'guest':
      return 'fast';
    case 'free':
      return 'balanced';
    case 'paid':
      return 'best';
    default:
      return 'auto';
  }
}

/**
 * Create gateway input from minimal parameters
 */
export function createGatewayInput(params: {
  prompt?: string;
  modality?: ModalityType;
  preference?: 'auto' | 'fast' | 'balanced' | 'best';
  userMetadata?: Record<string, unknown>;
}): GatewayInput {
  return {
    prompt: params.prompt,
    modality: params.modality,
    preference: params.preference,
    userMetadata: params.userMetadata,
  };
}

/**
 * Get model selection summary
 */
export function getSelectionSummary(output: GatewayOutput): string {
  return [
    `Model: ${output.modelId}`,
    `Provider: ${output.providerId}`,
    `Modality: ${output.modality}`,
    `Free: ${output.isFree ? 'Yes' : 'No'}`,
    `Score: ${output.score.toFixed(2)}`,
  ].join(' | ');
}
