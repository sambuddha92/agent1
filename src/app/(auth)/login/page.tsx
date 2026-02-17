'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES, UI_TEXT } from '@/lib/constants';
import { signInWithGoogle } from '@/lib/auth/oauth';
import { Eye, EyeOff, Leaf } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(UI_TEXT.AUTH_ERROR);
      }
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push(ROUTES.CHAT);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        // Provide more user-friendly error messages
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for the confirmation link.');
        } else if (err.message.includes('User not found')) {
          setError('No account found with this email. Please sign up first.');
        } else {
          setError(err.message);
        }
      } else {
        setError(UI_TEXT.AUTH_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-nature px-6 py-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div className="absolute top-32 right-20 text-8xl animate-float">🌿</div>
        <div className="absolute bottom-40 left-16 text-7xl animate-float" style={{animationDelay: '2s'}}>🌱</div>
        <div className="absolute top-1/3 left-1/4 text-6xl animate-float" style={{animationDelay: '4s'}}>🍃</div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 animate-float">
            <Leaf className="icon-3xl icon-primary mx-auto" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-primary mb-4">
            Welcome Back
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            Sign in to access your garden dashboard and AI plant companion
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated backdrop-glass">
          {error && (
            <div className="alert-error animate-slide-up mb-6">
              <strong className="font-semibold block mb-1">Error</strong>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Google OAuth Section - Primary */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {googleLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></span>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="flex-1">{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface-elevated text-text-muted">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Section - Secondary */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <Link 
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-xs text-primary hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Eye className="icon-md" />
                  ) : (
                    <EyeOff className="icon-md" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || googleLoading}
              className="w-full btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {UI_TEXT.SIGNING_IN}
                </span>
              ) : (
                UI_TEXT.SIGN_IN
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-text-secondary text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                href={ROUTES.SIGNUP}
                className="text-primary font-semibold hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-8">
          {UI_TEXT.APP_NAME} • {UI_TEXT.APP_TAGLINE}
        </p>
      </div>
    </div>
  );
}
