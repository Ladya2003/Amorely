import mongoose from 'mongoose';

export const normalizeIdStr = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const asString = String((value as { toString(): string }).toString()).trim();
    return asString && asString !== '[object Object]' ? asString : null;
  }

  const asString = String(value).trim();
  return asString && asString !== '[object Object]' ? asString : null;
};

export const idsEqual = (left: unknown, right: unknown): boolean => {
  const a = normalizeIdStr(left);
  const b = normalizeIdStr(right);
  return Boolean(a && b && a === b);
};

export const hasActivePartner = (userId: string, partnerId?: string | null): boolean =>
  Boolean(partnerId && !idsEqual(partnerId, userId));

export const idQueryValues = (value: string): Array<string | mongoose.Types.ObjectId> => {
  const normalized = normalizeIdStr(value);
  if (!normalized) {
    return [];
  }

  try {
    return [normalized, new mongoose.Types.ObjectId(normalized)];
  } catch {
    return [normalized];
  }
};

export const fieldMatchesUserId = (field: string, userId: string) => ({
  [field]: { $in: idQueryValues(userId) }
});
