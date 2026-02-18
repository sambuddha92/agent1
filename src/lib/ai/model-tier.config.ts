/**
 * Model Tier Configuration
 *
 * Maps user-facing preferences to internal 5-tier system:
 * - T1-T3: User-facing (visible in ModelSelector)
 * - T4-T5: Hidden (auto-escalated by router for paid users)
 *
 * Provider Strategy:
 * - Primary: Google AI Studio (cheaper, faster)
 * - Fallback: Bedrock (reliable safety net)
 * - Emergency: gemini-2.0-flash (free, immutable)
 */

import { MODEL_CONFIG } from '../constants';

// ============================================
// Types
// ============================================

export type ModelPreference = 'auto' | 'fast' | 'balanced' | 'best';

export type UserTier = 'free' | 'paid';

export type InternalTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface TierDisplayMeta {
  label: string;
  description: string;
  badge: string;
  /** Whether free users can access this tier */
  freeAccess: boolean;
  /** Whether this tier is visible in ModelSelector UI */
  visible: boolean;
}

export interface ModelTierEntry {
  /** Internal tier (T1-T5) */
  internalTier: InternalTier;
  /** Google primary model (from model-registry) */
  googleModelId: string;
  /** Bedrock fallback model */
  bedrockFallback: string;
  display: TierDisplayMeta;
}

export interface FullTierConfig extends ModelTierEntry {
  /** Whether this tier requires paid subscription */
  paidOnly: boolean;
  /** Complexity thresholds for auto-escalation */
  escalationTriggers?: {
    minMessageLength?: number;
    maxImages?: number;
    keywordPatterns?: RegExp;
  };
}

// ============================================
// Full 5-Tier Configuration
// ============================================

/**
 * Complete tier configuration including hidden tiers T4 and T5
 * This is the source of truth for all tier information
 */
export const FULL_TIER_CONFIG: Record<InternalTier, FullTierConfig> = {
  T1: {
    internalTier: 'T1',
    googleModelId: MODEL_CONFIG.GOOGLE_T1_PRIMARY,
    bedrockFallback: MODEL_CONFIG.BEDROCK_T1_FALLBACK,
    paidOnly: false,
    display: {
      label: 'Eco',
      description: 'Fast & efficient, perfect for quick questions',
      badge: 'leaf',
      freeAccess: true,
      visible: true,
    },
  },
  T2: {
    internalTier: 'T2',
    googleModelId: MODEL_CONFIG.GOOGLE_T2_PRIMARY,
    bedrockFallback: MODEL_CONFIG.BEDROCK_T2_FALLBACK,
    paidOnly: false,
    display: {
      label: 'Balanced',
      description: 'Good answers with reasonable token usage',
      badge: 'scale',
      freeAccess: true,
      visible: true,
    },
  },
  T3: {
    internalTier: 'T3',
    googleModelId: MODEL_CONFIG.GOOGLE_T3_PRIMARY,
    bedrockFallback: MODEL_CONFIG.BEDROCK_T3_FALLBACK,
    paidOnly: true,
    display: {
      label: 'Power',
      description: 'Maximum quality for complex planning',
      badge: 'zap',
      freeAccess: false,
      visible: true,
    },
  },
  T4: {
    internalTier: 'T4',
    googleModelId: MODEL_CONFIG.GOOGLE_T4_PRIMARY,
    bedrockFallback: MODEL_CONFIG.BEDROCK_T4_FALLBACK,
    paidOnly: true,
    display: {
      label: 'Premium',
      description: 'Advanced reasoning (auto-escalated)',
      badge: 'crown',
      freeAccess: false,
      visible: false, // Hidden from UI
    },
    escalationTriggers: {
      minMessageLength: MODEL_CONFIG.VERY_COMPLEX_LENGTH,
      maxImages: 3,
    },
  },
  T5: {
    internalTier: 'T5',
    googleModelId: MODEL_CONFIG.GOOGLE_T5_PRIMARY,
    bedrockFallback: MODEL_CONFIG.BEDROCK_T5_FALLBACK_PRIMARY,
    paidOnly: true,
    display: {
      label: 'Ultra',
      description: 'Maximum intelligence (auto-escalated)',
      badge: 'sparkles',
      freeAccess: false,
      visible: false, // Hidden from UI
    },
    escalationTriggers: {
      minMessageLength: MODEL_CONFIG.EXTREME_COMPLEXITY_LENGTH,
      maxImages: 5,
    },
  },
};

/**
 * User-facing preference to tier mapping (only T1-T3)
 * T4-T5 are not shown in UI but can be auto-escalated by router
 */
export const MODEL_TIER_CONFIG: Record<Exclude<ModelPreference, 'auto'>, ModelTierEntry> = {
  fast: {
    internalTier: 'T1',
    googleModelId: FULL_TIER_CONFIG.T1.googleModelId,
    bedrockFallback: FULL_TIER_CONFIG.T1.bedrockFallback,
    display: FULL_TIER_CONFIG.T1.display,
  },
  balanced: {
    internalTier: 'T2',
    googleModelId: FULL_TIER_CONFIG.T2.googleModelId,
    bedrockFallback: FULL_TIER_CONFIG.T2.bedrockFallback,
    display: FULL_TIER_CONFIG.T2.display,
  },
  best: {
    internalTier: 'T3',
    googleModelId: FULL_TIER_CONFIG.T3.googleModelId,
    bedrockFallback: FULL_TIER_CONFIG.T3.bedrockFallback,
    display: FULL_TIER_CONFIG.T3.display,
  },
} as const;

export const AUTO_DISPLAY_META: TierDisplayMeta = {
  label: 'AUTO',
  description: 'Adapts to your question — efficient by default',
  badge: 'auto',
  freeAccess: true,
  visible: true,
};

// ============================================
// Access Control
// ============================================

/**
 * Check if user can access a tier (not preference)
 */
export function canAccessTier(userTier: UserTier, internalTier: InternalTier): boolean {
  const config = FULL_TIER_CONFIG[internalTier];
  if (config.paidOnly && userTier === 'free') return false;
  return true;
}

/**
 * Determines if a user of a given tier can access a model preference.
 *
 * Free users: auto, fast, balanced allowed. best is locked.
 * Paid users: all preferences (but best is still T3, visible).
 * T4-T5 are never accessible via preference (only auto-escalation).
 */
export function canAccessPreference(
  userTier: UserTier,
  preference: ModelPreference,
): boolean {
  if (preference === 'auto') return true;
  if (userTier === 'paid') return true;
  if (preference === 'best') return false;
  return true;
}

/**
 * Get all preference options with access state for a given user tier.
 * Used by the ModelSelector UI to render locked/unlocked states.
 * Note: Only shows T1-T3 (user-facing tiers).
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
// Complexity → Internal Tier Mapping (for AUTO mode)
// ============================================

export type TaskComplexity = 'simple' | 'medium' | 'complex' | 'very_complex' | 'extreme';

/**
 * Maps task complexity to internal tier for AUTO mode.
 * Free users: T1, T2 only.
 * Paid users: T1-T5 with auto-escalation.
 */
export function complexityToTier(
  complexity: TaskComplexity,
  userTier: UserTier,
): InternalTier {
  if (complexity === 'simple') return 'T1';
  if (complexity === 'medium') return 'T2';
  if (complexity === 'complex') {
    return userTier === 'paid' ? 'T3' : 'T2'; // Free users capped at T2
  }
  if (complexity === 'very_complex') {
    return userTier === 'paid' ? 'T4' : 'T2'; // Paid only
  }
  // extreme
  return userTier === 'paid' ? 'T5' : 'T2'; // Paid only
}

/**
 * Legacy support: Map to old preference strings
 */
export function complexityToPreference(
  complexity: TaskComplexity,
  userTier: UserTier,
): Exclude<ModelPreference, 'auto'> {
  const tier = complexityToTier(complexity, userTier);
  if (tier === 'T1') return 'fast';
  if (tier === 'T2' || tier === 'T3' || tier === 'T4' || tier === 'T5') return 'balanced';
  return 'balanced'; // Default
}
