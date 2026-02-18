'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Image as ImageType } from '@/types';
import MyGardenHeader from './components/MyGardenHeader';
import ImageGallery from './components/ImageGallery';
import ImageViewer from './components/ImageViewer';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import EmptyState from './components/EmptyState';
import { Loader2 } from 'lucide-react';

type FilterType = 'all' | 'uploaded' | 'generated' | 'favorites';
type SortType = 'newest' | 'oldest' | 'favorites-first';

export default function MyGardenPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('newest');
  const [viewerState, setViewerState] = useState<{ isOpen: boolean; index: number }>({ isOpen: false, index: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; path: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load all images
  useEffect(() => {
    async function loadImages() {
      try {
        setError(null);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Please sign in to view your garden');
          setIsLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        setImages(data || []);
      } catch (err) {
        console.error('Error loading images:', err);
        setError('Failed to load your garden');
      } finally {
        setIsLoading(false);
      }
    }

    loadImages();
  }, []);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async (imageId: string) => {
    try {
      const updatedImages = images.map(img => {
        if (img.id === imageId) {
          return {
            ...img,
            metadata: {
              ...img.metadata,
              is_favorite: !img.metadata?.is_favorite,
            },
          };
        }
        return img;
      });

      setImages(updatedImages);

      // Update in database
      const image = updatedImages.find(img => img.id === imageId);
      if (image) {
        const supabase = createClient();
        const { error } = await supabase
          .from('images')
          .update({
            metadata: image.metadata,
          })
          .eq('id', imageId);

        if (error) {
          // Revert on error
          setImages(images);
          throw error;
        }
      }
    } catch (err) {
      console.error('Error updating favorite:', err);
      setError('Failed to update favorite');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [images]);

  // Handle delete click
  const handleDeleteClick = useCallback((imageId: string, path: string) => {
    setDeleteConfirm({ id: imageId, path });
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    setDeletingId(deleteConfirm.id);
    try {
      const response = await fetch(
        `/api/images?id=${deleteConfirm.id}&path=${encodeURIComponent(deleteConfirm.path)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      
      // Close viewer if deleted image was being viewed
      if (viewerState.isOpen) {
        const currentImage = filteredAndSortedImages[viewerState.index];
        if (currentImage?.id === deleteConfirm.id) {
          setViewerState({ isOpen: false, index: 0 });
        }
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm, viewerState]);

  // Sort images
  const sortImages = useCallback((imgs: ImageType[]): ImageType[] => {
    const sorted = [...imgs];
    switch (selectedSort) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'favorites-first':
        return sorted.sort((a, b) => {
          const aFav = a.metadata?.is_favorite ? 1 : 0;
          const bFav = b.metadata?.is_favorite ? 1 : 0;
          if (bFav !== aFav) return bFav - aFav;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [selectedSort]);

  // Filter and sort images
  const filteredAndSortedImages = useMemo((): ImageType[] => {
    let filtered = images;

    if (selectedFilter === 'uploaded') {
      filtered = filtered.filter(img => img.type === 'uploaded');
    } else if (selectedFilter === 'generated') {
      filtered = filtered.filter(img => img.type === 'generated');
    } else if (selectedFilter === 'favorites') {
      filtered = filtered.filter(img => img.metadata?.is_favorite);
    }

    return sortImages(filtered);
  }, [images, selectedFilter, sortImages]);

  // Get favorite images
  const favoriteImages = useMemo(() => {
    return images.filter(img => img.metadata?.is_favorite);
  }, [images]);

  // Handle image click - open viewer
  const handleImageClick = useCallback((image: ImageType) => {
    const index = filteredAndSortedImages.findIndex(img => img.id === image.id);
    if (index !== -1) {
      setViewerState({ isOpen: true, index });
    }
  }, [filteredAndSortedImages]);

  // Handle viewer close
  const handleViewerClose = useCallback(() => {
    setViewerState({ isOpen: false, index: 0 });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-surface via-background to-surface">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-text-muted text-sm font-light">Loading your garden...</p>
        </div>
      </div>
    );
  }

  // Error state (no images)
  if (error && images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface via-background to-surface">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-primary mb-2">Oops!</h1>
          <p className="text-text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-surface via-background to-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24">
        {/* Header with Filters & Sort */}
        <MyGardenHeader
          totalImages={images.length}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          favoriteCount={favoriteImages.length}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
        />

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm animate-slide-up">
            {error}
          </div>
        )}

        {/* Content */}
        {images.length === 0 ? (
          <EmptyState />
        ) : (
          <ImageGallery
            images={filteredAndSortedImages}
            onImageClick={handleImageClick}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* Fullscreen Image Viewer */}
      {viewerState.isOpen && filteredAndSortedImages.length > 0 && (
        <ImageViewer
          images={filteredAndSortedImages}
          initialIndex={viewerState.index}
          onClose={handleViewerClose}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDeleting={deletingId === deleteConfirm.id}
        />
      )}
    </div>
  );
}
