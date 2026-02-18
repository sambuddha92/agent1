'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { API_ENDPOINTS, UI_TEXT } from '@/lib/constants';
import { Plus, SendHorizontal, X, Square, Loader2 } from 'lucide-react';
import { uploadImageClient } from '@/lib/supabase/image-client';
import { createClient } from '@/lib/supabase/client';
import ModelSelector from '@/components/ModelSelector';
import { ChatImage } from '@/components/ChatImage';
import { ChatMessagesSkeleton } from '@/components/Skeletons';
import { CameraModal } from '@/components/CameraModal';
import { AttachmentModal } from '@/components/AttachmentModal';
import { useModelSelector } from '@/hooks/useModelSelector';
import { resolveUserTier } from '@/lib/ai/model-resolver';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import type { Message, ChatMessage, Image as ImageType, User } from '@/types';

// ─── Model metadata ephemeral display ────────────────────────────────────────

interface ModelMetadataDisplayProps {
  modelId: string;
  tier: string;
}

function ModelMetadataDisplay({ modelId, tier }: ModelMetadataDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 10_000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const tierDisplay = typeof tier === 'number'
    ? `T${tier}`
    : tier.startsWith('T') ? tier : `T${tier}`;

  return (
    <div className="model-metadata-ephemeral">
      <span className="model-metadata-text">{modelId} · {tierDisplay}</span>
    </div>
  );
}

// ─── Simple in-memory conversation cache ─────────────────────────────────────

const conversationCache = new Map<string, { messages: Message[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Main chat page content ───────────────────────────────────────────────────

function ChatPageContent() {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id');

  // ── Core state ──────────────────────────────────────────────────────────────
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationLoadFailed, setConversationLoadFailed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ image: ImageType; file: File }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Separate camera input with capture="environment" for native iOS camera
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // AbortController for stream cancellation (Stop button)
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── User tier + model selector ───────────────────────────────────────────────
  const userTier = resolveUserTier(
    (user as unknown as { user_metadata?: Record<string, unknown> })?.user_metadata ?? null
  );

  const {
    preference: modelPreference,
    setPreference: setModelPreference,
    options: modelOptions,
    isSaving: isModelSaving,
    logUpgradeInterest,
  } = useModelSelector(currentConversationId, userTier);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleTextareaResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  // ── Fetch user on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as User || null);
    }
    fetchUser();
  }, []);

  // ── Auto-scroll on new messages ──────────────────────────────────────────────

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Load conversation from URL param ────────────────────────────────────────

  const loadConversation = useCallback(async (conversationId: string) => {
    const cached = conversationCache.get(conversationId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      setMessages(cached.messages);
      setCurrentConversationId(conversationId);
      setConversationLoadFailed(false);
      return;
    }

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
        conversationCache.set(conversationId, { messages: displayMessages, timestamp: now });
        setMessages(displayMessages);
        setCurrentConversationId(conversationId);
        setConversationLoadFailed(false);
      } else {
        console.error('[chat] Failed to load conversation:', response.status);
        setConversationLoadFailed(true);
        setMessages([]);
        window.history.replaceState(null, '', '/chat');
      }
    } catch (error) {
      console.error('[chat] Error loading conversation:', error);
      setConversationLoadFailed(true);
      setMessages([]);
      window.history.replaceState(null, '', '/chat');
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      loadConversation(conversationIdFromUrl);
    } else if (!conversationIdFromUrl && currentConversationId) {
      setMessages([]);
      setCurrentConversationId(null);
      setInput('');
    }
  }, [conversationIdFromUrl, currentConversationId, loadConversation]);

  // ── Auto-focus textarea on desktop ──────────────────────────────────────────

  const [isMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (!isMobile && !isLoadingConversation) {
      textareaRef.current?.focus();
    }
  }, [isMobile, isLoadingConversation]);

  // ── File upload ──────────────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || !user) return;
    try {
      setUploadError(null);
      setIsUploading(true);
      const image = await uploadImageClient(file, 'uploaded', user.id, file.name);
      setUploadedImages((prev) => [...prev, { image, file }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const removeUploadedImage = useCallback((index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────────

  const { openCameraModal, isCameraModalOpen, closeCameraModal, handleCameraConfirm } = useCameraCapture({
    onCapture: handleFileUpload,
  });

  /**
   * Handle "Take Photo" action
   * ChatGPT-exact behavior:
   * - Mobile: Trigger native file input with capture="environment" (iOS native camera)
   * - Desktop: Open CameraModal with getUserMedia webcam
   */
  const handleOpenCamera = useCallback(() => {
    if (isMobile) {
      // Mobile: Use native file input camera — instant, native iOS picker
      cameraInputRef.current?.click();
    } else {
      // Desktop: Use CameraModal with WebRTC webcam
      openCameraModal();
    }
  }, [isMobile, openCameraModal]);

  // ── Stop streaming ───────────────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;

    const imageUrls = uploadedImages.map((item) => item.image.url);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (uploadedImages.length > 0
        ? `Shared ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
        : ''),
      imageUrl: imageUrls[0],
      imageUrls,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    // New AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append(
        'message',
        input || (uploadedImages.length > 0
          ? `Shared ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
          : '')
      );
      uploadedImages.forEach((item) => formData.append('images', item.file));
      if (currentConversationId) formData.append('conversationId', currentConversationId);
      formData.append('modelPreference', modelPreference);

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
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

        try {
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
                assistantMessage += line.substring(line.indexOf(':') + 1);
              } else {
                assistantMessage += line;
              }
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, content: assistantMessage } : m
              )
            );
          }
        } catch (readError) {
          // AbortError means user pressed Stop — keep partial response, don't show error
          if (readError instanceof Error && readError.name === 'AbortError') {
            // Partial message already in state — nothing more to do
            return;
          }
          throw readError;
        }
      }
    } catch (error) {
      // AbortError is intentional (user stopped) — swallow it
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
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
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [input, uploadedImages, isLoading, currentConversationId, modelPreference]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const canSend = (input.trim().length > 0 || uploadedImages.length > 0) && !isLoading;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-surface via-background to-surface">

      {/* ── Messages area ── */}
      <div className="chat-messages flex-1 overflow-y-auto">

        {/* Loading skeleton while fetching conversation history */}
        {isLoadingConversation && <ChatMessagesSkeleton count={4} />}

        {/* Empty state */}
        {messages.length === 0 && !isLoadingConversation && (!conversationIdFromUrl || conversationLoadFailed) && (
          <div className="flex flex-col justify-center items-center h-full px-6 animate-fade-in">
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
                      message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                    }`}
                  >
                    {message.role === 'user' && (
                      <>
                        {(message.imageUrls && message.imageUrls.length > 0
                          ? message.imageUrls
                          : message.imageUrl ? [message.imageUrl] : []
                        ).map((url, idx) => (
                          <ChatImage
                            key={idx}
                            src={url}
                            alt={`Shared image ${idx + 1}`}
                            index={idx}
                          />
                        ))}
                      </>
                    )}
                    <p className="chat-bubble-text">
                      {typeof message.content === 'string'
                        ? message.content
                        : JSON.stringify(message.content)}
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

        {/* Streaming thinking dots */}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="chat-message-row justify-start animate-fade-in max-w-4xl mx-auto">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Upload error toast ── */}
      {uploadError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-error/90 text-white px-4 py-2 rounded-lg text-sm z-50 animate-slide-up">
          {uploadError}
        </div>
      )}

      {/* ════════════════════════════════════════
          COMMAND CENTER
          ════════════════════════════════════════ */}
      <div className="chat-footer">
        <form onSubmit={handleSubmit}>

          {/* Model selector row (shown once conversation starts) */}
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

          {/* Command Pill */}
          <div className="command-pill">

            {/* ── Left: + button ── */}
            <button
              type="button"
              onClick={() => setShowAttachmentModal(true)}
              disabled={isLoading || isUploading}
              className="command-pill-plus"
              aria-label="Add attachment"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* ── Center: textarea + image previews stack ── */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Image thumbnails (inside the pill, above textarea) */}
              {(uploadedImages.length > 0 || isUploading) && (
                <div className="flex items-center gap-2 px-1 pt-1 pb-0.5 overflow-x-auto scrollbar-hide">
                  {uploadedImages.map((item, index) => (
                    <div key={index} className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                      <Image
                        src={item.image.url}
                        alt={`Uploaded image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      {/* Remove badge — always visible (no hover required on mobile) */}
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Upload spinner thumbnail */}
                  {isUploading && (
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTextareaResize();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={isLoading ? 'Thinking…' : UI_TEXT.CHAT_INPUT_PLACEHOLDER}
                className="command-pill-input"
                disabled={isLoading}
                autoComplete="off"
                inputMode="text"
                rows={1}
                data-gramm="false"
                spellCheck="false"
              />
            </div>

            {/* ── Right: Send / Stop button ── */}
            {isLoading ? (
              /* Stop button — filled circle with square icon */
              <button
                type="button"
                onClick={handleStop}
                className="command-pill-stop"
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              /* Send button */
              <button
                type="submit"
                disabled={!canSend}
                className="command-pill-send"
                aria-label="Send message"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-text-muted text-center font-light mt-3 opacity-70">
            {UI_TEXT.CHAT_POWERED_BY} • {UI_TEXT.CHAT_EMPTY_STATE_SUBTITLE}
          </p>
        </form>
      </div>

      {/* ── Hidden file input for library upload ── */}
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

      {/* ── Hidden camera input for native iOS camera (ChatGPT-style) ── */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
      />

      {/* ── Attachment modal (ChatGPT-style centered modal) ── */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onCamera={handleOpenCamera}
        onUpload={() => fileInputRef.current?.click()}
      />

      {/* ── Camera modal (fullscreen, unchanged) ── */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={closeCameraModal}
        onConfirm={handleCameraConfirm}
      />
    </div>
  );
}

// ─── Page wrapper with Suspense ───────────────────────────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
