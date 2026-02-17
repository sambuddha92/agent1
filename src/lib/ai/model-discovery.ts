/**
 * Model Discovery Service
 *
 * Dynamically fetches available Bedrock foundation models from us-east-1
 * using the AWS Bedrock ListFoundationModels API.
 *
 * Results are filtered to TEXT and MULTIMODAL output models only,
 * then classified into tiers using MODEL_TIER_CONFIG.
 *
 * Results are cached in memory for 6 hours to minimize API calls.
 */

import {
  BedrockClient,
  ListFoundationModelsCommand,
  type FoundationModelSummary,
} from '@aws-sdk/client-bedrock';
import { MODEL_CONFIG } from '../constants';

// ============================================
// Types
// ============================================

export interface DiscoveredModel {
  modelId: string;
  providerName: string;
  modelName: string;
  inputModalities: string[];
  outputModalities: string[];
  /** Inferred tier based on model ID matching */
  tier: 'T1' | 'T2' | 'T3' | 'unknown';
  /** Whether this model supports text input */
  supportsText: boolean;
  /** Whether this model supports image input */
  supportsImages: boolean;
  /** Pricing tier classification */
  pricingTier: 'cheap' | 'balanced' | 'premium';
}

interface ModelCache {
  models: DiscoveredModel[];
  fetchedAt: number;
}

// ============================================
// Cache
// ============================================

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let _cache: ModelCache | null = null;

function isCacheValid(): boolean {
  if (!_cache) return false;
  return Date.now() - _cache.fetchedAt < CACHE_TTL_MS;
}

// ============================================
// Tier Classification
// ============================================

/**
 * Classifies a Bedrock model into T1/T2/T3 based on its modelId.
 * Matching is done against MODEL_CONFIG IDs to avoid hardcoding.
 */
function classifyModelTier(modelId: string): DiscoveredModel['tier'] {
  const t1Models = [MODEL_CONFIG.T1_MODEL, MODEL_CONFIG.T1_FALLBACK];
  const t2Models = [MODEL_CONFIG.T2_MODEL, MODEL_CONFIG.T2_FALLBACK];
  const t3Models = [
    MODEL_CONFIG.T3_MODEL,
    MODEL_CONFIG.T3_FALLBACK,
    MODEL_CONFIG.T3_FALLBACK_SECONDARY,
  ];

  // Normalize for cross-region prefix comparison (us. prefix variants)
  const normalizedId = modelId.replace(/^us\./, '');

  const matchesAny = (list: string[]) =>
    list.some(
      (id) =>
        modelId === id ||
        normalizedId === id ||
        modelId === id.replace(/^us\./, '') ||
        id.includes(normalizedId) ||
        normalizedId.includes(id.replace(/^us\./, '')),
    );

  if (matchesAny(t1Models)) return 'T1';
  if (matchesAny(t2Models)) return 'T2';
  if (matchesAny(t3Models)) return 'T3';

  // Heuristic fallback: classify by known provider + model name patterns
  const lower = modelId.toLowerCase();

  // Amazon Nova family
  if (lower.includes('nova-micro') || lower.includes('nova-lite')) return 'T1';
  if (lower.includes('nova-pro')) return 'T2';

  // Anthropic Claude family
  if (lower.includes('haiku')) return 'T1';
  if (lower.includes('sonnet')) return 'T2';
  if (lower.includes('opus')) return 'T3';

  // Meta Llama
  if (lower.includes('llama3') || lower.includes('llama-3')) {
    if (lower.includes('8b')) return 'T1';
    if (lower.includes('70b')) return 'T2';
    if (lower.includes('405b')) return 'T3';
  }

  // Mistral
  if (lower.includes('mistral-small') || lower.includes('mistral-7b')) return 'T1';
  if (lower.includes('mistral-large') || lower.includes('mixtral')) return 'T2';

  // Amazon Titan
  if (lower.includes('titan-text-lite')) return 'T1';
  if (lower.includes('titan-text-express') || lower.includes('titan-text-premier')) return 'T2';

  return 'unknown';
}

/**
 * Maps tier to pricing classification.
 */
function tierToPricingClass(
  tier: DiscoveredModel['tier'],
): DiscoveredModel['pricingTier'] {
  if (tier === 'T1') return 'cheap';
  if (tier === 'T3') return 'premium';
  return 'balanced';
}

// ============================================
// Bedrock Client
// ============================================

function getBedrockClient(): BedrockClient {
  return new BedrockClient({
    region: 'us-east-1',
    // Credentials are resolved automatically from:
    // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    // 2. IAM role (production)
    // 3. ~/.aws/credentials (local dev)
  });
}

// ============================================
// Model Fetching
// ============================================

/**
 * Fetch and process foundation models from Bedrock.
 * Only returns models that support TEXT or MULTIMODAL output.
 */
async function fetchModelsFromBedrock(): Promise<DiscoveredModel[]> {
  const client = getBedrockClient();

  try {
    const command = new ListFoundationModelsCommand({
      byOutputModality: 'TEXT', // Filter for text-generating models
    });

    const response = await client.send(command);
    const summaries: FoundationModelSummary[] = response.modelSummaries ?? [];

    console.log(
      `[model-discovery] Fetched ${summaries.length} models from Bedrock us-east-1`,
    );

    const discovered: DiscoveredModel[] = summaries
      .filter((model) => {
        // Must have at least one TEXT or MULTIMODAL output
        // Cast to string[] because AWS SDK types ModelModality as an enum
        const outputs = (model.outputModalities ?? []) as string[];
        return outputs.includes('TEXT') || outputs.includes('MULTIMODAL');
      })
      .map((model): DiscoveredModel => {
        const modelId = model.modelId ?? '';
        const inputModalities = (model.inputModalities ?? []) as string[];
        const outputModalities = (model.outputModalities ?? []) as string[];
        const tier = classifyModelTier(modelId);

        return {
          modelId,
          providerName: model.providerName ?? 'Unknown',
          modelName: model.modelName ?? modelId,
          inputModalities,
          outputModalities,
          tier,
          supportsText: inputModalities.includes('TEXT'),
          supportsImages: inputModalities.includes('IMAGE'),
          pricingTier: tierToPricingClass(tier),
        };
      });

    console.log(
      `[model-discovery] Processed ${discovered.length} text-capable models`,
    );

    return discovered;
  } catch (error) {
    console.error('[model-discovery] Failed to fetch models from Bedrock:', error);
    // Return empty array — callers should fall back to MODEL_CONFIG
    return [];
  }
}

// ============================================
// Public API
// ============================================

/**
 * Get all discovered Bedrock models with tier classification.
 * Results are cached for 6 hours.
 *
 * Returns empty array on failure — callers MUST handle this gracefully
 * and fall back to the static MODEL_CONFIG constants.
 */
export async function getDiscoveredModels(): Promise<DiscoveredModel[]> {
  if (isCacheValid() && _cache) {
    console.log(
      `[model-discovery] Cache hit — ${_cache.models.length} models (fetched ${Math.round((Date.now() - _cache.fetchedAt) / 60000)}m ago)`,
    );
    return _cache.models;
  }

  console.log('[model-discovery] Cache miss — fetching from Bedrock...');
  const models = await fetchModelsFromBedrock();

  _cache = {
    models,
    fetchedAt: Date.now(),
  };

  return models;
}

/**
 * Get discovered models for a specific tier.
 */
export async function getModelsByTier(
  tier: 'T1' | 'T2' | 'T3',
): Promise<DiscoveredModel[]> {
  const all = await getDiscoveredModels();
  return all.filter((m) => m.tier === tier);
}

/**
 * Check if a specific modelId is available in Bedrock.
 * Falls back to true if discovery fails (non-blocking).
 */
export async function isModelAvailable(modelId: string): Promise<boolean> {
  try {
    const models = await getDiscoveredModels();
    if (models.length === 0) return true; // Assume available if discovery failed
    return models.some((m) => m.modelId === modelId || m.modelId.includes(modelId));
  } catch {
    return true; // Non-blocking — assume available
  }
}

/**
 * Force-refresh the model cache (useful for admin/debug endpoints).
 */
export async function refreshModelCache(): Promise<DiscoveredModel[]> {
  _cache = null;
  return getDiscoveredModels();
}

/**
 * Get a summary of tier distribution for monitoring.
 */
export async function getModelTierSummary(): Promise<Record<string, number>> {
  const models = await getDiscoveredModels();
  const summary: Record<string, number> = { T1: 0, T2: 0, T3: 0, unknown: 0 };
  for (const m of models) {
    summary[m.tier] = (summary[m.tier] ?? 0) + 1;
  }
  return summary;
}
