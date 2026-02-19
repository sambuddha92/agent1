/**
 * useModelSelector Hook
 *
 * Manages the model preference state per chat conversation.
 *
 * - New chats always start with 'auto'
 * - When loading an existing conversation, reads its stored preference
 * - When user changes preference, persists it to the conversation via PATCH API
 * - Logs upgrade interest to DB when a free user clicks Upgrade
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ModelPreference, UserTier } from '@/types';
import { getPreferenceOptions } from '@/lib/ai/model-selector';

// ============================================
// Types
// ============================================

export interface UseModelSelectorReturn {
  /** Currently selected model preference */
  preference: ModelPreference;
  /** Set the preference and persist to DB if conversationId exists */
  setPreference: (preference: ModelPreference) => void;
  /** User's subscription tier — controls locked/unlocked states */
  userTier: UserTier;
  /** Whether a preference update is being saved */
  isSaving: boolean;
  /** All available preference options with locked state */
  options: ReturnType<typeof getPreferenceOptions>;
  /** Log upgrade interest when user clicks Upgrade on a locked tier */
  logUpgradeInterest: (tier: string) => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function useModelSelector(
  conversationId: string | null,
  userTier: UserTier = 'free',
): UseModelSelectorReturn {
  const [preference, setPreferenceState] = useState<ModelPreference>('auto');
  const [isSaving, setIsSaving] = useState(false);

  const options = getPreferenceOptions(userTier);

  // ---- Reset to 'auto' when starting a new chat ----
  useEffect(() => {
    if (!conversationId) {
      setPreferenceState('auto');
    }
  }, [conversationId]);

  // ---- Load preference from existing conversation ----
  useEffect(() => {
    if (!conversationId) return;

    async function fetchPreference() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        // The conversations PATCH/GET returns model_preference
        if (data?.model_preference) {
          const pref = data.model_preference as ModelPreference;
          setPreferenceState(pref);
        }
      } catch {
        // Non-blocking — keep default 'auto'
      }
    }

    fetchPreference();
  }, [conversationId]);

  // ---- Set preference + persist to DB ----
  const setPreference = useCallback(
    (newPreference: ModelPreference) => {
      setPreferenceState(newPreference);

      if (!conversationId) return; // New chat — just store in state, API call happens on first message

      setIsSaving(true);
      fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_preference: newPreference }),
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('[useModelSelector] Failed to persist model preference');
          }
        })
        .catch((err) => {
          console.error('[useModelSelector] Error persisting preference:', err);
        })
        .finally(() => {
          setIsSaving(false);
        });
    },
    [conversationId],
  );

  // ---- Log upgrade interest ----
  const logUpgradeInterest = useCallback(async (tier: string) => {
    try {
      await fetch('/api/models/upgrade-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_tier: tier }),
      });
    } catch (err) {
      // Non-blocking — analytics failure should never impact UX
      console.warn('[useModelSelector] Failed to log upgrade interest:', err);
    }
  }, []);

  return {
    preference,
    setPreference,
    userTier,
    isSaving,
    options,
    logUpgradeInterest,
  };
}
