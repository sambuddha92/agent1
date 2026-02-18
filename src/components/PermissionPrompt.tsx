'use client';

import { AlertCircle, Camera, X } from 'lucide-react';

interface PermissionPromptProps {
  onRequestPermission: () => void;
  onClose: () => void;
  onFallbackToUpload: () => void;
}

/**
 * PermissionPrompt Component
 * Shows when camera permission is needed, explaining why and how to grant it
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1040] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 animate-scale-in">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-semibold text-center mb-2 text-text-primary">
            Camera Access Needed
          </h2>
          
          <p className="text-center text-text-secondary mb-6">
            We need your permission to access the camera so you can take photos of your plants directly in the app.
          </p>

          {/* Benefits */}
          <div className="bg-background rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <p className="text-sm text-text-secondary">
                Take photos instantly without leaving the chat
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <p className="text-sm text-text-secondary">
                Get real-time plant care advice with photos
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <p className="text-sm text-text-secondary">
                Your privacy is protected - we only access the camera when you use it
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onRequestPermission}
              className="btn-primary w-full"
            >
              <Camera className="w-5 h-5" />
              Allow Camera Access
            </button>

            <button
              onClick={onFallbackToUpload}
              className="btn-secondary w-full"
            >
              Upload from Gallery Instead
            </button>
          </div>

          {/* Info note */}
          <div className="mt-4 flex items-start gap-2 text-xs text-text-muted">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              You can change camera permissions anytime in your browser settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
