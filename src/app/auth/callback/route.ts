import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants';

/**
 * Auth callback handler for email confirmations and OAuth redirects
 * Exchanges the auth code for a session and redirects to the app
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? ROUTES.CHAT;

  if (code) {
    const supabase = createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(
          new URL(`${ROUTES.LOGIN}?error=auth_callback_failed`, requestUrl.origin)
        );
      }

      // Successful authentication - redirect to the app
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      console.error('Unexpected auth callback error:', err);
      return NextResponse.redirect(
        new URL(`${ROUTES.LOGIN}?error=unexpected_error`, requestUrl.origin)
      );
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL(ROUTES.LOGIN, requestUrl.origin));
}
