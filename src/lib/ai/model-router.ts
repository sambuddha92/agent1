import { bedrock } from '@ai-sdk/amazon-bedrock';
import { MODEL_CONFIG } from '../constants';
import type { ModelTier, Message, ModelSelection } from '@/types';

// ============================================
// 3-Tier Model Router with Fallback Support
// ============================================
// T1: Nova Pro      — $0.80/$3.20   — Simple Q&A, greetings (fallback: Nova Lite)
// T2: Haiku 3.5     — $0.80/$4.00   — Medium complexity, care guidance (fallback: Nova Pro)
// T3: Sonnet 3.5    — $3.00/$15.00  — Complex planning, design, images (fallback: Haiku → Nova Pro)
// ============================================

interface ModelConfig {
  primary: string;
  fallbacks: string[];
}

const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  T1: {
    primary: MODEL_CONFIG.T1_MODEL,
    fallbacks: [MODEL_CONFIG.T1_FALLBACK],
  },
  T2: {
    primary: MODEL_CONFIG.T2_MODEL,
    fallbacks: [MODEL_CONFIG.T2_FALLBACK],
  },
  T3: {
    primary: MODEL_CONFIG.T3_MODEL,
    fallbacks: [MODEL_CONFIG.T3_FALLBACK, MODEL_CONFIG.T3_FALLBACK_SECONDARY],
  },
};

// --------------- Keyword Sets ---------------

// Simple interactions that don't need complex reasoning
const GREETING_PATTERNS =
  /^(hi|hello|hey|yo|sup|hola|good\s*(morning|evening|afternoon|night)|what'?s\s*up|howdy)\b/i;

const ACK_PATTERNS =
  /^(thanks?|thank\s*you|ok(ay)?|got\s*it|cool|nice|great|awesome|sure|yep|yup|yes|no|nah|k|👍|🙏|❤️|💚)\s*[.!]?\s*$/i;

// Complex tasks requiring advanced reasoning
const COMPLEX_KEYWORDS =
  /\b(plan|design|layout|dream|render|visuali[sz]e|compare|redesign|makeover|transform|comprehensive|exhaustive|everything|full\s*plan|seasonal\s*calendar|year[\s-]*round|complete\s*(guide|plan|redesign)|all\s*seasons|entire\s*(balcony|garden|space)|from\s*scratch|in[\s-]*depth|step[\s-]*by[\s-]*step|detailed\s*(plan|guide))\b/i;

// Medium complexity - needs nuanced understanding but not deep planning
const MEDIUM_KEYWORDS =
  /\b(why|how|diagnose|problem|dying|disease|pest|fungus|rot|schedule|calendar|yellow(ing)?|wilt(ing)?|brown\s*spots?|drooping|overwater|underwater|nutrient|deficien|fertili[sz]|propaga|repot|transplant|prune|trim|when\s+to|best\s+time|recommend|suggest|should\s+I)\b/i;

// --------------- Helper Functions ---------------

/**
 * Check if messages contain image content
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
 * Extract text content from the last user message
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
 * Count total number of user messages in conversation
 */
function countUserMessages(messages: Message[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

/**
 * Check if conversation has multiple questions or complex multi-part query
 */
function isMultiPartQuery(text: string): boolean {
  const questionCount = (text.match(/\?/g) || []).length;
  const hasMultipleQuestions = questionCount >= MODEL_CONFIG.MULTI_QUESTION_THRESHOLD;
  const hasAndConjunctions = (text.match(/\band\b/gi) || []).length >= 2;
  return hasMultipleQuestions || hasAndConjunctions;
}

// --------------- Classification Logic ---------------

/**
 * Classify message complexity and select appropriate model tier
 * Optimized 3-tier system balancing cost and user experience
 * 
 * @param messages - Array of chat messages
 * @returns Model tier (T1-T3) based on complexity analysis
 */
export function classifyTier(messages: Message[]): ModelTier {
  const text = getLastUserText(messages).trim();
  const len = text.length;
  const userMsgCount = countUserMessages(messages);
  const containsImages = hasImages(messages);

  // ---- T3: Complex tasks ----
  // Images always get best model for quality analysis
  if (containsImages) return 'T3';
  
  // Keywords indicating planning, design, visualization needs
  if (COMPLEX_KEYWORDS.test(text)) return 'T3';
  
  // Very long messages or multi-part queries need sophisticated reasoning
  if (len > MODEL_CONFIG.LONG_MESSAGE_LENGTH && isMultiPartQuery(text)) return 'T3';
  
  // Long conversations on complex topics (user has invested time, needs quality)
  if (userMsgCount >= MODEL_CONFIG.LONG_CONVERSATION_THRESHOLD && MEDIUM_KEYWORDS.test(text)) {
    return 'T3';
  }

  // ---- T2: Medium complexity ----
  // Diagnostic questions, care guidance, recommendations
  if (MEDIUM_KEYWORDS.test(text)) return 'T2';
  
  // Medium-length messages with questions need nuanced responses
  if (len > MODEL_CONFIG.MEDIUM_MESSAGE_LENGTH && text.includes('?')) return 'T2';
  
  // Multi-part queries default to medium tier for better structure
  if (isMultiPartQuery(text)) return 'T2';

  // ---- T1: Simple interactions ----
  // Greetings and acknowledgments
  if (GREETING_PATTERNS.test(text) && len < 50) return 'T1';
  if (ACK_PATTERNS.test(text)) return 'T1';
  
  // Very short messages without questions (likely simple statements)
  if (len < MODEL_CONFIG.SHORT_MESSAGE_LENGTH && !text.includes('?')) return 'T1';

  // ---- Default: T2 ----
  // When in doubt, use medium tier for better UX
  // (Better to overspend slightly than deliver poor experience)
  return 'T2';
}

// --------------- Model Selection with Fallback ---------------

/**
 * Select optimal AI model with automatic fallback support
 * Implements cascading fallback to ensure reliability
 * 
 * @param messages - Array of chat messages
 * @param attemptedModels - Array of previously failed model IDs (for recursive fallback)
 * @returns Selected model instance, tier, model ID, and fallback information
 */
export function selectModel(
  messages: Message[],
  attemptedModels: string[] = []
): ModelSelection & { isFallback: boolean; fallbackLevel: number } {
  const tier = classifyTier(messages);
  const config = MODEL_CONFIGS[tier];
  
  // Try to find a model that hasn't been attempted yet
  const allModels = [config.primary, ...config.fallbacks];
  const availableModel = allModels.find(
    (modelId) => !attemptedModels.includes(modelId)
  );

  if (!availableModel) {
    // All models exhausted - this shouldn't happen, but fallback to most reliable
    const modelId = MODEL_CONFIG.T1_FALLBACK;
    console.error(
      `[model-router] All models exhausted for tier=${tier}. Using emergency fallback: ${modelId}`
    );
    return {
      model: bedrock(modelId),
      tier,
      modelId,
      isFallback: true,
      fallbackLevel: allModels.length,
    };
  }

  const isPrimary = availableModel === config.primary;
  const fallbackLevel = isPrimary ? 0 : allModels.indexOf(availableModel);

  // Log for observability
  if (fallbackLevel > 0) {
    console.warn(
      `[model-router] Using fallback model for tier=${tier}, level=${fallbackLevel}, model=${availableModel}`
    );
  } else {
    console.log(`[model-router] Tier=${tier} Model=${availableModel}`);
  }

  return {
    model: bedrock(availableModel),
    tier,
    modelId: availableModel,
    isFallback: !isPrimary,
    fallbackLevel,
  };
}

/**
 * Get fallback model for a failed attempt
 * Used by chat API when a model fails to respond
 * 
 * @param tier - The original tier that failed
 * @param failedModelId - The model ID that failed
 * @returns Fallback model selection or null if no fallbacks available
 */
export function getFallbackModel(
  tier: ModelTier,
  failedModelId: string
): ModelSelection | null {
  const config = MODEL_CONFIGS[tier];
  const allModels = [config.primary, ...config.fallbacks];
  
  // Find next available fallback
  const failedIndex = allModels.indexOf(failedModelId);
  if (failedIndex === -1 || failedIndex === allModels.length - 1) {
    return null; // No fallback available
  }

  const fallbackModelId = allModels[failedIndex + 1];
  console.warn(
    `[model-router] Falling back from ${failedModelId} to ${fallbackModelId} for tier=${tier}`
  );

  return {
    model: bedrock(fallbackModelId),
    tier,
    modelId: fallbackModelId,
  };
}
