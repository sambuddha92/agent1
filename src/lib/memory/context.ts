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
 * Build a human-readable summary of user context for AI injection
 * Converts structured data into natural language the AI can understand
 * 
 * @param context - User context object
 * @returns Formatted context summary string
 */
export function buildContextSummary(context: UserContext): string {
  const sections: string[] = [];

  // User profile
  if (context.user) {
    const userInfo: string[] = [];
    if (context.user.full_name) userInfo.push(`Name: ${context.user.full_name}`);
    if (context.user.city) userInfo.push(`Location: ${context.user.city}`);
    if (userInfo.length > 0) {
      sections.push(`USER PROFILE:\n${userInfo.join(', ')}`);
    }
  }

  // Balconies/Growing spaces
  if (context.balconies.length > 0) {
    const balconyDescriptions = context.balconies.map(b => {
      const details: string[] = [b.name];
      if (b.orientation) details.push(`${b.orientation}-facing`);
      if (b.dimensions_m2) details.push(`${b.dimensions_m2}m²`);
      if (b.floor_level !== null && b.floor_level !== undefined) {
        details.push(`floor ${b.floor_level}`);
      }
      if (b.sun_hours_estimated) details.push(`~${b.sun_hours_estimated}h sun/day`);
      if (b.wind_exposure) details.push(`${b.wind_exposure} wind`);
      if (b.climate_zone) details.push(`${b.climate_zone} climate`);
      return `- ${details.join(', ')}`;
    });
    sections.push(`GROWING SPACES:\n${balconyDescriptions.join('\n')}`);
  }

  // Active plants
  if (context.plants.length > 0) {
    const plantList = context.plants.map(p => {
      const parts: string[] = [];
      if (p.nickname) parts.push(`"${p.nickname}"`);
      parts.push(p.species);
      if (p.variety) parts.push(`(${p.variety})`);
      if (p.container_size_liters) parts.push(`${p.container_size_liters}L container`);
      if (p.position_description) parts.push(p.position_description);
      return `- ${parts.join(' ')}`;
    });
    sections.push(`ACTIVE PLANTS (${context.plants.length}):\n${plantList.join('\n')}`);
  }

  // Recent health observations
  if (context.recentHealthSnapshots.length > 0) {
    const healthNotes: string[] = [];
    const issuesFound = context.recentHealthSnapshots
      .filter(s => s.health_score && s.health_score < 70)
      .slice(0, 3);
    
    if (issuesFound.length > 0) {
      healthNotes.push('Recent health concerns detected on some plants');
    }
    
    if (healthNotes.length > 0) {
      sections.push(`RECENT OBSERVATIONS:\n${healthNotes.join('\n')}`);
    }
  }

  // Accumulated memories (grouped by type)
  if (context.memories.length > 0) {
    const memoryGroups: Record<string, string[]> = {};
    
    context.memories.forEach(m => {
      if (!memoryGroups[m.memory_type]) {
        memoryGroups[m.memory_type] = [];
      }
      memoryGroups[m.memory_type].push(`- ${m.memory_value}`);
    });

    const memoryLines: string[] = [];
    if (memoryGroups.preference) {
      memoryLines.push('Preferences:', ...memoryGroups.preference);
    }
    if (memoryGroups.goal) {
      memoryLines.push('Goals:', ...memoryGroups.goal);
    }
    if (memoryGroups.constraint) {
      memoryLines.push('Constraints:', ...memoryGroups.constraint);
    }
    if (memoryGroups.context) {
      memoryLines.push('Context:', ...memoryGroups.context);
    }
    if (memoryGroups.observation) {
      memoryLines.push('Patterns:', ...memoryGroups.observation);
    }

    if (memoryLines.length > 0) {
      sections.push(`LEARNED ABOUT USER:\n${memoryLines.join('\n')}`);
    }
  }

  // If no context available
  if (sections.length === 0) {
    return 'No spatial context or plant data available yet. This appears to be a new user.';
  }

  return sections.join('\n\n');
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
