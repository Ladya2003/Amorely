import crypto from 'crypto';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** After the first verification email, wait 1 minute before resend. */
export const VERIFICATION_RESEND_COOLDOWN_FIRST_MS = 60 * 1000;
/** After the second send and later, wait 5 minutes between resends. */
export const VERIFICATION_RESEND_COOLDOWN_NEXT_MS = 5 * 60 * 1000;

export const createEmailVerificationToken = (): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  return { token, tokenHash, expiresAt };
};

export const hashEmailVerificationToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Cooldown before the *next* send, given how many emails were already sent. */
export const getVerificationResendCooldownMs = (sendCount: number): number => {
  if (sendCount <= 0) {
    return 0;
  }
  if (sendCount === 1) {
    return VERIFICATION_RESEND_COOLDOWN_FIRST_MS;
  }
  return VERIFICATION_RESEND_COOLDOWN_NEXT_MS;
};

export const getVerificationResendRetryAfterSeconds = (user: {
  emailVerificationSentAt?: Date | null;
  emailVerificationSendCount?: number | null;
}): number => {
  const count = user.emailVerificationSendCount ?? 0;
  const lastSent = user.emailVerificationSentAt;
  if (!lastSent || count <= 0) {
    return 0;
  }
  const cooldownMs = getVerificationResendCooldownMs(count);
  const elapsedMs = Date.now() - new Date(lastSent).getTime();
  return Math.max(0, Math.ceil((cooldownMs - elapsedMs) / 1000));
};
