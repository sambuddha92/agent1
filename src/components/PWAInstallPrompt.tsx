'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check localStorage for previous install
    if (typeof window !== 'undefined' && localStorage.getItem('pwa-installed') === 'true') {
      setIsInstalled(true);
      return;
    }

    // Mobile detection - only show on mobile devices or small viewports
    const checkIsMobile = () => {
      const mobileUserAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSmallViewport = window.innerWidth < 1024;
      setIsMobile(mobileUserAgent || isSmallViewport);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pwa-installed', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
  };

  // Don't render if:
  // - Already installed
  // - No install prompt available
  // - Not on mobile device/viewport
  if (isInstalled || !deferredPrompt || !isMobile) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 w-full px-4 py-3 rounded-lg transition-all duration-150 text-white/55 hover:text-white/85 hover:bg-white/5 active:scale-98"
      aria-label="Install FloatGreens as an app"
    >
      <Download className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">Get as app</span>
    </button>
  );
}
