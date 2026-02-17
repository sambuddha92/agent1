'use client';

/**
 * ModelSelector Component
 *
 * Dropdown selector for choosing AI model preference per conversation.
 * Renders in the chat header area.
 *
 * Options:
 *   AUTO (Recommended) — dynamic selection based on task complexity
 *   Fast              — Tier 1, cheapest/fastest
 *   Balanced          — Tier 2, quality + cost tradeoff
 *   Best Quality      — Tier 3, locked for free users
 *
 * Locked options:
 *   - Visible but disabled
 *   - Show lock icon
 *   - Show "Upgrade" button that logs interest + shows "Coming Soon" modal
 */

import { useState, useRef, useEffect } from 'react';
import { Lock, ChevronDown, X, Sparkles } from 'lucide-react';
import type { ModelPreference, UserTier } from '@/types';
import type { UseModelSelectorReturn } from '@/hooks/useModelSelector';

// ============================================
// Types
// ============================================

interface ModelSelectorProps {
  preference: ModelPreference;
  onPreferenceChange: (preference: ModelPreference) => void;
  userTier: UserTier;
  options: UseModelSelectorReturn['options'];
  onUpgradeClick: (tier: string) => void;
  isSaving?: boolean;
  disabled?: boolean;
}

// ============================================
// Coming Soon Modal
// ============================================

function ComingSoonModal({ onClose }: { onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 mb-4">
          <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
        </div>

        {/* Content */}
        <h3
          id="coming-soon-title"
          className="font-display text-xl font-semibold text-[var(--color-text-primary)] mb-2"
        >
          Coming Soon ✨
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          Premium model access is coming to FloatGreens. We&apos;ve noted your interest — you&apos;ll be among the first to know when it launches!
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full btn-primary text-sm py-3"
          style={{ minHeight: '2.75rem' }}
        >
          Got it 🌿
        </button>
      </div>
    </div>
  );
}

// ============================================
// Preference Option Row
// ============================================

interface OptionRowProps {
  value: ModelPreference;
  label: string;
  description: string;
  badge: string;
  locked: boolean;
  isSelected: boolean;
  onSelect: (value: ModelPreference) => void;
  onUpgradeClick: (tier: string) => void;
}

function OptionRow({
  value,
  label,
  description,
  badge,
  locked,
  isSelected,
  onSelect,
  onUpgradeClick,
}: OptionRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${
        locked
          ? 'opacity-60 cursor-not-allowed'
          : isSelected
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]'
      }`}
      onClick={() => {
        if (!locked) onSelect(value);
      }}
      role="option"
      aria-selected={isSelected}
      aria-disabled={locked}
    >
      {/* Badge */}
      <span className="text-base flex-shrink-0 w-6 text-center">{badge}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-medium truncate ${
              isSelected ? 'text-[var(--color-primary)]' : ''
            }`}
          >
            {label}
          </span>
          {value === 'auto' && (
            <span className="text-xs px-1.5 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full font-medium leading-none">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] truncate leading-snug mt-0.5">
          {description}
        </p>
      </div>

      {/* Right side: lock icon or checkmark */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        {locked ? (
          <>
            <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpgradeClick(value);
              }}
              className="text-xs px-2 py-1 bg-[var(--color-primary)] text-white rounded-md font-medium hover:bg-[var(--color-primary-hover)] transition-colors leading-none"
              aria-label={`Upgrade to access ${label}`}
            >
              Upgrade
            </button>
          </>
        ) : isSelected ? (
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function ModelSelector({
  preference,
  onPreferenceChange,
  userTier,
  options,
  onUpgradeClick,
  isSaving = false,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const currentOption = options.find((o) => o.value === preference) ?? options[0];

  const handleUpgradeClick = async (tier: string) => {
    setIsOpen(false);
    setShowComingSoon(true);
    await onUpgradeClick(tier);
  };

  return (
    <>
      <div className="relative inline-block" ref={dropdownRef}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-3 py-1.5
            bg-[var(--color-surface)] border border-[var(--color-border)]
            rounded-full text-sm font-medium
            text-[var(--color-text-secondary)]
            hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
            transition-all duration-150
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isOpen ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : ''}
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Model: ${currentOption?.label ?? 'AUTO'}`}
        >
          <span className="text-base leading-none">{currentOption?.badge ?? '🤖'}</span>
          <span className="hidden sm:inline text-xs font-semibold tracking-wide uppercase">
            {currentOption?.label ?? 'AUTO'}
          </span>
          {isSaving ? (
            <span className="w-3 h-3 border border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" aria-label="Saving..." />
          ) : (
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 animate-scale-in overflow-hidden"
            role="listbox"
            aria-label="Select model preference"
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                AI Model
              </p>
            </div>

            {/* Options */}
            <div className="p-1.5 space-y-0.5">
              {options.map((option) => (
                <OptionRow
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  badge={option.badge}
                  locked={option.locked}
                  isSelected={option.value === preference}
                  onSelect={(v) => {
                    onPreferenceChange(v);
                    setIsOpen(false);
                  }}
                  onUpgradeClick={handleUpgradeClick}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] leading-snug">
                {userTier === 'paid'
                  ? '✅ All models available'
                  : '🔒 Best Quality available for paid users'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <ComingSoonModal onClose={() => setShowComingSoon(false)} />
      )}
    </>
  );
}
