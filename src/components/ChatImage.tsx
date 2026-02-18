'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatImageProps {
  src: string;
  alt: string;
  index?: number;
}

type ImageState = 'loading' | 'loaded' | 'unavailable';

const TIMEOUT_MS = 5000; // 5 seconds

/**
 * ChatImage component with instant placeholder, smooth fade-in, and timeout
 * - Shimmer placeholder shows immediately (0ms)
 * - Image loads in background
 * - Smooth fade when image is ready
 * - After 5s timeout → shows "Image unavailable" static placeholder
 */
export function ChatImage({ src, alt, index = 0 }: ChatImageProps) {
  const [state, setState] = useState<ImageState>('loading');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up timeout for unavailable state
  useEffect(() => {
    if (state === 'loading') {
      timeoutRef.current = setTimeout(() => {
        setState('unavailable');
      }, TIMEOUT_MS);
    }

    // Cleanup on unmount or state change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state]);

  const handleLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState('loaded');
  };

  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState('unavailable');
  };

  // Unavailable state - static placeholder
  if (state === 'unavailable') {
    return (
      <div className="mb-3 w-full max-w-xs h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-lg overflow-hidden relative w-full max-w-xs">
      {/* Shimmer placeholder - shows while loading */}
      {state === 'loading' && (
        <div className="w-full h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded-lg" />
      )}
      
      {/* Image loads in background, fades in smoothly when ready */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || `Shared image ${index + 1}`}
        className={`w-full h-auto object-cover max-h-64 transition-opacity duration-300 ease-out ${
          state === 'loaded' ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

export default ChatImage;
