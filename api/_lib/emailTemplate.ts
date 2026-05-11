/**
 * Branded Nada Gallery verification email template.
 * Elegant floral aesthetic consistent with the Nada Gallery brand.
 */

export interface VerificationEmailParams {
  verificationLink: string;
  userName?: string;
}

/**
 * Generate the branded HTML email for verification.
 */
export function buildVerificationEmailHtml({
  verificationLink,
  userName,
}: VerificationEmailParams): string {
  const greeting = userName ? `Hello, ${userName}` : 'Hello';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email — Nada Gallery</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:56px;height:56px;border:1px solid #333;display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:16px;font-weight:400;color:#ffffff;letter-spacing:2px;font-style:italic;">Nada Gallery</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #222222;padding:48px 40px;">
              
              <!-- Greeting -->
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                ${greeting}
              </p>
              
              <!-- Message -->
              <p style="margin:0 0 32px 0;font-size:15px;color:#888888;line-height:1.7;">
                Thank you for creating your Nada Gallery account. Please verify your email address to activate your account and start exploring our collections.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px 0;">
                    <a href="${verificationLink}" 
                       target="_blank"
                       style="display:inline-block;padding:16px 48px;background-color:#ffffff;color:#0a0a0a;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;border:none;">
                      VERIFY EMAIL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #222222;margin:0 0 24px 0;" />

              <!-- Fallback link -->
              <p style="margin:0 0 8px 0;font-size:12px;color:#555555;text-transform:uppercase;letter-spacing:1px;">
                Or copy this link:
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#888888;word-break:break-all;line-height:1.6;">
                <a href="${verificationLink}" style="color:#888888;text-decoration:underline;">${verificationLink}</a>
              </p>

              <!-- Note -->
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                If you did not create an account with Nada Gallery, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <p style="margin:0 0 4px 0;font-size:11px;color:#333333;letter-spacing:3px;text-transform:uppercase;">
                NADA GALLERY
              </p>
              <p style="margin:0;font-size:11px;color:#333333;">
                Premium Floral Boutique
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Generate plain-text fallback for the verification email.
 */
export function buildVerificationEmailText({
  verificationLink,
  userName,
}: VerificationEmailParams): string {
  const greeting = userName ? `Hello, ${userName}` : 'Hello';
  return [
    `${greeting},`,
    '',
    'Thank you for creating your Nada Gallery account.',
    'Please verify your email address by clicking the link below:',
    '',
    verificationLink,
    '',
    'If you did not create an account with Nada Gallery, you can safely ignore this email.',
    '',
    '— Nada Gallery',
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PASSWORD RESET EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

export interface PasswordResetEmailParams {
  resetLink: string;
  userName?: string;
}

/**
 * Generate the branded HTML email for password reset.
 */
export function buildPasswordResetEmailHtml({
  resetLink,
  userName,
}: PasswordResetEmailParams): string {
  const greeting = userName ? `Hello, ${userName}` : 'Hello';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password — Nada Gallery</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:56px;height:56px;border:1px solid #333;display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:16px;font-weight:400;color:#ffffff;letter-spacing:2px;font-style:italic;">Nada Gallery</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #222222;padding:48px 40px;">
              
              <!-- Greeting -->
              <p style="margin:0 0 8px 0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                ${greeting}
              </p>
              
              <!-- Message -->
              <p style="margin:0 0 32px 0;font-size:15px;color:#888888;line-height:1.7;">
                We received a request to reset the password for your Nada Gallery account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px 0;">
                    <a href="${resetLink}" 
                       target="_blank"
                       style="display:inline-block;padding:16px 48px;background-color:#ffffff;color:#0a0a0a;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;border:none;">
                      RESET PASSWORD
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #222222;margin:0 0 24px 0;" />

              <!-- Fallback link -->
              <p style="margin:0 0 8px 0;font-size:12px;color:#555555;text-transform:uppercase;letter-spacing:1px;">
                Or copy this link:
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#888888;word-break:break-all;line-height:1.6;">
                <a href="${resetLink}" style="color:#888888;text-decoration:underline;">${resetLink}</a>
              </p>

              <!-- Note -->
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <p style="margin:0 0 4px 0;font-size:11px;color:#333333;letter-spacing:3px;text-transform:uppercase;">
                NADA GALLERY
              </p>
              <p style="margin:0;font-size:11px;color:#333333;">
                Premium Floral Boutique
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Generate plain-text fallback for the password reset email.
 */
export function buildPasswordResetEmailText({
  resetLink,
  userName,
}: PasswordResetEmailParams): string {
  const greeting = userName ? `Hello, ${userName}` : 'Hello';
  return [
    `${greeting},`,
    '',
    'We received a request to reset the password for your Nada Gallery account.',
    'Click the link below to choose a new password:',
    '',
    resetLink,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
    'Your password will remain unchanged.',
    '',
    '— Nada Gallery',
  ].join('\n');
}

