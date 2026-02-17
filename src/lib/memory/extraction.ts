/**
 * Memory Extraction Utilities
 * 
 * Analyzes conversations to extract and store user memories.
 * Uses AI to identify preferences, goals, constraints, and patterns.
 * Designed to run asynchronously without blocking chat responses.
 */

import { generateText } from 'ai';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { addUserMemories } from './context';
import type { Message } from '@/types';

// ============================================
// Memory Extraction Prompt
// ============================================

const MEMORY_EXTRACTION_PROMPT = `Extract key facts from this conversation. Return JSON ONLY.

Categories:
- preference: What they like/dislike (organic methods, colorful plants, etc)
- constraint: Limitations (time, space, travel, pets, etc)
- goal: What they want to achieve
- observation: Behavioral patterns (overwatering, detail-focused, etc)
- interaction: Communication/interaction preferences (brief responses, technical depth, etc)
- success: Successful outcomes or approaches
- context: Background info (work from home, has cats, etc)

Rules:
1. Only extract explicit/strongly implied facts
2. Be specific and actionable
3. Skip temporary states
4. Prioritize INTERACTION patterns (communication style, detail preference, engagement level)
5. Return empty array [] if nothing found

Format: [{"memoryType":"preference","memoryKey":"key","memoryValue":"clear statement","confidence":0.9}]

Conversation:`;


// ============================================
// Extraction Logic
// ============================================

/**
 * Extract memories from a conversation using AI
 * Uses cheap model (Nova Lite) for cost efficiency
 * 
 * @param messages - Conversation messages to analyze
 * @param userId - User ID for memory storage
 * @returns Number of memories extracted and stored
 */
export async function extractMemoriesFromConversation(
  messages: Message[],
  userId: string
): Promise<number> {
  // Only extract from conversations with meaningful content
  if (messages.length < 2) {
    return 0;
  }

  // Skip if conversation is too short (likely just greetings)
  const totalLength = messages
    .map(m => (typeof m.content === 'string' ? m.content : ''))
    .join(' ')
    .length;

  if (totalLength < 50) {
    return 0;
  }

  try {
    // Format conversation for analysis
    const conversationText = messages
      .map(m => {
        const content = typeof m.content === 'string' ? m.content : 
          m.content.map(c => c.type === 'text' ? c.text : '[image]').join(' ');
        return `${m.role === 'user' ? 'User' : 'Assistant'}: ${content}`;
      })
      .join('\n\n');

    // Use Nova Lite for cost efficiency (T2 model)
    const model = bedrock('amazon.nova-lite-v1:0');

    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      prompt: `${MEMORY_EXTRACTION_PROMPT}\n\n${conversationText}`,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Parse the response
    let memories;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      memories = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[memory-extraction] Failed to parse extraction result:', parseError);
      console.error('[memory-extraction] Raw response:', text);
      return 0;
    }

    if (!Array.isArray(memories) || memories.length === 0) {
      console.log('[memory-extraction] No memories extracted from conversation');
      return 0;
    }

    // Store extracted memories
    const stored = await addUserMemories(userId, memories);
    console.log(`[memory-extraction] Extracted and stored ${stored}/${memories.length} memories for user ${userId}`);
    
    // Also extract interaction insights (communication patterns that refine behavior)
    // These are supplementary to the AI extraction and capture behavioral patterns
    const { extractInteractionInsights } = await import('./personalized-extraction');
    
    // Convert Message type to simple format for interaction insights
    const simpleMessages = messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : 
        m.content.map(c => c.type === 'text' ? c.text : '[image]').join(' '),
    }));
    
    const interactionInsights = extractInteractionInsights(simpleMessages);
    
    if (interactionInsights.length > 0) {
      const interactionStored = await addUserMemories(userId, interactionInsights);
      console.log(`[memory-extraction] Extracted and stored ${interactionStored} interaction insights for user ${userId}`);
      return stored + interactionStored;
    }
    
    return stored;
  } catch (error) {
    console.error('[memory-extraction] Error during extraction:', error);
    return 0;
  }
}

/**
 * Analyze conversation and extract memories asynchronously
 * Fire-and-forget pattern - doesn't block the response
 * 
 * @param messages - Conversation messages
 * @param userId - User ID
 */
export function extractMemoriesAsync(messages: Message[], userId: string): void {
  // Fire and forget - don't await
  extractMemoriesFromConversation(messages, userId).catch(error => {
    console.error('[memory-extraction] Async extraction failed:', error);
  });
}

// ============================================
// Manual Memory Addition
// ============================================

/**
 * Manually add a single memory (for explicit user statements)
 * Use this when user explicitly tells the agent something to remember
 * 
 * @param userId - User ID
 * @param statement - What the user wants remembered
 * @returns Success boolean
 */
export async function rememberExplicitStatement(
  userId: string,
  statement: string
): Promise<boolean> {
  try {
    // Use AI to classify and structure the statement
    const model = bedrock('amazon.nova-lite-v1:0');

    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      prompt: `Classify this user statement into a structured memory.
      
Statement: "${statement}"

Return JSON only (no markdown):
{
  "memoryType": "preference|constraint|goal|context",
  "memoryKey": "short_key_describing_this",
  "memoryValue": "clear statement of what to remember"
}`,
      temperature: 0.2,
    });

    const memory = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    
    const { addUserMemory } = await import('./context');
    const success = await addUserMemory(
      userId,
      memory.memoryType,
      memory.memoryKey,
      memory.memoryValue,
      {
        confidence: 1.0,
        source: 'explicit',
      }
    );

    return success;
  } catch (error) {
    console.error('[memory-extraction] Failed to remember explicit statement:', error);
    return false;
  }
}
