/**
 * Provider Base Interface
 *
 * All AI providers must implement this interface.
 * Each provider handles specific models and capabilities.
 */

// ============================================
// Request Types
// ============================================

export interface TextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TextRequest {
  modelId: string;
  messages: TextMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ImageRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  seed?: number;
}

export interface VideoRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  duration?: number;
  fps?: number;
  resolution?: '720p' | '1080p';
}

// ============================================
// Response Types
// ============================================

export interface TextResponse {
  id: string;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content-filter' | 'error';
}

export interface ImageResponse {
  id: string;
  model: string;
  images: string[]; // Base64 or URLs
  seed?: number;
}

export interface VideoResponse {
  id: string;
  model: string;
  videoUrl: string;
  duration?: number;
}

// ============================================
// Provider Interface
// ============================================

export interface Provider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * List of supported model IDs
   */
  readonly supportedModels: string[];

  /**
   * Execute a text generation request
   */
  executeText?(request: TextRequest): Promise<TextResponse>;

  /**
   * Execute an image generation request
   */
  executeImage?(request: ImageRequest): Promise<ImageResponse>;

  /**
   * Execute a video generation request
   */
  executeVideo?(request: VideoRequest): Promise<VideoResponse>;

  /**
   * Check if provider supports a specific model
   */
  supportsModel(modelId: string): boolean;

  /**
   * Check if provider supports a specific capability
   */
  supportsCapability(capability: 'text' | 'image' | 'video'): boolean;
}

// ============================================
// Provider Factory
// ============================================

export type ProviderType = 'text' | 'image' | 'video';

export interface ProviderRegistry {
  getProvider(id: string): Provider | undefined;
  getProvidersByType(type: ProviderType): Provider[];
  listProviders(): Provider[];
}
