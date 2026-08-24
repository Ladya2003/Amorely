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

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale?: string | null
): Promise<void> {
  const verifyUrl = buildVerificationUrl(token);
  const resend = getResendClient();

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set. Verification link:', verifyUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: buildVerificationEmailSubject(locale),
    html: buildVerificationEmailHtml(verifyUrl, locale),
    text: buildVerificationEmailText(verifyUrl, locale),
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

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale?: string | null
): Promise<void> {
  const resetUrl = buildPasswordResetUrl(token);
  const resend = getResendClient();

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set. Password reset link:', resetUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: buildPasswordResetEmailSubject(locale),
    html: buildPasswordResetEmailHtml(resetUrl, locale),
    text: buildPasswordResetEmailText(resetUrl, locale),
  });

  if (error) {
    // Log the link so local/dev can still complete the flow when Resend rejects the send
    // (e.g. free tier only delivers to the Resend account email).
    console.error('[email] Failed to send password reset email:', error, 'Reset link:', resetUrl);
    throw new Error('Failed to send password reset email');
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getSupportInbox = (): string =>
  process.env.SUPPORT_EMAIL?.trim() || 'amorely013@gmail.com';

export async function sendSupportInboxEmail(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const resend = getResendClient();
  const inbox = getSupportInbox();
  const subject = `Amorely support: ${payload.name}`;
  const text = `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`;
  const html = `<p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
<p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
<p>${escapeHtml(payload.message).replace(/\n/g, '<br />')}</p>`;

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set. Support form accepted without sending.');
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: inbox,
    replyTo: payload.email,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('[email] Failed to send support inbox email');
    throw new Error('Failed to send support inbox email');
  }
}
