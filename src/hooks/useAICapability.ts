/**
 * useAICapability Hook
 *
 * Provides AI capability information for the current user.
 * This hook abstracts the capability system for the frontend.
 *
 * Returns:
 * - capabilityLevel: guest | free | paid
 * - canAccessPremium: boolean
 *
 * This hook is designed to replace useModelSelector when manual model
 * selection is removed from the UI.
 */

'use client';

import { useMemo } from 'react';
import type { UserTier } from '@/types';
import { canAccessPremium } from '@/lib/ai/router/capabilityResolver';

// ============================================
// Types
// ============================================

export interface AICapability {
  /**
   * The user's capability level
   */
  capabilityLevel: UserTier;
  
  /**
   * Whether the user can access premium features
   */
  canAccessPremium: boolean;
  
  /**
   * Display name for the capability level
   */
  displayName: string;
  
  /**
   * Description of the current tier
   */
  description: string;
}

// ============================================
// Display Configuration
// ============================================

const TIER_CONFIG: Record<UserTier, { displayName: string; description: string }> = {
  guest: {
    displayName: 'Guest',
    description: 'Basic access to AI chat',
  },
  free: {
    displayName: 'Free',
    description: 'Full access to AI capabilities',
  },
  paid: {
    displayName: 'Premium',
    description: 'Maximum AI capabilities and priority support',
  },
};

// ============================================
// Hook
// ============================================

/**
 * Get AI capability information for the current user
 * 
 * @param userTier - The user's tier (guest, free, paid)
 * 
 * @returns Object containing:
 *   - capabilityLevel: The tier as guest | free | paid
 *   - canAccessPremium: Whether premium features are available
 *   - displayName: Human-readable tier name
 *   - description: Description of current tier
 */
export function useAICapability(userTier: UserTier = 'free'): AICapability {
  const capability = useMemo(() => {
    const tierConfig = TIER_CONFIG[userTier] ?? TIER_CONFIG.free;
    
    return {
      capabilityLevel: userTier,
      canAccessPremium: canAccessPremium(userTier),
      displayName: tierConfig.displayName,
      description: tierConfig.description,
    };
  }, [userTier]);

  return capability;
}

// ============================================
// Compatibility Alias
// ============================================

/**
 * @deprecated Use useAICapability instead
 * This alias is provided for backward compatibility during migration
 */
export const useModelCapability = useAICapability;
