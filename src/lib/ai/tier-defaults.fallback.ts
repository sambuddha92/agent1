/**
 * IMMUTABLE FALLBACK CONFIGURATION
 *
 * This file is NEVER modified at runtime.
 * It serves as the ultimate safety net when:
 *   1. API discovery fails
 *   2. tier-defaults.json is corrupted/missing
 *   3. All providers are unreachable
 *
 * Guarantees: The system NEVER fails to respond to a user.
 *
 * Emergency model: gemini-2.0-flash
 * - FREE tier (no cost)
 * - High quality (better than most)
 * - Multimodal (handles images)
 * - Highly reliable (Google infrastructure)
 * - 1,500 requests/day, 1M tokens/minute rate limits
 */

export interface FallbackModelConfig {
  provider: 'google' | 'bedrock';
  model: string;
  reason: string;
}

export interface FallbackTierConfig {
  primary: FallbackModelConfig;
  fallbacks: FallbackModelConfig[];
}

export type FallbackModelTiers = Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', FallbackTierConfig>;

/**
 * IMMUTABLE FALLBACK CONFIG
 * Used when all dynamic discovery and persistence fails
 */
export const IMMUTABLE_FALLBACK_TIERS: FallbackModelTiers = {
  T1: {
    primary: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      reason: 'Free tier, ultra-fast, ideal for simple queries',
    },
    fallbacks: [
      {
        provider: 'bedrock',
        model: 'amazon.nova-lite-v1:0',
        reason: 'Cheapest Bedrock option',
      },
      {
        provider: 'google',
        model: 'gemini-2.0-flash',
        reason: 'Emergency fallback (free)',
      },
    ],
  },

  T2: {
    primary: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      reason: 'Free tier fallback for medium queries',
    },
    fallbacks: [
      {
        provider: 'bedrock',
        model: 'amazon.nova-pro-v1:0',
        reason: 'Balanced Bedrock option',
      },
      {
        provider: 'google',
        model: 'gemini-2.0-flash',
        reason: 'Emergency fallback (free)',
      },
    ],
  },

  T3: {
    primary: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      reason: 'Free tier fallback for complex queries',
    },
    fallbacks: [
      {
        provider: 'bedrock',
        model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        reason: 'Quality Bedrock option',
      },
      {
        provider: 'google',
        model: 'gemini-2.0-flash',
        reason: 'Emergency fallback (free)',
      },
    ],
  },

  T4: {
    primary: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      reason: 'Free tier fallback for premium queries (paid users fallback)',
    },
    fallbacks: [
      {
        provider: 'bedrock',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        reason: 'Premium Bedrock option',
      },
      {
        provider: 'google',
        model: 'gemini-2.0-flash',
        reason: 'Emergency fallback (free)',
      },
    ],
  },

  T5: {
    primary: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      reason: 'Free tier fallback for ultra-premium queries (paid users fallback)',
    },
    fallbacks: [
      {
        provider: 'bedrock',
        model: 'anthropic.claude-3-opus',
        reason: 'Most capable Bedrock option',
      },
      {
        provider: 'bedrock',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        reason: 'Secondary Bedrock premium',
      },
      {
        provider: 'google',
        model: 'gemini-2.0-flash',
        reason: 'Emergency fallback (free)',
      },
    ],
  },
};

/**
 * Get fallback config for a tier
 * Safe to call even if tier-defaults.json is missing
 */
export function getFallbackConfig(tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5'): FallbackTierConfig {
  return IMMUTABLE_FALLBACK_TIERS[tier];
}

/**
 * Get the ultimate emergency model (always works)
 */
export function getEmergencyModel(): FallbackModelConfig {
  return {
    provider: 'google',
    model: 'gemini-2.0-flash',
    reason: 'Immutable emergency fallback - guaranteed to work',
  };
}
