/**
 * OAuth authentication utilities for Google Sign-In
 * Handles OAuth flow with Supabase
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Initiate Google OAuth sign-in flow
 * Redirects to Google account picker (no consent re-prompt for returning users)
 */
export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        // 'select_account' shows only the account picker for returning users,
        // skipping the full consent screen. Use 'consent' only on first signup.
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('Google OAuth error:', error);
    throw new Error(error.message || 'Failed to initiate Google Sign-In');
  }

  return data;
}

/**
 * Initiate Google OAuth sign-up flow
 * Redirects to Google consent screen for new account creation
 */
export async function signUpWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google OAuth error:', error);
    throw new Error(error.message || 'Failed to initiate Google Sign-Up');
  }

  return data;
}
