'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Image as ImageType } from '@/types';

export default function GardenPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'uploaded' | 'generated' | undefined>(undefined);

  useEffect(() => {
    async function loadUserAndImages() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Query images directly using Supabase client
          let query = supabase
            .from('images')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (selectedType) {
            query = query.eq('type', selectedType);
          }

          const { data, error } = await query;
          if (error) throw error;
          setImages(data || []);
        }
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserAndImages();
  }, [selectedType]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="text-4xl sm:text-5xl animate-pulse-soft">🌱</div>
            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-primary">My Garden</h1>
              <p className="text-text-secondary text-sm sm:text-lg mt-1">
                {images.length} {images.length === 1 ? 'image' : 'images'} in your garden
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType(undefined)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === undefined
                ? 'bg-primary text-white'
                : 'bg-surface border border-primary/20 text-text-secondary hover:border-primary/40'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setSelectedType('uploaded')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'uploaded'
                ? 'bg-primary text-white'
                : 'bg-surface border border-primary/20 text-text-secondary hover:border-primary/40'
            }`}
          >
            Uploaded
          </button>
          <button
            onClick={() => setSelectedType('generated')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'generated'
                ? 'bg-primary text-white'
                : 'bg-surface border border-primary/20 text-text-secondary hover:border-primary/40'
            }`}
          >
            Generated
          </button>
        </div>

        {/* Gallery or Empty State */}
        {images.length === 0 ? (
          <div className="card-elevated backdrop-glass text-center p-12 sm:p-16 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl sm:text-7xl mb-6 animate-float">📷</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-4">
                Your garden is empty
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8">
                Share photos in Garden Chat to build your collection. Capture plant photos, upload existing images,
                and watch your garden grow!
              </p>
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium">
                <span>💡 Tip:</span> Visit Garden Chat to upload your first photo
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-black border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="absolute inset-0 flex items-center justify-center text-4xl bg-surface/50">
                  📷
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white text-xs">
                    <div className="font-semibold">{image.description || 'Untitled'}</div>
                    <div className="text-white/70">{new Date(image.created_at).toLocaleDateString()}</div>
                    <div className="text-white/70 capitalize text-xs">{image.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
