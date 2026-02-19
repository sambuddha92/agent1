/**
 * Model Router
 *
 * Selects the best model based on:
 * - User capability profile
 * - Task type (text/image/video)
 * - Modality detection
 * - Optimization score
 * - Free-tier prioritization
 */

import type { ProviderType } from '../providers/providerBase';
import type { ModelDefinition, CostLevel } from '../registry/modelRegistry';
import type { UserTier } from './capabilityResolver';

import {
  models,
  getModelsByType,
  getModelById,
} from '../registry/modelRegistry';
import { getAvailableProviders } from '../registry/providerRegistry';
import {
  getCapabilityProfile as getProfile,
  canAccessCost,
  canAccessProvider,
  meetsQualityThreshold,
} from './capabilityResolver';

// ============================================
// Modality Types
// ============================================

export type ModalityType = 'text' | 'image' | 'video' | 'code' | 'vision';

// ============================================
// Router Input
// ============================================

export interface RouterInput {
  /**
   * User's tier (guest, free, paid)
   */
  userTier: UserTier;

  /**
   * Optional explicit modality hint
   */
  modality?: ModalityType;

  /**
   * Optional prompt/content to analyze
   */
  prompt?: string;

  /**
   * Optional preferred provider
   */
  preferredProvider?: string;

  /**
   * Whether to prioritize free models
   */
  prioritizeFree?: boolean;

  /**
   * Weights for scoring
   */
  weights?: {
    quality?: number;
    speed?: number;
    cost?: number;
  };
}

// ============================================
// Router Output
// ============================================

export interface RouterOutput {
  model: ModelDefinition;
  provider: string;
  modality: ModalityType;
  score: number;
  alternatives: ModelDefinition[];
  isFree: boolean;
  failoverChain: string[];
}

// ============================================
// Modality Detection
// ============================================

const IMAGE_KEYWORDS = /\b(generate\s*image|draw|create\s*image|make\s*image|generate\s*picture|create\s*picture|make\s*picture|design\s*image|visuali[sz]e|render|photo\s*of|illustration|image\s*of|picture\s*of)\b/i;
const VIDEO_KEYWORDS = /\b(generate\s*video|create\s*video|make\s*video|animate|animation|video\s*of|motion|render\s*video)\b/i;
const CODE_KEYWORDS = /\b(code|program|function|class|script|algorithm|implement|debug|fix|write\s*code|programming)\b/i;
const VISION_KEYWORDS = /\b(analyze\s*image|describe\s*image|what\s*is\s*in|look\s*at|see\s*this|identify|recogni[sz]e|vision)\b/i;

/**
 * Detect modality from prompt
 */
export function detectModality(prompt?: string): ModalityType {
  if (!prompt) return 'text';

  const lower = prompt.toLowerCase();

  if (IMAGE_KEYWORDS.test(lower)) return 'image';
  if (VIDEO_KEYWORDS.test(lower)) return 'video';
  if (CODE_KEYWORDS.test(lower)) return 'code';
  if (VISION_KEYWORDS.test(lower)) return 'vision';

  return 'text';
}

/**
 * Map modality to provider type
 */
export function modalityToProviderType(modality: ModalityType): ProviderType {
  switch (modality) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'code':
    case 'vision':
    case 'text':
    default:
      return 'text';
  }
}

// ============================================
// Scoring
// ============================================

const DEFAULT_WEIGHTS = {
  quality: 0.5,
  speed: 0.3,
  cost: 0.2,
};

const COST_SCORES: Record<CostLevel, number> = {
  free: 1.0,
  low: 0.6,
  medium: 0.3,
  high: 0.0,
};

/**
 * Calculate optimization score for a model
 */
export function calculateScore(
  model: ModelDefinition,
  weights?: RouterInput['weights']
): number {
  const effectiveWeights = {
    quality: weights?.quality ?? DEFAULT_WEIGHTS.quality,
    speed: weights?.speed ?? DEFAULT_WEIGHTS.speed,
    cost: weights?.cost ?? DEFAULT_WEIGHTS.cost,
  };
  
  const costScore = COST_SCORES[model.cost];

  return (
    effectiveWeights.quality * model.quality +
    effectiveWeights.speed * model.speed -
    effectiveWeights.cost * costScore
  );
}

// ============================================
// Filtering
// ============================================

/**
 * Filter models by capability profile
 */
function filterByCapability(
  candidateModels: ModelDefinition[],
  profile: ReturnType<typeof getProfile>
): ModelDefinition[] {
  return candidateModels.filter((model) => {
    // Check provider access
    if (!canAccessProvider(profile, model.provider)) {
      return false;
    }
    // Check cost access
    if (!canAccessCost(profile, model.cost)) {
      return false;
    }
    // Check quality threshold
    if (!meetsQualityThreshold(profile, model.quality)) {
      return false;
    }
    return true;
  });
}

/**
 * Filter models by preferred provider
 */
function filterByProvider(
  candidateModels: ModelDefinition[],
  preferredProvider?: string
): ModelDefinition[] {
  if (!preferredProvider) return candidateModels;

  const preferred = candidateModels.filter(
    (m) => m.provider === preferredProvider
  );

  // If preferred provider has candidates, use only those
  if (preferred.length > 0) {
    return preferred;
  }

  // Otherwise, return all candidates
  return candidateModels;
}

// ============================================
// Main Router Function
// ============================================

/**
 * Select the best model based on context
 */
export function selectModel(input: RouterInput): RouterOutput {
  const {
    userTier,
    modality,
    prompt,
    preferredProvider,
    prioritizeFree = true,
    weights,
  } = input;

  // 1. Get user profile
  const profile = getProfile(userTier);

  // 2. Detect modality if not provided
  const detectedModality = modality ?? detectModality(prompt);
  const providerType = modalityToProviderType(detectedModality);

  // 3. Get candidate models by type
  let candidates = getModelsByType(providerType);

  // 4. Filter by available providers (based on environment variables)
  const availableProviders = getAvailableProviders();
  candidates = candidates.filter((m) => availableProviders.includes(m.provider));

  // 5. Filter by capability profile
  candidates = filterByCapability(candidates, profile);

  // 6. Filter by preferred provider
  candidates = filterByProvider(candidates, preferredProvider);

  // 7. Free-tier optimization: prioritize free models first
  if (prioritizeFree) {
    const freeModels = candidates.filter((m) => m.cost === 'free');
    if (freeModels.length > 0) {
      // If free models meet the quality threshold, use them
      const bestFree = freeModels.sort(
        (a, b) => calculateScore(b, weights) - calculateScore(a, weights)
      )[0];

      if (meetsQualityThreshold(profile, bestFree.quality)) {
        candidates = freeModels;
      }
    }
  }

  // 8. Score and rank models
  const scored = candidates.map((model) => ({
    model,
    score: calculateScore(model, weights),
  }));

  scored.sort((a, b) => b.score - a.score);

  // 9. Select best model
  const best = scored[0];

  if (!best) {
    throw new Error(`No models available for modality: ${detectedModality}`);
  }

  // 10. Build failover chain (top 3 alternatives)
  const alternatives = scored.slice(1, 4).map((s) => s.model);
  const failoverChain = alternatives.map((m) => m.id);

  return {
    model: best.model,
    provider: best.model.provider,
    modality: detectedModality,
    score: best.score,
    alternatives,
    isFree: best.model.cost === 'free',
    failoverChain,
  };
}

// ============================================
// Fallover Support
// ============================================

/**
 * Get a fallback model for error handling
 */
export function getFallbackModel(
  currentModelId: string,
  userTier: UserTier,
  modality?: ModalityType
): ModelDefinition | undefined {
  const currentModel = getModelById(currentModelId);
  const detectedModality = modality ?? currentModel?.type ?? 'text';
  const providerType = modalityToProviderType(detectedModality);

  // Get available providers
  const availableProviders = getAvailableProviders();

  // Get profile
  const profile = getProfile(userTier);

  // Get candidates
  let candidates = getModelsByType(providerType);
  
  // Filter by available providers
  candidates = candidates.filter((m) => availableProviders.includes(m.provider));
  
  // Filter by capability
  candidates = filterByCapability(candidates, profile);

  // Exclude current model
  candidates = candidates.filter((m) => m.id !== currentModelId);

  // Score and sort
  const scored = candidates.map((model) => ({
    model,
    score: calculateScore(model),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.model;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get available models for a user's tier
 */
export function getAvailableModels(userTier: UserTier): ModelDefinition[] {
  const profile = getProfile(userTier);

  // Start with all models and filter
  let available = [...models];

  // Filter by provider
  available = available.filter((m) =>
    profile.allowedProviders.includes(m.provider)
  );

  // Filter by cost
  available = available.filter((m) =>
    profile.allowedCost.includes(m.cost)
  );

  // Filter by quality
  available = available.filter((m) =>
    meetsQualityThreshold(profile, m.quality)
  );

  return available;
}

/**
 * Check if a specific model is available for a user
 */
export function isModelAvailable(
  modelId: string,
  userTier: UserTier
): boolean {
  const model = getModelById(modelId);
  if (!model) return false;

  const profile = getProfile(userTier);

  return (
    canAccessProvider(profile, model.provider) &&
    canAccessCost(profile, model.cost) &&
    meetsQualityThreshold(profile, model.quality)
  );
}
