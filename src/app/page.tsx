import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ROUTES, UI_TEXT } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth/actions';

export default async function Home() {
  // Redirect authenticated users to chat
  const user = await getCurrentUser();
  if (user) {
    redirect(ROUTES.CHAT);
  }
  return (
    <div className="min-h-screen gradient-nature">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.06]">
        <div className="absolute top-20 right-10 md:right-20 text-6xl md:text-9xl animate-float">🌿</div>
        <div className="absolute bottom-32 left-8 md:left-16 text-5xl md:text-8xl animate-float" style={{animationDelay: '2s'}}>🌸</div>
        <div className="absolute top-1/2 right-1/4 md:right-1/3 text-4xl md:text-7xl animate-float" style={{animationDelay: '4s'}}>🍃</div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 py-16 sm:py-20 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20 sm:mb-24 md:mb-32 text-center">
            <div className="inline-block text-6xl sm:text-7xl mb-8 animate-float">🌿</div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-primary mb-6 sm:mb-8 tracking-tight">
              {UI_TEXT.APP_NAME}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-text-primary max-w-3xl mx-auto leading-relaxed font-semibold">
              {UI_TEXT.LANDING_HERO_SUBTITLE}
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-24 sm:mb-28 md:mb-32 max-w-md mx-auto">
            <Link href={ROUTES.SIGNUP} className="btn-primary text-center">
              {UI_TEXT.LANDING_CTA_PRIMARY}
            </Link>
            <Link href={ROUTES.LOGIN} className="btn-secondary text-center">
              {UI_TEXT.LANDING_CTA_SECONDARY}
            </Link>
          </div>

          {/* Core Value Props - 3 Powerful USPs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 mb-20 sm:mb-24 md:mb-28">
            <div className="card-interactive group">
              <div className="text-5xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform">🧠</div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-4 text-primary">Remembers Your Space</h3>
              <p className="text-text-primary leading-relaxed">
                Builds a model of your microclimate—sun hours, wind, containers, soil. Advice calibrated to your exact conditions.
              </p>
            </div>
            
            <div className="card-interactive group">
              <div className="text-5xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-4 text-primary">Acts Proactively</h3>
              <p className="text-text-primary leading-relaxed">
                Adjusts watering before heatwaves. Diagnoses issues early. Watches weather and intervenes autonomously.
              </p>
            </div>
            
            <div className="card-interactive group">
              <div className="text-5xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-4 text-primary">Local Intelligence</h3>
              <p className="text-text-primary leading-relaxed">
                See what thrives in your area. Hyperlocal growth data from your neighborhood&apos;s balconies.
              </p>
            </div>
          </div>

          {/* How It Works - Concrete Examples */}
          <div className="mb-20 sm:mb-24 md:mb-28">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary text-center mb-12 sm:mb-16">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <div className="card group hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">📸</div>
                  <div>
                    <h4 className="font-display text-xl sm:text-2xl font-semibold mb-3 text-primary">Visualize & Plan</h4>
                    <p className="text-text-primary leading-relaxed">
                      Upload a photo. Get dream renders with plants suited to your light and climate, plus a shopping list.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card group hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">🔬</div>
                  <div>
                    <h4 className="font-display text-xl sm:text-2xl font-semibold mb-3 text-primary">Instant Diagnosis</h4>
                    <p className="text-text-primary leading-relaxed">
                      Snap a photo. Get issue identification and treatment recommendations in 60 seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card group hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">✈️</div>
                  <div>
                    <h4 className="font-display text-xl sm:text-2xl font-semibold mb-3 text-primary">Travel Mode</h4>
                    <p className="text-text-primary leading-relaxed">
                      Pre-trip checklist and weather monitoring while you&apos;re away. Return to healthy plants.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card group hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="text-4xl sm:text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">🌱</div>
                  <div>
                    <h4 className="font-display text-xl sm:text-2xl font-semibold mb-3 text-primary">Local Network</h4>
                    <p className="text-text-primary leading-relaxed">
                      Find nearby growers. Swap cuttings and seeds with compatible neighbors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Footer CTA */}
          <div className="p-10 sm:p-12 md:p-16 gradient-forest rounded-2xl text-white shadow-xl">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-6">
                {UI_TEXT.LANDING_CTA_PRIMARY}
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-white/90">
                {UI_TEXT.LANDING_SETUP_PROMISE}
              </p>
              <Link
                href={ROUTES.SIGNUP}
                className="inline-flex items-center justify-center px-10 sm:px-12 py-4 sm:py-5 bg-white text-primary rounded-lg font-bold text-base sm:text-lg hover:bg-white/95 hover:scale-105 active:scale-100 transition-all shadow-xl hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 uppercase tracking-wide"
              >
                Get Started Free
              </Link>
              <p className="text-sm text-white/70 mt-6">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
