import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_dev');

/**
 * Base HTML Template wrapper to ensure emails look professional and consistent
 */
const BaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
    .container { max-w-[600px] margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #2271b1; }
    .content { font-size: 16px; color: #3c434a; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2271b1; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Social Auto</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Social Auto. All rights reserved.<br>
      You are receiving this email because you opted in via our website.
    </div>
  </div>
</body>
</html>
`;

/**
 * Email Templates
 */
export const EmailTemplates = {
  // 1. Verification Email Template
  Verification: (verificationLink: string, userName: string = 'User') => BaseTemplate(`
    <h2>Welcome to Social Auto, ${userName}!</h2>
    <p>We're excited to have you on board. Please verify your email address to get started and unlock all features.</p>
    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${verificationLink}">${verificationLink}</a></p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `),

  // 2. Password Reset Template
  PasswordReset: (resetLink: string, userName: string = 'User') => BaseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to reset the password for your Social Auto account. Click the button below to choose a new password.</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
  `),

  // 3. General Notification Template
  Notification: (title: string, message: string, actionUrl?: string, actionText?: string) => BaseTemplate(`
    <h2>${title}</h2>
    <p>${message}</p>
    ${actionUrl && actionText ? `
      <div style="text-align: center;">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
    ` : ''}
  `),
};

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'Social Auto Notifications <onboarding@resend.dev>', // Use verified domain in prod
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}
