/**
 * POST /api/models/upgrade-interest
 *
 * Logs when a free user clicks "Upgrade" on a locked model tier.
 * Inserts a record into model_upgrade_interest table.
 *
 * Request body: { model_tier: 'best' | 'T3' }
 *
 * Authentication required.
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
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

    // Parse body
    const body = await request.json().catch(() => ({}));
    const modelTier = body?.model_tier as string;

    if (!modelTier || !['best', 'T3'].includes(modelTier)) {
      return NextResponse.json(
        { error: 'Invalid model_tier. Must be "best" or "T3".' },
        { status: 400 },
      );
    }

    // Insert upgrade interest record using service client (bypasses RLS for server-side insert)
    const serviceClient = createServiceClient();
    const { error: insertError } = await serviceClient
      .from('model_upgrade_interest')
      .insert({
        user_id: user.id,
        model_tier: modelTier,
        // timestamp defaults to now() in the database
      });

    if (insertError) {
      console.error('[POST /api/models/upgrade-interest] Insert error:', insertError);
      // Non-blocking: don't fail the UX for an analytics write error
      return NextResponse.json({ success: true, warning: 'Logged with errors' });
    }

    console.log(
      `[POST /api/models/upgrade-interest] Logged upgrade interest: user=${user.id}, tier=${modelTier}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/models/upgrade-interest] Error:', error);
    // Non-blocking: analytics failure must not break UX
    return NextResponse.json({ success: true, warning: 'Failed silently' });
  }
}
