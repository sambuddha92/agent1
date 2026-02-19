/**
 * Provider Registry
 *
 * Central registry of all available AI providers.
 * Provides access to provider instances and metadata.
 * Supports dynamic provider detection from environment variables.
 */

import type { Provider, ProviderType, ProviderRegistry as IProviderRegistry } from '../providers/providerBase';
import type { ModelDefinition } from './modelRegistry';

// Import all provider implementations
import { googleProvider } from '../providers/googleProvider';
import { groqProvider } from '../providers/groqProvider';
import { openrouterProvider } from '../providers/openrouterProvider';
import { togetherProvider } from '../providers/togetherProvider';
import { fireworksProvider } from '../providers/fireworksProvider';
import { cloudflareProvider } from '../providers/cloudflareProvider';
import { falProvider } from '../providers/falProvider';
import { replicateProvider } from '../providers/replicateProvider';
import { models, getModelsByProvider } from './modelRegistry';

// ============================================
// Provider Metadata
// ============================================

export interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  baseUrl?: string;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsVideo: boolean;
  supportsImageGeneration: boolean;
}

// ============================================
// Registry
// ============================================

const PROVIDER_MAP: Map<string, Provider> = new Map([
  ['google', googleProvider as Provider],
  ['groq', groqProvider as Provider],
  ['openrouter', openrouterProvider as Provider],
  ['together', togetherProvider as Provider],
  ['fireworks', fireworksProvider as Provider],
  ['cloudflare', cloudflareProvider as Provider],
  ['fal', falProvider as Provider],
  ['replicate', replicateProvider as Provider],
]);

// Provider metadata for UI and documentation
const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models for text and vision',
    supportsStreaming: true,
    supportsVision: true,
    supportsVideo: false,
    supportsImageGeneration: false,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with Llama and Mixtral',
    supportsStreaming: true,
    supportsVision: false,
    supportsVideo: false,
    supportsImageGeneration: false,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Aggregated access to multiple providers',
    supportsStreaming: true,
    supportsVision: true,
    supportsVideo: false,
    supportsImageGeneration: false,
  },
  together: {
    id: 'together',
    name: 'Together AI',
    description: 'Open source models with fast inference',
    supportsStreaming: true,
    supportsVision: false,
    supportsVideo: false,
    supportsImageGeneration: true,
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    description: 'Fast inference for open models',
    supportsStreaming: true,
    supportsVision: false,
    supportsVideo: false,
    supportsImageGeneration: true,
  },
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    description: 'Edge inference for low latency',
    supportsStreaming: true,
    supportsVision: false,
    supportsVideo: false,
    supportsImageGeneration: false,
  },
  fal: {
    id: 'fal',
    name: 'fal.ai',
    description: 'Flux and Kling for image and video generation',
    supportsStreaming: false,
    supportsVision: false,
    supportsVideo: true,
    supportsImageGeneration: true,
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    description: 'Open source models for image and video',
    supportsStreaming: false,
    supportsVision: false,
    supportsVideo: true,
    supportsImageGeneration: true,
  },
};

// ============================================
// Registry Implementation
// ============================================

class ProviderRegistryImpl implements IProviderRegistry {
  /**
   * Get a provider by ID
   */
  getProvider(id: string): Provider | undefined {
    return PROVIDER_MAP.get(id);
  }

  /**
   * Get all providers of a specific type
   */
  getProvidersByType(type: ProviderType): Provider[] {
    const providers: Provider[] = [];
    
    for (const provider of PROVIDER_MAP.values()) {
      if (provider.supportsCapability(type)) {
        providers.push(provider);
      }
    }
    
    return providers;
  }

  /**
   * List all available providers
   */
  listProviders(): Provider[] {
    return Array.from(PROVIDER_MAP.values());
  }

  /**
   * Get provider metadata
   */
  getProviderMetadata(id: string): ProviderMetadata | undefined {
    return PROVIDER_METADATA[id];
  }

  /**
   * List all provider metadata
   */
  listProviderMetadata(): ProviderMetadata[] {
    return Object.values(PROVIDER_METADATA);
  }

  /**
   * Check if a provider is available
   */
  hasProvider(id: string): boolean {
    return PROVIDER_MAP.has(id);
  }

  /**
   * Get provider IDs
   */
  listProviderIds(): string[] {
    return Array.from(PROVIDER_MAP.keys());
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistryImpl();

// ============================================
// Convenience Functions
// ============================================

/**
 * Get a provider by ID
 */
export function getProvider(id: string): Provider | undefined {
  return providerRegistry.getProvider(id);
}

/**
 * Get all text providers
 */
export function getTextProviders(): Provider[] {
  return providerRegistry.getProvidersByType('text');
}

/**
 * Get all image providers
 */
export function getImageProviders(): Provider[] {
  return providerRegistry.getProvidersByType('image');
}

/**
 * Get all video providers
 */
export function getVideoProviders(): Provider[] {
  return providerRegistry.getProvidersByType('video');
}

/**
 * List all available providers
 */
export function listAllProviders(): Provider[] {
  return providerRegistry.listProviders();
}

/**
 * Get provider metadata
 */
export function getProviderInfo(id: string): ProviderMetadata | undefined {
  return providerRegistry.getProviderMetadata(id);
}

/**
 * List all provider info
 */
export function listAllProviderInfo(): ProviderMetadata[] {
  return providerRegistry.listProviderMetadata();
}

/**
 * Check if a provider exists
 */
export function isProviderAvailable(id: string): boolean {
  return providerRegistry.hasProvider(id);
}

// ============================================
// Dynamic Provider Detection
// ============================================

/**
 * Environment variable prefixes for provider API keys
 */
const PROVIDER_ENV_PREFIXES: Record<string, string> = {
  google: 'GOOGLE_',
  groq: 'GROQ_',
  openrouter: 'OPENROUTER_',
  together: 'TOGETHER_',
  fireworks: 'FIREWORKS_',
  cloudflare: 'CLOUDFLARE_',
  fal: 'FAL_',
  replicate: 'REPLICATE_',
};

/**
 * Additional specific environment variable names for providers
 * that don't follow the standard prefix pattern
 */
const ADDITIONAL_PROVIDER_ENVS: Record<string, string[]> = {
  google: ['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY'],
  groq: ['GROQ_KEY', 'GROQ_API_KEY'],
  openrouter: ['OPEN_ROUTER_KEY', 'OPENROUTER_API_KEY'],
};

/**
 * Get available providers based on environment variables
 * Returns list of provider IDs that have their API keys configured
 */
export function getAvailableProviders(): string[] {
  const available: string[] = [];
  
  for (const [providerId] of PROVIDER_MAP) {
    // Check if the provider has API keys configured
    // Common patterns: PROVIDER_API_KEY, PROVIDER_KEY, etc.
    const envPrefix = PROVIDER_ENV_PREFIXES[providerId];
    
    // Check for standard prefix env vars
    let hasApiKey = !!(
      process.env[`${envPrefix}API_KEY`] ||
      process.env[`${envPrefix}KEY`] ||
      process.env[`${envPrefix}TOKEN`] ||
      process.env[`${envPrefix}SECRET`]
    );
    
    // If no standard env var found, check additional specific env vars
    if (!hasApiKey && ADDITIONAL_PROVIDER_ENVS[providerId]) {
      hasApiKey = ADDITIONAL_PROVIDER_ENVS[providerId].some(
        (envName) => !!process.env[envName]
      );
    }
    
    // Google is always available (uses Application Default Credentials)
    if (providerId === 'google' || hasApiKey) {
      available.push(providerId);
    }
  }
  
  // Always include google as fallback
  if (!available.includes('google')) {
    available.push('google');
  }
  
  return available;
}

/**
 * Get models filtered by available providers
 * Only returns models from providers that have API keys configured
 */
export function getAvailableModels(): ModelDefinition[] {
  const availableProviders = getAvailableProviders();
  
  return models.filter((model) => 
    availableProviders.includes(model.provider)
  );
}

/**
 * Get available models for a specific provider
 */
export function getAvailableModelsForProvider(providerId: string): ModelDefinition[] {
  const availableProviders = getAvailableProviders();
  
  if (!availableProviders.includes(providerId)) {
    return [];
  }
  
  return getModelsByProvider(providerId);
}

/**
 * Check if a provider is available based on environment variables
 */
export function isProviderConfigured(providerId: string): boolean {
  const availableProviders = getAvailableProviders();
  return availableProviders.includes(providerId);
}

/**
 * Get provider configuration status
 * Returns map of provider ID to boolean indicating if it's configured
 */
export function getProviderStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  const availableProviders = getAvailableProviders();
  
  for (const providerId of Object.keys(PROVIDER_METADATA)) {
    status[providerId] = availableProviders.includes(providerId);
  }
  
  return status;
}
