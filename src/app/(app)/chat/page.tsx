'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { API_ENDPOINTS, UI_TEXT } from '@/lib/constants';
import { Plus, SendHorizontal, X, Camera, Upload, Loader2 } from 'lucide-react';
import { uploadImageClient } from '@/lib/supabase/image-client';
import { createClient } from '@/lib/supabase/client';
import ModelSelector from '@/components/ModelSelector';
import { ChatImage } from '@/components/ChatImage';
import { ChatMessagesSkeleton } from '@/components/Skeletons';
import { CameraModal } from '@/components/CameraModal';
import { useModelSelector } from '@/hooks/useModelSelector';
import { resolveUserTier } from '@/lib/ai/model-resolver';
import { isCameraSupported } from '@/lib/camera/permissions';
import type { Message, ChatMessage, Image as ImageType, User } from '@/types';

/**
 * ModelMetadataDisplay - Ephemeral display of model ID and tier
 * Shows briefly below assistant message, fades out after 10 seconds
 */
interface ModelMetadataDisplayProps {
  modelId: string;
  tier: string;
}

function ModelMetadataDisplay({ modelId, tier }: ModelMetadataDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Convert tier number to T format (e.g., "1" -> "T1")
  const tierDisplay = typeof tier === 'number' ? `T${tier}` : tier.startsWith('T') ? tier : `T${tier}`;

  return (
    <div className="model-metadata-ephemeral">
      <span className="model-metadata-text">{modelId} · {tierDisplay}</span>
    </div>
  );
}

// Simple in-memory cache for loaded conversations
// Persists across navigation but clears on page refresh
const conversationCache = new Map<string, { messages: Message[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function ChatPageContent() {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id');

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationLoadFailed, setConversationLoadFailed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ image: ImageType; file: File }>>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Synchronous capability check — no async state, no UI flash.
  // Camera option is shown whenever the browser supports getUserMedia.
  // Only hidden on environments where mediaDevices is entirely absent.
  const cameraSupported = isCameraSupported();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Derive user tier from Supabase user metadata
  const userTier = resolveUserTier(
    (user as unknown as { user_metadata?: Record<string, unknown> })?.user_metadata ?? null
  );

  // Model selector hook — manages preference state per conversation
  const {
    preference: modelPreference,
    setPreference: setModelPreference,
    options: modelOptions,
    isSaving: isModelSaving,
    logUpgradeInterest,
  } = useModelSelector(currentConversationId, userTier);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-resize textarea
  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
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

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu]);

  const loadConversation = useCallback(async (conversationId: string) => {
    // Check cache first for instant loading
    const cached = conversationCache.get(conversationId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      // Cache hit - instant load
      setMessages(cached.messages);
      setCurrentConversationId(conversationId);
      setConversationLoadFailed(false);
      return;
    }

    // Cache miss - show skeleton and fetch
    setIsLoadingConversation(true);
    setConversationLoadFailed(false);
    
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
        
        // Update cache
        conversationCache.set(conversationId, {
          messages: displayMessages,
          timestamp: now,
        });
        
        setMessages(displayMessages);
        setCurrentConversationId(conversationId);
        setConversationLoadFailed(false);
      } else {
        // Handle 404 or other error responses
        console.error('[chat] Failed to load conversation:', response.status);
        setConversationLoadFailed(true);
        setMessages([]);
        // Clear the URL to show fresh chat state
        window.history.replaceState(null, '', '/chat');
      }
    } catch (error) {
      console.error('[chat] Error loading conversation:', error);
      setConversationLoadFailed(true);
      setMessages([]);
      // Clear the URL to show fresh chat state
      window.history.replaceState(null, '', '/chat');
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      loadConversation(conversationIdFromUrl);
    } else if (!conversationIdFromUrl && currentConversationId) {
      setMessages([]);
      setCurrentConversationId(null);
      setInput('');
    }
  }, [conversationIdFromUrl, currentConversationId, loadConversation]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file || !user) return;
    try {
      setUploadError(null);
      setIsUploading(true);
      setShowPlusMenu(false);
      const image = await uploadImageClient(file, 'uploaded', user.id, file.name);
      setUploadedImages((prev) => [...prev, { image, file }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // Camera modal handlers
  const handleOpenCamera = () => {
    setShowPlusMenu(false);
    setShowCameraModal(true);
  };

  const handleCloseCamera = () => {
    setShowCameraModal(false);
  };

  const handleCameraCapture = (file: File) => {
    handleFileUpload(file);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;

    // Collect all image URLs for display
    const imageUrls = uploadedImages.map((item) => item.image.url);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (uploadedImages.length > 0 ? `Shared ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}` : ''),
      imageUrl: imageUrls[0],
      imageUrls: imageUrls,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', input || (uploadedImages.length > 0 ? `Shared ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}` : ''));
      // Append all images
      uploadedImages.forEach((item) => {
        formData.append('images', item.file);
      });
      if (currentConversationId) {
        formData.append('conversationId', currentConversationId);
      }
      // Send the current model preference to the API
      formData.append('modelPreference', modelPreference);

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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-surface via-background to-surface">
      {/* Messages Area */}
      <div className="chat-messages flex-1 overflow-y-auto">
        {/* Loading Skeleton for Conversation History */}
        {isLoadingConversation && (
          <ChatMessagesSkeleton count={4} />
        )}

        {/* Empty State */}
        {messages.length === 0 && !isLoadingConversation && (!conversationIdFromUrl || conversationLoadFailed) && (
          <div className="flex flex-col justify-center items-center h-full px-6 animate-fade-in">
            {/* Model selector in empty state header */}
            <div className="flex items-center gap-2 mb-6">
              <ModelSelector
                preference={modelPreference}
                onPreferenceChange={setModelPreference}
                options={modelOptions}
                onUpgradeClick={logUpgradeInterest}
                isSaving={isModelSaving}
                disabled={isLoading}
              />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-4xl font-semibold text-primary mb-3 text-center leading-snug tracking-tight">
              {UI_TEXT.CHAT_EMPTY_STATE_TITLE}
            </h2>
            <p className="text-sm sm:text-base text-text-muted text-center max-w-sm font-light mb-0 leading-relaxed">
              Ask about plant care, share a photo, or get garden design advice.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="chat-content max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message-row ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div className="flex flex-col gap-1">
                  <div
                    className={`chat-bubble ${
                      message.role === 'user'
                        ? 'chat-bubble-user'
                        : 'chat-bubble-assistant'
                    }`}
                  >
                    {message.role === 'user' && (
                      <>
                        {(message.imageUrls && message.imageUrls.length > 0
                          ? message.imageUrls
                          : message.imageUrl ? [message.imageUrl] : []
                        ).map((url, _idx) => (
                          <ChatImage
                            key={_idx}
                            src={url}
                            alt={`Shared image ${_idx + 1}`}
                            index={_idx}
                          />
                        ))}
                      </>
                    )}
                    <p className="chat-bubble-text">
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </p>
                  </div>
                  {message.role === 'assistant' && message.modelId && message.tier && (
                    <ModelMetadataDisplay modelId={message.modelId} tier={message.tier} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-message-row justify-start animate-fade-in max-w-4xl mx-auto">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-error/90 text-white px-4 py-2 rounded-lg text-sm z-50 animate-slide-up">
          {uploadError}
        </div>
      )}

      {/* ===== COMMAND CENTER INPUT ===== */}
      <div className="chat-footer">
        <form onSubmit={handleSubmit}>
          {/* Image Preview */}
          {uploadedImages.length > 0 && (
            <div className="command-pill-images-container animate-scale-in">
              {uploadedImages.map((item, index) => (
                <div key={index} className="command-pill-image-item">
                  <Image
                    src={item.image.url}
                    alt={`Uploaded image ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(index)}
                    className="command-pill-image-remove"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Uploading indicator */}
          {isUploading && (
            <div className="command-pill-preview animate-scale-in">
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              <span className="text-xs text-text-secondary">Uploading image...</span>
            </div>
          )}

          {/* Model Selector + Pill row */}
          {messages.length > 0 && (
            <div className="flex items-center justify-center mb-2 max-w-3xl mx-auto">
              <ModelSelector
                preference={modelPreference}
                onPreferenceChange={setModelPreference}
                options={modelOptions}
                onUpgradeClick={logUpgradeInterest}
                isSaving={isModelSaving}
                disabled={isLoading}
              />
            </div>
          )}

          {/* The Pill */}
          <div className="command-pill" ref={plusMenuRef}>
            {/* + Button */}
            <button
              type="button"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              disabled={isLoading || isUploading}
              className="command-pill-plus"
              aria-label="Add files and more"
              title="Add files and more"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Plus Menu — Desktop Popover */}
            {showPlusMenu && !isMobile && (
              <div className="plus-menu-popover animate-scale-in">
                {cameraSupported && (
                  <button
                    type="button"
                    className="plus-menu-item"
                    onClick={handleOpenCamera}
                  >
                    <div className="plus-menu-item-icon">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Camera</div>
                      <div className="text-xs text-text-muted">Take a photo</div>
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  className="plus-menu-item"
                  onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                >
                  <div className="plus-menu-item-icon">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Upload Photo</div>
                    <div className="text-xs text-text-muted">Choose from files</div>
                  </div>
                </button>
              </div>
            )}

            {/* Textarea */}
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
              placeholder={UI_TEXT.CHAT_INPUT_PLACEHOLDER}
              className="command-pill-input"
              disabled={isLoading}
              autoComplete="off"
              rows={1}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
              className="command-pill-send"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizontal className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Hidden file input for gallery upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />

          <p className="text-xs text-text-muted text-center font-light mt-3 opacity-70">
            {UI_TEXT.CHAT_POWERED_BY} • {UI_TEXT.CHAT_EMPTY_STATE_SUBTITLE}
          </p>
        </form>
      </div>

      {/* Mobile Bottom Sheet for + menu */}
      {showPlusMenu && isMobile && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setShowPlusMenu(false)} />
          <div className="bottom-sheet">
            <div className="bottom-sheet-handle" />
            {cameraSupported && (
              <button
                type="button"
                className="bottom-sheet-item"
                onClick={handleOpenCamera}
              >
                <div className="bottom-sheet-item-icon">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">Camera</div>
                  <div className="text-sm text-text-muted font-light">Take a photo of your plant</div>
                </div>
              </button>
            )}
            <button
              type="button"
              className="bottom-sheet-item"
              onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
            >
              <div className="bottom-sheet-item-icon">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">Upload Photo</div>
                <div className="text-sm text-text-muted font-light">Choose from your gallery</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
      />
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
