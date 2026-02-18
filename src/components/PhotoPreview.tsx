'use client';

import { Check, X, RotateCcw } from 'lucide-react';
import Image from 'next/image';

interface PhotoPreviewProps {
  photoDataUrl: string;
  onConfirm: () => void;
  onRetake: () => void;
  onClose: () => void;
}

/**
 * PhotoPreview Component
 * Shows captured photo with options to confirm, retake, or cancel
 */
export function PhotoPreview({
  photoDataUrl,
  onConfirm,
  onRetake,
  onClose,
}: PhotoPreviewProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 z-[1040] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1050] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <h3 className="text-white font-semibold">Preview Photo</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Photo */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full aspect-[4/3] rounded-lg overflow-hidden bg-black">
            <Image
              src={photoDataUrl}
              alt="Captured photo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-black/50 backdrop-blur-sm">
          <div className="flex gap-3 max-w-2xl mx-auto">
            {/* Retake */}
            <button
              onClick={onRetake}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>

            {/* Confirm */}
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              <Check className="w-5 h-5" />
              Use This Photo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
