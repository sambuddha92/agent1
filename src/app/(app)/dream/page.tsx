export default function DreamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-8 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-5xl animate-pulse-soft">🎨</div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary">Visualize</h1>
              <p className="text-text-secondary text-base sm:text-lg mt-1">Design your ideal garden space</p>
            </div>
          </div>
        </div>
        
        {/* Coming Soon Card */}
        <div className="card-elevated backdrop-glass text-center p-12 sm:p-16 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="text-7xl sm:text-8xl mb-8 animate-float">✨</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-6">
              Reimagine Your Space
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-12">
              Upload a photo of your space to see AI-generated garden designs tailored to your environment. 
              Explore possibilities and plan your ideal garden layout.
            </p>
            
            {/* Feature Preview */}
            <div className="grid sm:grid-cols-3 gap-6 mt-12">
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Visual Transform</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Upload your space and receive instant AI-generated garden visualizations tailored to your area.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">🌺</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Style Options</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Choose from various garden styles—tropical, zen, cottage, modern, and more to match your vision.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">🌿</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Climate-Smart</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Receive recommendations featuring plants proven to thrive in your specific growing conditions.
                </p>
              </div>
            </div>

            {/* Example Showcase */}
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="card rounded-2xl overflow-hidden border-2 p-10">
                <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">Before</p>
                <div className="text-6xl">🏠</div>
                <p className="text-xs text-text-muted mt-3">Your current space</p>
              </div>
              <div className="card rounded-2xl overflow-hidden border-2 border-primary/30 p-10">
                <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">After</p>
                <div className="text-6xl">🌴🪴🌺</div>
                <p className="text-xs text-text-muted mt-3">AI-designed garden</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-text-secondary">
                <strong className="text-primary font-semibold">Coming soon:</strong> Advanced AI visualization to help you design your perfect garden space.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
