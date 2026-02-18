'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Trash2, Share2 } from 'lucide-react';
import type { Image as ImageType } from '@/types';

interface ImageCardProps {
  image: ImageType;
  onImageClick: (image: ImageType) => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
  index?: number;
}

function ImageCard({
  image,
  onImageClick,
  onToggleFavorite,
  onDelete,
  index = 0,
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const getImageUrl = (path: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
  };

  const isFavorite = image.metadata?.is_favorite ?? false;
  const imageUrl = getImageUrl(image.storage_path);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFavorite) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    onToggleFavorite(image.id);
  }, [isFavorite, image.id, onToggleFavorite]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(image.id, image.storage_path);
  }, [image.id, image.storage_path, onDelete]);

  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my plant!',
          text: image.description || 'From my garden',
          url: imageUrl,
        });
      } catch {
        // User cancelled or share failed, fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
    
    function copyToClipboard() {
      navigator.clipboard.writeText(imageUrl);
      // Could add toast notification here
    }
  }, [imageUrl, image.description]);

  const handleCardClick = useCallback(() => {
    onImageClick(image);
  }, [image, onImageClick]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-[var(--color-surface-hover)] cursor-pointer transition-all duration-300 ease-out hover:shadow-xl active:scale-[0.99]"
      style={{ 
        animationDelay: `${Math.min(index * 50, 300)}ms`,
      }}
      onClick={handleCardClick}
    >
      {/* Image Container - Fixed height, centered image */}
      <div className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center bg-[var(--color-surface-hover)]">
        {/* Loading skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-hover)] animate-pulse" />
        )}
        
        <Image
          src={imageUrl}
          alt={image.description || 'Garden photo'}
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          className={`object-contain transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />

        {/* Double-tap heart animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart 
              size={80} 
              className="text-white fill-white animate-heart-pop drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
            />
          </div>
        )}

        {/* Top-right: Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
            isFavorite 
              ? 'bg-white/95 text-rose-500 shadow-md' 
              : 'bg-black/30 text-white hover:bg-black/40'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
        </button>

        {/* Bottom-left: Delete button */}
        <button
          onClick={handleDeleteClick}
          className="absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md text-white hover:bg-red-500/80 transition-all z-10"
          aria-label="Delete photo"
        >
          <Trash2 size={20} />
        </button>

        {/* Bottom-right: Share button */}
        <button
          onClick={handleShareClick}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-all z-10"
          aria-label="Share photo"
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
}

export default memo(ImageCard);
