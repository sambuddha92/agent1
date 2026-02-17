/**
 * User Context Memory System
 * 
 * Export all memory-related functionality from a single module.
 * This is the main entry point for the memory system.
 */

export {
  getUserContext,
  buildContextSummary,
  addUserMemory,
  addUserMemories,
  buildContextualSystemPrompt,
} from './context';

export {
  extractMemoriesFromConversation,
  extractMemoriesAsync,
  rememberExplicitStatement,
} from './extraction';

export type {
  UserContext,
  UserContextMemory,
  MemoryType,
  MemorySource,
} from '@/types';
