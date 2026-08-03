import mongoose from 'mongoose';

const isObjectIdLike = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    _bsontype?: string;
    constructor?: { name?: string };
    toHexString?: () => string;
  };

  return (
    candidate._bsontype === 'ObjectId' ||
    candidate.constructor?.name === 'ObjectId' ||
    typeof candidate.toHexString === 'function'
  );
};

export const normalizeIdStr = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  // ObjectId has recursive `_id`/`id` accessors — never walk into them.
  if (isObjectIdLike(value)) {
    const asString = String((value as { toString(): string }).toString()).trim();
    return asString && asString !== '[object Object]' ? asString : null;
  }

  if (Buffer.isBuffer(value)) {
    const asHex = value.toString('hex').trim();
    return asHex || null;
  }

  if (typeof value === 'object' && value !== null) {
    // Populated mongoose docs / plain `{ _id }` refs.
    if ('_id' in (value as Record<string, unknown>)) {
      const nested = normalizeIdStr((value as { _id: unknown })._id);
      if (nested) {
        return nested;
      }
    }

    if ('toString' in value) {
      const asString = String((value as { toString(): string }).toString()).trim();
      return asString && asString !== '[object Object]' ? asString : null;
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const asString = String(value).trim();
    return asString && asString !== '[object Object]' ? asString : null;
  }

  return null;
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
