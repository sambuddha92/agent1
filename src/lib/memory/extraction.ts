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

const MEMORY_EXTRACTION_PROMPT = `Extract ONLY explicitly stated facts from the USER's messages below. Return JSON ONLY.

⚠️ CRITICAL RULES - DO NOT VIOLATE:
1. ONLY extract facts the user EXPLICITLY stated in their own words
2. DO NOT infer, assume, or add information the user didn't say
3. DO NOT extract problems you (the assistant) suggested - only what the USER reported
4. DO NOT extract diagnoses unless the user specifically mentioned them
5. If the user says "my plant isn't flowering", DO NOT add "pest problems" or "disease" unless they said so
6. Be extremely conservative - when in doubt, DO NOT extract

Categories (extract ONLY if user explicitly mentioned):
- preference: What they explicitly said they like/dislike ("I prefer organic methods")
- constraint: Limitations they stated ("I don't have much time", "my balcony is small")
- goal: What they explicitly want ("I want to grow herbs for cooking")
- observation: Their own observations about their behavior ("I tend to overwater")
- interaction: How they want to communicate ("keep it brief", "explain why")
- success: Outcomes they reported as successful ("my tomatoes did great")
- context: Background they shared ("I work from home", "I have cats")

❌ NEGATIVE EXAMPLES (DO NOT extract):
- User: "My Dahlia isn't flowering" → DO NOT extract "pest_problem" or "yellowing_leaves" - they didn't mention these
- User: "What should I do?" → DO NOT extract anything - this is a question, not a statement
- Assistant suggested: "Check for aphids" → DO NOT extract this as user context - assistant said it, not user

✅ POSITIVE EXAMPLES (DO extract):
- User: "I prefer organic gardening" → Extract: preference/organic_methods
- User: "I have a small balcony" → Extract: constraint/limited_space
- User: "My basil died from overwatering" → Extract: observation/overwatering_tendency

Format: [{"memoryType":"preference","memoryKey":"key","memoryValue":"clear statement","confidence":0.9,"sourceMessage":"excerpt from user message"}]

USER MESSAGES (not assistant messages):`;


// ============================================
// Validation Logic
// ============================================

/**
 * Validate extracted memories against actual user messages
 * Ensures memories are grounded in what the user actually said
 * 
 * @param memories - Memories extracted by AI
 * @param userMessages - Actual user messages
 * @returns Filtered memories that passed validation
 */
function validateMemories(
  memories: Array<{
    memoryType: string;
    memoryKey: string;
    memoryValue: string;
    confidence?: number;
    sourceMessage?: string;
  }>,
  userMessages: Message[]
): Array<{
  memoryType: string;
  memoryKey: string;
  memoryValue: string;
  confidence?: number;
  source?: string;
}> {
  const validated = [];
  
  // Combine all user message text for validation
  const userText = userMessages
    .map(m => {
      const content = typeof m.content === 'string' ? m.content : 
        m.content.map(c => c.type === 'text' ? c.text : '[image]').join(' ');
      return content;
    })
    .join(' ')
    .toLowerCase();

  for (const memory of memories) {
    // Basic validation: check if key concepts from the memory appear in user messages
    const memoryValue = memory.memoryValue.toLowerCase();
    const memoryWords = memoryValue.split(/\s+/).filter(w => w.length > 3); // Filter short words
    
    // For observation/preference/goal types, be stricter
    const strictTypes = ['observation', 'preference', 'goal', 'success', 'constraint'];
    const isStrictType = strictTypes.includes(memory.memoryType);
    
    // Check if sourceMessage exists and can be found in user text
    if (memory.sourceMessage) {
      const sourceSnippet = memory.sourceMessage.toLowerCase();
      const sourceWords = sourceSnippet.split(/\s+/).filter(w => w.length > 3);
      
      // Check if significant words from source appear in user messages
      const matchedWords = sourceWords.filter(word => userText.includes(word));
      const matchRatio = matchedWords.length / Math.max(sourceWords.length, 1);
      
      if (matchRatio >= 0.5) { // At least 50% of source words found
        validated.push({
          memoryType: memory.memoryType,
          memoryKey: memory.memoryKey,
          memoryValue: memory.memoryValue,
          confidence: memory.confidence,
          source: 'conversation_validated',
        });
        continue;
      }
    }
    
    // Fallback: check if key words from memory value appear in user text
    const matchedWords = memoryWords.filter(word => userText.includes(word));
    const matchRatio = matchedWords.length / Math.max(memoryWords.length, 1);
    
    // More lenient thresholds for initial learning phase
    // Strict types (observation, preference, goal) need 50% match; others need 35%
    const threshold = isStrictType ? 0.5 : 0.35;
    
    if (matchRatio >= threshold) {
      validated.push({
        memoryType: memory.memoryType,
        memoryKey: memory.memoryKey,
        memoryValue: memory.memoryValue,
        confidence: memory.confidence ? memory.confidence * 0.9 : 0.7, // Reduce confidence slightly
        source: 'conversation_validated',
      });
    } else {
      console.log(`[memory-extraction] Rejected memory (match ratio ${matchRatio.toFixed(2)}, threshold ${threshold.toFixed(2)}): ${memory.memoryKey} - ${memory.memoryValue}`);
    }
  }
  
  return validated;
}

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
    // CRITICAL: Only analyze USER messages to prevent extracting assistant suggestions
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      console.log('[memory-extraction] No user messages to analyze');
      return 0;
    }

    // Format USER messages ONLY for analysis
    const conversationText = userMessages
      .map((m, index) => {
        const content = typeof m.content === 'string' ? m.content : 
          m.content.map(c => c.type === 'text' ? c.text : '[image]').join(' ');
        return `[Message ${index + 1}] ${content}`;
      })
      .join('\n\n');

    // Use Nova Lite for cost efficiency (T2 model)
    const model = bedrock('amazon.nova-lite-v1:0');

    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      prompt: `${MEMORY_EXTRACTION_PROMPT}\n\n${conversationText}`,
      temperature: 0.2, // Very low temperature for strict extraction
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

    // VALIDATION LAYER: Verify each memory against actual user messages
    const validatedMemories = validateMemories(memories, userMessages);
    
    if (validatedMemories.length === 0) {
      console.log('[memory-extraction] All extracted memories failed validation');
      return 0;
    }

    // Filter by confidence threshold (only store high-confidence memories)
    const highConfidenceMemories = validatedMemories.filter(m => (m.confidence || 0) >= 0.7);
    
    if (highConfidenceMemories.length === 0) {
      console.log('[memory-extraction] No high-confidence memories to store');
      return 0;
    }

    // Store validated, high-confidence memories
    const stored = await addUserMemories(userId, highConfidenceMemories);
    console.log(`[memory-extraction] Stored ${stored}/${memories.length} memories (${memories.length - validatedMemories.length} failed validation, ${validatedMemories.length - highConfidenceMemories.length} below confidence threshold)`);
    
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
