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

const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system for FloatGreens, an AI plant care assistant.

Your job is to analyze conversations and extract important facts about the user that should be remembered for future personalization.

Extract memories in these categories:
- preference: User preferences (e.g., "prefers organic methods", "likes colorful flowers")
- constraint: Physical or time constraints (e.g., "limited time for maintenance", "travels frequently")
- goal: User goals (e.g., "wants to grow herbs for cooking", "aims for aesthetic balcony")
- observation: Behavioral patterns (e.g., "tends to overwater", "very detail-oriented")
- success: Successful outcomes (e.g., "tomatoes thrived with weekly feeding")
- failure: Failed attempts (e.g., "basil died from overwatering last summer")
- context: General context (e.g., "works from home", "has cats", "vegetarian")

IMPORTANT RULES:
1. Only extract facts explicitly stated or strongly implied in the conversation
2. Be specific and actionable - avoid vague statements
3. Focus on information that will help personalize future advice
4. Don't extract temporary states (e.g., "is watering plants right now")
5. Return ONLY valid JSON, no markdown formatting
6. If no meaningful memories found, return empty array

Output format (JSON array only):
[
  {
    "memoryType": "preference",
    "memoryKey": "watering_approach",
    "memoryValue": "Prefers to water deeply once a week rather than frequent light watering",
    "confidence": 0.9
  },
  {
    "memoryType": "goal",
    "memoryKey": "growing_purpose",
    "memoryValue": "Wants to grow herbs for cooking, especially basil and mint",
    "confidence": 1.0
  }
]

Analyze the following conversation and extract memories:`;

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
