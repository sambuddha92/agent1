'use client';

import { Camera, ImagePlus, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      {/* Icon cluster */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 flex items-center justify-center">
          <Camera size={36} className="text-[var(--color-primary)]" />
        </div>
        <div className="absolute -right-2 -top-2 w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-sm">
          <ImagePlus size={18} className="text-[var(--color-text-muted)]" />
        </div>
      </div>

      {/* Text */}
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        Your garden awaits
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-8 leading-relaxed">
        Share photos of your plants with Sage to get personalized care tips and track their growth journey.
      </p>

      {/* Action */}
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg hover:bg-[var(--color-primary-hover)] transition-all active:scale-[0.98]"
      >
        <MessageCircle size={18} />
        <span>Chat with Sage</span>
      </Link>

      {/* Hint */}
      <p className="mt-6 text-xs text-[var(--color-text-muted)]/60">
        Send a photo in chat to add it to your garden
      </p>
    </div>
  );
}
