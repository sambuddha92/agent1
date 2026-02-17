'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS, UI_TEXT } from '@/lib/constants';
import type { Message, Conversation, ChatMessage } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationIdFromUrl
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATIONS);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('[chat] Failed to load conversations:', error);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`);
      if (response.ok) {
        const chatMessages: ChatMessage[] = await response.json();
        
        // Convert ChatMessage[] to Message[] format for display
        const displayMessages: Message[] = chatMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          modelId: msg.model_id || undefined,
          tier: msg.tier as Message['tier'],
        }));
        
        setMessages(displayMessages);
        setCurrentConversationId(conversationId);
        
        // Update URL without triggering navigation
        router.push(`/chat?id=${conversationId}`, { scroll: false });
      } else {
        console.error('[chat] Failed to load conversation');
      }
    } catch (error) {
      console.error('[chat] Error loading conversation:', error);
    }
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation from URL on mount or URL change
  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      loadConversation(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl, currentConversationId, loadConversation]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput('');
    router.push('/chat', { scroll: false });
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking the conversation item
    
    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from list
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        
        // If we're viewing this conversation, start a new chat
        if (conversationId === currentConversationId) {
          startNewChat();
        }
      } else {
        console.error('[chat] Failed to delete conversation');
      }
    } catch (error) {
      console.error('[chat] Error deleting conversation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`${UI_TEXT.NETWORK_ERROR}: ${response.statusText}`);
      }

      // Get conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId);
        router.push(`/chat?id=${newConversationId}`, { scroll: false });
        // Reload conversations to show the new one
        loadConversations();
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantMessageId = (Date.now() + 1).toString();

      // Extract model information from headers (development only)
      const modelId = response.headers.get('X-Model-Id');
      const modelTier = response.headers.get('X-Model-Tier') as Message['tier'];

      if (reader) {
        // Add the assistant message placeholder
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            modelId: modelId || undefined,
            tier: modelTier || undefined,
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // Parse the text stream - AI SDK returns text chunks directly or in data: format
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            // Handle data: prefix format (Server-Sent Events)
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;
              assistantMessage += data;
            } 
            // Handle direct text chunks with numeric prefix
            else if (line.match(/^\d+:/)) {
              const data = line.substring(line.indexOf(':') + 1);
              assistantMessage += data;
            }
            // Handle plain text
            else {
              assistantMessage += line;
            }
            
            // Update the message in real-time
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: assistantMessage }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('[chat] Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : UI_TEXT.GENERIC_ERROR,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${!sidebarOpen ? 'chat-sidebar-hidden' : ''}`}>
        <div className="chat-sidebar-header">
          <button
            onClick={startNewChat}
            className="chat-sidebar-new-btn"
            aria-label="Start new conversation"
          >
            <span className="text-lg">+</span>
            <span>New Chat</span>
          </button>
        </div>

        <div className="chat-sidebar-list">
          {conversations.length === 0 ? (
            <div className="chat-sidebar-empty">
              <p>No conversations yet.</p>
              <p className="mt-2">Start chatting to begin!</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className={`chat-sidebar-item ${
                  conversation.id === currentConversationId
                    ? 'chat-sidebar-item-active'
                    : ''
                }`}
              >
                <div className="chat-sidebar-item-content">
                  <span className="chat-sidebar-item-title">
                    {conversation.title || 'Untitled conversation'}
                  </span>
                  {conversation.summary && (
                    <span className="chat-sidebar-item-summary">
                      {conversation.summary}
                    </span>
                  )}
                  <span className="chat-sidebar-item-date">
                    {formatDate(conversation.updated_at)}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="chat-sidebar-item-delete"
                  aria-label="Delete conversation"
                  title="Delete"
                >
                  ×
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Sidebar Toggle Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="chat-sidebar-toggle md:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '×' : '☰'}
        </button>

        <div className="flex flex-col h-full bg-gradient-to-br from-surface via-background to-surface">
          {/* Header */}
          <header className="chat-header bg-surface/60 backdrop-glass border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-pulse-soft transform">🌿</div>
              <div className="flex-1">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-primary leading-tight">
                  Garden Chat
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5 font-light">
                  Your intelligent gardening companion
                </p>
              </div>
            </div>
          </header>

          {/* Messages Container */}
          <div className="chat-messages flex-1 overflow-y-auto">
            {messages.length === 0 && (
              <div className="chat-empty-state max-w-2xl mx-auto animate-fade-in">
                <div className="text-7xl sm:text-8xl mb-8 sm:mb-10 animate-float">🌱</div>
                <h2 className="font-display text-3xl sm:text-5xl font-semibold text-primary mb-4 sm:mb-6 leading-tight">
                  Welcome to your garden
                </h2>
                <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-12 max-w-lg mx-auto leading-relaxed font-light">
                  Ask questions about plant care, get personalized growing advice, and discover what thrives in your unique space.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8">
                  <button
                    onClick={() => setInput("What should I plant this season?")}
                    className="chat-suggestion-btn group"
                  >
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">🌸</div>
                    <p className="text-xs sm:text-sm font-medium text-primary">What should I plant?</p>
                  </button>
                  <button
                    onClick={() => setInput("How do I care for my plants?")}
                    className="chat-suggestion-btn group"
                  >
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">💧</div>
                    <p className="text-xs sm:text-sm font-medium text-primary">Plant care tips</p>
                  </button>
                  <button
                    onClick={() => setInput("What's the weather forecast?")}
                    className="chat-suggestion-btn group"
                  >
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">☀️</div>
                    <p className="text-xs sm:text-sm font-medium text-primary">Weather forecast</p>
                  </button>
                </div>
                <p className="text-xs text-text-muted font-light">
                  💡 Tip: Share a photo of your space to get personalized recommendations
                </p>
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="chat-content">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message-row ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div
                      className={`chat-bubble ${
                        message.role === 'user'
                          ? 'chat-bubble-user'
                          : 'chat-bubble-assistant'
                      }`}
                    >
                      <p className="chat-bubble-text">
                        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                      </p>
                      {/* Show model info in development only */}
                      {message.role === 'assistant' && message.modelId && message.tier && (
                        <div className="chat-bubble-metadata">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="inline-flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded-md">
                              <span className="text-primary font-semibold">🤖</span>
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
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="chat-message-row justify-start animate-fade-in">
                <div className="chat-bubble chat-bubble-assistant">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-footer bg-surface/60 backdrop-glass border-t border-border/50">
            <form onSubmit={handleSubmit}>
              <div className="chat-input-group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your plants, share a photo, or get advice..."
                  className="chat-input"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="chat-send-btn"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span className="hidden sm:inline">{UI_TEXT.SENDING}</span>
                    </span>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted text-center font-light mt-3">
                Powered by AI • Upload photos for instant identification
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
