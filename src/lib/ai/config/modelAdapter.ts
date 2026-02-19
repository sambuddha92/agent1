/**
 * Model Adapter
 *
 * Maps our model registry IDs to Vercel AI SDK models.
 * This provides compatibility between the new architecture and existing code.
 * 
 * Note: Currently only Google SDK is installed. Other providers (Groq, OpenRouter)
 * are in the registry but require their SDK packages to be installed.
 * The router automatically filters by available providers based on env vars.
 */

import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { openrouter } from '@openrouter/ai-sdk-provider';

// ============================================
// Model Mapping
// ============================================

interface ModelMapping {
  provider: string;
  modelId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any; // Vercel AI SDK model
}

const MODEL_MAPPINGS: Record<string, ModelMapping> = {
  // Google
  'google-gemini-2.5-pro': {
    provider: 'google',
    modelId: 'gemini-2.5-pro',
    model: google('gemini-2.5-pro'),
  },
  'google-gemini-2.5-flash': {
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    model: google('gemini-2.5-flash'),
  },
  'google-gemini-2.0-flash': {
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    model: google('gemini-2.0-flash'),
  },
  'google-gemini-2.0-pro': {
    provider: 'google',
    modelId: 'gemini-2.0-pro',
    model: google('gemini-2.0-pro'),
  },
  // Groq
  'groq-llama-3.3-70b': {
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    model: groq('llama-3.3-70b-versatile'),
  },
  'groq-llama-3.1-70b': {
    provider: 'groq',
    modelId: 'llama-3.1-70b-versatile',
    model: groq('llama-3.1-70b-versatile'),
  },
  'groq-mixtral-8x7b': {
    provider: 'groq',
    modelId: 'mixtral-8x7b-32768',
    model: groq('mixtral-8x7b-32768'),
  },
  // OpenRouter
  'openrouter-anthropic-claude': {
    provider: 'openrouter',
    modelId: 'anthropic/claude-3.5-sonnet',
    model: openrouter('anthropic/claude-3.5-sonnet'),
  },
  'openrouter-openai-gpt4': {
    provider: 'openrouter',
    modelId: 'openai/gpt-4-turbo',
    model: openrouter('openai/gpt-4-turbo'),
  },
};

// ============================================
// Adapter Functions
// ============================================

/**
 * Get the Vercel AI SDK model for a given provider and modelId
 */
export function getModelForProvider(provider: string, modelId: string) {
  const key = `${provider}-${modelId}`;
  
  if (MODEL_MAPPINGS[key]) {
    return MODEL_MAPPINGS[key].model;
  }
  
  // Fallback to default Google model
  console.warn(`[model-adapter] No mapping found for ${key}, using default`);
  return google('gemini-2.0-flash');
}

/**
 * Check if a provider+modelId combination is supported
 */
export function isModelSupported(provider: string, modelId: string): boolean {
  const key = `${provider}-${modelId}`;
  return !!MODEL_MAPPINGS[key];
}

/**
 * Get all supported model combinations
 */
export function getSupportedModels(): Array<{ provider: string; modelId: string }> {
  return Object.values(MODEL_MAPPINGS).map(m => ({
    provider: m.provider,
    modelId: m.modelId,
  }));
}
