'use client';

import { useState } from 'react';
import Image from 'next/image';
import { generateDeterministicSeed, generatePlantAvatar } from '@/lib/utils/avatar';

interface AvatarDisplayProps {
  userName?: string;
  userEmail: string;
  onClick?: () => void;
}

export default function AvatarDisplay({ userName, userEmail, onClick }: AvatarDisplayProps) {
  // Generate deterministic seed from email
  const deterministicSeed = generateDeterministicSeed(userEmail);
  
  // Check if there's a custom seed in localStorage (from refresh)
  const [seed] = useState(() => {
    if (typeof window === 'undefined') return deterministicSeed;
    
    try {
      const stored = localStorage.getItem(`floatgreens_avatar_seed_${userEmail}`);
      return stored || deterministicSeed;
    } catch {
      return deterministicSeed;
    }
  });

  // Generate avatar URL synchronously
  const avatarUrl = generatePlantAvatar(seed);

  // Get initials as fallback
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      aria-label={`${userName || userEmail}'s avatar`}
      title="Click to view avatar options"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${userName || userEmail}'s avatar`}
          width={40}
          height={40}
          className="w-full h-full object-cover rounded-full"
          unoptimized
        />
      ) : null}

      {/* Fallback: Show initials if avatar URL doesn't exist or fails */}
      <div className="w-full h-full bg-white/20 backdrop-blur flex items-center justify-center font-semibold text-sm text-white rounded-full">
        {initials}
      </div>
    </button>
  );
}
