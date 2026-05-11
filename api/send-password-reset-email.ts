/**
 * POST /api/send-password-reset-email
 * 
 * Vercel Serverless Function that:
 * 1. Accepts { email, name? } in the request body
 * 2. Uses Firebase Admin SDK to generate a password reset link
 * 3. Sends the branded reset email via Resend
 * 
 * Reuses the same helpers as the verification email endpoint:
 * - api/_lib/firebaseAdmin.ts
 * - api/_lib/resendClient.ts
 * - api/_lib/emailTemplate.ts
 * 
 * Environment variables required:
 * - FIREBASE_SERVICE_ACCOUNT (JSON string)
 * - RESEND_API_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth } from './_lib/firebaseAdmin';
import { getResendClient } from './_lib/resendClient';
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from './_lib/emailTemplate';

// ─── Configuration ──────────────────────────────────────────────────────────────
// Change this sender when you have a verified domain in Resend.
const EMAIL_FROM = 'Nada Gallery <onboarding@resend.dev>';
const EMAIL_SUBJECT = 'Reset your password for Nada Gallery';

// ─── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers (adjust origin for production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { email, name } = req.body || {};

  // ── Validate input ──────────────────────────────────────────────────────────
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    // ── Generate Firebase password reset link ───────────────────────────────
    const adminAuth = getAdminAuth();
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    console.log(`[send-password-reset-email] Generated reset link for: ${email}`);

    // ── Send email via Resend ───────────────────────────────────────────────
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: EMAIL_SUBJECT,
      html: buildPasswordResetEmailHtml({
        resetLink,
        userName: name || undefined,
      }),
      text: buildPasswordResetEmailText({
        resetLink,
        userName: name || undefined,
      }),
    });

    if (sendError) {
      console.error('[send-password-reset-email] Resend API error:', sendError);
      return res.status(502).json({
        error: 'Failed to send password reset email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? sendError : undefined,
      });
    }

    console.log(`[send-password-reset-email] Email sent successfully to: ${email}`);
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('[send-password-reset-email] Error:', err);

    // Provide helpful error messages based on known error types
    if (err.message?.includes('FIREBASE_SERVICE_ACCOUNT')) {
      return res.status(500).json({
        error: 'Server configuration error: Firebase Admin is not configured.',
      });
    }
    if (err.message?.includes('RESEND_API_KEY')) {
      return res.status(500).json({
        error: 'Server configuration error: Email service is not configured.',
      });
    }
    if (err.code === 'auth/user-not-found') {
      // For security, don't reveal if an email exists or not.
      // Still return 200 so attackers can't enumerate emails.
      console.log(`[send-password-reset-email] User not found: ${email} — returning 200 for security.`);
      return res.status(200).json({ success: true });
    }
    if (err.code === 'auth/invalid-email') {
      return res.status(400).json({
        error: 'The email address is invalid.',
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
