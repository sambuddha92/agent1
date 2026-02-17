/**
 * Model Tier Configuration
 *
 * Maps display-facing model preference options to internal tier classifications.
 * All model IDs are sourced from MODEL_CONFIG — never hardcoded here.
 *
 * Tier Semantics (FloatGreens):
 *   T1 — Fast:         Cheap, high-throughput. Nova Lite / Nova Micro class.
 *   T2 — Balanced:     Quality + cost tradeoff. Haiku / Nova Pro class.
 *   T3 — Best Quality: Highest quality. Sonnet class. Restricted for free users.
 *
 * NOTE: The existing model-router.ts uses T1=NovaPro, T2=Haiku, T3=Sonnet
 * for AUTO-mode classification. Those assignments are intentional for AUTO logic
 * and are NOT changed. This config only drives explicit user-facing preference
 * overrides (Fast / Balanced / Best Quality) and display metadata.
 */

import { MODEL_CONFIG } from '../constants';

// ============================================
// Types
// ============================================

export type ModelPreference = 'auto' | 'fast' | 'balanced' | 'best';

export type UserTier = 'free' | 'paid';

export interface TierDisplayMeta {
  label: string;
  description: string;
  badge: string;
  /** Whether free users can access this tier */
  freeAccess: boolean;
}

export interface ModelTierEntry {
  /** Internal tier key used by model-router */
  routerTier: 'T1' | 'T2' | 'T3';
  /** Primary model ID to use for this preference */
  primaryModelId: string;
  /** Fallback model ID if primary is unavailable */
  fallbackModelId: string;
  display: TierDisplayMeta;
}

// ============================================
// Tier Configuration Map
// ============================================

/**
 * Maps each user-facing model preference to a concrete tier configuration.
 *
 * 'auto' is special — it defers to the existing classifyTier() logic in
 * model-router.ts and does not use a fixed model.
 */
export const MODEL_TIER_CONFIG: Record<Exclude<ModelPreference, 'auto'>, ModelTierEntry> = {
  fast: {
    routerTier: 'T1',
    primaryModelId: MODEL_CONFIG.T1_FALLBACK,   // amazon.nova-lite-v1:0 — cheapest/fastest
    fallbackModelId: MODEL_CONFIG.T1_MODEL,      // amazon.nova-pro-v1:0  — fallback
    display: {
      label: 'Fast',
      description: 'Quick responses, best for simple questions',
      badge: '⚡',
      freeAccess: true,
    },
  },
  balanced: {
    routerTier: 'T2',
    primaryModelId: MODEL_CONFIG.T2_MODEL,       // claude-3-5-haiku
    fallbackModelId: MODEL_CONFIG.T2_FALLBACK,   // amazon.nova-pro-v1:0
    display: {
      label: 'Balanced',
      description: 'Best mix of quality and speed',
      badge: '⚖️',
      freeAccess: true,
    },
  },
  best: {
    routerTier: 'T3',
    primaryModelId: MODEL_CONFIG.T3_MODEL,            // claude-3-5-sonnet
    fallbackModelId: MODEL_CONFIG.T3_FALLBACK,        // claude-3-5-haiku (fallback)
    display: {
      label: 'Best Quality',
      description: 'Most capable model for complex tasks',
      badge: '✨',
      freeAccess: false,  // Paid users only
    },
  },
} as const;

export const AUTO_DISPLAY_META: TierDisplayMeta = {
  label: 'AUTO',
  description: 'Automatically selects the best model for your task',
  badge: '🤖',
  freeAccess: true,
};

// ============================================
// Access Control
// ============================================

/**
 * Determines if a user of a given tier can access a model preference.
 *
 * Free users: auto, fast, balanced allowed. best is locked.
 * Paid users: all preferences allowed.
 */
export function canAccessPreference(
  userTier: UserTier,
  preference: ModelPreference,
): boolean {
  if (userTier === 'paid') return true;
  if (preference === 'auto') return true;
  if (preference === 'best') return false;
  return MODEL_TIER_CONFIG[preference].display.freeAccess;
}

/**
 * Get all preference options with access state for a given user tier.
 * Used by the ModelSelector UI to render locked/unlocked states.
 */
export function getPreferenceOptions(userTier: UserTier): Array<{
  value: ModelPreference;
  label: string;
  description: string;
  badge: string;
  locked: boolean;
}> {
  const options: Array<{ value: ModelPreference; label: string; description: string; badge: string; locked: boolean }> = [
    {
      value: 'auto',
      label: AUTO_DISPLAY_META.label,
      description: AUTO_DISPLAY_META.description,
      badge: AUTO_DISPLAY_META.badge,
      locked: false,
    },
  ];

  for (const [key, config] of Object.entries(MODEL_TIER_CONFIG) as [Exclude<ModelPreference, 'auto'>, ModelTierEntry][]) {
    options.push({
      value: key,
      label: config.display.label,
      description: config.display.description,
      badge: config.display.badge,
      locked: !canAccessPreference(userTier, key),
    });
  }

  return options;
}

// ============================================
// Complexity → Preference Mapping (for AUTO mode)
// ============================================

export type TaskComplexity = 'simple' | 'medium' | 'high';

/**
 * Maps task complexity to the appropriate model preference for AUTO mode.
 * Free users are capped at 'balanced' regardless of complexity.
 */
export function complexityToPreference(
  complexity: TaskComplexity,
  userTier: UserTier,
): Exclude<ModelPreference, 'auto'> {
  if (complexity === 'simple') return 'fast';
  if (complexity === 'medium') return 'balanced';
  // High complexity
  if (userTier === 'paid') return 'best';
  return 'balanced'; // Free users never get 'best'
}
