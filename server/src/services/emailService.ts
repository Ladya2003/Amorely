import { Resend } from 'resend';
import { getPrimaryClientBaseUrl } from '../utils/clientBaseUrl';
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailSubject,
  buildPasswordResetEmailText,
} from './emailTemplates/passwordResetEmail';
import {
  buildVerificationEmailHtml,
  buildVerificationEmailSubject,
  buildVerificationEmailText,
} from './emailTemplates/verificationEmail';

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Resend accepts `email@domain` or `Name <email@domain>`.
 * Normalize common mistake: `Amorely noreply@domain` → `Amorely <noreply@domain>`.
 */
const normalizeFromAddress = (raw: string): string => {
  const value = raw.trim();
  if (!value) {
    return 'Amorely <onboarding@resend.dev>';
  }
  if (value.includes('<') && value.includes('>')) {
    return value;
  }
  if (/^[^\s<>]+@[^\s<>]+$/.test(value)) {
    return value;
  }
  const match = value.match(/^(.+?)\s+([^\s<>]+@[^\s<>]+)$/);
  if (match) {
    return `${match[1].trim()} <${match[2]}>`;
  }
  return value;
};

const getFromAddress = (): string =>
  normalizeFromAddress(process.env.EMAIL_FROM?.trim() || 'Amorely <onboarding@resend.dev>');

export const buildVerificationUrl = (token: string): string => {
  const base = getPrimaryClientBaseUrl();
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
};

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = buildVerificationUrl(token);
  const resend = getResendClient();

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set. Verification link:', verifyUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: buildVerificationEmailSubject(),
    html: buildVerificationEmailHtml(verifyUrl),
    text: buildVerificationEmailText(verifyUrl),
  });

  if (error) {
    console.error('[email] Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export const buildPasswordResetUrl = (token: string): string => {
  const base = getPrimaryClientBaseUrl();
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = buildPasswordResetUrl(token);
  const resend = getResendClient();

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set. Password reset link:', resetUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: buildPasswordResetEmailSubject(),
    html: buildPasswordResetEmailHtml(resetUrl),
    text: buildPasswordResetEmailText(resetUrl),
  });

  if (error) {
    // Log the link so local/dev can still complete the flow when Resend rejects the send
    // (e.g. free tier only delivers to the Resend account email).
    console.error('[email] Failed to send password reset email:', error, 'Reset link:', resetUrl);
    throw new Error('Failed to send password reset email');
  }
}
