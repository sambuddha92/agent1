/**
 * Capability Resolver
 *
 * Resolves user capabilities based on their tier.
 * Provides access control for models, providers, and features.
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
  canAccessPremium: boolean;
  canAccessBest: boolean;
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
    canAccessPremium: false,
    canAccessBest: false,
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
    canAccessPremium: false,
    canAccessBest: true,
  },

  /**
   * Paid users - maximum access
   * Feels magical
   */
  paid: {
    tier: 'paid',
    allowedQuality: 1.0,
    allowedCost: ['free', 'low', 'medium', 'high'],
    allowedProviders: ['google', 'groq', 'together', 'fireworks', 'cloudflare', 'openrouter', 'fal', 'replicate'],
    maxTokens: 128000,
    rateLimitPerMinute: 100,
    canAccessPremium: true,
    canAccessBest: true,
  },
};

// ============================================
// Resolver Functions
// ============================================

/**
 * Get capability profile for a user tier
 */
export function getCapabilityProfile(tier: UserTier): CapabilityProfile {
  return capabilityProfiles[tier] ?? capabilityProfiles.guest;
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

/**
 * Check if user can access premium features
 */
export function canAccessPremium(tier: UserTier): boolean {
  return capabilityProfiles[tier]?.canAccessPremium ?? false;
}

/**
 * Check if user can access best quality models
 */
export function canAccessBest(tier: UserTier): boolean {
  return capabilityProfiles[tier]?.canAccessBest ?? false;
}

/**
 * Get rate limit for user tier
 */
export function getRateLimit(tier: UserTier): number {
  return capabilityProfiles[tier]?.rateLimitPerMinute ?? 5;
}

/**
 * Get max tokens for user tier
 */
export function getMaxTokens(tier: UserTier): number {
  return capabilityProfiles[tier]?.maxTokens ?? 4096;
}

// ============================================
// Subscription Resolver (Placeholder)
// ============================================

/**
 * Subscription status placeholder
 * This will be replaced with actual payment system integration
 */
export interface SubscriptionStatus {
  tier: UserTier;
  isActive: boolean;
  planName?: string;
  expiresAt?: Date;
}

/**
 * Placeholder subscription resolver
 * 
 * TODO: Replace with actual payment system integration
 * Current implementation:)
 * - Returns 'paid' for users with 'paid', 'pro', or 'premium' in metadata
 * - Returns 'free' for authenticated users
 * - Returns 'guest' for unauthenticated users
 * 
 * Future integration options:
 * - Stripe subscription status
 * - Supabase billing extension
 * - Custom subscription table
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resolveSubscription(userId?: string): Promise<SubscriptionStatus> {
  // TODO: Use userId to fetch subscription from payment system
  void userId;
  // Placeholder: return default free tier
  // TODO: Integrate with actual payment system
  return {
    tier: 'free',
    isActive: true,
    planName: 'free',
  };
}

/**
 * Check if subscription allows feature
 */
export function hasFeature(subscription: SubscriptionStatus, feature: string): boolean {
  // Placeholder implementation
  // TODO: Add feature flag logic
  const premiumFeatures = ['premium-models', 'unlimited-messages', 'priority-support'];
  
  if (premiumFeatures.includes(feature)) {
    return subscription.tier === 'paid';
  }
  
  return true;
}

/**
 * Get capability based on subscription
 */
export function getCapabilitiesForSubscription(subscription: SubscriptionStatus): CapabilityProfile {
  return getCapabilityProfile(subscription.tier);
}

/**
 * Check if user can use specific model
 */
export function canUseModel(
  subscription: SubscriptionStatus,
  modelQuality: number,
  modelCost: string,
  modelProvider: string
): boolean {
  const profile = getCapabilitiesForSubscription(subscription);
  
  // Check tier access
  if (!profile.allowedCost.includes(modelCost as CostLevel)) {
    return false;
  }
  
  // Check provider access
  if (!profile.allowedProviders.includes(modelProvider)) {
    return false;
  }
  
  // Check quality threshold
  if (!meetsQualityThreshold(profile, modelQuality)) {
    return false;
  }
  
  return true;
}
