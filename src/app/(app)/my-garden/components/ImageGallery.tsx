'use client';

import { memo } from 'react';
import type { Image as ImageType } from '@/types';
import { InboxIcon } from 'lucide-react';
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
      <div className="text-center py-12 sm:py-16">
        <div className="mb-4 opacity-50 flex justify-center">
          <InboxIcon size={48} />
        </div>
        <p className="text-text-secondary">No images match your filter</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {images.map((image, index) => (
          <div
            key={image.id}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ImageCard
              image={image}
              onImageClick={onImageClick}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              size="small"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ImageGallery);
