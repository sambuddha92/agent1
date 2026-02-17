import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PROTECTED_ROUTES, AUTH_ROUTES, ROUTES } from '../constants';

// ============================================
// Middleware Utilities
// ============================================

/**
 * Safely handle cookie operations in middleware
 * Catches errors without breaking the request flow
 * 
 * @param operation - Cookie operation function
 * @param context - Context for logging
 */
function safeCookieSet(
  operation: () => void,
  context: string
): void {
  try {
    operation();
  } catch (error) {
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[middleware] Cookie operation failed (${context}):`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    // Continue - cookies failing shouldn't block request
  }
}

/**
 * Validate required environment variables for Supabase
 * 
 * @throws {Error} If required environment variables are missing
 */
function validateMiddlewareEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(
        `[middleware] Missing required environment variable: ${envVar}. ` +
        'Please check your .env.local file.'
      );
    }
  }
}

// ============================================
// Session Update Middleware
// ============================================

/**
 * Middleware function to handle Supabase session management and route protection
 * - Refreshes expired sessions automatically
 * - Protects authenticated routes
 * - Redirects authenticated users away from auth pages
 * - Gracefully handles errors to prevent breaking auth flow
 * 
 * @param request - Next.js request object
 * @returns Next.js response with updated cookies
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Validate environment early
    validateMiddlewareEnv();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            safeCookieSet(
              () => {
                request.cookies.set({ name, value, ...options });
                response = NextResponse.next({
                  request: {
                    headers: request.headers,
                  },
                });
                response.cookies.set({ name, value, ...options });
              },
              `set cookie: ${name}`
            );
          },
          remove(name: string, options: CookieOptions) {
            safeCookieSet(
              () => {
                request.cookies.set({ name, value: '', ...options });
                response = NextResponse.next({
                  request: {
                    headers: request.headers,
                  },
                });
                response.cookies.set({ name, value: '', ...options });
              },
              `remove cookie: ${name}`
            );
          },
        },
      }
    );

    // Refresh session if expired
    // Safely handle errors - user will be null if session is invalid
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[middleware] Auth check error:', authError.message);
      }
      // Continue with null user - they'll be redirected if accessing protected routes
    }

    // Protected routes — redirect to login if not authenticated
    const isProtected = PROTECTED_ROUTES.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isProtected && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROUTES.LOGIN;
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect logged-in users away from auth pages
    const isAuthPage = AUTH_ROUTES.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isAuthPage && user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROUTES.CHAT;
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[middleware] Unhandled error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // On critical errors, allow the request through
    // User will be treated as unauthenticated and redirected if needed
    return response;
  }
}
