'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Bot } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

/**
 * Memoized message bubble component
 * Prevents re-renders when parent component updates but message hasn't changed
 * Only re-renders if message.content changes (via deep equality comparison)
 */
export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`chat-message-row ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div
        className={`chat-bubble ${
          message.role === 'user'
            ? 'chat-bubble-user'
            : 'chat-bubble-assistant'
        }`}
      >
        {/* Image Display */}
        {message.imageUrl && message.role === 'user' && (
          <div className="mb-3 rounded-lg overflow-hidden bg-black/10 relative w-fit">
            <Image
              src={message.imageUrl}
              alt="Shared image"
              width={400}
              height={256}
              className="max-w-xs h-auto object-cover max-h-64"
              loading="lazy"
            />
          </div>
        )}
        
        <p className="chat-bubble-text">
          {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
        </p>
        
        {message.role === 'assistant' && message.modelId && message.tier && (
          <div className="chat-bubble-metadata">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded-md">
                <Bot size={14} className="text-primary" />
                <span className="font-mono text-xs">{message.modelId}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded-md">
                <span className="text-primary font-semibold">Tier</span>
                <span className="font-mono font-bold text-xs">{message.tier}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
