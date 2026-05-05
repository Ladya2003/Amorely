import mongoose from 'mongoose';
import Content from '../models/content';
import FeedRotationState from '../models/feedRotationState';
import Relationship from '../models/relationship';
import User from '../models/user';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const MINSK_TIMEZONE = 'Europe/Minsk';
const SLOT_MORNING = '0200';
const SLOT_EVENING = '1700';

interface MinskParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

interface RotationItemState {
  contentId: string;
  showCount: number;
  lastShownAt?: Date;
}

const getMinskParts = (date: Date): MinskParts => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MINSK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour')
  };
};

const ymdToUtcDay = (year: number, month: number, day: number): number =>
  Math.floor(Date.UTC(year, month - 1, day) / MS_IN_DAY);

const isWithinMonthDayWindow = (
  date: Date,
  month: number,
  day: number,
  daysBefore: number,
  daysAfter: number
): boolean => {
  const now = getMinskParts(date);
  const todayDay = ymdToUtcDay(now.year, now.month, now.day);
  const yearsToCheck = [now.year - 1, now.year, now.year + 1];

  return yearsToCheck.some((candidateYear) => {
    const targetDay = ymdToUtcDay(candidateYear, month, day);
    const diff = todayDay - targetDay;
    return diff >= -daysBefore && diff <= daysAfter;
  });
};

const shuffle = <T>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const buildSlotKey = (date: Date): string => {
  const parts = getMinskParts(date);
  let slot = SLOT_EVENING;
  let slotYear = parts.year;
  let slotMonth = parts.month;
  let slotDay = parts.day;

  if (parts.hour >= 17) {
    slot = SLOT_EVENING;
  } else if (parts.hour >= 2) {
    slot = SLOT_MORNING;
  } else {
    // До 02:00 используем вечерний слот предыдущего дня.
    const previous = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    previous.setUTCDate(previous.getUTCDate() - 1);
    slotYear = previous.getUTCFullYear();
    slotMonth = previous.getUTCMonth() + 1;
    slotDay = previous.getUTCDate();
    slot = SLOT_EVENING;
  }

  return `${slotYear}-${String(slotMonth).padStart(2, '0')}-${String(slotDay).padStart(2, '0')}-${slot}`;
};

const pickRandomItems = (
  eligibleIds: string[],
  existingItems: RotationItemState[],
  limit: number
): string[] => {
  if (eligibleIds.length === 0 || limit <= 0) return [];

  const result: string[] = [];
  const selected = new Set<string>();
  const existingMap = new Map(existingItems.map((item) => [item.contentId, item]));

  const unseen = shuffle(eligibleIds.filter((id) => !existingMap.has(id)));
  for (const id of unseen) {
    if (result.length >= limit) break;
    result.push(id);
    selected.add(id);
  }

  if (result.length >= limit) return result;

  const seenCandidates = eligibleIds.filter((id) => existingMap.has(id) && !selected.has(id));
  const groupedByCount = new Map<number, string[]>();
  for (const id of seenCandidates) {
    const count = existingMap.get(id)?.showCount ?? 0;
    if (!groupedByCount.has(count)) groupedByCount.set(count, []);
    groupedByCount.get(count)?.push(id);
  }

  const sortedCounts = Array.from(groupedByCount.keys()).sort((a, b) => a - b);
  for (const count of sortedCounts) {
    const pool = shuffle(groupedByCount.get(count) || []);
    for (const id of pool) {
      if (result.length >= limit) break;
      result.push(id);
      selected.add(id);
    }
    if (result.length >= limit) break;
  }

  return result;
};

const pickSingle = (candidateIds: string[]): string | null => {
  if (candidateIds.length === 0) return null;
  const idx = Math.floor(Math.random() * candidateIds.length);
  return candidateIds[idx];
};

const upsertCounts = (
  existingItems: RotationItemState[],
  selectedRandomIds: string[],
  now: Date
): RotationItemState[] => {
  const map = new Map(existingItems.map((item) => [item.contentId, item]));
  for (const contentId of selectedRandomIds) {
    const item = map.get(contentId);
    if (item) {
      item.showCount += 1;
      item.lastShownAt = now;
    } else {
      map.set(contentId, { contentId, showCount: 1, lastShownAt: now });
    }
  }
  return Array.from(map.values());
};

const cleanupItems = (items: RotationItemState[], allowedIds: Set<string>): RotationItemState[] =>
  items.filter((item) => allowedIds.has(item.contentId));

const getCanonicalPairIds = (
  firstId: mongoose.Types.ObjectId,
  secondId: mongoose.Types.ObjectId
): { userA: mongoose.Types.ObjectId; userB: mongoose.Types.ObjectId } => {
  const [a, b] = [firstId.toString(), secondId.toString()].sort();
  return {
    userA: new mongoose.Types.ObjectId(a),
    userB: new mongoose.Types.ObjectId(b)
  };
};

const getRelationshipForUser = async (userId: string) =>
  Relationship.findOne({
    $or: [{ userId }, { partnerId: userId }],
    status: 'active'
  });

/** Весь контент пары для ленты (как старая лента), включая загрузки до появления партнёра. */
const fetchFullFeedForPair = async (ownerId: mongoose.Types.ObjectId, partnerId: mongoose.Types.ObjectId) =>
  Content.find({
    $or: [{ userId: ownerId }, { userId: partnerId }],
    showInFeed: true,
    url: { $ne: '' }
  }).sort({ eventDate: -1, createdAt: -1 });

export const buildOrGetDynamicFeed = async (userId: string, now: Date = new Date()) => {
  const relationship = await getRelationshipForUser(userId);
  if (!relationship) {
    return [];
  }

  const ownerId = new mongoose.Types.ObjectId(userId);
  const partnerId =
    relationship.userId.toString() === userId
      ? relationship.partnerId
      : relationship.userId;
  const { userA, userB } = getCanonicalPairIds(ownerId, partnerId);

  const slotKey = buildSlotKey(now);
  const getIdsFromSlots = (slots: any): string[] =>
    [
      slots?.birthdayContentId?.toString(),
      slots?.anniversaryContentId?.toString(),
      ...((slots?.randomContentIds || []) as mongoose.Types.ObjectId[]).map((id) => id.toString())
    ].filter((id): id is string => Boolean(id));

  let state = await FeedRotationState.findOne({ userId: userA, partnerId: userB });
  const mirroredState = await FeedRotationState.findOne({ userId: userB, partnerId: userA });

  // Миграция старых зеркальных записей к канонической паре.
  if (!state && mirroredState) {
    mirroredState.userId = userA;
    mirroredState.partnerId = userB;
    await mirroredState.save();
    state = mirroredState;
  } else if (state && mirroredState) {
    // Если уже есть дубликат, оставляем каноническую и удаляем зеркальную.
    await FeedRotationState.deleteOne({ _id: mirroredState._id });
  }

  // Нет записи ротации — создаем и сразу генерируем текущий слот.
  if (!state) {
    state = await FeedRotationState.findOneAndUpdate(
      { userId: userA, partnerId: userB },
      {
        $setOnInsert: {
          userId: userA,
          partnerId: userB,
          status: relationship.status,
          items: [],
          currentSlots: { randomContentIds: [] }
        }
      },
      { upsert: true, new: true }
    );
  }

  if (!state) {
    return fetchFullFeedForPair(ownerId, partnerId);
  }

  if (state.lastGeneratedSlot === slotKey) {
    const selectedIds = getIdsFromSlots(state.currentSlots);
    if (selectedIds.length === 0) {
      return fetchFullFeedForPair(ownerId, partnerId);
    }
    const docs = await Content.find({
      _id: { $in: selectedIds.map((id) => new mongoose.Types.ObjectId(id)) }
    }).sort({ eventDate: -1, createdAt: -1 });
    const orderMap = new Map(selectedIds.map((id, index) => [id, index]));
    docs.sort(
      (a, b) => (orderMap.get(a._id.toString()) ?? 999) - (orderMap.get(b._id.toString()) ?? 999)
    );
    return docs;
  }

  const contentPool = await Content.find({
    $or: [{ userId: ownerId }, { userId: partnerId }],
    showInFeed: true,
    url: { $ne: '' }
  }).sort({ eventDate: -1, createdAt: -1 });

  const contentById = new Map(contentPool.map((item) => [item._id.toString(), item]));
  const eligibleIds = Array.from(contentById.keys());
  const allowedIdSet = new Set(eligibleIds);

  const currentItems = cleanupItems(
    ((state.items || []) as any[]).map((item) => ({
      contentId: item.contentId.toString(),
      showCount: item.showCount,
      lastShownAt: item.lastShownAt
    })),
    allowedIdSet
  );

  const randomIds = pickRandomItems(eligibleIds, currentItems, 3);

  const [ownerUser, partnerUser] = await Promise.all([
    User.findById(ownerId).select('birthday'),
    User.findById(partnerId).select('birthday')
  ]);

  const isBirthdayWindow = [ownerUser?.birthday, partnerUser?.birthday]
    .filter((birthday): birthday is Date => Boolean(birthday))
    .some((birthday) =>
      isWithinMonthDayWindow(now, birthday.getUTCMonth() + 1, birthday.getUTCDate(), 5, 3)
    );

  const isAnniversaryWindow = isWithinMonthDayWindow(
    now,
    relationship.startDate.getUTCMonth() + 1,
    relationship.startDate.getUTCDate(),
    5,
    3
  );

  const used = new Set(randomIds);
  let birthdayId: string | null = null;
  let anniversaryId: string | null = null;

  if (isBirthdayWindow) {
    const birthdayCandidates = eligibleIds.filter((id) => {
      const content = contentById.get(id);
      return Boolean(content?.isBirthdayEvent) && !used.has(id);
    });
    birthdayId = pickSingle(birthdayCandidates);
    if (birthdayId) used.add(birthdayId);
  }

  if (isAnniversaryWindow) {
    const anniversaryCandidates = eligibleIds.filter((id) => {
      const content = contentById.get(id);
      return Boolean(content?.isAnniversaryEvent) && !used.has(id);
    });
    anniversaryId = pickSingle(anniversaryCandidates);
  }

  const nextItems = upsertCounts(currentItems, randomIds, now).map((item) => ({
    contentId: new mongoose.Types.ObjectId(item.contentId),
    showCount: item.showCount,
    lastShownAt: item.lastShownAt
  }));
  const currentSlots = {
    randomContentIds: randomIds.map((id) => new mongoose.Types.ObjectId(id)),
    birthdayContentId: birthdayId ? new mongoose.Types.ObjectId(birthdayId) : undefined,
    anniversaryContentId: anniversaryId ? new mongoose.Types.ObjectId(anniversaryId) : undefined
  };

  // Не фиксируем пустой слот в БД — иначе лента «залипнет» пустой до следующего окна.
  if (randomIds.length === 0 && !birthdayId && !anniversaryId) {
    return fetchFullFeedForPair(ownerId, partnerId);
  }

  const updateResult = await FeedRotationState.updateOne(
    { _id: state._id, lastGeneratedSlot: { $ne: slotKey } },
    {
      $set: {
        status: relationship.status,
        items: nextItems,
        currentSlots,
        lastGeneratedSlot: slotKey,
        lastGeneratedAt: now
      }
    }
  );

  const finalState =
    updateResult.modifiedCount > 0
      ? ({ currentSlots } as any)
      : await FeedRotationState.findById(state._id).select('currentSlots');

  const selectedIds = getIdsFromSlots(finalState?.currentSlots);
  if (selectedIds.length === 0) {
    return fetchFullFeedForPair(ownerId, partnerId);
  }

  const docs = await Content.find({
    _id: { $in: selectedIds.map((id) => new mongoose.Types.ObjectId(id)) }
  }).sort({ eventDate: -1, createdAt: -1 });

  const orderMap = new Map(selectedIds.map((id, index) => [id, index]));
  docs.sort((a, b) => (orderMap.get(a._id.toString()) ?? 999) - (orderMap.get(b._id.toString()) ?? 999));

  return docs;
};

export const refreshDynamicFeedForAllActiveRelationships = async (now: Date = new Date()) => {
  const relationships = await Relationship.find({ status: 'active' }).select('userId partnerId');
  for (const relationship of relationships) {
    await buildOrGetDynamicFeed(relationship.userId.toString(), now);
  }
};

export const getCurrentSlotKey = (date: Date = new Date()) => buildSlotKey(date);
