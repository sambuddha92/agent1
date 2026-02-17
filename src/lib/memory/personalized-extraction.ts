/**
 * Personalized Extraction Utilities
 * 
 * Extracts interaction patterns and communication preferences from conversations
 * to enable gradual behavioral adaptation of the AI agent.
 * 
 * This module focuses on learning HOW users prefer to interact,
 * complementing the main memory extraction that learns WHAT they care about.
 */

// ============================================
// Interaction Pattern Detection
// ============================================

/**
 * Extract interaction insights from conversation
 * Returns suggested memories to persist from conversation
 * 
 * These patterns help the agent understand:
 * - Communication style (technical vs casual)
 * - Detail preference (brief vs comprehensive)
 * - Engagement level (exploratory vs goal-focused)
 * - Response patterns (asks for brevity, depth, alternatives, etc)
 */
export function extractInteractionInsights(
  messages: Array<{ role: string; content: string }>
): Array<{
  memoryType: string;
  memoryKey: string;
  memoryValue: string;
  confidence: number;
}> {
  const insights: Array<{
    memoryType: string;
    memoryKey: string;
    memoryValue: string;
    confidence: number;
  }> = [];

  // Analyze user messages
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) {
    return insights;
  }

  const conversationLength = messages.length;
  const userMessagesText = userMessages.map(m => m.content).join(' ').toLowerCase();

  // ============================================
  // Pattern 1: Brevity Preference
  // ============================================
  const brevityKeywords = ['short', 'brief', 'quick', 'concise', 'tl;dr', 'summarize'];
  const brevityMatches = brevityKeywords.filter(k => userMessagesText.includes(k)).length;

  if (brevityMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'prefers_brevity',
      memoryValue: 'User prefers short, concise responses. Be direct and avoid unnecessary verbosity.',
      confidence: Math.min(0.95, 0.5 + brevityMatches * 0.15),
    });
  }

  // ============================================
  // Pattern 2: Detail & Explanation Preference
  // ============================================
  const detailKeywords = [
    'why',
    'explain',
    'how',
    'mechanism',
    'reasoning',
    'detail',
    'understand',
    'deep dive',
  ];
  const detailMatches = detailKeywords.filter(k => userMessagesText.includes(k)).length;

  if (detailMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'prefers_explanations',
      memoryValue: 'User enjoys detailed explanations and reasoning. Explain the "why" behind recommendations.',
      confidence: Math.min(0.95, 0.5 + detailMatches * 0.12),
    });
  }

  // ============================================
  // Pattern 3: Technical Language Preference
  // ============================================
  const technicalKeywords = [
    'ph',
    'nutrient',
    'photosynthesis',
    'osmosis',
    'enzyme',
    'chlorophyll',
    'substrate',
    'ppm',
    'ec',
    'humidity',
  ];
  const technicalMatches = technicalKeywords.filter(k => userMessagesText.includes(k)).length;

  if (technicalMatches > 1) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'communication_style_technical',
      memoryValue: 'User uses technical terminology. Use scientific language and botanical accuracy.',
      confidence: Math.min(0.9, 0.4 + technicalMatches * 0.15),
    });
  }

  // ============================================
  // Pattern 4: Casual/Conversational Preference
  // ============================================
  const casualKeywords = ['lol', 'haha', 'yeah', 'cool', 'fun', 'awesome', 'sweet', 'love'];
  const casualMatches = casualKeywords.filter(k => userMessagesText.includes(k)).length;

  if (casualMatches > 0 && technicalMatches === 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'communication_style_casual',
      memoryValue: 'User prefers casual, conversational tone. Use friendly language and light humor.',
      confidence: Math.min(0.85, 0.5 + casualMatches * 0.1),
    });
  }

  // ============================================
  // Pattern 5: Engagement Level
  // ============================================
  // Extended conversations indicate collaborative, engaged users
  if (conversationLength > 8) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'engagement_level',
      memoryValue: 'User is highly engaged and collaborative. They prefer back-and-forth discussion.',
      confidence: Math.min(0.8, 0.4 + (conversationLength - 8) * 0.05),
    });
  }

  // ============================================
  // Pattern 6: Goal-Focused vs Exploratory
  // ============================================
  const goalKeywords = ['want', 'need', 'achieve', 'goal', 'target', 'build', 'create', 'grow'];
  const exploratoryKeywords = ['curious', 'wonder', 'what if', 'exploring', 'try'];

  const goalMatches = goalKeywords.filter(k => userMessagesText.includes(k)).length;
  const exploratoryMatches = exploratoryKeywords.filter(k => userMessagesText.includes(k)).length;

  if (goalMatches > exploratoryMatches && goalMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'focus_goal_oriented',
      memoryValue: 'User is goal-focused. Lead with actionable steps toward their objectives.',
      confidence: Math.min(0.85, 0.5 + goalMatches * 0.1),
    });
  } else if (exploratoryMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'focus_exploratory',
      memoryValue: 'User is exploratory and curious. Provide options and encourage experimentation.',
      confidence: Math.min(0.8, 0.5 + exploratoryMatches * 0.15),
    });
  }

  // ============================================
  // Pattern 7: Preference for Alternatives
  // ============================================
  const alternativeKeywords = ['alternative', 'other', 'another', 'option', 'instead', 'different'];
  const alternativeMatches = alternativeKeywords.filter(k => userMessagesText.includes(k)).length;

  if (alternativeMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'prefers_alternatives',
      memoryValue: 'User likes to see multiple options and alternatives. Present choices when relevant.',
      confidence: Math.min(0.8, 0.5 + alternativeMatches * 0.15),
    });
  }

  // ============================================
  // Pattern 8: Question Pattern (Curious vs Confident)
  // ============================================
  const questionCount = userMessages.filter(m => m.content.includes('?')).length;
  const userMessageCount = userMessages.length;
  const questionRatio = questionCount / userMessageCount;

  if (questionRatio > 0.5) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'communication_questioning',
      memoryValue: 'User asks many questions. They prefer discovering through dialogue.',
      confidence: Math.min(0.8, 0.5 + questionRatio * 0.3),
    });
  }

  // ============================================
  // Pattern 9: Time Sensitivity
  // ============================================
  const urgencyKeywords = ['urgent', 'asap', 'quick', 'fast', 'immediately', 'now', 'today'];
  const urgencyMatches = urgencyKeywords.filter(k => userMessagesText.includes(k)).length;

  if (urgencyMatches > 0) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'time_sensitivity',
      memoryValue: 'User often has time-sensitive concerns. Prioritize quick, actionable advice.',
      confidence: Math.min(0.75, 0.5 + urgencyMatches * 0.12),
    });
  }

  return insights;
}

// ============================================
// Batch Analysis Functions
// ============================================

/**
 * Analyze patterns across multiple conversations
 * Useful for identifying persistent behavioral traits
 */
export function analyzeConversationPatterns(
  conversations: Array<Array<{ role: string; content: string }>>
): Record<string, { frequency: number; confidence: number }> {
  const patterns: Record<string, { frequency: number; confidence: number }> = {};

  conversations.forEach(conversation => {
    const insights = extractInteractionInsights(conversation);

    insights.forEach(insight => {
      const key = insight.memoryKey;
      if (!patterns[key]) {
        patterns[key] = { frequency: 0, confidence: 0 };
      }
      patterns[key].frequency += 1;
      patterns[key].confidence = Math.max(patterns[key].confidence, insight.confidence);
    });
  });

  return patterns;
}

/**
 * Determine dominant interaction style from patterns
 * Returns primary and secondary communication styles
 */
export function determineInteractionStyle(
  patterns: Record<string, { frequency: number; confidence: number }>
): {
  primary: 'technical' | 'casual' | 'mixed';
  secondary?: string;
} {
  const technicalScore =
    (patterns.communication_style_technical?.frequency || 0) * patterns.communication_style_technical?.confidence || 0;
  const casualScore =
    (patterns.communication_style_casual?.frequency || 0) * patterns.communication_style_casual?.confidence || 0;

  if (technicalScore > casualScore + 0.2) {
    return { primary: 'technical' };
  } else if (casualScore > technicalScore + 0.2) {
    return { primary: 'casual' };
  } else {
    return { primary: 'mixed' };
  }
}
