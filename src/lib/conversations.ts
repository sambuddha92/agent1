/**
 * Conversation History Data Layer
 * 
 * Server-side functions for managing chat conversations and messages.
 * Uses Supabase service client to bypass RLS for API route operations.
 */

import { createServiceClient } from '@/lib/supabase/server';
import type { Conversation, ChatMessage, MessageRole } from '@/types';

// ============================================
// Constants
// ============================================

const MAX_TITLE_LENGTH = 80;
const MAX_SUMMARY_LENGTH = 120;
const DEFAULT_CONVERSATIONS_LIMIT = 50;

// ============================================
// Conversation Operations
// ============================================

/**
 * Get all conversations for a user, ordered by most recently updated
 */
export async function getConversations(
  userId: string,
  limit = DEFAULT_CONVERSATIONS_LIMIT
): Promise<Conversation[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[conversations] Failed to fetch conversations:', error);
    return [];
  }

  return data as Conversation[];
}

/**
 * Get a single conversation by ID (with ownership check)
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[conversations] Failed to fetch conversation:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * Create a new conversation for a user
 * Title is auto-generated from the first user message
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<Conversation | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[conversations] Failed to create conversation:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * Update the title of a conversation
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const supabase = createServiceClient();

  const truncatedTitle =
    title.length > MAX_TITLE_LENGTH
      ? title.substring(0, MAX_TITLE_LENGTH) + '…'
      : title;

  const { error } = await supabase
    .from('conversations')
    .update({ title: truncatedTitle })
    .eq('id', conversationId);

  if (error) {
    console.error('[conversations] Failed to update title:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation and all its messages (cascade)
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[conversations] Failed to delete conversation:', error);
    return false;
  }

  return true;
}

// ============================================
// Message Operations
// ============================================

/**
 * Get all messages for a conversation, ordered chronologically
 * Uses a single query with ownership check via join to reduce round trips
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const supabase = createServiceClient();

  // Single query: verify ownership AND fetch messages in one round trip
  // Uses inner join to ensure conversation belongs to user
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      conversations!inner(id, user_id)
    `)
    .eq('conversation_id', conversationId)
    .eq('conversations.user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[conversations] Failed to fetch messages:', error);
    return [];
  }

  // Strip the joined conversation data from each message
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (data || []).map(({ conversations, ...msg }) => msg as ChatMessage);
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  modelId?: string,
  tier?: string,
  imageUrl?: string
): Promise<ChatMessage | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      model_id: modelId || null,
      tier: tier || null,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[conversations] Failed to save message:', error);
    return null;
  }

  return data as ChatMessage;
}

/**
 * Generate a conversation title from the first user message
 */
export function generateTitle(firstMessage: string): string {
  // Take the first line or first MAX_TITLE_LENGTH characters
  const firstLine = firstMessage.split('\n')[0].trim();
  if (firstLine.length <= MAX_TITLE_LENGTH) {
    return firstLine;
  }
  // Cut at last word boundary before limit
  const truncated = firstLine.substring(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '…';
}

/**
 * Generate a conversation summary from recent messages
 * Takes first few user messages and assistant responses to create context
 */
export function generateSummary(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';
  
  // Take up to first 4 messages (2 exchanges) for summary
  const recentMessages = messages.slice(0, 4);
  const parts: string[] = [];
  
  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      // Take first sentence or 50 chars of each message
      const content = msg.content.split(/[.!?]/)[0].trim();
      const preview = content.substring(0, 50);
      parts.push(preview);
    }
  }
  
  let summary = parts.join(' • ');
  
  // Truncate to MAX_SUMMARY_LENGTH
  if (summary.length > MAX_SUMMARY_LENGTH) {
    const truncated = summary.substring(0, MAX_SUMMARY_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    summary = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '…';
  }
  
  return summary;
}

/**
 * Update conversation summary
 */
export async function updateConversationSummary(
  conversationId: string,
  summary: string
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId);

  if (error) {
    console.error('[conversations] Failed to update summary:', error);
    return false;
  }

  return true;
}

/**
 * Update the model preference for a conversation.
 * Called when user changes the ModelSelector for an existing chat.
 */
export async function updateConversationModelPreference(
  conversationId: string,
  userId: string,
  modelPreference: string
): Promise<boolean> {
  const supabase = createServiceClient();

  // Validate that preference is one of the allowed values
  const validPreferences = ['auto', 'fast', 'balanced', 'best'];
  if (!validPreferences.includes(modelPreference)) {
    console.warn(
      `[conversations] Invalid model preference: "${modelPreference}", defaulting to "auto"`
    );
    modelPreference = 'auto';
  }

  const { error } = await supabase
    .from('conversations')
    .update({ model_preference: modelPreference })
    .eq('id', conversationId)
    .eq('user_id', userId); // Ownership check

  if (error) {
    console.error('[conversations] Failed to update model preference:', error);
    return false;
  }

  return true;
}

/**
 * Get a single conversation with its model_preference field.
 * Used by the PATCH/GET handler to return full conversation data to the client.
 */
export async function getConversationWithPreference(
  conversationId: string,
  userId: string
): Promise<(Conversation & { model_preference?: string }) | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[conversations] Failed to fetch conversation with preference:', error);
    return null;
  }

  return data as Conversation & { model_preference?: string };
}
