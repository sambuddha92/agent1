'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_ENDPOINTS, UI_TEXT } from '@/lib/constants';
import { Flower2, Droplets, CloudSun, X } from 'lucide-react';
import ImageUploadButton from '@/components/ImageUploadButton';
import { createClient } from '@/lib/supabase/client';
import type { Message, ChatMessage, Image as ImageType, User } from '@/types';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id');

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationIdFromUrl
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [uploadedImage, setUploadedImage] = useState<ImageType | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-resize textarea
  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 240); // max 10 lines ~240px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as User || null);
    }
    fetchUser();
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}`);
      if (response.ok) {
        const chatMessages: ChatMessage[] = await response.json();
        
        const displayMessages: Message[] = chatMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          modelId: msg.model_id || undefined,
          tier: msg.tier as Message['tier'],
          imageUrl: msg.image_url || undefined,
        }));
        
        setMessages(displayMessages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('[chat] Error loading conversation:', error);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      loadConversation(conversationIdFromUrl);
    } else if (!conversationIdFromUrl && currentConversationId) {
      // New chat started
      setMessages([]);
      setCurrentConversationId(null);
      setInput('');
    }
  }, [conversationIdFromUrl, currentConversationId, loadConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (uploadedImage ? '📸 Shared an image' : ''),
      imageUrl: uploadedImage?.url,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedImage(null);
    setUploadedImageFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', input || (uploadedImage ? '📸 Shared an image' : ''));
      if (uploadedImageFile) {
        formData.append('image', uploadedImageFile);
      }
      if (currentConversationId) {
        formData.append('conversationId', currentConversationId);
      }

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`${UI_TEXT.NETWORK_ERROR}: ${response.statusText}`);
      }

      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId);
        window.history.replaceState(null, '', `/chat?id=${newConversationId}`);
        
        // Trigger layout to reload conversations
        window.dispatchEvent(new CustomEvent('conversationCreated'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantMessageId = (Date.now() + 1).toString();

      const modelId = response.headers.get('X-Model-Id');
      const modelTier = response.headers.get('X-Model-Tier') as Message['tier'];

      if (reader) {
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
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;
              assistantMessage += data;
            } else if (line.match(/^\d+:/)) {
              const data = line.substring(line.indexOf(':') + 1);
              assistantMessage += data;
            } else {
              assistantMessage += line;
            }
            
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

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-surface via-background to-surface">
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
                <div className="mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <Flower2 className="icon-3xl icon-primary mx-auto" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-primary">What should I plant?</p>
              </button>
              <button
                onClick={() => setInput("How do I care for my plants?")}
                className="chat-suggestion-btn group"
              >
                <div className="mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <Droplets className="icon-3xl icon-primary mx-auto" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-primary">Plant care tips</p>
              </button>
              <button
                onClick={() => setInput("What's the weather forecast?")}
                className="chat-suggestion-btn group"
              >
                <div className="mb-3 sm:mb-4 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <CloudSun className="icon-3xl icon-primary mx-auto" />
                </div>
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
                  {/* Image Display */}
                  {message.imageUrl && message.role === 'user' && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black/10">
                      <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="max-w-xs h-auto object-cover max-h-64"
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

      {/* Input Area - Fixed at Bottom */}
      <div className="chat-footer bg-surface/60 backdrop-glass border-t border-border/50">
        <form onSubmit={handleSubmit}>
          <div className="chat-input-container max-w-4xl mx-auto">
            {/* Image Preview Chip */}
            {uploadedImage && (
              <div className="mb-3 flex items-center gap-3 p-3 bg-surface rounded-lg border border-primary/20 animate-scale-in">
                <div className="relative w-10 h-10 rounded overflow-hidden bg-black/5 flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg">🖼️</span>
                  </div>
                </div>
                <span className="text-xs text-text-secondary flex-1 truncate">{uploadedImage.description || 'Image attached'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedImageFile(null);
                  }}
                  className="flex-shrink-0 text-text-secondary hover:text-primary transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Controls Row */}
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTextareaInput();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about your plants, share a photo, or get advice..."
                className="chat-input"
                disabled={isLoading}
                autoComplete="off"
                rows={1}
              />
              
              {user && (
                <ImageUploadButton
                  userId={user.id}
                  onImageUploaded={(image, file) => {
                    setUploadedImage(image);
                    setUploadedImageFile(file);
                  }}
                  disabled={isLoading}
                />
              )}
              
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !uploadedImage)}
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
          </div>
          
          <p className="text-xs text-text-muted text-center font-light mt-3">
            Powered by AI • Upload photos for instant identification
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
