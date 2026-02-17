import { createClient } from '@/lib/supabase/server';
import { getConversations } from '@/lib/conversations';

/**
 * GET /api/conversations
 * Returns all conversations for the authenticated user
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const conversations = await getConversations(user.id);

  return new Response(JSON.stringify(conversations), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
