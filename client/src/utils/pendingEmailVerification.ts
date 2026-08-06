const STORAGE_KEY = 'amorely.pendingEmailVerification';

export type PendingEmailVerification = {
  email: string;
  /** Epoch ms when resend button becomes available again */
  resendAvailableAt: number;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const readPendingEmailVerification = (): PendingEmailVerification | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingEmailVerification>;
    if (typeof parsed.email !== 'string' || !parsed.email.includes('@')) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const resendAvailableAt =
      typeof parsed.resendAvailableAt === 'number' && Number.isFinite(parsed.resendAvailableAt)
        ? parsed.resendAvailableAt
        : Date.now();
    return {
      email: normalizeEmail(parsed.email),
      resendAvailableAt,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const savePendingEmailVerification = (
  email: string,
  resendAvailableInSeconds: number
): PendingEmailVerification => {
  const pending: PendingEmailVerification = {
    email: normalizeEmail(email),
    resendAvailableAt: Date.now() + Math.max(0, Math.floor(resendAvailableInSeconds)) * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  return pending;
};

export const clearPendingEmailVerification = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getPendingResendSecondsLeft = (pending: PendingEmailVerification): number =>
  Math.max(0, Math.ceil((pending.resendAvailableAt - Date.now()) / 1000));
