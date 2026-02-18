'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type FilterType = 'all' | 'uploaded' | 'generated' | 'favorites';
type SortType = 'newest' | 'oldest' | 'favorites-first';

interface MyGardenHeaderProps {
  totalImages: number;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  favoriteCount: number;
  selectedSort?: SortType;
  onSortChange?: (sort: SortType) => void;
}

export default function MyGardenHeader({
  totalImages,
  selectedFilter,
  onFilterChange,
  favoriteCount,
  selectedSort = 'newest',
  onSortChange,
}: MyGardenHeaderProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'uploaded', label: 'Uploaded' },
    { id: 'generated', label: 'AI' },
    { id: 'favorites', label: '❤️' },
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'favorites-first', label: 'Favorites' },
  ];

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="mb-6 sm:mb-8">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl sm:text-3xl" role="img" aria-label="Plant">🌿</span>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)] tracking-tight">
            My Garden
          </h1>
        </div>
        
        {/* Photo count badge */}
        {totalImages > 0 && (
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2.5 py-1 rounded-full">
            {totalImages} {totalImages === 1 ? 'photo' : 'photos'}
          </span>
        )}
      </div>

      {/* Filter & Sort Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div 
          className="flex p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"
          role="tablist" 
          aria-label="Filter images"
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter.id;
            const count = filter.id === 'all' ? totalImages : filter.id === 'favorites' ? favoriteCount : null;
            
            return (
              <button
                key={filter.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(filter.id)}
                className={`
                  relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
              >
                <span className="flex items-center gap-1.5">
                  {filter.label}
                  {count !== null && count > 0 && (
                    <span className={`text-[10px] ${isActive ? 'opacity-75' : 'opacity-50'}`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        {onSortChange && totalImages > 1 && (
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-all"
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
            >
              <span className="hidden sm:inline">{sortOptions.find(s => s.id === selectedSort)?.label}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort Dropdown Menu */}
            {showSortMenu && (
              <div 
                className="absolute top-full right-0 mt-1.5 min-w-[140px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in"
                role="listbox"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    role="option"
                    aria-selected={selectedSort === option.id}
                    onClick={() => {
                      onSortChange(option.id as SortType);
                      setShowSortMenu(false);
                    }}
                    className={`
                      flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors
                      ${selectedSort === option.id 
                        ? 'text-[var(--color-primary)] font-medium bg-[var(--color-surface-hover)]' 
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {selectedSort === option.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
