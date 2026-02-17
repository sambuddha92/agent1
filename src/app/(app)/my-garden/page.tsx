'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Image as ImageType } from '@/types';
import MyGardenHeader from './components/MyGardenHeader';
import FavoritesCarousel from './components/FavoritesCarousel';
import ImageGallery from './components/ImageGallery';
import ImageDetailModal from './components/ImageDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import EmptyState from './components/EmptyState';

type FilterType = 'all' | 'uploaded' | 'generated' | 'favorites';

export default function MyGardenPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
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
  const handleToggleFavorite = async (imageId: string) => {
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
    }
  };

  // Handle delete
  const handleDeleteClick = (imageId: string, path: string) => {
    setDeleteConfirm({ id: imageId, path });
  };

  const handleConfirmDelete = async () => {
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

      setImages(images.filter(img => img.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      if (selectedImage?.id === deleteConfirm.id) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter images based on selected filter
  const getFilteredImages = (): ImageType[] => {
    let filtered = images;

    if (selectedFilter === 'uploaded') {
      filtered = filtered.filter(img => img.type === 'uploaded');
    } else if (selectedFilter === 'generated') {
      filtered = filtered.filter(img => img.type === 'generated');
    } else if (selectedFilter === 'favorites') {
      filtered = filtered.filter(img => img.metadata?.is_favorite);
    }

    return filtered;
  };

  const filteredImages = getFilteredImages();
  const favoriteImages = images.filter(img => img.metadata?.is_favorite);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-primary mb-2">Oops!</h1>
          <p className="text-text-secondary mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <MyGardenHeader
          totalImages={images.length}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          favoriteCount={favoriteImages.length}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Content */}
        {images.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Favorites Carousel */}
            {favoriteImages.length > 0 && (
              <FavoritesCarousel
                images={favoriteImages}
                onImageClick={setSelectedImage}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteClick}
              />
            )}

            {/* Image Gallery */}
            <ImageGallery
              images={filteredImages}
              onImageClick={setSelectedImage}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteClick}
            />
          </>
        )}
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
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
