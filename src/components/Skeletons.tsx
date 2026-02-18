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
        <div className="w-8 h-8 rounded-full bg-border"></div>
        <div className="flex-1">
          <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-border rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chat message list skeleton - shows while loading conversation history
 */
export function ChatMessagesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="chat-content max-w-4xl mx-auto animate-fade-in">
      {Array.from({ length: count }).map((_, i) => {
        // Alternate between user (right) and assistant (left) messages
        const isUser = i % 2 === 0;
        return (
          <div
            key={i}
            className={`chat-message-row ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div
              className={`animate-pulse rounded-2xl ${
                isUser
                  ? 'bg-primary/20 ml-auto'
                  : 'bg-surface-elevated mr-auto'
              }`}
              style={{
                width: `${Math.random() * 30 + 40}%`,
                minWidth: '120px',
                maxWidth: '320px',
              }}
            >
              <div className="p-4 space-y-2">
                <div className={`h-3 rounded ${isUser ? 'bg-primary/30' : 'bg-border-hover'} w-full`}></div>
                <div className={`h-3 rounded ${isUser ? 'bg-primary/30' : 'bg-border-hover'} w-4/5`}></div>
                {!isUser && <div className="h-3 rounded bg-border w-3/5"></div>}
              </div>
            </div>
          </div>
        );
      })}
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
          className="aspect-square rounded-xl overflow-hidden bg-surface animate-pulse"
        >
          <div className="w-full h-full bg-gradient-to-br from-border to-border-hover"></div>
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
          <div className="h-12 bg-border rounded-xl animate-pulse mb-3"></div>
          <div className="flex gap-3">
            <div className="flex-1 h-10 bg-border rounded-xl animate-pulse"></div>
            <div className="w-10 h-10 bg-border rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-border rounded-full animate-pulse"></div>
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
        <div key={i} className="p-3 rounded-lg bg-surface animate-pulse">
          <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-border rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Sidebar Conversation list skeleton - for dark sidebar background
 */
export function SidebarConversationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1 px-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="px-3 py-2.5 rounded-md animate-pulse"
          style={{ 
            animationDelay: `${i * 100}ms`,
            animationDuration: '1.5s'
          }}
        >
          <div className="h-3 bg-white/15 rounded w-4/5 mb-2"></div>
          <div className="h-2.5 bg-white/10 rounded w-3/5"></div>
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
      <div className="w-12 h-12 rounded-full bg-border"></div>
      <div className="flex-1">
        <div className="h-4 bg-border rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-border rounded w-1/2"></div>
      </div>
    </div>
  );
}

/**
 * Sidebar Profile skeleton - for dark sidebar background
 */
export function SidebarProfileSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-white/15 flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-white/15 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-4/5"></div>
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
      className={`bg-border rounded animate-pulse ${width} ${height} ${className}`}
    ></div>
  );
}
