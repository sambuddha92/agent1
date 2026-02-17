import { streamText } from 'ai';
// import { floatgreensTools } from '@/lib/ai/tools';
import { FLOATGREENS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { selectModel } from '@/lib/ai/model-router';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get authenticated user
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Fetch user's spatial context (balcony data, plant inventory)
  // and inject into system prompt for context-aware responses

  // Smart model routing — picks the cheapest model capable of handling this message
  const { model, tier } = selectModel(messages);
  console.log(`[chat] user=${user.id} tier=${tier}`);

  const result = await streamText({
    model,
    system: FLOATGREENS_SYSTEM_PROMPT,
    messages,
    // TODO: Fix tools for AI SDK v6 - temporarily disabled
    // tools: floatgreensTools,
  });

  return result.toTextStreamResponse();
}
