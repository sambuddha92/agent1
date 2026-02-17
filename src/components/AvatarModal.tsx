'use client';

import { useEffect, useState } from 'react';
import { generateRandomSeed, generatePlantAvatar, getPlantQuoteFromSeed, getRandomPlantQuote } from '@/lib/utils/avatar';
import { X, RefreshCw } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  userEmail: string;
  userName?: string;
  onClose: () => void;
}

export default function AvatarModal({ isOpen, userEmail, userName, onClose }: AvatarModalProps) {
  const [customSeed, setCustomSeed] = useState<string>('');
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Load custom seed from localStorage if it exists
      try {
        const stored = localStorage.getItem(`floatgreens_avatar_seed_${userEmail}`);
        if (stored) {
          setCustomSeed(stored);
          setQuote(getPlantQuoteFromSeed(stored));
        } else {
          // Load initial quote for default avatar
          const defaultSeed = userEmail;
          setQuote(getPlantQuoteFromSeed(defaultSeed));
        }
      } catch {
        setQuote(getRandomPlantQuote());
      }
    }
  }, [isOpen, userEmail]);

  const handleRefresh = () => {
    // Generate new random seed
    const newSeed = generateRandomSeed();
    setCustomSeed(newSeed);
    
    // Save to localStorage
    try {
      localStorage.setItem(`floatgreens_avatar_seed_${userEmail}`, newSeed);
    } catch {
      console.error('Failed to save avatar seed to localStorage');
    }
    
    // Get new quote
    setQuote(getPlantQuoteFromSeed(newSeed));
  };

  const handleReset = () => {
    // Remove from localStorage
    try {
      localStorage.removeItem(`floatgreens_avatar_seed_${userEmail}`);
    } catch {
      console.error('Failed to remove avatar seed from localStorage');
    }
    
    setCustomSeed('');
    setQuote(getPlantQuoteFromSeed(userEmail));
  };

  const currentSeed = customSeed || userEmail;
  const avatarUrl = generatePlantAvatar(currentSeed);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 animate-slide-up">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Avatar display - Large zoomed version */}
          <div className="mb-6 flex justify-center">
            <div
              className="w-32 h-32 rounded-full shadow-lg"
              style={{
                backgroundImage: `url('${avatarUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>

          {/* User name */}
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            {userName || 'Your Garden Avatar'}
          </h2>

          {/* Plant quote */}
          <p className="text-center text-white/80 text-sm mb-6 italic">
            &quot;{quote}&quot;
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
              title="Generate a new random avatar"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Avatar</span>
            </button>

            {/* Reset button (only if custom seed exists) */}
            {customSeed && (
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                title="Reset to default avatar"
              >
                Reset
              </button>
            )}
          </div>

          {/* Info text */}
          <p className="text-center text-white/50 text-xs mt-4">
            {customSeed ? 'Your custom avatar is saved to this device.' : 'Click "New Avatar" to personalize yours!'}
          </p>
        </div>
      </div>
    </>
  );
}
