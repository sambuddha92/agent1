'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Download, 
  Trash2, 
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Bot,
  Upload
} from 'lucide-react';
import type { Image as ImageType } from '@/types';

interface ImageViewerProps {
  images: ImageType[];
  initialIndex: number;
  onClose: () => void;
  onToggleFavorite: (imageId: string) => void;
  onDelete: (imageId: string, path: string) => void;
}

function ImageViewer({
  images,
  initialIndex,
  onClose,
  onToggleFavorite,
  onDelete,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentImage = images[currentIndex];
  const isFavorite = currentImage?.metadata?.is_favorite ?? false;

  // Check if Web Share API is supported
  useEffect(() => {
    setIsShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Get image URL helper
  const getImageUrl = useCallback((path: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Reset zoom and position when changing images
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (scale === 1) {
        setShowControls(false);
      }
    }, 3000);
  }, [scale]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.5, 5));
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev / 1.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Double tap to zoom
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (scale > 1) {
        handleResetZoom();
      } else {
        setScale(2.5);
        // Center zoom on tap position would go here
      }
    }
    lastTapRef.current = now;
  }, [scale, handleResetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => {
      const newScale = Math.min(Math.max(prev * delta, 1), 5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Drag/pan when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (scale === 1) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;
      if (diff > 0) {
        setSwipeOffset(diff);
      }
    }
  }, [scale, touchStartY]);

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > 150) {
      setIsClosing(true);
      setTimeout(onClose, 200);
    } else {
      setSwipeOffset(0);
    }
  }, [swipeOffset, onClose]);

  // Swipe navigation for touch devices
  const [touchStartX, setTouchStartX] = useState(0);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    handleDoubleTap(e);
  }, [handleDoubleTap]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (scale > 1) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Only trigger horizontal swipe if it's more horizontal than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0 && currentIndex < images.length - 1) {
        goToNext();
      } else if (diffX < 0 && currentIndex > 0) {
        goToPrevious();
      }
    }
    
    handleTouchEnd();
  }, [scale, touchStartX, touchStartY, currentIndex, images.length, goToNext, goToPrevious, handleTouchEnd]);

  // Share function
  const handleShare = useCallback(async () => {
    const imageUrl = getImageUrl(currentImage.storage_path);
    
    if (isShareSupported) {
      try {
        await navigator.share({
          title: 'My Garden Photo',
          text: currentImage.description || 'Check out this plant from my garden!',
          url: imageUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(imageUrl);
          alert('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(imageUrl);
      alert('Link copied to clipboard!');
    }
  }, [currentImage, getImageUrl, isShareSupported]);

  // Download function
  const handleDownload = useCallback(async () => {
    try {
      const imageUrl = getImageUrl(currentImage.storage_path);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garden-${currentImage.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  }, [currentImage, getImageUrl]);

  // Handle delete
  const handleDelete = useCallback(() => {
    onDelete(currentImage.id, currentImage.storage_path);
    if (images.length === 1) {
      onClose();
    } else if (currentIndex === images.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentImage, currentIndex, images.length, onDelete, onClose]);

  if (!currentImage) return null;

  const opacity = isClosing ? 0 : 1 - swipeOffset / 300;
  const translateY = isClosing ? 100 : swipeOffset;

  return (
    <div 
      ref={containerRef}
      className="gallery-viewer"
      style={{ opacity }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onClose();
        }
        resetControlsTimeout();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div 
        className={`gallery-viewer-header ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={onClose}
          className="gallery-viewer-btn"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="gallery-viewer-counter">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="flex items-center gap-2">
          {/* Type Badge */}
          <span className="gallery-viewer-badge">
            {currentImage.type === 'generated' ? <Bot size={14} /> : <Upload size={14} />}
            <span className="capitalize">{currentImage.type}</span>
          </span>
        </div>
      </div>

      {/* Navigation Arrows - Desktop */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`gallery-viewer-nav gallery-viewer-nav-prev ${showControls ? 'opacity-100' : 'opacity-0'} ${currentIndex === 0 ? 'invisible' : ''}`}
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === images.length - 1}
            className={`gallery-viewer-nav gallery-viewer-nav-next ${showControls ? 'opacity-100' : 'opacity-0'} ${currentIndex === images.length - 1 ? 'invisible' : ''}`}
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Main Image Area */}
      <div 
        ref={imageRef}
        className="gallery-viewer-image-container"
        style={{ transform: `translateY(${translateY}px)` }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleSwipeEnd}
      >
        <div
          className="gallery-viewer-image-wrapper"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <Image
            src={getImageUrl(currentImage.storage_path)}
            alt={currentImage.description || 'Garden image'}
            fill
            sizes="100vw"
            className="object-contain"
            priority
            draggable={false}
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div 
        className={`gallery-viewer-zoom ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={handleZoomOut}
          disabled={scale === 1}
          className="gallery-viewer-zoom-btn"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="gallery-viewer-zoom-level">{Math.round(scale * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="gallery-viewer-zoom-btn"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        {scale !== 1 && (
          <button
            onClick={handleResetZoom}
            className="gallery-viewer-zoom-btn"
            aria-label="Reset zoom"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div 
        className={`gallery-viewer-footer ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Image Info */}
        <div className="gallery-viewer-info">
          {currentImage.description && (
            <p className="gallery-viewer-description">{currentImage.description}</p>
          )}
          <p className="gallery-viewer-date">{formatDate(currentImage.created_at)}</p>
        </div>

        {/* Action Buttons */}
        <div className="gallery-viewer-actions">
          <button
            onClick={() => onToggleFavorite(currentImage.id)}
            className={`gallery-viewer-action-btn ${isFavorite ? 'gallery-viewer-action-btn-active' : ''}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={22} className={isFavorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleShare}
            className="gallery-viewer-action-btn"
            aria-label="Share"
          >
            <Share2 size={22} />
          </button>
          <button
            onClick={handleDownload}
            className="gallery-viewer-action-btn"
            aria-label="Download"
          >
            <Download size={22} />
          </button>
          <button
            onClick={handleDelete}
            className="gallery-viewer-action-btn gallery-viewer-action-btn-danger"
            aria-label="Delete"
          >
            <Trash2 size={22} />
          </button>
        </div>
      </div>

      {/* Dot Indicators - Mobile */}
      {images.length > 1 && images.length <= 10 && (
        <div className={`gallery-viewer-dots ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`gallery-viewer-dot ${idx === currentIndex ? 'gallery-viewer-dot-active' : ''}`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe hint on first view */}
      <div className="gallery-viewer-hint">
        <span>Swipe to navigate • Double-tap to zoom</span>
      </div>
    </div>
  );
}

export default memo(ImageViewer);
