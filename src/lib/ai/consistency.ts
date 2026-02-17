/**
 * AI Consistency Layer
 * 
 * Ensures uniform tone, style, and personality across different AI models.
 * Addresses the challenge of maintaining consistent voice when using multiple
 * models (Nova Pro, Nova Lite, Claude Haiku, Claude Sonnet) with varying
 * capabilities and tendencies.
 * 
 * Key Features:
 * - Model-specific prompt adjustments
 * - Response post-processing and normalization
 * - Style validation and enforcement
 * - Tone consistency checks
 * - Voice guidelines injection
 * 
 * Architecture:
 *   Input → Model-Specific Prompt Enhancement → Model Response → Post-Processing → Output
 */

import type { ModelTier } from '@/types';

// ============================================
// Voice & Style Guidelines
// ============================================

/**
 * The FloatGreens Voice - Immutable style rules
 * These constraints apply regardless of which model is used
 */
export const VOICE_GUIDELINES = {
  // Tone attributes (0-10 scale)
  warmth: 8,           // Friendly and approachable
  professionalism: 7,  // Expert but not stuffy
  playfulness: 5,      // Occasional wit, not overdone
  directness: 8,       // Get to the point
  empathy: 9,          // Deeply caring about user's success
  
  // Style constraints
  maxEmojisPerResponse: 2,
  maxPunsPerResponse: 1,
  preferBulletPoints: true,
  leadWithAction: true,
  avoidJargonWithoutContext: true,
  
  // Language patterns to maintain
  preferredPhrases: [
    "Let's check",
    "Here's what I see",
    "Your plants will thank you",
    "I'd recommend",
    "Watch out for",
    "Quick tip",
  ],
  
  // Patterns to avoid
  avoidedPhrases: [
    "I'm sorry but",
    "I apologize",
    "I'm just an AI",
    "I don't have personal experience",
    "As an AI",
    "In my opinion",
    "I think maybe possibly",
  ],
} as const;

/**
 * Voice personality traits that should be consistent
 */
export interface VoiceProfile {
  energy: 'calm' | 'moderate' | 'enthusiastic';
  formality: 'casual' | 'balanced' | 'professional';
  verbosity: 'concise' | 'balanced' | 'detailed';
  humor: 'none' | 'subtle' | 'playful';
}

/**
 * Default FloatGreens voice profile
 */
export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  energy: 'moderate',
  formality: 'balanced',
  verbosity: 'concise',
  humor: 'subtle',
};

// ============================================
// Model-Specific Adjustments
// ============================================

/**
 * Model-specific behavioral tendencies and compensations
 * Different models have different "personalities" - we normalize them here
 */
export const MODEL_BEHAVIORS = {
  // Nova models tend to be more formal and verbose
  'amazon.nova-pro-v1:0': {
    tendencies: ['verbose', 'formal', 'apologetic'],
    compensation: 'increase_directness',
    styleAdjustment: 'CRITICAL: Be MORE concise. Cut fluff. No apologies. Lead with action.',
  },
  'amazon.nova-lite-v1:0': {
    tendencies: ['brief', 'generic', 'less_nuanced'],
    compensation: 'add_warmth',
    styleAdjustment: 'CRITICAL: Add warmth and personality. Be specific, not generic. Show expertise.',
  },
  
  // Claude models tend to be more conversational
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0': {
    tendencies: ['thorough', 'explanatory', 'cautious'],
    compensation: 'reduce_hedging',
    styleAdjustment: 'CRITICAL: Be more direct and confident. Fewer caveats. Trust your expertise.',
  },
  'us.anthropic.claude-3-5-haiku-20241022-v1:0': {
    tendencies: ['balanced', 'concise', 'helpful'],
    compensation: 'maintain_consistency',
    styleAdjustment: 'CRITICAL: Maintain this exact tone - warm, expert, concise.',
  },
} as const;

/**
 * Get model-specific style adjustment instructions
 */
export function getModelStyleAdjustment(modelId: string): string {
  const behavior = MODEL_BEHAVIORS[modelId as keyof typeof MODEL_BEHAVIORS];
  return behavior?.styleAdjustment || MODEL_BEHAVIORS['us.anthropic.claude-3-5-haiku-20241022-v1:0'].styleAdjustment;
}

// ============================================
// Consistency Enforcement Prompts
// ============================================

/**
 * Build strict voice consistency instructions
 * This gets prepended to system prompts to enforce uniform style
 */
export function buildVoiceConsistencyBlock(modelId: string, voiceProfile: VoiceProfile = DEFAULT_VOICE_PROFILE): string {
  const modelAdjustment = getModelStyleAdjustment(modelId);
  
  return `
═══════════════════════════════════════
🎯 VOICE CONSISTENCY LAYER (MANDATORY)
═══════════════════════════════════════

[THIS OVERRIDES ALL OTHER STYLE INSTRUCTIONS IF CONFLICTS ARISE]

Your voice MUST be consistent with these EXACT parameters:

TONE CALIBRATION:
• Warmth: ${VOICE_GUIDELINES.warmth}/10 - Friendly, caring, supportive
• Expertise: ${VOICE_GUIDELINES.professionalism}/10 - Professional but approachable
• Playfulness: ${VOICE_GUIDELINES.playfulness}/10 - Occasional wit, never forced
• Directness: ${VOICE_GUIDELINES.directness}/10 - Get to the point quickly
• Empathy: ${VOICE_GUIDELINES.empathy}/10 - Deeply invested in their success

STYLE RULES (Non-Negotiable):
✓ Lead with ACTION or ANSWER first
✓ Max ${VOICE_GUIDELINES.maxEmojisPerResponse} emojis per response
✓ Max ${VOICE_GUIDELINES.maxPunsPerResponse} pun/joke per response (if any)
✓ Use bullet points for lists of 2+ items
✓ Response length: ${voiceProfile.verbosity === 'concise' ? '<150 words unless detail requested' : voiceProfile.verbosity === 'detailed' ? '200-300 words with full context' : '100-200 words balanced'}
✓ Formality: ${voiceProfile.formality} - ${voiceProfile.formality === 'casual' ? 'conversational, relatable' : voiceProfile.formality === 'professional' ? 'polished but warm' : 'friendly expert'}
✓ Energy: ${voiceProfile.energy} - ${voiceProfile.energy === 'calm' ? 'steady, reassuring' : voiceProfile.energy === 'enthusiastic' ? 'upbeat, motivating' : 'engaged, helpful'}

LANGUAGE PATTERNS TO USE:
${VOICE_GUIDELINES.preferredPhrases.map(p => `• "${p}"`).join('\n')}

LANGUAGE PATTERNS TO AVOID:
${VOICE_GUIDELINES.avoidedPhrases.map(p => `✗ "${p}"`).join('\n')}

MODEL-SPECIFIC ADJUSTMENT FOR ${modelId}:
⚠️ ${modelAdjustment}

VOICE CONSISTENCY CHECKLIST (Verify before responding):
[ ] Does it lead with action/answer?
[ ] Is it concise and direct?
[ ] Does it sound warm but expert?
[ ] No unnecessary apologies or hedging?
[ ] Specific to user's context, not generic?
[ ] Would this response sound the same from any FloatGreens model?

═══════════════════════════════════════
`.trim();
}

// ============================================
// Response Post-Processing
// ============================================

/**
 * Style inconsistency patterns to detect and fix
 */
interface StylePattern {
  pattern: RegExp;
  issue: string;
  replacement?: string | ((match: string) => string);
  severity: 'low' | 'medium' | 'high';
}

/**
 * Patterns that indicate style drift from FloatGreens voice
 */
const STYLE_VIOLATIONS: StylePattern[] = [
  // Excessive apologies
  {
    pattern: /\b(?:I'm sorry|I apologize|Sorry about that|My apologies)(?:\s+(?:but|that|for))?\b/gi,
    issue: 'unnecessary_apology',
    replacement: '',
    severity: 'high',
  },
  
  // AI self-awareness (breaks immersion)
  {
    pattern: /\b(?:As an AI|I'm (?:just )?an AI|I don't have personal experience|being an AI)\b/gi,
    issue: 'ai_self_reference',
    replacement: '',
    severity: 'high',
  },
  
  // Excessive hedging
  {
    pattern: /\b(?:I think|maybe|possibly|perhaps|might|could potentially)\s+(?:I think|maybe|possibly|perhaps|might)\b/gi,
    issue: 'excessive_hedging',
    replacement: (match) => match.split(/\s+/)[0], // Keep first hedge word only
    severity: 'medium',
  },
  
  // Overly formal language
  {
    pattern: /\b(?:utilize|endeavor|ascertain|commence|terminate)\b/gi,
    issue: 'overly_formal',
    replacement: (match) => {
      const replacements: Record<string, string> = {
        utilize: 'use',
        endeavor: 'try',
        ascertain: 'check',
        commence: 'start',
        terminate: 'end',
      };
      return replacements[match.toLowerCase()] || match;
    },
    severity: 'low',
  },
  
  // Multiple exclamation marks (over-enthusiasm)
  {
    pattern: /!{2,}/g,
    issue: 'excessive_enthusiasm',
    replacement: '!',
    severity: 'low',
  },
  
  // Generic opening phrases
  {
    pattern: /^(?:Sure!?|Certainly!?|Of course!?|Absolutely!?|Great question!?|Thank you for asking!?)[,.]?\s+/i,
    issue: 'generic_opening',
    replacement: '',
    severity: 'medium',
  },
  
  // Markdown bold (if not rendering markdown in frontend)
  {
    pattern: /\*\*([^*]+)\*\*/g,
    issue: 'markdown_bold',
    replacement: '$1',
    severity: 'low',
  },
  
  // Markdown italic
  {
    pattern: /\*([^*]+)\*/g,
    issue: 'markdown_italic',
    replacement: '$1',
    severity: 'low',
  },
  
  // Markdown code inline
  {
    pattern: /`([^`]+)`/g,
    issue: 'markdown_code',
    replacement: '$1',
    severity: 'low',
  },
];

/**
 * Post-process response to enforce consistency
 * Normalizes style, removes violations, maintains voice
 */
export function normalizeResponse(
  response: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _modelId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tier: ModelTier
): {
  normalized: string;
  violations: Array<{ issue: string; severity: string }>;
  adjustmentsMade: number;
} {
  let normalized = response;
  const violations: Array<{ issue: string; severity: string }> = [];
  let adjustmentsMade = 0;

  // Apply each style correction
  for (const violation of STYLE_VIOLATIONS) {
    const matches = normalized.match(violation.pattern);
    if (matches) {
      violations.push({
        issue: violation.issue,
        severity: violation.severity,
      });
      
      if (violation.replacement !== undefined) {
        if (typeof violation.replacement === 'string') {
          normalized = normalized.replace(violation.pattern, violation.replacement);
        } else {
          normalized = normalized.replace(violation.pattern, violation.replacement);
        }
        adjustmentsMade++;
      }
    }
  }

  // Clean up multiple consecutive spaces
  normalized = normalized.replace(/\s{2,}/g, ' ');
  
  // Clean up orphaned punctuation (space BEFORE punctuation only)
  normalized = normalized.replace(/\s+([.,!?])/g, '$1');
  
  // Ensure proper spacing after punctuation (add space if missing)
  normalized = normalized.replace(/([.!?])([A-Z])/g, '$1 $2');
  normalized = normalized.replace(/([.!?])(\d)/g, '$1 $2');
  
  // Clean up multiple consecutive spaces again (in case we added any)
  normalized = normalized.replace(/\s{2,}/g, ' ');
  
  // Trim whitespace
  normalized = normalized.trim();

  return {
    normalized,
    violations,
    adjustmentsMade,
  };
}

// ============================================
// Response Validation
// ============================================

/**
 * Metrics for evaluating response consistency
 */
export interface ConsistencyMetrics {
  emojiCount: number;
  wordCount: number;
  bulletPointsUsed: boolean;
  startsWithAction: boolean;
  hasApologies: boolean;
  hasAISelfReference: boolean;
  formalityScore: number; // 0-10, higher = more formal
  consistencyScore: number; // 0-100, overall consistency with voice
}

/**
 * Analyze response for consistency metrics
 */
export function analyzeResponseConsistency(response: string): ConsistencyMetrics {
  // Count emojis using a simpler character range approach
  // This matches most common emojis without requiring Unicode flag
  const emojiCount = (response.match(/[\u2600-\u27BF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;
  const wordCount = response.split(/\s+/).length;
  const bulletPointsUsed = /^[\s]*[•\-\*]\s/m.test(response);
  
  // Check if starts with action/answer (not generic pleasantries)
  const startsWithAction = !/^(?:Sure|Certainly|Of course|Absolutely|Great|Thanks|Thank you|Yes|Hello|Hi)/i.test(response.trim());
  
  // Check for violations
  const hasApologies = /\b(?:sorry|apologize|apologies)\b/i.test(response);
  const hasAISelfReference = /\b(?:as an ai|i'm an ai|being an ai)\b/i.test(response);
  
  // Calculate formality score (0-10)
  const formalWords = (response.match(/\b(?:utilize|endeavor|ascertain|nevertheless|furthermore|consequently|thus|henceforth)\b/gi) || []).length;
  const casualWords = (response.match(/\b(?:hey|yeah|nope|yep|gonna|wanna|cool|awesome)\b/gi) || []).length;
  const formalityScore = Math.min(10, Math.max(0, 5 + formalWords - casualWords));
  
  // Calculate consistency score (0-100)
  let consistencyScore = 100;
  
  // Deduct points for violations
  if (emojiCount > VOICE_GUIDELINES.maxEmojisPerResponse) consistencyScore -= 15;
  if (!bulletPointsUsed && wordCount > 100) consistencyScore -= 10;
  if (!startsWithAction) consistencyScore -= 20;
  if (hasApologies) consistencyScore -= 25;
  if (hasAISelfReference) consistencyScore -= 30;
  if (formalityScore > 7 || formalityScore < 4) consistencyScore -= 15;
  if (wordCount > 250) consistencyScore -= 10; // Too verbose
  
  return {
    emojiCount,
    wordCount,
    bulletPointsUsed,
    startsWithAction,
    hasApologies,
    hasAISelfReference,
    formalityScore,
    consistencyScore: Math.max(0, consistencyScore),
  };
}

// ============================================
// Logging & Observability
// ============================================

/**
 * Log consistency metrics for monitoring
 * Helps identify which models drift most from expected voice
 */
export function logConsistencyMetrics(
  modelId: string,
  tier: ModelTier,
  metrics: ConsistencyMetrics,
  violations: Array<{ issue: string; severity: string }>
): void {
  // Only log in development or if consistency score is low
  if (process.env.NODE_ENV === 'development' || metrics.consistencyScore < 80) {
    console.log(`[consistency] model=${modelId} tier=${tier} score=${metrics.consistencyScore}`);
    
    if (violations.length > 0) {
      console.warn('[consistency] violations detected:', violations.map(v => v.issue).join(', '));
    }
    
    if (metrics.consistencyScore < 70) {
      console.warn('[consistency] LOW SCORE - Response may sound inconsistent with brand voice');
    }
  }
}

// ============================================
// Main Consistency Pipeline
// ============================================

/**
 * Complete consistency enforcement pipeline
 * 
 * @param response - Raw model response
 * @param modelId - Model that generated the response
 * @param tier - Tier classification
 * @returns Normalized response with consistency enforced
 */
export function enforceConsistency(
  response: string,
  modelId: string,
  tier: ModelTier
): string {
  // Step 1: Normalize response (fix violations)
  const { normalized, violations, adjustmentsMade } = normalizeResponse(response, modelId, tier);
  
  // Step 2: Analyze consistency metrics
  const metrics = analyzeResponseConsistency(normalized);
  
  // Step 3: Log for observability
  logConsistencyMetrics(modelId, tier, metrics, violations);
  
  // Step 4: Return normalized response
  if (adjustmentsMade > 0) {
    console.log(`[consistency] Applied ${adjustmentsMade} style corrections to response`);
  }
  
  return normalized;
}

/**
 * Enhance system prompt with consistency layer
 * Injects voice guidelines before the actual prompt
 * 
 * @param systemPrompt - Original system prompt
 * @param modelId - Model ID for model-specific adjustments
 * @param voiceProfile - Optional voice profile override
 * @returns Enhanced prompt with consistency layer
 */
export function enhancePromptWithConsistency(
  systemPrompt: string,
  modelId: string,
  voiceProfile?: VoiceProfile
): string {
  const voiceBlock = buildVoiceConsistencyBlock(modelId, voiceProfile);
  
  return `${voiceBlock}\n\n${systemPrompt}`;
}
