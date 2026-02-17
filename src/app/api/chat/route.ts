import { streamText } from 'ai';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { selectModel } from '@/lib/ai/model-router';
import { createClient } from '@/lib/supabase/server';
// import { floatgreensTools } from '@/lib/ai/tools';

export const runtime = 'edge';

/**
 * Chat API Route - Handles streaming AI responses
 * - Authenticates user
 * - Selects optimal AI model based on complexity
 * - Streams response back to client
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

  // TODO: Fetch user's spatial context (balcony data, plant inventory)
  // and inject into system prompt for context-aware responses

  // Smart model routing — picks the cheapest model capable of handling this message
  const { model, tier, modelId } = selectModel(messages);
  console.log(`[chat] user=${user.id} tier=${tier} model=${modelId}`);

  const result = await streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any, // Type assertion for Bedrock model compatibility
    system: FLOATGREENS_SYSTEM_PROMPT,
    messages,
    // TODO: Fix tools for AI SDK v6 - temporarily disabled
    // tools: floatgreensTools,
  });

  const response = result.toTextStreamResponse();

  // In development, include model information in custom headers
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Model-Id', modelId);
    response.headers.set('X-Model-Tier', tier);
  }

  return response;
}
