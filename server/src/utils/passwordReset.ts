import crypto from 'crypto';

/** Password reset links expire after 1 hour. */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** After the first reset email, wait 1 minute before resend. */
export const PASSWORD_RESET_COOLDOWN_FIRST_MS = 60 * 1000;
/** After the second send and later, wait 5 minutes between resends. */
export const PASSWORD_RESET_COOLDOWN_NEXT_MS = 5 * 60 * 1000;

export const createPasswordResetToken = (): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  return { token, tokenHash, expiresAt };
};

export const hashPasswordResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const getPasswordResetCooldownMs = (sendCount: number): number => {
  if (sendCount <= 0) {
    return 0;
  }
  if (sendCount === 1) {
    return PASSWORD_RESET_COOLDOWN_FIRST_MS;
  }
  return PASSWORD_RESET_COOLDOWN_NEXT_MS;
};

export const getPasswordResetRetryAfterSeconds = (user: {
  passwordResetSentAt?: Date | null;
  passwordResetSendCount?: number | null;
}): number => {
  const count = user.passwordResetSendCount ?? 0;
  const lastSent = user.passwordResetSentAt;
  if (!lastSent || count <= 0) {
    return 0;
  }
  const cooldownMs = getPasswordResetCooldownMs(count);
  const elapsedMs = Date.now() - new Date(lastSent).getTime();
  return Math.max(0, Math.ceil((cooldownMs - elapsedMs) / 1000));
};
