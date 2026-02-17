/**
 * User Context Memory Service
 * 
 * Provides functions to fetch, build, and inject user context into AI conversations.
 * Designed for zero-impact integration with existing chat flows.
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import type {
  UserContext,
  UserContextMemory,
  Balcony,
  Plant,
  HealthSnapshot,
  User,
} from '@/types';

// ============================================
// Context Retrieval
// ============================================

/**
 * Fetch comprehensive user context for AI personalization
 * Includes: user profile, balconies, plants, health snapshots, and accumulated memories
 * 
 * @param userId - User ID to fetch context for
 * @returns Complete user context or null if user not found
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
  const supabase = createClient();

  try {
    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[memory] Failed to fetch user:', userError);
      return null;
    }

    // Fetch balconies
    const { data: balconies, error: balconiesError } = await supabase
      .from('balconies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (balconiesError) {
      console.error('[memory] Failed to fetch balconies:', balconiesError);
    }

    // Fetch active plants with their balcony info
    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select('*')
      .in('balcony_id', (balconies || []).map(b => b.id))
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (plantsError) {
      console.error('[memory] Failed to fetch plants:', plantsError);
    }

    // Fetch recent health snapshots (last 30 days, max 20 entries)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const plantIds = (plants || []).map(p => p.id);
    let recentHealthSnapshots: HealthSnapshot[] = [];

    if (plantIds.length > 0) {
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('health_snapshots')
        .select('*')
        .in('plant_id', plantIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (snapshotsError) {
        console.error('[memory] Failed to fetch health snapshots:', snapshotsError);
      } else {
        recentHealthSnapshots = snapshots || [];
      }
    }

    // Fetch accumulated memories (active only)
    const { data: memories, error: memoriesError } = await supabase
      .from('user_active_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (memoriesError) {
      console.error('[memory] Failed to fetch memories:', memoriesError);
    }

    // Build context object
    const context: UserContext = {
      user: user as User,
      balconies: (balconies || []) as Balcony[],
      plants: (plants || []) as Plant[],
      recentHealthSnapshots: recentHealthSnapshots,
      memories: (memories || []) as UserContextMemory[],
      summary: '', // Will be built below
    };

    // Generate summary
    context.summary = buildContextSummary(context);

    return context;
  } catch (error) {
    console.error('[memory] Error fetching user context:', error);
    return null;
  }
}

// ============================================
// Context Summary Builder
// ============================================

/**
 * Build a concise context summary for AI injection
 * Prioritizes actionable info, omits details AI doesn't need
 * 
 * @param context - User context object
 * @returns Formatted context summary string
 */
export function buildContextSummary(context: UserContext): string {
  const lines: string[] = [];

  // User location (helps with weather/plant recs)
  if (context.user?.city) {
    lines.push(`📍 ${context.user.city}`);
  }

  // Quick balcony facts (MOST important - drives all advice)
  if (context.balconies.length > 0) {
    context.balconies.slice(0, 2).forEach(b => {
      const facts = [];
      if (b.orientation) facts.push(b.orientation);
      if (b.sun_hours_estimated) facts.push(`${b.sun_hours_estimated}h sun`);
      if (b.wind_exposure) facts.push(b.wind_exposure);
      if (facts.length) lines.push(`🪴 ${b.name}: ${facts.join(', ')}`);
    });
  }

  // Just plant names + status (don't need all details)
  if (context.plants.length > 0) {
    const plantNames = context.plants
      .slice(0, 5)
      .map(p => p.nickname || p.species)
      .join(', ');
    lines.push(`🌱 Plants: ${plantNames}${context.plants.length > 5 ? ' +more' : ''}`);
  }

  // Only flag serious issues
  if (context.recentHealthSnapshots.length > 0) {
    const critical = context.recentHealthSnapshots.filter(s => s.health_score && s.health_score < 50);
    if (critical.length > 0) {
      lines.push(`⚠️ Health alerts: ${critical.length} plant(s) in trouble`);
    }
  }

  // User preferences/goals (drives style of advice)
  if (context.memories.length > 0) {
    const key = context.memories.slice(0, 2).map(m => m.memory_value).join('; ');
    if (key) lines.push(`💭 ${key}`);
  }

  if (lines.length === 0) {
    return 'New user - no context yet';
  }

  return lines.join('\n');
}


// ============================================
// Memory Accumulation
// ============================================

/**
 * Add a new memory for a user
 * Uses upsert logic - will update existing memory if key exists
 * 
 * @param userId - User ID
 * @param memoryType - Type of memory
 * @param memoryKey - Unique key for this memory
 * @param memoryValue - Human-readable value
 * @param options - Additional options (confidence, source, etc.)
 * @returns Success boolean
 */
export async function addUserMemory(
  userId: string,
  memoryType: string,
  memoryKey: string,
  memoryValue: string,
  options?: {
    confidence?: number;
    source?: string;
    conversationId?: string;
    expiresAt?: string;
  }
): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    // Defensive check: Ensure user profile exists before saving memory
    // This prevents foreign key constraint violations
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userExists) {
      console.warn(`[memory] User profile not found for ${userId}, skipping memory save`);
      return false;
    }

    const { error } = await supabase.rpc('upsert_user_memory', {
      p_user_id: userId,
      p_memory_type: memoryType,
      p_memory_key: memoryKey,
      p_memory_value: memoryValue,
      p_confidence: options?.confidence ?? 1.0,
      p_source: options?.source ?? 'conversation',
      p_conversation_id: options?.conversationId ?? null,
      p_expires_at: options?.expiresAt ?? null,
    });

    if (error) {
      console.error('[memory] Failed to add memory:', error);
      return false;
    }

    console.log(`[memory] Added: ${memoryType}/${memoryKey} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[memory] Error adding memory:', error);
    return false;
  }
}

/**
 * Batch add multiple memories at once
 * Useful for extracting multiple facts from a single conversation
 * 
 * @param userId - User ID
 * @param memories - Array of memory entries to add
 * @returns Number of successfully added memories
 */
export async function addUserMemories(
  userId: string,
  memories: Array<{
    memoryType: string;
    memoryKey: string;
    memoryValue: string;
    confidence?: number;
    source?: string;
  }>
): Promise<number> {
  let successCount = 0;

  for (const memory of memories) {
    const success = await addUserMemory(
      userId,
      memory.memoryType,
      memory.memoryKey,
      memory.memoryValue,
      {
        confidence: memory.confidence,
        source: memory.source,
      }
    );
    if (success) successCount++;
  }

  return successCount;
}

// ============================================
// Context Injection Helper
// ============================================

/**
 * Build enhanced system prompt with user context
 * Appends context summary to base system prompt
 * 
 * @param basePrompt - Base system prompt
 * @param userId - User ID to fetch context for
 * @returns Enhanced system prompt with context
 */
export async function buildContextualSystemPrompt(
  basePrompt: string,
  userId: string
): Promise<string> {
  const context = await getUserContext(userId);

  if (!context || context.summary === '') {
    // No context available - return base prompt
    return basePrompt;
  }

  // Inject context summary into system prompt
  const contextBlock = `

═══════════════════════════════════════
📍 USER'S SPATIAL CONTEXT & MEMORY
═══════════════════════════════════════

${context.summary}

═══════════════════════════════════════
IMPORTANT: Use this context to provide highly personalized, specific advice. Reference their actual plants, their specific balcony setup, and what you've learned about them. Don't be generic - be contextual!
`;

  return basePrompt + contextBlock;
}
