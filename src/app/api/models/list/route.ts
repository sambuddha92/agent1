/**
 * GET /api/models/list
 *
 * Returns available AI models based on user tier.
 * Uses the new AI Gateway architecture.
 *
 * Response shape:
 * {
 *   models: ModelInfo[],
 *   cachedAt: string (ISO),
 *   tierSummary: { guest: number, free: number, paid: number }
 * }
 *
 * Authentication required.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { getAvailableModels } from '@/lib/ai/router/modelRouter';
import { resolveUserTier } from '@/lib/ai/router/capabilityResolver';
import { getProviderStatus } from '@/lib/ai/registry/providerRegistry';

export async function GET() {
  try {
    // Auth check
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user tier
    const userTier = resolveUserTier(user.user_metadata as Record<string, unknown> | null);
    
    // Get available models for this user tier
    const availableModels = getAvailableModels(userTier);

    // Format models for response
    const formattedModels = availableModels.map((model) => ({
      id: model.id,
      provider: model.provider,
      type: model.type,
      quality: model.quality,
      cost: model.cost,
      speed: model.speed,
      description: model.description,
    }));

    // Count by provider
    const providerCounts = formattedModels.reduce((acc, model) => {
      acc[model.provider] = (acc[model.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Summary by user tier access
    const tierSummary = {
      guest: getAvailableModels('guest').length,
      free: getAvailableModels('free').length,
      paid: getAvailableModels('paid').length,
    };

    // Get provider status
    const providerStatus = getProviderStatus();

    return NextResponse.json(
      {
        models: formattedModels,
        tierSummary,
        providerCounts,
        userTier,
        providerStatus,
        cachedAt: new Date().toISOString(),
        count: formattedModels.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=21600',
        },
      },
    );
  } catch (error) {
    console.error('[GET /api/models/list] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 },
    );
  }
}
