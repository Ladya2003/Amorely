import type { Document } from 'mongoose';
import {
  calculateDaysTogether,
  DAYS_ACHIEVEMENT_REWARD,
  getUnlockedAchievementIds,
} from '../config/daysAchievementCatalog';
import { notifyCurrencyAward } from '../games/gameCurrencyAwards';
import { awardCurrency, getOrCreateWallet } from './currencyService';

type RelationshipDaysAchievements = Document & {
  _id: { toString(): string };
  userId: { toString(): string };
  partnerId: { toString(): string };
  startDate: Date;
  daysAchievementsAwarded?: string[];
  daysAchievementsInitialized?: boolean;
  save(): Promise<unknown>;
};

export const bootstrapDaysAchievementsForRelationship = async (
  relationship: RelationshipDaysAchievements
) => {
  if (relationship.daysAchievementsInitialized) {
    return;
  }

  const daysCount = calculateDaysTogether(relationship.startDate);
  relationship.daysAchievementsAwarded = getUnlockedAchievementIds(daysCount);
  relationship.daysAchievementsInitialized = true;
  await relationship.save();
};

export const processNewDaysAchievements = async (
  userId: string,
  relationship: RelationshipDaysAchievements
) => {
  if (!relationship.daysAchievementsInitialized) {
    await bootstrapDaysAchievementsForRelationship(relationship);
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance, newAchievementIds: [] as string[] };
  }

  const daysCount = calculateDaysTogether(relationship.startDate);
  const unlockedIds = getUnlockedAchievementIds(daysCount);
  const awardedSet = new Set(relationship.daysAchievementsAwarded ?? []);
  const newAchievementIds = unlockedIds.filter((id) => !awardedSet.has(id));

  if (newAchievementIds.length === 0) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance, newAchievementIds };
  }

  const relationshipId = relationship._id.toString();
  const participantIds = [relationship.userId.toString(), relationship.partnerId.toString()];
  let userTotalAwarded = 0;
  let lastBalance = 0;

  for (const achievementId of newAchievementIds) {
    for (const participantId of participantIds) {
      const award = await awardCurrency(
        participantId,
        DAYS_ACHIEVEMENT_REWARD,
        'days_achievement',
        `days_achievement:${participantId}:${relationshipId}:${achievementId}`
      );

      if (award.awarded) {
        notifyCurrencyAward(participantId, award);
        if (participantId === userId) {
          userTotalAwarded += award.amount;
          lastBalance = award.balance;
        }
      }
    }

    awardedSet.add(achievementId);
  }

  relationship.daysAchievementsAwarded = [...awardedSet];
  await relationship.save();

  if (userTotalAwarded === 0) {
    const { wallet } = await getOrCreateWallet(userId);
    lastBalance = wallet.balance;
  }

  return {
    awarded: userTotalAwarded > 0,
    amount: userTotalAwarded,
    balance: lastBalance,
    newAchievementIds,
  };
};
