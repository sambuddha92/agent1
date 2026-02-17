/**
 * GET /api/models/list
 *
 * Returns all available Bedrock foundation models with tier classification.
 * Uses the model-discovery service with 6-hour in-memory cache.
 *
 * Response shape:
 * {
 *   models: DiscoveredModel[],
 *   cachedAt: string (ISO),
 *   tierSummary: { T1: number, T2: number, T3: number, unknown: number }
 * }
 *
 * Authentication required.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDiscoveredModels, getModelTierSummary } from '@/lib/ai/model-discovery';

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

    // Fetch models (cached for 6 hours)
    const [models, tierSummary] = await Promise.all([
      getDiscoveredModels(),
      getModelTierSummary(),
    ]);

    return NextResponse.json(
      {
        models,
        tierSummary,
        cachedAt: new Date().toISOString(),
        count: models.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=21600', // 6 hours
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
