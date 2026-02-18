/**
 * Pricing Registry
 *
 * Embedded pricing data for all available models across providers.
 * Used by model-registry.ts for dynamic pricing-based tiering.
 *
 * Prices per 1M tokens (input / output)
 * Last updated: Feb 2026
 */

export interface ModelPricingInfo {
  provider: 'google' | 'bedrock';
  inputPrice: number;  // Per 1M tokens
  outputPrice: number; // Per 1M tokens
  quality: 'low' | 'medium' | 'high' | 'premium';
  /** True if this model is part of free tier */
  isFree: boolean;
}

export const MODEL_PRICING: Record<string, ModelPricingInfo> = {
  // ============================================
  // GOOGLE AI STUDIO (Free & Paid Tiers)
  // ============================================

  // FREE TIER MODELS
  'gemini-2.0-flash': {
    provider: 'google',
    inputPrice: 0.0,
    outputPrice: 0.0,
    quality: 'high',
    isFree: true, // 1,500 RPD, 1M TPM
  },
  'gemini-2.0-flash-lite': {
    provider: 'google',
    inputPrice: 0.0,
    outputPrice: 0.0,
    quality: 'medium',
    isFree: true, // 1,500 RPD, 1M TPM, 128K context
  },

  // PAID TIER MODELS
  'gemini-1.5-flash': {
    provider: 'google',
    inputPrice: 0.075,
    outputPrice: 0.30,
    quality: 'high',
    isFree: false,
  },
  'gemini-1.5-pro': {
    provider: 'google',
    inputPrice: 1.25,
    outputPrice: 5.0,
    quality: 'premium',
    isFree: false,
  },
  'gemini-2.0-pro-exp': {
    provider: 'google',
    inputPrice: 1.5,
    outputPrice: 6.0,
    quality: 'premium',
    isFree: false,
  },
  'gemini-2.5-pro': {
    provider: 'google',
    inputPrice: 2.0,
    outputPrice: 8.0,
    quality: 'premium',
    isFree: false,
  },

  // ============================================
  // AMAZON BEDROCK
  // ============================================

  // Amazon Nova
  'amazon.nova-lite-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.06,
    outputPrice: 0.24,
    quality: 'low',
    isFree: false,
  },
  'amazon.nova-pro-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.8,
    outputPrice: 3.2,
    quality: 'medium',
    isFree: false,
  },

  // Anthropic Claude (Bedrock)
  'anthropic.claude-3-5-haiku-20241022-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.8,
    outputPrice: 4.0,
    quality: 'high',
    isFree: false,
  },
  'us.anthropic.claude-3-5-haiku-20241022-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.8,
    outputPrice: 4.0,
    quality: 'high',
    isFree: false,
  },
  'anthropic.claude-3-5-sonnet-20241022-v2:0': {
    provider: 'bedrock',
    inputPrice: 3.0,
    outputPrice: 15.0,
    quality: 'premium',
    isFree: false,
  },
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0': {
    provider: 'bedrock',
    inputPrice: 3.0,
    outputPrice: 15.0,
    quality: 'premium',
    isFree: false,
  },
  'anthropic.claude-4-sonnet': {
    provider: 'bedrock',
    inputPrice: 3.0,
    outputPrice: 15.0,
    quality: 'premium',
    isFree: false,
  },
  'anthropic.claude-3-opus': {
    provider: 'bedrock',
    inputPrice: 15.0,
    outputPrice: 75.0,
    quality: 'premium',
    isFree: false,
  },

  // Amazon Titan
  'amazon.titan-text-lite-v0': {
    provider: 'bedrock',
    inputPrice: 0.075,
    outputPrice: 0.30,
    quality: 'medium',
    isFree: false,
  },
  'amazon.titan-text-express-v1': {
    provider: 'bedrock',
    inputPrice: 0.2,
    outputPrice: 0.8,
    quality: 'medium',
    isFree: false,
  },

  // Meta Llama (Bedrock)
  'meta.llama2-13b-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.75,
    outputPrice: 1.0,
    quality: 'medium',
    isFree: false,
  },
  'meta.llama3-8b-instruct-v1:0': {
    provider: 'bedrock',
    inputPrice: 0.3,
    outputPrice: 0.6,
    quality: 'medium',
    isFree: false,
  },
  'meta.llama3-70b-instruct-v1:0': {
    provider: 'bedrock',
    inputPrice: 2.64,
    outputPrice: 3.5,
    quality: 'high',
    isFree: false,
  },

  // Mistral (Bedrock)
  'mistral.mistral-7b-instruct-v0:2': {
    provider: 'bedrock',
    inputPrice: 0.15,
    outputPrice: 0.45,
    quality: 'low',
    isFree: false,
  },
  'mistral.mistral-large-2407-v1:0': {
    provider: 'bedrock',
    inputPrice: 4.0,
    outputPrice: 12.0,
    quality: 'high',
    isFree: false,
  },
};

/**
 * Get pricing info for a model, with fallback to estimate
 */
export function getPricingInfo(modelId: string): ModelPricingInfo {
  if (MODEL_PRICING[modelId]) {
    return MODEL_PRICING[modelId];
  }

  // Fallback: estimate based on model name patterns
  const lower = modelId.toLowerCase();

  if (lower.includes('gemini') && lower.includes('flash')) {
    return {
      provider: 'google',
      inputPrice: 0.075,
      outputPrice: 0.30,
      quality: 'high',
      isFree: false,
    };
  }

  if (lower.includes('gemini') && (lower.includes('pro') || lower.includes('pro-exp'))) {
    return {
      provider: 'google',
      inputPrice: 1.5,
      outputPrice: 6.0,
      quality: 'premium',
      isFree: false,
    };
  }

  if (lower.includes('haiku')) {
    return {
      provider: 'bedrock',
      inputPrice: 0.8,
      outputPrice: 4.0,
      quality: 'high',
      isFree: false,
    };
  }

  if (lower.includes('sonnet') || lower.includes('opus')) {
    return {
      provider: 'bedrock',
      inputPrice: 3.0,
      outputPrice: 15.0,
      quality: 'premium',
      isFree: false,
    };
  }

  if (lower.includes('nova-lite')) {
    return {
      provider: 'bedrock',
      inputPrice: 0.06,
      outputPrice: 0.24,
      quality: 'low',
      isFree: false,
    };
  }

  // Ultra-safe default
  return {
    provider: 'bedrock',
    inputPrice: 1.0,
    outputPrice: 3.0,
    quality: 'medium',
    isFree: false,
  };
}

/**
 * Pricing thresholds for auto-tiering
 */
export const TIER_PRICE_THRESHOLDS = {
  T1: { maxInput: 0.15, maxOutput: 0.60 },    // Cheapest tier
  T2: { maxInput: 0.50, maxOutput: 2.00 },    // Budget-friendly
  T3: { maxInput: 2.00, maxOutput: 8.00 },    // Mid-range
  T4: { maxInput: 5.00, maxOutput: 20.00 },   // Premium
  T5: { maxInput: Infinity, maxOutput: Infinity }, // Ultra-premium
} as const;

/**
 * Assign tier based on pricing
 */
export function autoAssignTierByPrice(
  inputPrice: number,
  outputPrice: number,
): 'T1' | 'T2' | 'T3' | 'T4' | 'T5' {
  const tiers = ['T1', 'T2', 'T3', 'T4', 'T5'] as const;

  for (const tier of tiers) {
    const threshold = TIER_PRICE_THRESHOLDS[tier];
    if (inputPrice <= threshold.maxInput && outputPrice <= threshold.maxOutput) {
      return tier;
    }
  }

  return 'T5';
}
