/**
 * FloatGreens Wisdom Service
 * 
 * Provides access to the Botany 101 knowledge base for AI prompt enrichment.
 * 
 * The Botany 101 rules are deterministic plant care truths that should be
 * applied with high confidence. They are not probabilistic patterns but
 * established horticultural principles.
 */

import { BOTANY_101_RULES } from './botany-101';

// ============================================
// Exports
// ============================================

export { BOTANY_101_RULES };

/**
 * Build the wisdom context block for AI prompt injection
 * 
 * Returns the complete Botany 101 knowledge base as a formatted string
 * for inclusion in AI prompts.
 * 
 * @returns Formatted wisdom context string for prompt injection
 */
export function buildWisdomContext(): string {
  return BOTANY_101_RULES;
}
