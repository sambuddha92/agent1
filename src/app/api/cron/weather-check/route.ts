import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getWeatherForecast, getWeatherAlerts } from '@/lib/weather';
import { sendWeatherAlert } from '@/lib/email';

export const runtime = 'edge';

/**
 * Vercel Cron endpoint — runs every 6 hours
 * Checks weather for all active users and sends alerts
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Fetch all users with their cities
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, city')
      .not('city', 'is', null);

    if (error) throw error;

    let alertsSent = 0;

    for (const user of users || []) {
      try {
        // Get weather forecast for user's city
        const forecast = await getWeatherForecast(user.city, 3);
        const alerts = getWeatherAlerts(forecast);

        if (alerts.length > 0) {
          // Log agent action
          await supabase.from('agent_actions').insert({
            user_id: user.id,
            action_type: 'weather_alert',
            payload: { alerts, forecast },
            status: 'delivered',
            executed_at: new Date().toISOString(),
          });

          // Send email notification
          if (user.email) {
            await sendWeatherAlert(
              user.email,
              user.full_name || 'there',
              alerts
            );
            alertsSent++;
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // Continue with next user
      }
    }

    return NextResponse.json({
      success: true,
      usersChecked: users?.length || 0,
      alertsSent,
    });
  } catch (error) {
    console.error('Weather check cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
