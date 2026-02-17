import Link from 'next/link';
import { ROUTES, UI_TEXT } from '@/lib/constants';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar Navigation */}
      <aside className="w-72 gradient-forest text-white shadow-xl flex flex-col">
        <div className="p-8 border-b border-white/10">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 group">
            <span className="text-4xl group-hover:animate-pulse-soft">🌿</span>
            <div>
              <h2 className="font-display text-2xl font-bold">{UI_TEXT.APP_NAME}</h2>
              <p className="text-xs text-white/70 mt-1">{UI_TEXT.APP_TAGLINE}</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link href={ROUTES.CHAT} className="nav-link group">
            <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
            <div className="flex-1">
              <span className="font-semibold block">Chat</span>
              <span className="text-xs text-white/70">Ask your AI companion</span>
            </div>
          </Link>
          
          <Link href={ROUTES.GARDEN} className="nav-link group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
            <div className="flex-1">
              <span className="font-semibold block">My Garden</span>
              <span className="text-xs text-white/70">Track your plants</span>
            </div>
          </Link>
          
          <Link href={ROUTES.DREAM} className="nav-link group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🎨</span>
            <div className="flex-1">
              <span className="font-semibold block">Visualize</span>
              <span className="text-xs text-white/70">Design your space</span>
            </div>
          </Link>
          
          <Link href={ROUTES.BLOOM} className="nav-link group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🗺️</span>
            <div className="flex-1">
              <span className="font-semibold block">Neighborhood</span>
              <span className="text-xs text-white/70">Local community</span>
            </div>
          </Link>
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-5 backdrop-blur">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-xs font-semibold text-white/90 mb-1">Pro Tip</p>
                <p className="text-sm text-white/80 leading-relaxed">
                  Water early morning or evening for best absorption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto scrollbar-custom">
        {children}
      </main>
    </div>
  );
}
