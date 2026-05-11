/**
 * POST /api/send-verification-email
 * 
 * Vercel Serverless Function that:
 * 1. Accepts { email, name? } in the request body
 * 2. Uses Firebase Admin SDK to generate an email verification link
 * 3. Sends the branded verification email via Resend
 * 
 * Environment variables required:
 * - FIREBASE_SERVICE_ACCOUNT (JSON string)
 * - RESEND_API_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminAuth } from './_lib/firebaseAdmin';
import { getResendClient } from './_lib/resendClient';
import {
  buildVerificationEmailHtml,
  buildVerificationEmailText,
} from './_lib/emailTemplate';

// ─── Configuration ──────────────────────────────────────────────────────────────
// Change this sender when you have a verified domain in Resend.
const EMAIL_FROM = 'Nada Gallery <onboarding@resend.dev>';
const EMAIL_SUBJECT = 'Verify your email for Nada Gallery';

// Action code settings for the verification link (optional).
// To use a custom continue URL after verification, add your domain to:
//   Firebase Console > Authentication > Settings > Authorized domains
// Then uncomment and update:
// const ACTION_CODE_SETTINGS = {
//   url: 'https://your-domain.com',
//   handleCodeInApp: false,
// };

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
    // ── Generate Firebase verification link ─────────────────────────────────
    // Uses Firebase's default authorized domain (no actionCodeSettings needed).
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUserByEmail(email);

    if (userRecord.emailVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true });
    }

    const verificationLink = await adminAuth.generateEmailVerificationLink(
      email
    );

    console.log(`[send-verification-email] Generated verification link for: ${email}`);

    // ── Send email via Resend ───────────────────────────────────────────────
    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: EMAIL_SUBJECT,
      html: buildVerificationEmailHtml({
        verificationLink,
        userName: name || undefined,
      }),
      text: buildVerificationEmailText({
        verificationLink,
        userName: name || undefined,
      }),
    });

    if (sendError) {
      console.error('[send-verification-email] Resend API error:', sendError);
      return res.status(502).json({
        error: 'Failed to send verification email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? sendError : undefined,
      });
    }

    console.log(`[send-verification-email] Email sent successfully to: ${email}`);
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('[send-verification-email] Error:', err);

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
      return res.status(404).json({
        error: 'No account found with this email address.',
      });
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
