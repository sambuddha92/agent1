'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import type { Image as ImageType } from '@/types';

interface ImageGridProps {
  initialImages: ImageType[];
}

/**
 * Get Supabase public image URL
 * Memoized to prevent recalculation on every render
 */
function getImageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
}

/**
 * Individual image card component
 * Memoized to prevent unnecessary re-renders
 * Uses Next.js Image for automatic optimization (resizing, lazy loading, WebP)
 */
interface ImageCardProps {
  image: ImageType;
}

const ImageCard = memo(function ImageCard({ image }: ImageCardProps) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-black border border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
      <Image
        src={getImageUrl(image.storage_path)}
        alt={image.description || 'Garden image'}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="text-white text-xs">
          <div className="font-semibold">{image.description || 'Untitled'}</div>
          <div className="text-white/70">{new Date(image.created_at).toLocaleDateString()}</div>
          <div className="text-white/70 capitalize text-xs">{image.type}</div>
        </div>
      </div>
    </div>
  );
});

/**
 * Main image grid component
 * Implements pagination with "Load More" button
 * Memoized child cards prevent re-renders when parent re-renders
 */
export default function ImageGrid({ initialImages }: ImageGridProps) {
  const [displayCount, setDisplayCount] = useState(12);
  const displayedImages = initialImages.slice(0, displayCount);
  const hasMore = displayCount < initialImages.length;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {displayedImages.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setDisplayCount(prev => prev + 12)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
