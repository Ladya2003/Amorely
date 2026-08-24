import CurrencyTransaction from '../models/currencyTransaction';
import AppAnnouncement from '../models/appAnnouncement';
import User from '../models/user';

const announcementReadKeyPrefix = (userId: string) => `announcement_read:${userId}:`;

const parseAnnouncementKeyFromIdempotencyKey = (key: string, userId: string): string | null => {
  const prefix = announcementReadKeyPrefix(userId);
  if (!key.startsWith(prefix)) {
    return null;
  }

  const announcementKey = key.slice(prefix.length).trim();
  return announcementKey || null;
};

const toKeyStrings = (keys: string[] | undefined): string[] =>
  [...new Set((keys ?? []).filter((key) => typeof key === 'string' && key.trim()))];

export async function getReadAnnouncementKeys(userId: string): Promise<string[]> {
  const user = await User.findById(userId).select('readAnnouncementKeys readAnnouncementsBackfilled');
  if (!user) {
    return [];
  }

  if (user.readAnnouncementsBackfilled) {
    return toKeyStrings(user.readAnnouncementKeys);
  }

  const txs = await CurrencyTransaction.find({
    userId,
    reason: 'announcement_read',
  })
    .select('idempotencyKey')
    .lean();

  const fromTx = txs
    .map((tx) => parseAnnouncementKeyFromIdempotencyKey(tx.idempotencyKey, userId))
    .filter((key): key is string => Boolean(key));

  await User.updateOne(
    { _id: userId, readAnnouncementsBackfilled: { $ne: true } },
    {
      $addToSet: { readAnnouncementKeys: { $each: fromTx } },
      $set: { readAnnouncementsBackfilled: true },
    }
  );

  const fresh = await User.findById(userId).select('readAnnouncementKeys');
  return toKeyStrings(fresh?.readAnnouncementKeys);
}

export async function markAnnouncementRead(userId: string, announcementKey: string): Promise<string[]> {
  await getReadAnnouncementKeys(userId);
  await User.updateOne({ _id: userId }, { $addToSet: { readAnnouncementKeys: announcementKey } });
  const user = await User.findById(userId).select('readAnnouncementKeys');
  return toKeyStrings(user?.readAnnouncementKeys);
}

export async function markAnnouncementReadMany(
  userId: string,
  announcementKeys: string[]
): Promise<string[]> {
  const uniqueKeys = [...new Set(announcementKeys.map((key) => key.trim()).filter(Boolean))];
  await getReadAnnouncementKeys(userId);

  if (uniqueKeys.length > 0) {
    const existing = await AppAnnouncement.find({ key: { $in: uniqueKeys } })
      .select('key')
      .lean();

    const existingKeys = existing.map((item) => item.key);
    if (existingKeys.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { readAnnouncementKeys: { $each: existingKeys } } }
      );
    }
  }

  const user = await User.findById(userId).select('readAnnouncementKeys');
  return toKeyStrings(user?.readAnnouncementKeys);
}
