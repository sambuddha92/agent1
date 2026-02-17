import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================
// Environment Variable Validation
// ============================================

/**
 * Validate required Supabase environment variables
 * Throws early with clear error message if missing
 * 
 * @throws {Error} If required environment variables are not set
 */
function validateSupabaseEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(
        `Missing required environment variable: ${envVar}. ` +
        'Please check your .env.local file.'
      );
    }
  }
}

/**
 * Validate Supabase service role key availability
 * Throws early if missing - service client requires this key
 * 
 * @throws {Error} If service role key is not set
 */
function validateServiceRoleKey(): void {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Service client operations will fail. Check your .env.local file.'
    );
  }
}

// ============================================
// Cookie Handler Utilities
// ============================================

/**
 * Safely handle cookie set operations
 * Catches and logs Server Component context errors without breaking
 * 
 * @param setter - Cookie setter function
 * @param errorContext - Context for logging (e.g., "set session cookie")
 */
function safeCookieOperation(
  setter: () => void,
  errorContext: string
): void {
  try {
    setter();
  } catch (error) {
    // Silent in Server Components, but log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[supabase-server] Cookie operation failed (${errorContext}). ` +
        'This is normal in Server Components when middleware handles session refresh.'
      );
    }
  }
}

// ============================================
// Server Client Creation
// ============================================

/**
 * Create a Supabase client for server-side usage (Server Components, API Routes)
 * Handles cookie-based authentication with automatic session refresh
 * 
 * @returns Configured Supabase server client with user-level permissions
 * @throws {Error} If environment variables are missing
 * 
 * @example
 * ```typescript
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export function createClient() {
  // Validate environment before creating client
  validateSupabaseEnv();

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          safeCookieOperation(
            () => cookieStore.set({ name, value, ...options }),
            'set'
          );
        },
        remove(name: string, options: CookieOptions) {
          safeCookieOperation(
            () => cookieStore.set({ name, value: '', ...options }),
            'remove'
          );
        },
      },
    }
  );
}

/**
 * Create a Supabase service client with admin privileges
 * Uses service role key to bypass Row Level Security (RLS)
 * ⚠️ USE WITH CAUTION - Only for trusted server-side operations
 * 
 * @returns Configured Supabase service client with admin permissions
 */
export function createServiceClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {}
        },
      },
    }
  );
}
