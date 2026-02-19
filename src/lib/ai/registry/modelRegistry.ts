/**
 * Model Registry
 *
 * Central registry of all available AI models.
 * Contains metadata about each model including provider, type, quality, cost, and speed.
 */

import type { ProviderType } from '../providers/providerBase';

// ============================================
// Cost Levels
// ============================================

export type CostLevel = 'free' | 'low' | 'medium' | 'high';

// ============================================
// Model Definition
// ============================================

export interface ModelDefinition {
  id: string;
  provider: string;
  type: ProviderType;
  quality: number; // 0-1 scale
  cost: CostLevel;
  speed: number; // 0-1 scale (1 = fastest)
  contextWindow?: number;
  supportsVision?: boolean;
  supportsStreaming?: boolean;
  supportsImageGeneration?: boolean;
  supportsVideoGeneration?: boolean;
  maxImages?: number; // For image generation
  maxDuration?: number; // For video generation (seconds)
  description?: string;
  recommendedFor?: string[]; // Use case recommendations
}

// ============================================
// Registry
// ============================================

export const models: ModelDefinition[] = [
  // ===================
  // TEXT MODELS
  // ===================

  // Google - Gemini Series
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    type: 'text',
    quality: 0.98,
    cost: 'free',
    speed: 0.8,
    contextWindow: 2000000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Best overall reasoning and generation',
    recommendedFor: ['complex reasoning', 'detailed planning', 'creative writing', 'image analysis'],
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    type: 'text',
    quality: 0.9,
    cost: 'free',
    speed: 0.95,
    contextWindow: 1000000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Fast and efficient for most tasks',
    recommendedFor: ['general chat', 'quick answers', 'image analysis', 'coding'],
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    type: 'text',
    quality: 0.85,
    cost: 'free',
    speed: 1.0,
    contextWindow: 1000000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Ultra-fast for simple tasks',
    recommendedFor: ['simple queries', 'fast responses', 'image identification'],
  },

  // Groq - Llama and Mixtral
  {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    type: 'text',
    quality: 0.92,
    cost: 'free',
    speed: 1.0,
    contextWindow: 128000,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Ultra-fast inference with strong reasoning',
    recommendedFor: ['fast reasoning', 'code generation', 'complex tasks'],
  },
  {
    id: 'llama-3.1-70b-versatile',
    provider: 'groq',
    type: 'text',
    quality: 0.9,
    cost: 'free',
    speed: 1.0,
    contextWindow: 128000,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Fast and capable open model',
    recommendedFor: ['code generation', 'text completion', 'reasoning'],
  },
  {
    id: 'mixtral-8x22b-8192',
    provider: 'groq',
    type: 'text',
    quality: 0.88,
    cost: 'free',
    speed: 0.95,
    contextWindow: 65536,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Fast mixture of experts',
    recommendedFor: ['fast inference', 'diverse tasks'],
  },

  // Together AI
  {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    provider: 'together',
    type: 'text',
    quality: 0.92,
    cost: 'free',
    speed: 0.85,
    contextWindow: 128000,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Powerful open model via Together',
    recommendedFor: ['instruction following', 'coding', 'reasoning'],
  },
  {
    id: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    provider: 'together',
    type: 'text',
    quality: 0.9,
    cost: 'free',
    speed: 0.8,
    contextWindow: 65536,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Strong reasoning via Together',
    recommendedFor: ['reasoning', 'coding', 'math'],
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    provider: 'together',
    type: 'text',
    quality: 0.88,
    cost: 'free',
    speed: 0.9,
    contextWindow: 32768,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Efficient open model',
    recommendedFor: ['general tasks', 'coding', 'instruction following'],
  },

  // OpenRouter - Multi-provider aggregation
  {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    type: 'text',
    quality: 0.88,
    cost: 'low',
    speed: 0.95,
    contextWindow: 128000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Fast and affordable via OpenRouter',
    recommendedFor: ['fast queries', 'cost-effective inference', 'vision tasks'],
  },
  {
    id: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    type: 'text',
    quality: 0.85,
    cost: 'low',
    speed: 0.98,
    contextWindow: 200000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Fast Claude model via OpenRouter',
    recommendedFor: ['fast responses', 'cost-effective', 'vision tasks'],
  },
  {
    id: 'google/gemini-pro-1.5',
    provider: 'openrouter',
    type: 'text',
    quality: 0.95,
    cost: 'low',
    speed: 0.85,
    contextWindow: 2000000,
    supportsVision: true,
    supportsStreaming: true,
    description: 'Gemini Pro via OpenRouter',
    recommendedFor: ['long context', 'vision tasks', 'complex reasoning'],
  },

  // Cloudflare Workers AI
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    provider: 'cloudflare',
    type: 'text',
    quality: 0.75,
    cost: 'free',
    speed: 0.95,
    contextWindow: 128000,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Fast edge inference',
    recommendedFor: ['edge computing', 'low latency', 'simple tasks'],
  },
  {
    id: '@cf/meta/llama-3-8b-instruct',
    provider: 'cloudflare',
    type: 'text',
    quality: 0.72,
    cost: 'free',
    speed: 1.0,
    contextWindow: 8192,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Ultra-fast edge model',
    recommendedFor: ['ultra low latency', 'simple queries', 'edge deployment'],
  },

  // Fireworks AI
  {
    id: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    provider: 'fireworks',
    type: 'text',
    quality: 0.91,
    cost: 'low',
    speed: 0.9,
    contextWindow: 128000,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Fast Fireworks inference',
    recommendedFor: ['fast inference', 'coding', 'reasoning'],
  },
  {
    id: 'accounts/fireworks/models/qwen2p5-72b-instruct',
    provider: 'fireworks',
    type: 'text',
    quality: 0.87,
    cost: 'low',
    speed: 0.92,
    contextWindow: 32768,
    supportsVision: false,
    supportsStreaming: true,
    description: 'Efficient Qwen model',
    recommendedFor: ['efficient inference', 'coding', 'multilingual'],
  },

  // ===================
  // IMAGE MODELS
  // ===================

  // fal.ai - Flux Models
  {
    id: 'flux-pro',
    provider: 'fal',
    type: 'image',
    quality: 0.98,
    cost: 'high',
    speed: 0.7,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Best quality image generation',
    recommendedFor: ['professional design', 'high quality art', 'commercial use'],
  },
  {
    id: 'flux-dev',
    provider: 'fal',
    type: 'image',
    quality: 0.92,
    cost: 'low',
    speed: 0.8,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'High quality open weights model',
    recommendedFor: ['development', 'prototyping', 'high quality art'],
  },
  {
    id: 'flux-schnell',
    provider: 'fal',
    type: 'image',
    quality: 0.85,
    cost: 'free',
    speed: 1.0,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Fastest Flux model',
    recommendedFor: ['rapid prototyping', 'quick previews', 'fast iteration'],
  },

  // Together AI - Flux and SDXL
  {
    id: 'black-forest-labs/FLUX.1-dev',
    provider: 'together',
    type: 'image',
    quality: 0.92,
    cost: 'free',
    speed: 0.75,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Open Flux dev via Together',
    recommendedFor: ['open source', 'development', 'high quality'],
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    provider: 'together',
    type: 'image',
    quality: 0.85,
    cost: 'free',
    speed: 0.95,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Fast Flux via Together',
    recommendedFor: ['fast generation', 'quick previews'],
  },

  // Replicate - SDXL and others
  {
    id: 'sdxl',
    provider: 'replicate',
    type: 'image',
    quality: 0.85,
    cost: 'low',
    speed: 0.8,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Stable Diffusion XL',
    recommendedFor: ['versatile generation', 'artistic styles'],
  },
  {
    id: 'playground-v2.5',
    provider: 'replicate',
    type: 'image',
    quality: 0.88,
    cost: 'low',
    speed: 0.75,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Playground AI model',
    recommendedFor: ['high quality art', 'creative generation'],
  },

  // Fireworks - SDXL
  {
    id: 'accounts/fireworks/models/sdxl-lightning',
    provider: 'fireworks',
    type: 'image',
    quality: 0.82,
    cost: 'low',
    speed: 0.95,
    supportsImageGeneration: true,
    maxImages: 1,
    description: 'Fast SDXL via Fireworks',
    recommendedFor: ['fast generation', 'quick iteration'],
  },

  // ===================
  // VIDEO MODELS
  // ===================

  // fal.ai - Kling and AnimateDiff
  {
    id: 'kling-video',
    provider: 'fal',
    type: 'video',
    quality: 0.95,
    cost: 'high',
    speed: 0.5,
    supportsVideoGeneration: true,
    maxDuration: 10,
    description: 'Best video generation from Kling',
    recommendedFor: ['professional video', 'high quality', 'complex scenes'],
  },
  {
    id: 'animatediff',
    provider: 'fal',
    type: 'video',
    quality: 0.85,
    cost: 'medium',
    speed: 0.7,
    supportsVideoGeneration: true,
    maxDuration: 5,
    description: 'Animation from static images',
    recommendedFor: ['image animation', 'motion effects', 'creative'],
  },

  // Replicate - Runway and others
  {
    id: 'runway-gen3',
    provider: 'replicate',
    type: 'video',
    quality: 0.92,
    cost: 'high',
    speed: 0.6,
    supportsVideoGeneration: true,
    maxDuration: 5,
    description: 'Runway Gen-3 video',
    recommendedFor: ['high quality video', 'professional', 'creative'],
  },
  {
    id: 'text-to-video',
    provider: 'replicate',
    type: 'video',
    quality: 0.8,
    cost: 'medium',
    speed: 0.65,
    supportsVideoGeneration: true,
    maxDuration: 4,
    description: 'Open video generation',
    recommendedFor: ['open source', 'experimentation', 'creative'],
  },

  // Together - Video OSS
  {
    id: 'models/iframe/VideoGeneration',
    provider: 'together',
    type: 'video',
    quality: 0.78,
    cost: 'low',
    speed: 0.7,
    supportsVideoGeneration: true,
    maxDuration: 3,
    description: 'Open video model via Together',
    recommendedFor: ['open source', 'cost-effective', 'quick generation'],
  },

  // Stability AI - Video
  {
    id: 'stable-video-diffusion',
    provider: 'stability',
    type: 'video',
    quality: 0.82,
    cost: 'medium',
    speed: 0.6,
    supportsVideoGeneration: true,
    maxDuration: 4,
    description: 'SVD video generation',
    recommendedFor: ['image to video', 'consistent motion', 'artistic'],
  },
];

// ============================================
// Registry Helpers
// ============================================

/**
 * Get model by ID
 */
export function getModelById(id: string): ModelDefinition | undefined {
  return models.find((m) => m.id === id);
}

/**
 * Get all models of a specific type
 */
export function getModelsByType(type: ProviderType): ModelDefinition[] {
  return models.filter((m) => m.type === type);
}

/**
 * Get all models from a specific provider
 */
export function getModelsByProvider(provider: string): ModelDefinition[] {
  return models.filter((m) => m.provider === provider);
}

/**
 * Get all models that are free
 */
export function getFreeModels(): ModelDefinition[] {
  return models.filter((m) => m.cost === 'free');
}

/**
 * Get all models that are low cost
 */
export function getLowCostModels(): ModelDefinition[] {
  return models.filter((m) => m.cost === 'free' || m.cost === 'low');
}

/**
 * List all unique providers
 */
export function listProviders(): string[] {
  return [...new Set(models.map((m) => m.provider))];
}

/**
 * Get models by IDs
 */
export function getModelsByIds(ids: string[]): ModelDefinition[] {
  return ids.map((id) => getModelById(id)).filter((m): m is ModelDefinition => m !== undefined);
}

/**
 * Get all text models
 */
export function getTextModels(): ModelDefinition[] {
  return models.filter((m) => m.type === 'text');
}

/**
 * Get all image generation models
 */
export function getImageModels(): ModelDefinition[] {
  return models.filter((m) => m.type === 'image');
}

/**
 * Get all video generation models
 */
export function getVideoModels(): ModelDefinition[] {
  return models.filter((m) => m.type === 'video');
}

/**
 * Get models that support vision
 */
export function getVisionModels(): ModelDefinition[] {
  return models.filter((m) => m.supportsVision === true);
}

/**
 * Get models that support streaming
 */
export function getStreamingModels(): ModelDefinition[] {
  return models.filter((m) => m.supportsStreaming === true);
}

/**
 * Get models by quality threshold
 */
export function getModelsByMinQuality(minQuality: number): ModelDefinition[] {
  return models.filter((m) => m.quality >= minQuality);
}

/**
 * Get models by recommended use case
 */
export function getModelsByUseCase(useCase: string): ModelDefinition[] {
  return models.filter((m) => 
    m.recommendedFor?.some((uc) => uc.toLowerCase().includes(useCase.toLowerCase()))
  );
}

/**
 * Get model count by provider
 */
export function getModelCountByProvider(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const model of models) {
    counts[model.provider] = (counts[model.provider] || 0) + 1;
  }
  return counts;
}
