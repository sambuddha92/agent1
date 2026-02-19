/**
 * Capability Profiles
 *
 * Defines what models and providers users can access based on their tier.
 * Controls the "intelligence" level users can tap into.
 */

import type { CostLevel } from '../registry/modelRegistry';

// ============================================
// User Tiers
// ============================================

export type UserTier = 'guest' | 'free' | 'paid';

// ============================================
// Capability Profile
// ============================================

export interface CapabilityProfile {
  tier: UserTier;
  allowedQuality: number; // 0-1, minimum quality threshold
  allowedCost: CostLevel[];
  allowedProviders: string[];
  maxTokens?: number;
  rateLimitPerMinute?: number;
}

// ============================================
// Profiles
// ============================================

export const capabilityProfiles: Record<UserTier, CapabilityProfile> = {
  /**
   * Guest users - minimal access
   * Good but limited depth
   */
  guest: {
    tier: 'guest',
    allowedQuality: 0.5,
    allowedCost: ['free'],
    allowedProviders: ['google', 'groq', 'together', 'cloudflare'],
    maxTokens: 4096,
    rateLimitPerMinute: 5,
  },

  /**
   * Authenticated free users - strong access
   * Feels excellent
   */
  free: {
    tier: 'free',
    allowedQuality: 0.85,
    allowedCost: ['free', 'low'],
    allowedProviders: ['google', 'groq', 'together', 'fireworks', 'openrouter', 'fal'],
    maxTokens: 16384,
    rateLimitPerMinute: 20,
  },

  /**
   * Paid users - maximum access
   * Feels magical
   */
  paid: {
    tier: 'paid',
    allowedQuality: 1.0,
    allowedCost: ['free', 'low', 'medium', 'high'],
    allowedProviders: [
      'google',
      'groq',
      'together',
      'fireworks',
      'cloudflare',
      'openrouter',
      'fal',
      'replicate',
      'stability',
    ],
    maxTokens: 128000,
    rateLimitPerMinute: 100,
  },
};

// ============================================
// Helpers
// ============================================

/**
 * Get capability profile for a user tier
 */
export function getProfile(tier: UserTier): CapabilityProfile {
  return capabilityProfiles[tier];
}

/**
 * Check if a user can access a specific cost level
 */
export function canAccessCost(profile: CapabilityProfile, cost: CostLevel): boolean {
  return profile.allowedCost.includes(cost);
}

/**
 * Check if a user can access a specific provider
 */
export function canAccessProvider(profile: CapabilityProfile, provider: string): boolean {
  return profile.allowedProviders.includes(provider);
}

/**
 * Check if a model meets the quality threshold
 */
export function meetsQualityThreshold(profile: CapabilityProfile, quality: number): boolean {
  return quality >= profile.allowedQuality;
}

/**
 * Resolve user tier from metadata
 */
export function resolveUserTier(userMetadata: Record<string, unknown> | null | undefined): UserTier {
  if (!userMetadata) return 'guest';
  
  const plan = userMetadata['plan'];
  if (plan === 'paid' || plan === 'pro' || plan === 'premium') return 'paid';
  
  // Check if user is authenticated
  const isAuthenticated = userMetadata['is_authenticated'] || userMetadata['email'];
  if (isAuthenticated) return 'free';
  
  return 'guest';
}
