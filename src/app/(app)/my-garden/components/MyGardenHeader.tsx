'use client';

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
    { id: 'uploaded', label: 'Uploaded', icon: '📤' },
    { id: 'generated', label: 'Generated', icon: '🤖' },
    { id: 'favorites', label: 'Favorites', icon: '⭐', count: favoriteCount },
  ];

  return (
    <div className="mb-12 sm:mb-16 animate-fade-in">
      {/* Title Section - Clean, Centered */}
      <div className="mb-10 sm:mb-12">
        <div className="flex items-center gap-3 sm:gap-4 mb-2 justify-start">
          <div className="text-5xl sm:text-6xl animate-pulse-soft flex-shrink-0">🌱</div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
              My Garden
            </h1>
            <p className="text-text-secondary text-sm sm:text-base mt-1 font-light">
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 active-press ${
              selectedFilter === filter.id
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40'
                : 'bg-surface border border-primary/20 text-text-primary hover:bg-surface-hover hover:border-primary/40'
            }`}
          >
            {filter.icon && <span>{filter.icon}</span>}
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span className={`text-xs font-semibold ${selectedFilter === filter.id ? 'text-white/80' : 'text-text-muted'}`}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
