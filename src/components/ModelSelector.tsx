'use client';

/**
 * ModelSelector Component
 *
 * Dropdown selector for choosing AI mode preference per conversation.
 * Renders in the chat header area with eco-friendly framing around token usage.
 *
 * Options (eco-friendly labels):
 *   AUTO (Recommended) — adapts to your question, efficient by default
 *   Eco               — Tier 1, fewest tokens, lightest footprint
 *   Balanced          — Tier 2, good answers, reasonable usage
 *   Power             — Tier 3, maximum tokens, locked for free users
 *
 * Locked options:
 *   - Visible but disabled
 *   - Show lock icon
 *   - Show "Upgrade" button that logs interest + shows "Growing Soon" modal
 *
 * Smart Positioning:
 *   - Uses portal-based rendering to avoid parent overflow issues
 *   - Intelligent collision detection keeps menu fully visible
 *   - Adapts to all screen sizes and trigger positions
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, ChevronDown, X, Sparkles, Leaf, Scale, Zap, Wand2, Check } from 'lucide-react';
import type { ModelPreference } from '@/types';
import type { UseModelSelectorReturn } from '@/hooks/useModelSelector';

// ============================================
// Icon Mapping
// ============================================

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  auto: Wand2,
  sparkles: Sparkles,
  leaf: Leaf,
  scale: Scale,
  zap: Zap,
};

function BadgeIcon({ badge, className }: { badge: string; className?: string }) {
  const Icon = BADGE_ICONS[badge];
  if (Icon) {
    return <Icon className={className} />;
  }
  // Fallback to text (for any legacy emoji badges)
  return <span className={className}>{badge}</span>;
}

// ============================================
// Types
// ============================================

interface ModelSelectorProps {
  preference: ModelPreference;
  onPreferenceChange: (preference: ModelPreference) => void;
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
          Growing Soon
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          Power mode is coming — we&apos;ve noted your interest! In the meantime, Eco and Balanced modes are kinder to the planet while still helping your garden thrive.
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full btn-primary text-sm py-3"
          style={{ minHeight: '2.75rem' }}
        >
          Got it
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
  // For locked options, render card with dimmed text + upgrade button
  if (locked) {
    return (
      <div className="relative border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
        {/* Content Area - dimmed with gray text */}
        <div className="px-4 py-3.5 flex flex-col gap-2">
          {/* Top row: Badge + Label + Lock icon */}
          <div className="flex items-center gap-2">
            {/* Badge Icon - dimmed gray */}
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors text-[var(--color-text-muted)]/50">
              <BadgeIcon badge={badge} className="w-5 h-5" />
            </span>

            {/* Label - gray instead of white */}
            <span className="text-sm font-semibold text-[var(--color-text-muted)]">
              {label}
            </span>

            {/* Lock icon - gray */}
            <Lock className="w-4 h-4 text-[var(--color-text-muted)]/60 flex-shrink-0 ml-auto" />
          </div>

          {/* Description - very light gray */}
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]/40">
            {description}
          </p>
        </div>

        {/* Upgrade Button Wrapper */}
        <div className="px-4 pb-3.5 pt-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpgradeClick(value);
            }}
            className="w-full text-sm px-3 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/40 hover:scale-[1.02] transition-all leading-none cursor-pointer"
            aria-label={`Upgrade to access ${label}`}
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // For unlocked options, render normal row
  return (
    <div
      className={`flex flex-col gap-2 px-4 py-3.5 rounded-xl transition-all cursor-pointer group ${
        isSelected
          ? 'bg-[var(--color-primary)]/12 border border-[var(--color-primary)]'
          : 'hover:bg-[var(--color-surface-hover)]'
      }`}
      onClick={() => {
        if (!locked) onSelect(value);
      }}
      role="option"
      aria-selected={isSelected}
      aria-disabled={locked}
    >
      {/* Top row: Badge + Label + Checkmark (if selected) */}
      <div className="flex items-center gap-2">
        {/* Badge Icon */}
        <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${
          isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
        }`}>
          <BadgeIcon badge={badge} className="w-5 h-5" />
        </span>

        {/* Label */}
        <span className={`text-sm font-semibold ${
          isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'
        }`}>
          {label}
        </span>

        {/* Recommended Badge */}
        {value === 'auto' && (
          <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md font-medium leading-none whitespace-nowrap">
            Recommended
          </span>
        )}

        {/* Checkmark (for selected) */}
        {isSelected && (
          <Check className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 ml-auto" />
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function ModelSelector({
  preference,
  onPreferenceChange,
  options,
  onUpgradeClick,
  isSaving = false,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Client-side only rendering for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const currentOption = options.find((o) => o.value === preference) ?? options[0];

  const handleUpgradeClick = async (tier: string) => {
    setIsOpen(false);
    setShowComingSoon(true);
    await onUpgradeClick(tier);
  };

  return (
    <>
      {/* Trigger button - Minimalist pill style */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3.5 py-2
          bg-[var(--color-surface)] border border-[var(--color-border)]
          rounded-full text-sm font-medium
          text-[var(--color-text-secondary)] transition-all duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-hover)]'}
          ${isOpen ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : ''}
        `}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Model: ${currentOption?.label ?? 'AUTO'}`}
      >
        <BadgeIcon badge={currentOption?.badge ?? 'auto'} className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-medium tracking-normal">
          {currentOption?.label ?? 'AUTO'}
        </span>
        {isSaving ? (
          <span className="w-3 h-3 border-1.5 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" aria-label="Saving..." />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 text-[var(--color-text-muted)] ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Center Modal - Portal-based */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Select model preference"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-6 pt-4 pb-2">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Choose Mode
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Select how you want the AI to respond
              </p>
            </div>

            {/* Options */}
            <div className="px-4 py-3 space-y-1.5">
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
          </div>
        </div>,
        document.body
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <ComingSoonModal onClose={() => setShowComingSoon(false)} />
      )}
    </>
  );
}
