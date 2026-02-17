export default function BloomMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-8 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-5xl animate-pulse-soft">🗺️</div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary">Neighborhood</h1>
              <p className="text-text-secondary text-base sm:text-lg mt-1">Connect with local plant enthusiasts</p>
            </div>
          </div>
        </div>
        
        {/* Coming Soon Card */}
        <div className="card-elevated backdrop-glass text-center p-12 sm:p-16 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="text-7xl sm:text-8xl mb-8 animate-float">🌍</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-6">
              Connect with Your Plant Community
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-12">
              Discover local gardens, share insights with nearby plant enthusiasts, and learn what thrives 
              in your specific climate and community.
            </p>
            
            {/* Feature Preview */}
            <div className="grid sm:grid-cols-2 gap-6 mt-12">
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Local Discovery</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Explore gardens in your area and see what plants are thriving in your neighborhood.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Community Connection</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Connect with local gardeners to exchange plants, tips, and gardening experiences.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Climate Insights</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Learn which plants successfully grow in your specific microclimate and conditions.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Garden Inspiration</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Get inspired by successful local gardens and discover new possibilities for your space.
                </p>
              </div>
            </div>

            {/* Map Preview */}
            <div className="mt-12 card rounded-2xl overflow-hidden border-2 p-16">
              <div className="text-7xl mb-6">🗺️</div>
              <p className="text-sm text-primary font-semibold mb-4 uppercase tracking-wide">Interactive Map Preview</p>
              <div className="flex justify-center gap-8 text-4xl">
                <span>🏡</span>
                <span>🌻</span>
                <span>🌿</span>
                <span>🌺</span>
                <span>🌱</span>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-text-secondary">
                <strong className="text-primary font-semibold">Coming soon:</strong> An interactive map connecting local gardeners and sharing regional growing insights.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-6 mt-8 animate-slide-up">
          <div className="card-elevated text-center p-8">
            <div className="text-4xl font-display font-bold text-primary mb-2">Soon</div>
            <p className="text-sm text-text-secondary">Active Gardeners</p>
          </div>
          <div className="card-elevated text-center p-8">
            <div className="text-4xl font-display font-bold text-primary mb-2">Soon</div>
            <p className="text-sm text-text-secondary">Neighborhood Gardens</p>
          </div>
          <div className="card-elevated text-center p-8">
            <div className="text-4xl font-display font-bold text-primary mb-2">Soon</div>
            <p className="text-sm text-text-secondary">Plant Species Shared</p>
          </div>
        </div>
      </div>
    </div>
  );
}
