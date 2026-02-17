import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for browser/client-side usage
 * Handles authentication and database operations in the browser
 * 
 * @returns Configured Supabase browser client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
