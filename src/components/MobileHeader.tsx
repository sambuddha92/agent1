'use client';

import { Menu, X, Leaf } from 'lucide-react';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export default function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
  return (
    <header className="mobile-header lg:hidden">
      <button
        onClick={onMenuToggle}
        className="hamburger-btn"
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? (
          <X className="icon-lg icon-primary" />
        ) : (
          <Menu className="icon-lg icon-primary" />
        )}
      </button>

      {/* App Name - Minimal */}
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        <Leaf className="icon-lg icon-primary flex-shrink-0" />
        <span className="font-display text-sm font-bold text-primary truncate">
          FloatGreens
        </span>
      </div>

      <div className="w-10" /> {/* Spacer for balance */}
    </header>
  );
}
