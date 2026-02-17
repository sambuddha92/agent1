'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Bot, Upload, Heart, Star, Trash2 } from 'lucide-react';
import type { Image as ImageType } from '@/types';

interface ImageCardProps {
  image: ImageType;
  onImageClick: (image: ImageType) => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
  size?: 'small' | 'large';
}

function ImageCard({
  image,
  onImageClick,
  onToggleFavorite,
  onDelete,
  size = 'small',
}: ImageCardProps) {
  const getImageUrl = (path: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isFavorite = image.metadata?.is_favorite ?? false;
  const containerClass = size === 'large' ? 'aspect-video' : 'aspect-square';

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-surface border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer animate-scale-in"
      onClick={() => onImageClick(image)}
    >
      {/* Image Container */}
      <div className={`relative ${containerClass} bg-surface overflow-hidden`}>
        <Image
          src={getImageUrl(image.storage_path)}
          alt={image.description || 'Garden image'}
          fill
          sizes={size === 'large' ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        {/* Top Actions */}
        <div className="flex justify-between items-start">
          {/* Type Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium">
            {image.type === 'generated' ? <Bot size={14} /> : <Upload size={14} />}
            <span className="capitalize ml-1">{image.type}</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(image.id);
            }}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all duration-200 hover:scale-110"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="space-y-2">
          {/* Description */}
          {image.description && (
            <div className="font-semibold text-sm text-white line-clamp-2">
              {image.description}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/80">
              {formatDate(image.created_at)}
            </div>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id, image.storage_path);
              }}
              className="p-2 bg-error/80 hover:bg-error text-white rounded-lg transition-all duration-200 hover:scale-110"
              title="Delete image"
              aria-label="Delete image"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Favorite Badge (always visible) */}
      {isFavorite && (
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 rounded-full text-xs font-bold text-white shadow-lg">
          <Star size={12} className="fill-current" />
        </div>
      )}
    </div>
  );
}

export default memo(ImageCard);
