/**
 * Resend email client — backend only.
 * Uses RESEND_API_KEY environment variable.
 */
import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      '[Resend] RESEND_API_KEY environment variable is missing. ' +
      'Please set it in your .env or Vercel environment variables.'
    );
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}
