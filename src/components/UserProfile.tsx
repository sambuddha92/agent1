'use client';

import { useState } from 'react';
import { signOut } from '@/lib/auth/actions';
import AvatarDisplay from './AvatarDisplay';
import AvatarModal from './AvatarModal';

interface UserProfileProps {
  userEmail: string;
  userName?: string;
}

export default function UserProfile({ userEmail, userName }: UserProfileProps) {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAvatarClick = () => {
    setIsAvatarModalOpen(true);
  };

  return (
    <>
      <div className="relative">
        {/* Profile Button */}
        <div 
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          onClick={handleAvatarClick}
          aria-label="User profile"
          role="button"
        >
          <AvatarDisplay userEmail={userEmail} userName={userName} />
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-white truncate">
              {userName || 'Account'}
            </div>
            <div className="text-xs text-white/70 truncate">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        userEmail={userEmail}
        userName={userName}
        onClose={() => setIsAvatarModalOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  );
}
