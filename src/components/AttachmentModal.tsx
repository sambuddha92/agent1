'use client';

/**
 * AttachmentModal
 *
 * ChatGPT-style centered modal for attachment options.
 * Triggered by the + button in the command pill.
 *
 * Design:
 * - Portal-rendered, centered on screen (same architecture as ModelSelector)
 * - Dark backdrop blur
 * - Two clean action rows: Camera | Upload from Library
 * - X close button + backdrop click + Escape key to dismiss
 * - No permission state UI — OS/browser owns that natively
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageIcon, X } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCamera: () => void;
  onUpload: () => void;
}

export function AttachmentModal({
  isOpen,
  onClose,
  onCamera,
  onUpload,
}: AttachmentModalProps) {
  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add attachment"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-xs shadow-2xl animate-scale-in overflow-hidden">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Add to message
          </h3>
        </div>

        {/* Action rows */}
        <div className="px-2 pb-3 flex flex-col gap-0.5">
          {/* Camera */}
          <button
            type="button"
            onClick={() => {
              // CRITICAL: Call onCamera SYNCHRONOUSLY within user gesture
              // This preserves the iOS Safari gesture chain for native camera input
              // Modal closes after camera action is triggered
              onCamera();
              onClose();
            }}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-left transition-colors hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-hover)] group"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
              <Camera className="w-5 h-5" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Take Photo
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-normal">
                Use your camera
              </span>
            </div>
          </button>

          {/* Upload from Library */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpload();
            }}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-left transition-colors hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-hover)] group"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Choose from Library
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-normal">
                Pick a photo from your device
              </span>
            </div>
          </button>
        </div>

        {/* Safe-area bottom padding on notched phones */}
        <div className="h-2" />
      </div>
    </div>,
    document.body
  );
}
