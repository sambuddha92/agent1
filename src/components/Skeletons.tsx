'use client';

/**
 * Loading Skeleton Components
 *
 * Reusable skeleton loaders that improve perceived performance
 * by showing placeholder content while real content loads
 */

import React from 'react';

/**
 * Message skeleton - mimics a chat message bubble
 */
export function MessageSkeleton() {
  return (
    <div className="animate-pulse mb-4">
      <div className="flex gap-4 mb-6">
        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Image grid skeleton - mimics a grid of loading images
 */
export function ImageGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg overflow-hidden bg-gray-100 animate-pulse"
        >
          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chat page skeleton - shows skeleton for loading chat
 */
export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-surface via-background to-surface">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <MessageSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 p-6 bg-surface/60 backdrop-glass">
        <div className="max-w-4xl mx-auto">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Conversation list skeleton
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Profile/User info skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4">
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

/**
 * Generic content skeleton (flexible box)
 */
export function ContentSkeleton({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${width} ${height} ${className}`}
    ></div>
  );
}
