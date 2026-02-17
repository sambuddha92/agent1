import { streamText } from 'ai';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { selectModel } from '@/lib/ai/model-router';
import { createClient } from '@/lib/supabase/server';
import { buildContextualSystemPrompt, extractMemoriesAsync } from '@/lib/memory';
// import { floatgreensTools } from '@/lib/ai/tools';

export const runtime = 'edge';

/**
 * Chat API Route - Handles streaming AI responses
 * - Authenticates user
 * - Fetches and injects user context for personalization
 * - Selects optimal AI model based on complexity
 * - Streams response back to client
 * - Asynchronously extracts memories from conversation
 * 
 * @param req - Request with messages array
 * @returns Streaming text response
 */
export async function POST(req: Request) {
  const { messages } = await req.json();

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

  // Build contextual system prompt with user's spatial context and memories
  // Falls back to base prompt if context unavailable (new users)
  const systemPrompt = await buildContextualSystemPrompt(
    FLOATGREENS_SYSTEM_PROMPT,
    user.id
  );

  // Smart model routing — picks the cheapest model capable of handling this message
  const { model, tier, modelId } = selectModel(messages);
  console.log(`[chat] user=${user.id} tier=${tier} model=${modelId}`);

  const result = await streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any, // Type assertion for Bedrock model compatibility
    system: systemPrompt,
    messages,
    // TODO: Fix tools for AI SDK v6 - temporarily disabled
    // tools: floatgreensTools,
  });

  // Trigger async memory extraction (fire-and-forget)
  // This doesn't block the response stream
  extractMemoriesAsync(messages, user.id);

  const response = result.toTextStreamResponse();

  // In development, include model information in custom headers
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Model-Id', modelId);
    response.headers.set('X-Model-Tier', tier);
  }

  return response;
}
