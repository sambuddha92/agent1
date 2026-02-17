'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ROUTES, UI_TEXT } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
          <div className="inline-block text-6xl mb-6 animate-float">🔑</div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-primary mb-4">
            Reset Password
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated backdrop-glass">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✉️</div>
              <h2 className="text-2xl font-bold text-primary mb-4">Check Your Email</h2>
              <p className="text-text-secondary mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-text-muted mb-6">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <Link href={ROUTES.LOGIN} className="btn-primary inline-block">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              {error && (
                <div className="alert-error animate-slide-up">
                  <strong className="font-semibold block mb-1">Error</strong>
                  <p className="text-sm">{error}</p>
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn-primary"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-text-secondary text-sm">
              Remember your password?{' '}
              <Link 
                href={ROUTES.LOGIN}
                className="text-primary font-semibold hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Sign in
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
