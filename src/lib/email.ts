// ============================================
// Resend Email Integration
// ============================================

import { Resend } from 'resend';
import { EMAIL_CONFIG } from './constants';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend
 * 
 * @param options - Email parameters (to, subject, html)
 * @returns Resend API response data or null if API key not configured
 * @throws Error if email sending fails
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send a weather alert email to a user
 * 
 * @param to - Recipient email address
 * @param userName - User's display name
 * @param alerts - Array of alert messages
 * @returns Resend API response data
 */
export async function sendWeatherAlert(
  to: string,
  userName: string,
  alerts: string[]
) {
  const alertsHtml = alerts
    .map((alert) => `<li style="margin-bottom: 8px;">${alert}</li>`)
    .join('');

  return sendEmail({
    to,
    subject: EMAIL_CONFIG.WEATHER_ALERT_SUBJECT,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">�️ Weather Alert!</h2>
        <p>Hey ${userName}! 👋</p>
        <p>Just spotted some weather shenanigans that might mess with your green babies:</p>
        <ul style="line-height: 1.8;">${alertsHtml}</ul>
        <p>Pop open FloatGreens for the full scoop on how to keep each of your plants happy through this! 🌿</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Stay leafy,<br/>
          Your FloatGreens buddy 🌱
        </p>
      </div>
    `,
  });
}
