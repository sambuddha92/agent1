/**
 * Personalized Prompt Engineering
 * 
 * Dynamically adapts system prompts based on accumulated user context and memory.
 * Enables gradual behavioral alignment with user's personalized expectations.
 * 
 * Key principles:
 * - Learn communication style from interaction patterns
 * - Prioritize relevant memories in system prompt
 * - Adapt tone, detail level, and response format based on history
 * - Reinforce successful patterns gradually
 */

import type { UserContext, UserContextMemory, MemoryType } from '@/types';

// ============================================
// Types for Prompt Personalization
// ============================================

export interface PersonalizationProfile {
  communicationStyle: CommunicationStyle;
  preferredDetailLevel: DetailLevel;
  priorityMemories: UserContextMemory[];
  constraintSummary: string;
  successPatterns: string[];
  interactionTone: InteractionTone;
  adaptationStrength: number; // 0-1, how much to adapt (based on confidence/time)
}

export type DetailLevel = 'brief' | 'moderate' | 'detailed';
export type CommunicationStyle = 'casual' | 'technical' | 'mixed';
export type InteractionTone = 'encouraging' | 'direct' | 'advisory' | 'collaborative';

// ============================================
// Memory Analysis & Prioritization
// ============================================

/**
 * Analyze user memories to build personalization profile
 * Prioritizes memories by type, confidence, and recency
 * 
 * @param context - User context with memories
 * @returns Personalization profile for prompt adaptation
 */
export function buildPersonalizationProfile(
  context: UserContext
): PersonalizationProfile {
  const memories = context.memories;

  if (memories.length === 0) {
    // Default profile for new users
    return {
      communicationStyle: 'mixed',
      preferredDetailLevel: 'moderate',
      priorityMemories: [],
      constraintSummary: '',
      successPatterns: [],
      interactionTone: 'advisory',
      adaptationStrength: 0,
    };
  }

  // Group memories by type for analysis
  const memoryGroups = groupMemoriesByType(memories);

  // Extract key information from different memory types
  const communicationStyle = inferCommunicationStyle(memoryGroups);
  const detailLevel = inferDetailPreference(memoryGroups);
  const interactionTone = inferInteractionTone(memoryGroups);
  const successPatterns = extractSuccessPatterns(memoryGroups);
  const constraintSummary = summarizeConstraints(memoryGroups);
  const priorityMemories = selectPriorityMemories(memories, 5);

  // Calculate adaptation strength (0-1)
  // More memories = stronger adaptation; high confidence memories = stronger adaptation
  const avgConfidence = memories.reduce((sum, m) => sum + (m.confidence || 0), 0) / memories.length;
  const adaptationStrength = Math.min(0.95, (memories.length / 20) * 0.5 + avgConfidence * 0.5);

  return {
    communicationStyle,
    preferredDetailLevel: detailLevel,
    priorityMemories,
    constraintSummary,
    successPatterns,
    interactionTone,
    adaptationStrength,
  };
}

/**
 * Group memories by type for easier analysis
 */
function groupMemoriesByType(memories: UserContextMemory[]): Record<string, UserContextMemory[]> {
  const grouped: Record<string, UserContextMemory[]> = {};

  memories.forEach(memory => {
    if (!grouped[memory.memory_type]) {
      grouped[memory.memory_type] = [];
    }
    grouped[memory.memory_type].push(memory);
  });

  return grouped;
}

/**
 * Infer communication style from interaction patterns
 */
function inferCommunicationStyle(
  memoryGroups: Record<string, UserContextMemory[]>
): CommunicationStyle {
  const interactionMemories = memoryGroups.interaction || [];

  if (interactionMemories.length === 0) {
    return 'mixed';
  }

  // Look for technical language preference
  const technicalPatterns = interactionMemories.filter(m =>
    m.memory_value.toLowerCase().includes('technical') ||
    m.memory_value.toLowerCase().includes('scientific') ||
    m.memory_value.toLowerCase().includes('detailed')
  );

  // Look for casual preference
  const casualPatterns = interactionMemories.filter(m =>
    m.memory_value.toLowerCase().includes('casual') ||
    m.memory_value.toLowerCase().includes('fun') ||
    m.memory_value.toLowerCase().includes('joking')
  );

  if (technicalPatterns.length > casualPatterns.length) return 'technical';
  if (casualPatterns.length > technicalPatterns.length) return 'casual';
  return 'mixed';
}

/**
 * Infer detail preference from accumulated feedback
 */
function inferDetailPreference(
  memoryGroups: Record<string, UserContextMemory[]>
): DetailLevel {
  const interactionMemories = memoryGroups.interaction || [];

  const briefPreference = interactionMemories.filter(m =>
    m.memory_value.toLowerCase().includes('brief') ||
    m.memory_value.toLowerCase().includes('short') ||
    m.memory_value.toLowerCase().includes('concise')
  ).length;

  const detailPreference = interactionMemories.filter(m =>
    m.memory_value.toLowerCase().includes('detail') ||
    m.memory_value.toLowerCase().includes('explain') ||
    m.memory_value.toLowerCase().includes('thorough')
  ).length;

  if (briefPreference > detailPreference) return 'brief';
  if (detailPreference > briefPreference) return 'detailed';
  return 'moderate';
}

/**
 * Infer preferred interaction tone
 */
function inferInteractionTone(
  memoryGroups: Record<string, UserContextMemory[]>
): InteractionTone {
  const interactionMemories = memoryGroups.interaction || [];

  const tones: Record<InteractionTone, number> = {
    encouraging: 0,
    direct: 0,
    advisory: 0,
    collaborative: 0,
  };

  interactionMemories.forEach(m => {
    const value = m.memory_value.toLowerCase();
    if (value.includes('encouraging') || value.includes('positive')) tones.encouraging++;
    if (value.includes('direct') || value.includes('straightforward')) tones.direct++;
    if (value.includes('advisory') || value.includes('suggest')) tones.advisory++;
    if (value.includes('collaborative') || value.includes('discussion')) tones.collaborative++;
  });

  const maxTone = Object.entries(tones).sort((a, b) => b[1] - a[1])[0];
  return (maxTone?.[0] as InteractionTone) || 'advisory';
}

/**
 * Extract successful patterns from past interactions
 */
function extractSuccessPatterns(memoryGroups: Record<string, UserContextMemory[]>): string[] {
  const successMemories = memoryGroups.success || [];
  const patterns: string[] = [];

  successMemories.slice(0, 3).forEach(memory => {
    // Extract key success pattern
    if (memory.memory_key && memory.memory_value) {
      patterns.push(`${memory.memory_key}: ${memory.memory_value}`);
    }
  });

  return patterns;
}

/**
 * Summarize key constraints for prompt injection
 */
function summarizeConstraints(memoryGroups: Record<string, UserContextMemory[]>): string {
  const constraintMemories = memoryGroups.constraint || [];

  if (constraintMemories.length === 0) {
    return '';
  }

  const constraints = constraintMemories
    .slice(0, 3)
    .map(m => `• ${m.memory_value}`)
    .join('\n');

  return `User's Constraints:\n${constraints}`;
}

/**
 * Select priority memories for inclusion in system prompt
 * Prioritizes by: type > confidence > recency
 */
function selectPriorityMemories(
  memories: UserContextMemory[],
  limit: number = 5
): UserContextMemory[] {
  const priorityScore = (memory: UserContextMemory): number => {
    let score = 0;

    // Priority by type (constraints are highest priority)
    const typePriority: Record<string, number> = {
      constraint: 100,
      goal: 80,
      success: 70,
      preference: 60,
      observation: 40,
      context: 30,
      failure: 20,
      interaction: 10,
    };

    score += typePriority[memory.memory_type] || 0;

    // Boost by confidence
    score += (memory.confidence || 0.5) * 50;

    // Slight boost for recent memories
    const daysOld = (new Date().getTime() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - daysOld * 2);

    return score;
  };

  return memories.sort((a, b) => priorityScore(b) - priorityScore(a)).slice(0, limit);
}

// ============================================
// Dynamic Prompt Building
// ============================================

/**
 * Build personalization instructions based on profile
 * Gradually reinforces learned behaviors
 */
export function buildPersonalizationInstructions(
  profile: PersonalizationProfile
): string {
  const lines: string[] = [];

  if (profile.adaptationStrength > 0) {
    lines.push(`[Personalization Level: ${Math.round(profile.adaptationStrength * 100)}%]`);
    lines.push('');
  }

  // Communication style instructions
  if (profile.communicationStyle === 'technical') {
    lines.push(
      'COMMUNICATION STYLE: Use scientific terminology. Explain mechanisms. Include accuracy caveats.'
    );
  } else if (profile.communicationStyle === 'casual') {
    lines.push('COMMUNICATION STYLE: Conversational tone. Relatable language. Light humor if appropriate.');
  } else {
    lines.push(
      'COMMUNICATION STYLE: Balance technical accuracy with conversational approachability.'
    );
  }

  // Detail level instructions
  if (profile.preferredDetailLevel === 'brief') {
    lines.push(
      'RESPONSE FORMAT: Ultra-concise. One-liners where possible. Only expand if explicitly asked.'
    );
  } else if (profile.preferredDetailLevel === 'detailed') {
    lines.push(
      'RESPONSE FORMAT: Comprehensive. Explain reasoning. Provide context and alternatives.'
    );
  } else {
    lines.push(
      'RESPONSE FORMAT: Balanced. Include key details without excessive verbosity.'
    );
  }

  // Interaction tone
  if (profile.interactionTone === 'encouraging') {
    lines.push('TONE: Supportive and motivating. Celebrate small wins. Frame challenges as opportunities.');
  } else if (profile.interactionTone === 'direct') {
    lines.push('TONE: Straightforward and pragmatic. No sugar-coating. Action-oriented.');
  } else if (profile.interactionTone === 'collaborative') {
    lines.push('TONE: Partner-like. Seek user input. Present options together.');
  } else {
    lines.push('TONE: Advisory but flexible. Provide guidance based on context.');
  }

  return lines.join('\n');
}

/**
 * Build memory context injection with prioritization
 */
export function buildMemoryContextBlock(profile: PersonalizationProfile): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════');
  lines.push('🧠 PERSONALIZED CONTEXT (From Learned Memory)');
  lines.push('═══════════════════════════════════════');
  lines.push('');

  if (profile.constraintSummary) {
    lines.push(profile.constraintSummary);
    lines.push('');
  }

  if (profile.successPatterns.length > 0) {
    lines.push('What Has Worked Well:');
    profile.successPatterns.forEach(pattern => {
      lines.push(`✓ ${pattern}`);
    });
    lines.push('');
  }

  if (profile.priorityMemories.length > 0) {
    lines.push('Key Learned Facts:');
    profile.priorityMemories.forEach(memory => {
      const icon = getMemoryTypeIcon(memory.memory_type);
      lines.push(`${icon} ${memory.memory_value}`);
    });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Get emoji icon for memory type
 */
function getMemoryTypeIcon(type: MemoryType): string {
  const icons: Record<MemoryType, string> = {
    preference: '❤️',
    constraint: '⚠️',
    goal: '🎯',
    observation: '👁️',
    success: '✨',
    failure: '📍',
    interaction: '💬',
    context: 'ℹ️',
  };
  return icons[type] || '•';
}

/**
 * Build adaptive response guidance based on history
 */
export function buildAdaptiveGuidance(profile: PersonalizationProfile): string {
  const lines: string[] = [];

  lines.push('ADAPTIVE BEHAVIOR RULES (Learned from Your History):');
  lines.push('');

  // Based on communication style
  if (profile.communicationStyle === 'technical') {
    lines.push('• Prioritize scientific accuracy over simplicity');
    lines.push('• Use proper botanical terminology');
    lines.push('• Include confidence levels for recommendations');
  } else if (profile.communicationStyle === 'casual') {
    lines.push('• Use relatable language and metaphors');
    lines.push('• Keep technical jargon minimal');
    lines.push('• Friendly, conversational approach');
  }

  // Based on detail preference
  if (profile.preferredDetailLevel === 'brief') {
    lines.push('• Keep responses under 100 words when possible');
    lines.push('• Use bullet points for multiple items');
    lines.push('• Lead with action/answer');
  } else if (profile.preferredDetailLevel === 'detailed') {
    lines.push('• Provide full explanations and reasoning');
    lines.push('• Include alternative approaches');
    lines.push('• Offer learning opportunity when relevant');
  }

  // Based on success patterns
  if (profile.successPatterns.length > 0) {
    lines.push('');
    lines.push('REPLICATE SUCCESS: Remember these approaches worked well:');
    profile.successPatterns.forEach(pattern => {
      lines.push(`• ${pattern}`);
    });
  }

  return lines.join('\n');
}

/**
 * Build complete personalized system prompt
 * Combines base prompt with personalization
 */
export function buildPersonalizedSystemPrompt(
  basePrompt: string,
  context: UserContext,
  userFacingText: boolean = false
): string {
  const profile = buildPersonalizationProfile(context);

  const sections: string[] = [basePrompt, ''];

  // Add personalization instructions (visible internally)
  if (!userFacingText) {
    sections.push(buildPersonalizationInstructions(profile));
    sections.push('');
    sections.push(buildAdaptiveGuidance(profile));
    sections.push('');
  }

  // Add memory context (can be shown to user or hidden)
  if (profile.priorityMemories.length > 0 || profile.constraintSummary) {
    sections.push(buildMemoryContextBlock(profile));
  }

  return sections.join('\n');
}

// ============================================
// Interaction Pattern Learning
// ============================================

/**
 * Extract interaction insights from conversation
 * Returns suggested memories to persist from conversation
 */
export function extractInteractionInsights(
  messages: Array<{ role: string; content: string }>
): Array<{
  memoryType: string;
  memoryKey: string;
  memoryValue: string;
  confidence: number;
  reason: string;
}> {
  const insights: Array<{
    memoryType: string;
    memoryKey: string;
    memoryValue: string;
    confidence: number;
    reason: string;
  }> = [];

  // Analyze user messages
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) {
    return insights;
  }

  const latestUserMessage = userMessages[userMessages.length - 1].content;
  const conversationLength = messages.length;

  // Pattern 1: Detect if user is asking for brevity
  if (
    latestUserMessage.toLowerCase().includes('short') ||
    latestUserMessage.toLowerCase().includes('brief') ||
    latestUserMessage.toLowerCase().includes('quick')
  ) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'prefers_brevity',
      memoryValue: 'User prefers short, concise responses',
      confidence: 0.8,
      reason: 'Explicit request for brevity detected',
    });
  }

  // Pattern 2: Detect technical depth requests
  if (
    latestUserMessage.toLowerCase().includes('why') ||
    latestUserMessage.toLowerCase().includes('explain') ||
    latestUserMessage.toLowerCase().includes('mechanism')
  ) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'prefers_explanations',
      memoryValue: 'User enjoys detailed explanations and reasoning',
      confidence: 0.7,
      reason: 'Multiple explanation requests detected',
    });
  }

  // Pattern 3: Detect engaged user (many messages = collaborative style)
  if (conversationLength > 10) {
    insights.push({
      memoryType: 'interaction',
      memoryKey: 'communication_style',
      memoryValue: 'Collaborative and engaged conversationalist',
      confidence: 0.6,
      reason: 'Extended conversation shows engagement',
    });
  }

  return insights;
}
