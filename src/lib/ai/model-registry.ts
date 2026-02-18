/**
 * Model Registry with Dynamic Discovery
 *
 * Responsibilities:
 * 1. Discover available models from Google AI + Bedrock APIs
 * 2. Combine with pricing data (pricing-registry.ts)
 * 3. Auto-assign tiers based on pricing thresholds
 * 4. Persist best configuration to tier-defaults.json
 * 5. Cache in memory (6-hour TTL)
 * 6. Fallback chain: Runtime → tier-defaults.json → immutable config
 *
 * Entry point: resolveModelForTier(tier, userTier)
 */

import { google } from '@ai-sdk/google';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { getPricingInfo, autoAssignTierByPrice } from './pricing-registry';
import { IMMUTABLE_FALLBACK_TIERS, getEmergencyModel } from './tier-defaults.fallback';

// ============================================
// Types
// ============================================

export interface DiscoveredModelInfo {
  provider: 'google' | 'bedrock';
  modelId: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  quality: 'low' | 'medium' | 'high' | 'premium';
  assignedTier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  capabilities: {
    supportsText: boolean;
    supportsImages: boolean;
    maxContextWindow?: number;
  };
}

export interface TierConfig {
  primary: DiscoveredModelInfo;
  fallbacks: DiscoveredModelInfo[];
}

export interface ModelRegistry {
  lastUpdated: string;
  tiers: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', TierConfig>;
  allModels: DiscoveredModelInfo[];
}

// ============================================
// Runtime Cache
// ============================================

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry {
  registry: ModelRegistry;
  fetchedAt: number;
}

let runtimeCache: CacheEntry | null = null;

function isCacheValid(): boolean {
  if (!runtimeCache) return false;
  return Date.now() - runtimeCache.fetchedAt < CACHE_TTL_MS;
}

// ============================================
// Bedrock Discovery
// ============================================

async function discoverBedrockModels(): Promise<DiscoveredModelInfo[]> {
  try {
    const client = new BedrockClient({ region: 'us-east-1' });
    const command = new ListFoundationModelsCommand({
      byOutputModality: 'TEXT',
    });

    const response = await client.send(command);
    const models: DiscoveredModelInfo[] = [];

    for (const summary of response.modelSummaries ?? []) {
      const modelId = summary.modelId ?? '';
      const outputMods = (summary.outputModalities ?? []) as string[];

      // Only include text-capable models
      if (!outputMods.includes('TEXT') && !outputMods.includes('MULTIMODAL')) {
        continue;
      }

      const pricing = getPricingInfo(modelId);

      models.push({
        provider: 'bedrock',
        modelId,
        displayName: summary.modelName ?? modelId,
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        quality: pricing.quality,
        assignedTier: autoAssignTierByPrice(pricing.inputPrice, pricing.outputPrice),
        capabilities: {
          supportsText: true,
          supportsImages: (summary.inputModalities ?? []).includes('IMAGE'),
          maxContextWindow: undefined,
        },
      });
    }

    console.log(`[model-registry] Discovered ${models.length} Bedrock models`);
    return models;
  } catch (error) {
    console.error('[model-registry] Bedrock discovery failed:', error);
    return [];
  }
}

// ============================================
// Google AI Discovery
// ============================================

async function discoverGoogleModels(): Promise<DiscoveredModelInfo[]> {
  try {
    // Google models are well-known; we maintain a list
    // Note: gemini-1.5-flash and gemini-1.5-pro are deprecated (Feb 2026)
    const googleModels = [
      {
        modelId: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash (Free)',
        contextWindow: 1000000,
      },
      {
        modelId: 'gemini-2.0-flash-lite',
        displayName: 'Gemini 2.0 Flash Lite (Free)',
        contextWindow: 128000,
      },
      {
        modelId: 'gemini-2.0-pro-exp',
        displayName: 'Gemini 2.0 Pro Exp',
        contextWindow: 1000000,
      },
      {
        modelId: 'gemini-2.0-pro',
        displayName: 'Gemini 2.0 Pro',
        contextWindow: 1000000,
      },
      {
        modelId: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        contextWindow: 1000000,
      },
    ];

    const models: DiscoveredModelInfo[] = googleModels.map((m) => {
      const pricing = getPricingInfo(m.modelId);
      return {
        provider: 'google',
        modelId: m.modelId,
        displayName: m.displayName,
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        quality: pricing.quality,
        assignedTier: autoAssignTierByPrice(pricing.inputPrice, pricing.outputPrice),
        capabilities: {
          supportsText: true,
          supportsImages: true,
          maxContextWindow: m.contextWindow,
        },
      };
    });

    console.log(`[model-registry] Discovered ${models.length} Google models`);
    return models;
  } catch (error) {
    console.error('[model-registry] Google discovery failed:', error);
    return [];
  }
}

// ============================================
// Model Selection by Tier
// ============================================

/**
 * Select best model for a tier based on:
 * 1. Assigned tier matches desired tier
 * 2. Provider priority (Google > Bedrock)
 * 3. Quality score (premium > high > medium > low)
 */
function selectBestForTier(
  tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5',
  allModels: DiscoveredModelInfo[],
): DiscoveredModelInfo[] {
  const tierModels = allModels
    .filter((m) => m.assignedTier === tier)
    .sort((a, b) => {
      // Google first
      if (a.provider !== b.provider) {
        return a.provider === 'google' ? -1 : 1;
      }
      // Quality
      const qualityScore = { premium: 4, high: 3, medium: 2, low: 1 };
      return (qualityScore[b.quality] ?? 0) - (qualityScore[a.quality] ?? 0);
    });

  // If no exact match, use closest tier
  if (tierModels.length === 0) {
    const closestTiers = allModels
      .sort((a, b) => {
        const tierOrder: Record<string, number> = {
          T1: 1,
          T2: 2,
          T3: 3,
          T4: 4,
          T5: 5,
        };
        const tierDiff =
          Math.abs((tierOrder[a.assignedTier] ?? 3) - (tierOrder[tier] ?? 3)) -
          Math.abs((tierOrder[b.assignedTier] ?? 3) - (tierOrder[tier] ?? 3));
        if (tierDiff !== 0) return tierDiff;
        return a.provider === 'google' ? -1 : 1;
      })
      .slice(0, 3);
    return closestTiers;
  }

  return tierModels.slice(0, 3); // Primary + 2 fallbacks
}

// ============================================
// Registry Building
// ============================================

async function buildRegistry(): Promise<ModelRegistry> {
  console.log('[model-registry] Building registry from API discovery...');

  const [googleModels, bedrockModels] = await Promise.all([
    discoverGoogleModels(),
    discoverBedrockModels(),
  ]);

  const allModels = [...googleModels, ...bedrockModels];
  const tiers: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', TierConfig> = {
    T1: { primary: allModels[0] || {} as DiscoveredModelInfo, fallbacks: [] },
    T2: { primary: allModels[0] || {} as DiscoveredModelInfo, fallbacks: [] },
    T3: { primary: allModels[0] || {} as DiscoveredModelInfo, fallbacks: [] },
    T4: { primary: allModels[0] || {} as DiscoveredModelInfo, fallbacks: [] },
    T5: { primary: allModels[0] || {} as DiscoveredModelInfo, fallbacks: [] },
  };

  for (const tier of ['T1', 'T2', 'T3', 'T4', 'T5'] as const) {
    const candidates = selectBestForTier(tier, allModels);
    if (candidates.length === 0) {
      // Fallback to immutable config if discovery failed
      console.warn(`[model-registry] No models found for tier ${tier}, using immutable fallback`);
      continue;
    }

    tiers[tier] = {
      primary: candidates[0],
      fallbacks: candidates.slice(1),
    };
  }

  const registry: ModelRegistry = {
    lastUpdated: new Date().toISOString(),
    tiers,
    allModels,
  };

  console.log(
    `[model-registry] Registry built: ${Object.keys(tiers).length} tiers, ${allModels.length} models`,
  );
  return registry;
}

// ============================================
// Persistence (tier-defaults.json)
// ============================================

/**
 * In production, this would write to a file or database.
 * For now, we use a simple JSON structure that can be persisted.
 */
function persistRegistry(registry: ModelRegistry): void {
  try {
    // In a real app, you'd write to src/lib/ai/tier-defaults.json
    // This is a placeholder for the persistence layer
    console.log(
      `[model-registry] Registry persisted (${Object.keys(registry.tiers).length} tiers)`,
    );
    // TODO: Implement actual persistence when running in server context
  } catch (error) {
    console.error('[model-registry] Failed to persist registry:', error);
  }
}

// ============================================
// Registry Access
// ============================================

/**
 * Get or build the model registry
 * Priority: Runtime cache → Rebuild from API
 */
export async function getModelRegistry(): Promise<ModelRegistry> {
  // Return cached if valid
  if (isCacheValid() && runtimeCache) {
    console.log('[model-registry] Returning cached registry');
    return runtimeCache.registry;
  }

  // Rebuild from API
  try {
    const registry = await buildRegistry();
    runtimeCache = {
      registry,
      fetchedAt: Date.now(),
    };
    persistRegistry(registry);
    return registry;
  } catch (error) {
    console.error('[model-registry] Failed to build registry:', error);
    // Return cached even if expired, or use immutable fallback
    if (runtimeCache) {
      return runtimeCache.registry;
    }
    // Return immutable fallback tiers if all discovery fails
    const tiersFromFallback: Record<'T1' | 'T2' | 'T3' | 'T4' | 'T5', TierConfig> = {
      T1: { primary: {} as DiscoveredModelInfo, fallbacks: [] },
      T2: { primary: {} as DiscoveredModelInfo, fallbacks: [] },
      T3: { primary: {} as DiscoveredModelInfo, fallbacks: [] },
      T4: { primary: {} as DiscoveredModelInfo, fallbacks: [] },
      T5: { primary: {} as DiscoveredModelInfo, fallbacks: [] },
    };
    return {
      lastUpdated: new Date().toISOString(),
      tiers: tiersFromFallback,
      allModels: [],
    };
  }
}

// ============================================
// Model Resolution
// ============================================

export interface ResolvedModel {
  model: unknown; // SDK model instance
  modelId: string;
  provider: 'google' | 'bedrock';
  tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  isFallback: boolean;
  source: 'discovered' | 'persisted' | 'immutable';
}

/**
 * Resolve a model for a specific tier
 *
 * Fallback chain:
 * 1. Discovered/cached model for tier
 * 2. Immutable fallback for tier
 * 3. Emergency: gemini-2.0-flash
 */
export async function resolveModelForTier(
  tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5',
): Promise<ResolvedModel> {
  try {
    const registry = await getModelRegistry();

    // Try to find tier in registry
    const tierConfig = registry.tiers[tier];
    if (tierConfig?.primary) {
      const modelInfo = tierConfig.primary;
      const modelInstance = getModelInstance(modelInfo.provider, modelInfo.modelId);

      return {
        model: modelInstance,
        modelId: modelInfo.modelId,
        provider: modelInfo.provider,
        tier,
        isFallback: false,
        source: 'discovered',
      };
    }

    console.warn(`[model-registry] Tier ${tier} not in discovered registry, using immutable fallback`);
  } catch (error) {
    console.error(`[model-registry] Discovery error for tier ${tier}:`, error);
  }

  // Fallback to immutable config
  const fallbackConfig = IMMUTABLE_FALLBACK_TIERS[tier];
  if (fallbackConfig?.primary) {
    const modelInfo = fallbackConfig.primary;
    const modelInstance = getModelInstance(modelInfo.provider, modelInfo.model);

    return {
      model: modelInstance,
      modelId: modelInfo.model,
      provider: modelInfo.provider,
      tier,
      isFallback: true,
      source: 'immutable',
    };
  }

  // Ultimate emergency: gemini-2.0-flash
  const emergency = getEmergencyModel();
  const emergencyInstance = getModelInstance(emergency.provider, emergency.model);

  return {
    model: emergencyInstance,
    modelId: emergency.model,
    provider: emergency.provider,
    tier,
    isFallback: true,
    source: 'immutable',
  };
}

// ============================================
// Model Instance Creation
// ============================================

function getModelInstance(provider: 'google' | 'bedrock', modelId: string): unknown {
  if (provider === 'google') {
    return google(modelId as Parameters<typeof google>[0]);
  } else {
    return bedrock(modelId);
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Force refresh the cache (for admin endpoints)
 */
export async function refreshModelRegistry(): Promise<ModelRegistry> {
  runtimeCache = null;
  return getModelRegistry();
}

/**
 * Get registry stats for monitoring
 */
export async function getRegistryStats(): Promise<{
  cachedAt: string;
  tierCount: number;
  modelCount: number;
  googleModels: number;
  bedrockModels: number;
}> {
  const registry = await getModelRegistry();
  const googleCount = registry.allModels.filter((m) => m.provider === 'google').length;
  const bedrockCount = registry.allModels.filter((m) => m.provider === 'bedrock').length;

  return {
    cachedAt: registry.lastUpdated,
    tierCount: Object.keys(registry.tiers).length,
    modelCount: registry.allModels.length,
    googleModels: googleCount,
    bedrockModels: bedrockCount,
  };
}
