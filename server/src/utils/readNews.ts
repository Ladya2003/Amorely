import mongoose from 'mongoose';
import CurrencyTransaction from '../models/currencyTransaction';
import News from '../models/news';
import User from '../models/user';

const newsReadKeyPrefix = (userId: string) => `news_read:${userId}:`;

const parseNewsIdFromIdempotencyKey = (key: string, userId: string): string | null => {
  const prefix = newsReadKeyPrefix(userId);
  if (!key.startsWith(prefix)) {
    return null;
  }

  const newsId = key.slice(prefix.length);
  return mongoose.Types.ObjectId.isValid(newsId) ? newsId : null;
};

const toIdStrings = (ids: Array<mongoose.Types.ObjectId | string> | undefined): string[] =>
  (ids ?? []).map((id) => id.toString());

export async function getReadNewsIds(userId: string): Promise<string[]> {
  const user = await User.findById(userId).select('readNewsIds readNewsBackfilled');
  if (!user) {
    return [];
  }

  if (user.readNewsBackfilled) {
    return toIdStrings(user.readNewsIds);
  }

  const txs = await CurrencyTransaction.find({
    userId,
    reason: 'news_read',
  })
    .select('idempotencyKey')
    .lean();

  const fromTx = txs
    .map((tx) => parseNewsIdFromIdempotencyKey(tx.idempotencyKey, userId))
    .filter((id): id is string => Boolean(id));

  await User.updateOne(
    { _id: userId, readNewsBackfilled: { $ne: true } },
    {
      $addToSet: { readNewsIds: { $each: fromTx } },
      $set: { readNewsBackfilled: true },
    }
  );

  const fresh = await User.findById(userId).select('readNewsIds');
  return toIdStrings(fresh?.readNewsIds);
}

export async function markNewsRead(userId: string, newsId: string): Promise<string[]> {
  await getReadNewsIds(userId);
  await User.updateOne({ _id: userId }, { $addToSet: { readNewsIds: newsId } });
  const user = await User.findById(userId).select('readNewsIds');
  return toIdStrings(user?.readNewsIds);
}

export async function markNewsReadMany(userId: string, newsIds: string[]): Promise<string[]> {
  const validIds = [...new Set(newsIds.filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  await getReadNewsIds(userId);

  if (validIds.length > 0) {
    const existing = await News.find({
      _id: { $in: validIds },
      isPublished: true,
    })
      .select('_id')
      .lean();

    const existingIds = existing.map((item) => item._id.toString());
    if (existingIds.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { readNewsIds: { $each: existingIds } } }
      );
    }
  }

  const user = await User.findById(userId).select('readNewsIds');
  return toIdStrings(user?.readNewsIds);
}
