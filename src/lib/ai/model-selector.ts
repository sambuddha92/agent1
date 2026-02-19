/**
 * Unified Model Selector
 * 
 * Single source of truth for AI model selection.
 * Provides Google as primary, Bedrock as fallback.
 * 
 * Responsibilities:
 * 1. Classify message complexity → tier (T1-T3)
 * 2. Map user preference → tier
 * 3. Access control (free vs paid users)
 * 4. Provider fallback: Google → Bedrock
 * 
 * @example
 * const selection = selectModel({ messages, preference: 'auto', userTier: 'free' });
 */

import { google } from '@ai-sdk/google';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import type { Message, ModelTier, ModelPreference, UserTier, ModelSelection } from '@/types';

// ============================================
// Types
// ============================================

export interface SelectModelInput {
  messages: Message[];
  preference: ModelPreference;
  userTier: UserTier;
}

export interface ResolvedSelection extends ModelSelection {
  isAuto: boolean;
  effectivePreference: ModelPreference;
  provider: 'google' | 'bedrock';
}

// ============================================
// Model Configurations
// ============================================

interface ModelConfig {
  primary: string;      // Google model ID
  fallback: string;     // Bedrock model ID
}

const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  T1: {
    primary: 'gemini-2.0-flash',
    fallback: 'amazon.nova-lite-v1:0',
  },
  T2: {
    primary: 'gemini-2.0-flash',
    fallback: 'amazon.nova-pro-v1:0',
  },
  T3: {
    primary: 'gemini-2.0-pro-exp',
    fallback: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  },
  T4: {
    primary: 'gemini-2.0-pro',
    fallback: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  },
  T5: {
    primary: 'gemini-2.5-pro',
    fallback: 'anthropic.claude-3-opus',
  },
};

// Preference → Tier mapping
const PREFERENCE_TO_TIER: Record<Exclude<ModelPreference, 'auto'>, ModelTier> = {
  fast: 'T1',
  balanced: 'T2',
  best: 'T3',
};

// ============================================
// Complexity Classification
// ============================================

const GREETING_PATTERNS = /^(hi|hello|hey|yo|sup|hola|good\s*(morning|evening|afternoon|night)|what'?s\s*up|howdy)\b/i;
const ACK_PATTERNS = /^(thanks?|thank\s*you|ok(ay)?|got\s*it|cool|nice|great|awesome|sure|yep|yup|yes|no|nah|k|👍|🙏|❤️|💚)\s*[.!]?\s*$/i;
const COMPLEX_KEYWORDS = /\b(plan|design|layout|dream|render|visuali[sz]e|compare|redesign|makeover|transform|comprehensive|exhaustive|everything|full\s*plan|seasonal\s*calendar|year[\s-]*round|complete\s*(guide|plan|redesign)|all\s*seasons|entire\s*(balcony|garden|space)|from\s*scratch|in[\s-]*depth|step[\s-]*by[\s-]*step|detailed\s*(plan|guide))\b/i;
const MEDIUM_KEYWORDS = /\b(why|how|diagnose|problem|dying|disease|pest|fungus|rot|schedule|calendar|yellow(ing)?|wilt(ing)?|brown\s*spots?|drooping|overwater|underwater|nutrient|deficien|fertili[sz]|propaga|repot|transplant|prune|trim|when\s+to|best\s+time|recommend|suggest|should\s+I)\b/i;

/**
 * Get text content from last user message
 */
function getLastUserText(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const c = messages[i].content;
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) {
        const textPart = c.find((p) => p.type === 'text');
        return (textPart as { text?: string })?.text ?? '';
      }
    }
  }
  return '';
}

/**
 * Check if messages contain images
 */
function hasImages(messages: Message[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return false;
  if (Array.isArray(last.content)) {
    return last.content.some((part) => part.type === 'image');
  }
  return false;
}

/**
 * Count user messages
 */
function countUserMessages(messages: Message[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

/**
 * Check for multi-part query
 */
function isMultiPartQuery(text: string): boolean {
  const questionCount = (text.match(/\?/g) || []).length;
  return questionCount >= 2 || (text.match(/\band\b/gi) || []).length >= 2;
}

/**
 * Classify message complexity → tier
 */
function classifyTier(messages: Message[]): ModelTier {
  const text = getLastUserText(messages).trim();
  const len = text.length;
  const userMsgCount = countUserMessages(messages);
  const containsImages = hasImages(messages);

  // T3: Complex tasks (images always get T3)
  if (containsImages) return 'T3';
  if (COMPLEX_KEYWORDS.test(text)) return 'T3';
  if (len > 300 && isMultiPartQuery(text)) return 'T3';
  if (userMsgCount >= 6 && MEDIUM_KEYWORDS.test(text)) return 'T3';

  // T2: Medium complexity
  if (MEDIUM_KEYWORDS.test(text)) return 'T2';
  if (len > 150 && text.includes('?')) return 'T2';
  if (isMultiPartQuery(text)) return 'T2';

  // T1: Simple interactions
  if (GREETING_PATTERNS.test(text) && len < 50) return 'T1';
  if (ACK_PATTERNS.test(text)) return 'T1';
  if (len < 30 && !text.includes('?')) return 'T1';

  // Default: T2
  return 'T2';
}

// ============================================
// Access Control
// ============================================

/**
 * Check if user can access a preference
 */
function canAccessPreference(userTier: UserTier, preference: ModelPreference): boolean {
  if (preference === 'auto') return true;
  if (userTier === 'paid') return true;
  if (preference === 'best') return false; // 'best' = T3, free users capped at T2
  return true;
}

// ============================================
// Model Selection
// ============================================

/**
 * Select the best model for the given input
 */
export function selectModel(input: SelectModelInput): ResolvedSelection {
  const { messages, preference, userTier } = input;

  // ---- AUTO: Use classification ----
  if (preference === 'auto') {
    let tier = classifyTier(messages);
    
    // Free users capped at T2
    if (userTier === 'free' && tier === 'T3') {
      tier = 'T2';
    }

    const config = MODEL_CONFIGS[tier];
    const model = google(config.primary);

    console.log(`[model-selector] AUTO: tier=${tier}, model=${config.primary}, provider=google`);

    return {
      model,
      tier,
      modelId: config.primary,
      provider: 'google',
      isAuto: true,
      effectivePreference: 'auto',
    };
  }

  // ---- Explicit preference ----
  if (!canAccessPreference(userTier, preference)) {
    console.warn(`[model-selector] Access denied for ${userTier} + ${preference}, downgrading to balanced`);
    const config = MODEL_CONFIGS.T2;
    const model = google(config.primary);

    return {
      model,
      tier: 'T2',
      modelId: config.primary,
      provider: 'google',
      isAuto: false,
      effectivePreference: 'balanced',
    };
  }

  const tier = PREFERENCE_TO_TIER[preference];
  const config = MODEL_CONFIGS[tier];
  const model = google(config.primary);

  console.log(`[model-selector] PREFERENCE: ${preference} → tier=${tier}, model=${config.primary}, provider=google`);

  return {
    model,
    tier,
    modelId: config.primary,
    provider: 'google',
    isAuto: false,
    effectivePreference: preference,
  };
}

/**
 * Get fallback model (for errors)
 */
export function getFallbackModel(tier: ModelTier): ModelSelection {
  const config = MODEL_CONFIGS[tier];
  return {
    model: bedrock(config.fallback),
    tier,
    modelId: config.fallback,
  };
}

// ============================================
// Utilities
// ============================================

/**
 * Parse model preference from FormData/string
 */
export function parseModelPreference(value: string | null | undefined): ModelPreference {
  const valid: ModelPreference[] = ['auto', 'fast', 'balanced', 'best'];
  if (value && valid.includes(value as ModelPreference)) {
    return value as ModelPreference;
  }
  return 'auto';
}

/**
 * Resolve user tier from Supabase metadata
 */
export function resolveUserTier(userMetadata: Record<string, unknown> | null | undefined): UserTier {
  if (!userMetadata) return 'free';
  const plan = userMetadata['plan'];
  if (plan === 'paid' || plan === 'pro' || plan === 'premium') return 'paid';
  return 'free';
}

// ============================================
// UI Helpers (for ModelSelector component)
// ============================================

const TIER_DISPLAY: Record<ModelTier, { label: string; description: string }> = {
  T1: { label: 'Eco', description: 'Fast & efficient, perfect for quick questions' },
  T2: { label: 'Balanced', description: 'Good answers with reasonable token usage' },
  T3: { label: 'Power', description: 'Maximum quality for complex planning' },
  T4: { label: 'Premium', description: 'Advanced reasoning (auto-escalated)' },
  T5: { label: 'Ultra', description: 'Maximum intelligence (auto-escalated)' },
};

/**
 * Get all preference options with access state for a given user tier.
 * Used by the ModelSelector UI to render locked/unlocked states.
 */
export function getPreferenceOptions(userTier: UserTier): Array<{
  value: ModelPreference;
  label: string;
  description: string;
  badge: string;
  locked: boolean;
}> {
  const preferences: ModelPreference[] = ['auto', 'fast', 'balanced', 'best'];
  const BADGE_MAP: Record<string, string> = {
    auto: 'auto',
    fast: 'leaf',
    balanced: 'scale',
    best: 'zap',
  };
  
  return preferences.map((pref) => {
    let tier: ModelTier;
    if (pref === 'auto') tier = 'T2'; // auto defaults to T2
    else tier = PREFERENCE_TO_TIER[pref];
    
    const canAccess = pref === 'auto' || userTier === 'paid' || pref !== 'best';
    
    return {
      value: pref,
      label: pref === 'auto' ? 'AUTO' : TIER_DISPLAY[tier]?.label ?? tier,
      description: pref === 'auto' 
        ? 'Adapts to your question — efficient by default'
        : TIER_DISPLAY[tier]?.description ?? '',
      badge: BADGE_MAP[pref] ?? 'auto',
      locked: !canAccess,
    };
  });
}
