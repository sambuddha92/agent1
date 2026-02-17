import { streamText } from 'ai';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { assembleSoulPrompt } from '@/lib/ai/soul';
import { selectModel } from '@/lib/ai/model-router';
import { createClient } from '@/lib/supabase/server';
import { extractMemoriesAsync, getUserContext } from '@/lib/memory';
import { buildPersonalizedSystemPrompt } from '@/lib/ai/personalized-prompts';
import {
  createConversation,
  saveMessage,
  generateTitle,
  updateConversationTitle,
  getConversation,
  getConversationMessages,
  generateSummary,
  updateConversationSummary,
} from '@/lib/conversations';
// import { floatgreensTools } from '@/lib/ai/tools';

export const runtime = 'edge';

/**
 * Chat API Route - Handles streaming AI responses with conversation persistence
 * - Authenticates user
 * - Creates or resumes a conversation
 * - Saves user message to DB
 * - Fetches and injects user context for personalization
 * - Selects optimal AI model based on complexity
 * - Streams response back to client
 * - Saves assistant response to DB after stream completes
 * - Asynchronously extracts memories from conversation
 * 
 * @param req - Request with messages array and optional conversationId
 * @returns Streaming text response with X-Conversation-Id header
 */
export async function POST(req: Request) {
  const { messages, conversationId: incomingConversationId } = await req.json();

  // Get authenticated user
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // --- Conversation persistence ---
  let conversationId: string = incomingConversationId;
  let isNewConversation = false;

  // Get the latest user message
  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === 'user')
    .pop();

  if (!conversationId) {
    // Create a new conversation — title from first user message
    const title = lastUserMessage
      ? generateTitle(lastUserMessage.content)
      : null;
    const conversation = await createConversation(user.id, title || undefined);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    conversationId = conversation.id;
    isNewConversation = true;
  } else {
    // Verify the user owns this conversation
    const existing = await getConversation(conversationId, user.id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // If conversation had no title (edge case), set it now
    if (!existing.title && lastUserMessage) {
      updateConversationTitle(conversationId, generateTitle(lastUserMessage.content));
    }
  }

  // Save the user message to the database
  if (lastUserMessage) {
    await saveMessage(conversationId, 'user', lastUserMessage.content);
  }

  // Fetch user context for personalized prompt engineering
  const userContext = await getUserContext(user.id);
  
  // Build personalized system prompt with adaptive behavior rules
  const personalizedPrompt = userContext
    ? buildPersonalizedSystemPrompt(FLOATGREENS_SYSTEM_PROMPT, userContext)
    : FLOATGREENS_SYSTEM_PROMPT;

  // Assemble final prompt: SOUL (immutable identity) → System + Personalization + Context
  const systemPrompt = assembleSoulPrompt(personalizedPrompt);

  // Smart model routing — picks the cheapest model capable of handling this message
  const { model, tier, modelId } = selectModel(messages);
  console.log(`[chat] user=${user.id} conversation=${conversationId} tier=${tier} model=${modelId} new=${isNewConversation}`);

  const result = await streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any, // Type assertion for Bedrock model compatibility
    system: systemPrompt,
    messages,
    // TODO: Fix tools for AI SDK v6 - temporarily disabled
    // tools: floatgreensTools,
  });

  // Trigger async memory extraction (fire-and-forget)
  extractMemoriesAsync(messages, user.id);

  // We need to collect the full response text to save it to the DB
  // Use the toTextStreamResponse but also tee the stream to capture the full text
  const response = result.toTextStreamResponse();

  // Save the assistant response asynchronously after the stream is consumed
  // We use the result.text promise which resolves when streaming completes
  // Wrap in Promise.resolve() since result.text is PromiseLike (no .catch)
  Promise.resolve(result.text).then(async (fullText) => {
    await saveMessage(
      conversationId,
      'assistant',
      fullText,
      modelId,
      tier
    );
    
    // Generate and save conversation summary (async, fire-and-forget)
    try {
      const allMessages = await getConversationMessages(conversationId, user.id);
      const summary = generateSummary(allMessages);
      if (summary) {
        await updateConversationSummary(conversationId, summary);
      }
    } catch (err) {
      console.error('[chat] Failed to update conversation summary:', err);
    }
  }).catch((err) => {
    console.error('[chat] Failed to save assistant message:', err);
  });

  // Set conversation ID header so the client knows which conversation this belongs to
  response.headers.set('X-Conversation-Id', conversationId);

  // In development, include model information in custom headers
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Model-Id', modelId);
    response.headers.set('X-Model-Tier', tier);
  }

  return response;
}
