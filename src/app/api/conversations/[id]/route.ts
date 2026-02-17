import { createClient } from '@/lib/supabase/server';
import {
  deleteConversation,
  getConversationMessages,
  updateConversationModelPreference,
  getConversationWithPreference,
} from '@/lib/conversations';

/**
 * GET /api/conversations/[id]
 * Returns all messages for a specific conversation.
 *
 * If the query param ?meta=1 is passed, returns the conversation metadata
 * (including model_preference) instead of messages.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  // If ?meta=1 is passed, return conversation metadata (model_preference etc.)
  const url = new URL(req.url);
  if (url.searchParams.get('meta') === '1') {
    const conversation = await getConversationWithPreference(params.id, user.id);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(conversation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = await getConversationMessages(params.id, user.id);

  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PATCH /api/conversations/[id]
 * Updates mutable fields of a conversation.
 * Currently supports: model_preference
 *
 * Request body: { model_preference?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle model_preference update
  if ('model_preference' in body) {
    const preference = body.model_preference as string;
    const success = await updateConversationModelPreference(
      params.id,
      user.id,
      preference,
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to update model preference' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, model_preference: preference }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ error: 'No updatable fields provided' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/conversations/[id]
 * Deletes a conversation and all its messages
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  const success = await deleteConversation(params.id, user.id);

  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
