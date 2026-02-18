'use client';

import { Upload, Bot, Star } from 'lucide-react';

interface MyGardenHeaderProps {
  totalImages: number;
  selectedFilter: 'all' | 'uploaded' | 'generated' | 'favorites';
  onFilterChange: (filter: 'all' | 'uploaded' | 'generated' | 'favorites') => void;
  favoriteCount: number;
}

export default function MyGardenHeader({
  totalImages,
  selectedFilter,
  onFilterChange,
  favoriteCount,
}: MyGardenHeaderProps) {
  const filters = [
    { id: 'all', label: 'All Photos', count: totalImages },
    { id: 'uploaded', label: 'Uploaded', icon: <Upload size={16} /> },
    { id: 'generated', label: 'Generated', icon: <Bot size={16} /> },
    { id: 'favorites', label: 'Favorites', icon: <Star size={16} className="fill-current" />, count: favoriteCount },
  ];

  return (
    <div className="mb-12 sm:mb-16 animate-fade-in">
      {/* Title Section - Clean, Centered */}
      <div className="mb-10 sm:mb-12">
        <div className="flex items-center gap-3 sm:gap-4 mb-2 justify-start">
          <div className="text-4xl sm:text-5xl animate-pulse-soft flex-shrink-0">🌱</div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary tracking-tight">
              My Garden
            </h1>
            <p className="text-text-muted text-xs sm:text-sm mt-0.5 font-light">
              Your plant collection and AI insights
            </p>
          </div>
        </div>
      </div>

      {/* Filter Pills - ChatGPT Style */}
      <div className="flex gap-2 flex-wrap items-center">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id as 'all' | 'uploaded' | 'generated' | 'favorites')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium text-xs transition-all duration-200 active-press ${
              selectedFilter === filter.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:border-border-hover hover:text-text-primary'
            }`}
          >
            {filter.icon}
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span className={`text-xs font-normal ${selectedFilter === filter.id ? 'text-white/70' : 'text-text-muted'}`}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
