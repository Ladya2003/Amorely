import DatingIdea from '../models/datingIdea';
import { findActiveRelationshipForUser } from '../utils/relationshipHelpers';
import { resolveLocale, AppLocale } from '../i18n/locales';
import { getUserLocale } from '../utils/userLocale';
import { spendCurrency, getBalance } from './currencyService';
import {
  DATING_IDEA_COST,
  getDatingIdeaLocalized,
  pickRandomDatingIdea,
} from '../datingIdeas/datingIdeasContent';

export { DATING_IDEA_COST };

type DatingIdeaLike = {
  _id: unknown;
  ideaKey: string;
  emoji: string;
  title: string;
  description: string;
  status: string;
  eventId?: string | null;
  createdBy: unknown;
  createdAt: Date;
  completedAt?: Date | null;
  skippedAt?: Date | null;
};

const formatIdea = (doc: DatingIdeaLike) => ({
  id: String(doc._id),
  ideaKey: doc.ideaKey,
  emoji: doc.emoji,
  title: doc.title,
  description: doc.description,
  status: doc.status as 'active' | 'completed' | 'skipped',
  eventId: doc.eventId || null,
  createdBy: String(doc.createdBy),
  createdAt: doc.createdAt,
  completedAt: doc.completedAt || null,
  skippedAt: doc.skippedAt || null,
});

export const getDatingIdeasOverview = async (userId: string, localeHint?: string) => {
  const relationship = await findActiveRelationshipForUser(userId);
  if (!relationship) {
    return { hasPartner: false as const };
  }

  const locale = localeHint ? resolveLocale(localeHint) : await getUserLocale(userId);
  const wallet = await getBalance(userId);
  const ideas = await DatingIdea.find({ relationshipId: relationship._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const active = ideas.find((idea) => idea.status === 'active') || null;
  const history = ideas.filter((idea) => idea.status !== 'active');

  return {
    hasPartner: true as const,
    cost: DATING_IDEA_COST,
    balance: wallet.balance,
    locale,
    active: active ? formatIdea(active as DatingIdeaLike) : null,
    history: history.map((idea) => formatIdea(idea as DatingIdeaLike)),
  };
};

export const generateDatingIdea = async (userId: string, localeHint?: string) => {
  const relationship = await findActiveRelationshipForUser(userId);
  if (!relationship) {
    return { error: 'NO_PARTNER' as const };
  }

  const wallet = await getBalance(userId);
  if (wallet.balance < DATING_IDEA_COST) {
    return {
      error: 'INSUFFICIENT_BALANCE' as const,
      balance: wallet.balance,
      required: DATING_IDEA_COST,
    };
  }

  const locale: AppLocale = localeHint ? resolveLocale(localeHint) : await getUserLocale(userId);

  const recent = await DatingIdea.find({ relationshipId: relationship._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('ideaKey status')
    .lean();
  const excludeIds = recent.map((item) => item.ideaKey);

  const spend = await spendCurrency(
    userId,
    DATING_IDEA_COST,
    'dating_idea_generate',
    `dating_idea_generate:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
  );

  if (!spend.success) {
    return {
      error: 'INSUFFICIENT_BALANCE' as const,
      balance: spend.balance,
      required: DATING_IDEA_COST,
    };
  }

  await DatingIdea.updateMany(
    { relationshipId: relationship._id, status: 'active' },
    { $set: { status: 'skipped', skippedAt: new Date() } }
  );

  const picked = pickRandomDatingIdea(excludeIds);
  const localized = getDatingIdeaLocalized(picked, locale);

  const created = await DatingIdea.create({
    relationshipId: relationship._id,
    ideaKey: localized.id,
    emoji: localized.emoji,
    title: localized.title,
    description: localized.description,
    status: 'active',
    createdBy: userId,
  });

  return {
    idea: formatIdea(created),
    balance: spend.balance,
    cost: DATING_IDEA_COST,
  };
};

export const skipDatingIdea = async (userId: string, ideaId: string) => {
  const relationship = await findActiveRelationshipForUser(userId);
  if (!relationship) {
    return { error: 'NO_PARTNER' as const };
  }

  const idea = await DatingIdea.findOne({
    _id: ideaId,
    relationshipId: relationship._id,
  });

  if (!idea) {
    return { error: 'NOT_FOUND' as const };
  }

  if (idea.status === 'active') {
    idea.status = 'skipped';
    idea.skippedAt = new Date();
    await idea.save();
  }

  return { idea: formatIdea(idea) };
};

export const completeDatingIdea = async (
  userId: string,
  ideaId: string,
  eventId: string
) => {
  const relationship = await findActiveRelationshipForUser(userId);
  if (!relationship) {
    return { error: 'NO_PARTNER' as const };
  }

  const idea = await DatingIdea.findOne({
    _id: ideaId,
    relationshipId: relationship._id,
  });

  if (!idea) {
    return { error: 'NOT_FOUND' as const };
  }

  idea.status = 'completed';
  idea.eventId = eventId;
  idea.completedAt = new Date();
  await idea.save();

  return { idea: formatIdea(idea) };
};
