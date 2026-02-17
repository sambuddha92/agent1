'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });

        router.push('/chat');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-nature px-6 py-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div className="absolute top-32 right-20 text-8xl animate-float">🌺</div>
        <div className="absolute bottom-40 left-16 text-7xl animate-float" style={{animationDelay: '2s'}}>🌻</div>
        <div className="absolute top-1/3 left-1/4 text-6xl animate-float" style={{animationDelay: '4s'}}>🍃</div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block text-6xl mb-6 animate-float">🌿</div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-primary mb-4">
            Start Growing
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            Create your account and join thousands of successful gardeners
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated backdrop-glass">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="alert-error animate-slide-up">
                <strong className="font-semibold block mb-1">Error</strong>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="input"
                placeholder="John Smith"
              />
            </div>

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
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                placeholder="Create a strong password"
              />
              <p className="mt-2 text-xs text-text-muted">
                Must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-primary font-semibold hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-8">
          FloatGreens • AI-Powered Plant Care
        </p>
      </div>
    </div>
  );
}
