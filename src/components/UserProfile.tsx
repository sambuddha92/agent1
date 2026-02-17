'use client';

import { useState } from 'react';
import { signOut } from '@/lib/auth/actions';
import { UI_TEXT } from '@/lib/constants';
import { ChevronDown, LogOut } from 'lucide-react';

interface UserProfileProps {
  userEmail: string;
  userName?: string;
}

export default function UserProfile({ userEmail, userName }: UserProfileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoggingOut(false);
      // Close menu on error
      setIsMenuOpen(false);
    }
  };

  // Get initials for avatar
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0].toUpperCase();

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        aria-label="User menu"
        aria-expanded={isMenuOpen}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-white truncate">
            {userName || 'Account'}
          </div>
          <div className="text-xs text-white/70 truncate">{userEmail}</div>
        </div>
        <ChevronDown
          className={`icon-md text-white transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-slide-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:bg-white/10 flex items-center gap-3 text-white disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="icon-md" />
                    <span>{UI_TEXT.SIGN_OUT}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
