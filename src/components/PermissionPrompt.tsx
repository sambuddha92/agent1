'use client';

import { Camera } from 'lucide-react';

interface PermissionPromptProps {
  onRequestPermission: () => void;
  onClose: () => void;
  onFallbackToUpload: () => void;
}

/**
 * PermissionPrompt Component
 * Compact, native-OS-style permission dialog — no marketing copy, just a clear ask.
 */
export function PermissionPrompt({
  onRequestPermission,
  onClose,
  onFallbackToUpload,
}: PermissionPromptProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1040] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 animate-scale-in">
        <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm p-5">

          {/* Icon + copy */}
          <div className="flex flex-col items-center text-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-text-primary leading-snug">
              Allow Camera Access?
            </h2>
            <p className="text-sm text-text-muted leading-snug">
              To take photos of your plants directly in chat.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onFallbackToUpload}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Upload Instead
            </button>
            <button
              onClick={onRequestPermission}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Camera className="w-4 h-4" />
              Allow
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
