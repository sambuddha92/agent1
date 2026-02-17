'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { MessageCircle, Lightbulb } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="py-16 sm:py-24 px-4">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        {/* Icon */}
        <div className="text-6xl sm:text-7xl lg:text-8xl mb-8 animate-float">
          📷
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
          Your garden is empty
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-12 max-w-lg mx-auto font-light">
          Start by uploading photos or chatting with the AI. Each photo helps build your personalized plant collection.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={ROUTES.CHAT}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active-press"
          >
            <MessageCircle size={20} />
            Start Chatting
          </Link>

          {/* Help Text */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-light">
            <Lightbulb size={16} />
            <span>Upload photos in chat to see them here</span>
          </div>
        </div>
      </div>
    </div>
  );
}
