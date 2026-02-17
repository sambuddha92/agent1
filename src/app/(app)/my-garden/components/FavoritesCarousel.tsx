'use client';

import { useRef, memo } from 'react';
import type { Image as ImageType } from '@/types';
import ImageCard from './ImageCard';

interface FavoritesCarouselProps {
  images: ImageType[];
  onImageClick: (image: ImageType) => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
}

function FavoritesCarousel({
  images,
  onImageClick,
  onToggleFavorite,
  onDelete,
}: FavoritesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 400;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mb-12 sm:mb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <span>⭐</span> Your Favorites
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {images.length} {images.length === 1 ? 'photo' : 'photos'} you&apos;ve loved
          </p>
        </div>

        {/* Scroll Controls */}
        {images.length > 3 && (
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-lg bg-surface border border-primary/20 hover:border-primary/50 text-primary hover:bg-surface-hover transition-all duration-200"
              aria-label="Scroll left"
              title="Scroll left"
            >
              <span className="text-lg">←</span>
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-lg bg-surface border border-primary/20 hover:border-primary/50 text-primary hover:bg-surface-hover transition-all duration-200"
              aria-label="Scroll right"
              title="Scroll right"
            >
              <span className="text-lg">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {images.map((image) => (
            <div
              key={image.id}
              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 snap-center animate-fade-in"
            >
              <div className="h-64 sm:h-72 lg:h-80">
                <div onClick={() => onImageClick(image)} className="h-full">
                  <ImageCard
                    image={image}
                    onImageClick={onImageClick}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={onDelete}
                    size="large"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gradient Fade on Right */}
        <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none rounded-r-lg" />
      </div>
    </div>
  );
}

export default memo(FavoritesCarousel);
