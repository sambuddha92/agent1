'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, Bot, Upload, Heart, Star, Download, Trash2 } from 'lucide-react';
import type { Image as ImageType } from '@/types';

interface ImageDetailModalProps {
  image: ImageType;
  onClose: () => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
}

export default function ImageDetailModal({
  image,
  onClose,
  onToggleFavorite,
  onDelete,
}: ImageDetailModalProps) {
  const getImageUrl = (path: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isFavorite = image.metadata?.is_favorite ?? false;

  // Handle keyboard navigation + prevent body scroll while modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const imageUrl = getImageUrl(image.storage_path);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garden-${image.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      {/* Close button (top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 hover:scale-110 z-10"
        title="Close"
        aria-label="Close modal"
      >
        <X size={24} />
      </button>

      {/* Main Container */}
      <div className="w-full h-full flex items-center justify-center p-4 animate-scale-in">
        <div className="max-w-5xl w-full max-h-[90vh] flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden">
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[500px] lg:min-h-[600px]">
              <Image
                src={getImageUrl(image.storage_path)}
                alt={image.description || 'Garden image'}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-72 bg-surface rounded-xl p-6 overflow-y-auto max-h-[90vh] border border-primary/10">
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-primary/10">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-display text-xl font-bold text-primary">
                  Image Details
                </h2>
                {isFavorite && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 rounded-full text-xs font-bold text-white">
                    <Star size={12} className="fill-current" />
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {image.description && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-sm text-text-primary leading-relaxed">
                  {image.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-4 mb-8 pb-8 border-b border-primary/10">
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Type
                </h3>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  {image.type === 'generated' ? <Bot size={14} /> : <Upload size={14} />}
                  <span className="text-sm font-medium text-primary capitalize ml-1">
                    {image.type}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Uploaded
                </h3>
                <p className="text-sm text-text-primary">
                  {formatDate(image.created_at)}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Storage Path
                </h3>
                <p className="text-xs text-text-secondary font-mono break-all">
                  {image.storage_path}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => onToggleFavorite(image.id)}
                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isFavorite
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg hover:shadow-yellow-500/30'
                    : 'bg-surface-hover border border-primary/20 text-text-primary hover:border-primary/50'
                }`}
              >
                <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-surface-hover border border-primary/20 text-text-primary hover:border-primary/50 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                <span>Download</span>
              </button>

              <button
                onClick={() => {
                  onDelete(image.id, image.storage_path);
                  onClose();
                }}
                className="w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-error/10 border border-error/30 text-error hover:bg-error/20 hover:border-error/50 flex items-center justify-center gap-2"
              >
                <Trash2 size={20} />
                <span>Delete</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-primary/10 text-center">
              <p className="text-xs text-text-secondary">
                Press <kbd className="px-2 py-1 bg-surface-hover rounded text-xs font-mono">ESC</kbd> to close
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
