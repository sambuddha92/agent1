import { bedrock } from '@ai-sdk/amazon-bedrock';
import { MODEL_CONFIG } from '../constants';
import type { ModelTier, Message, ModelSelection } from '@/types';

// ============================================
// 5-Tier Model Router — Optimized for Cost
// ============================================
// T1: Nova Micro   — $0.035/$0.14   — trivial (greetings, acks)
// T2: Nova Lite    — $0.06/$0.24    — simple Q&A
// T3: Haiku 3.5    — $0.80/$4.00    — moderate (detailed care, weather, basic images)
// T4: Sonnet 3.5   — $3.00/$15.00   — complex (planning, dream renders, analysis)
// T5: Opus 3       — $15.00/$75.00  — extreme (comprehensive multi-zone redesigns)
// ============================================

const MODEL_IDS: Record<ModelTier, string> = {
  T1: MODEL_CONFIG.T1_MODEL,
  T2: MODEL_CONFIG.T2_MODEL,
  T3: MODEL_CONFIG.T3_MODEL,
  T4: MODEL_CONFIG.T4_MODEL,
  T5: MODEL_CONFIG.T5_MODEL,
};

// --------------- Keyword Sets ---------------

const GREETING_PATTERNS =
  /^(hi|hello|hey|yo|sup|hola|good\s*(morning|evening|afternoon|night)|what'?s\s*up|howdy)\b/i;

const ACK_PATTERNS =
  /^(thanks?|thank\s*you|ok(ay)?|got\s*it|cool|nice|great|awesome|sure|yep|yup|yes|no|nah|k|👍|🙏|❤️|💚)\s*[.!]?\s*$/i;

const T5_KEYWORDS =
  /\b(comprehensive|exhaustive|everything|full\s*plan|seasonal\s*calendar|year[\s-]*round|complete\s*(guide|plan|redesign)|all\s*seasons|entire\s*(balcony|garden|space)|from\s*scratch)\b/i;

const T4_KEYWORDS =
  /\b(plan|design|layout|dream|render|compare|in[\s-]*depth|step[\s-]*by[\s-]*step|detailed\s*(plan|guide)|redesign|makeover|transform|visuali[sz]e)\b/i;

const T3_KEYWORDS =
  /\b(why|diagnose|problem|dying|disease|pest|fungus|rot|schedule|calendar|yellow(ing)?|wilt(ing)?|brown\s*spots?|drooping|overwater|underwater|nutrient|deficien|fertili[sz]|propaga|repot|transplant|prune|trim)\b/i;

// --------------- Classification Logic ---------------

/**
 * Check if messages contain image content
 * 
 * @param messages - Array of chat messages
 * @returns True if last message contains images
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
 * 
 * @param messages - Array of chat messages
 * @returns Text content or empty string
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
 * 
 * @param messages - Array of chat messages
 * @returns Count of user messages
 */
function countUserMessages(messages: Message[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

/**
 * Classify message complexity and select appropriate model tier
 * Uses cost-optimized heuristics to minimize expenses while maintaining quality
 * 
 * @param messages - Array of chat messages
 * @returns Model tier (T1-T5) based on complexity analysis
 */
export function classifyTier(messages: Message[]): ModelTier {
  const text = getLastUserText(messages).trim();
  const len = text.length;
  const userMsgCount = countUserMessages(messages);
  const containsImages = hasImages(messages);

  // ---- T5: Extreme complexity ----
  if (T5_KEYWORDS.test(text)) return 'T5';
  // Very long message with multiple question marks → likely multi-part complex query
  if (len > MODEL_CONFIG.VERY_LONG_MESSAGE_LENGTH && (text.match(/\?/g)?.length ?? 0) >= MODEL_CONFIG.MULTI_QUESTION_THRESHOLD) return 'T5';
  // Long conversation threads on complex topics
  if (userMsgCount > MODEL_CONFIG.LONG_CONVERSATION_THRESHOLD && T4_KEYWORDS.test(text)) return 'T5';

  // ---- T4: Complex tasks ----
  if (containsImages && T4_KEYWORDS.test(text)) return 'T4';
  if (T4_KEYWORDS.test(text)) return 'T4';
  // Long messages with images
  if (containsImages && len > MODEL_CONFIG.MEDIUM_MESSAGE_LENGTH) return 'T4';

  // ---- T3: Moderate complexity ----
  if (containsImages) return 'T3'; // Any image defaults to at least Haiku
  if (T3_KEYWORDS.test(text)) return 'T3';
  if (len > MODEL_CONFIG.LONG_MESSAGE_LENGTH) return 'T3'; // Longer messages need more nuance

  // ---- T1: Trivial ----
  if (GREETING_PATTERNS.test(text) && len < 50) return 'T1';
  if (ACK_PATTERNS.test(text)) return 'T1';
  if (len < MODEL_CONFIG.SHORT_MESSAGE_LENGTH && !text.includes('?')) return 'T1';

  // ---- T2: Simple Q&A (default) ----
  return 'T2';
}

// --------------- Public API ---------------

/**
 * Select optimal AI model based on message complexity
 * Implements cost-optimized routing to minimize API expenses
 * 
 * @param messages - Array of chat messages
 * @returns Selected model instance, tier, and model ID
 */
export function selectModel(messages: Message[]): ModelSelection {
  const tier = classifyTier(messages);
  const modelId = MODEL_IDS[tier];

  // Log for observability (will show in server logs)
  console.log(`[model-router] Tier=${tier} Model=${modelId}`);

  return { model: bedrock(modelId), tier, modelId };
}
