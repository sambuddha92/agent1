/**
 * Supabase Client Cache/Memoization
 *
 * Caches Supabase client instances to avoid recreating them
 * on every request. Reduces memory allocation and improves performance.
 *
 * Important: This is for client-side code. Server-side clients should be
 * created fresh per request to ensure proper session isolation.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Client Cache
// ============================================

let cachedClient: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

/**
 * Get or create a memoized Supabase client
 * Reuses the same instance across component renders
 *
 * WARNING: This is for client-side only!
 * Server-side code should use createClient() from @/lib/supabase/server
 * which properly handles sessions and RLS
 *
 * @returns Memoized Supabase client instance
 *
 * @example
 * ```typescript
 * // In a client component
 * const supabase = await getSupabaseClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Return cached instance if available
  if (cachedClient) {
    return cachedClient;
  }

  // Return existing init promise if already in progress
  if (initPromise) {
    return initPromise;
  }

  // Create new init promise
  initPromise = (async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          'Missing required Supabase environment variables: ' +
          'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
      }

      cachedClient = createSupabaseClient(url, key);
      return cachedClient;
    } catch (error) {
      // Clear promise so next call will retry
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Clear the cached Supabase client
 * Useful for logout or testing
 *
 * @example
 * ```typescript
 * // On user logout
 * await supabase.auth.signOut();
 * clearSupabaseCache();
 * ```
 */
export function clearSupabaseCache(): void {
  cachedClient = null;
  initPromise = null;
}

/**
 * Invalidate client cache on auth state change
 * Should be called when user logs in/out
 *
 * @example
 * ```typescript
 * useEffect(() => {
 *   const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
 *     invalidateSupabaseCache();
 *   });
 *
 *   return () => subscription?.unsubscribe();
 * }, []);
 * ```
 */
export function invalidateSupabaseCache(): void {
  clearSupabaseCache();
}
