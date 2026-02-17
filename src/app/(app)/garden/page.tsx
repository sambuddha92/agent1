export default function GardenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface p-8 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-5xl animate-pulse-soft">🌱</div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary">My Garden</h1>
              <p className="text-text-secondary text-base sm:text-lg mt-1">Track and manage your plants</p>
            </div>
          </div>
        </div>
        
        {/* Coming Soon Card */}
        <div className="card-elevated backdrop-glass text-center p-12 sm:p-16 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="text-7xl sm:text-8xl mb-8 animate-float">🪴</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-6">
              Coming Soon: Your Garden Dashboard
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-12">
              Track all your plants, monitor their health, and receive personalized care recommendations 
              in one beautifully organized dashboard.
            </p>
            
            {/* Feature Preview */}
            <div className="grid sm:grid-cols-2 gap-6 mt-12">
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Plant Collection</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Comprehensive tracking for every plant—species, age, location, and detailed care notes 
                  all in one place.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">💚</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Health Monitoring</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Real-time health assessments and actionable recommendations to keep your plants thriving.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Growth Timeline</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Visual documentation of your plants&apos; growth journey from seedling to full maturity.
                </p>
              </div>
              
              <div className="card rounded-2xl p-8 text-left hover:border-primary/30 transition-all">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-primary mb-3">Care Reminders</h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  Timely notifications for watering, feeding, pruning, and seasonal care tasks.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-text-secondary">
                <strong className="text-primary font-semibold">In the meantime:</strong> Use Garden Chat to track and manage your plants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
