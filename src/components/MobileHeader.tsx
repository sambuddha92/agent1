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

      <div className="flex items-center gap-2">
        <Leaf className="icon-xl icon-primary" />
        <span className="font-display text-lg font-bold text-primary">
          FloatGreens
        </span>
      </div>

      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}
