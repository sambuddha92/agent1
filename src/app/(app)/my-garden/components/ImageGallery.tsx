'use client';

import { memo } from 'react';
import type { Image as ImageType } from '@/types';
import { ImageIcon } from 'lucide-react';
import ImageCard from './ImageCard';

interface ImageGalleryProps {
  images: ImageType[];
  onImageClick: (image: ImageType) => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
}

function ImageGallery({
  images,
  onImageClick,
  onToggleFavorite,
  onDelete,
}: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-base font-medium text-[var(--color-text-secondary)] mb-1">No photos found</p>
        <p className="text-sm text-[var(--color-text-muted)]">Try a different filter</p>
      </div>
    );
  }

  return (
    <section aria-label="Image gallery">
      {/* Vertical stack - single column, max-width centered */}
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            onImageClick={onImageClick}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(ImageGallery);
