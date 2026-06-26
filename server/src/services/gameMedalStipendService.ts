import Relationship from '../models/relationship';
import { awardCurrency, getOrCreateWallet } from './currencyService';
import { notifyCurrencyAward } from '../games/gameCurrencyAwards';

const STIPEND_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

export const MEDAL_STIPEND_BY_RANK: Record<number, number> = {
  1: 25,
  2: 15,
  3: 10,
};

export const getMedalStipendPeriodKey = (date = new Date()): string =>
  String(Math.floor(date.getTime() / STIPEND_PERIOD_MS));

const getBestMedalBadges = (badges: Array<{ gameId: string; rank: number }>) =>
  badges
    .filter((badge) => badge.rank >= 1 && badge.rank <= 3)
    .reduce<Array<{ gameId: string; rank: number }>>((bestByGame, badge) => {
      const existing = bestByGame.find((item) => item.gameId === badge.gameId);
      if (!existing) {
        bestByGame.push({ gameId: badge.gameId, rank: badge.rank });
        return bestByGame;
      }

      if (badge.rank < existing.rank) {
        const index = bestByGame.indexOf(existing);
        bestByGame[index] = { gameId: badge.gameId, rank: badge.rank };
      }

      return bestByGame;
    }, []);

export const processGameMedalStipends = async (userId: string) => {
  const relationship = await Relationship.findOne({
    $or: [{ userId }, { partnerId: userId }],
    status: 'active',
  });

  if (!relationship?.badges?.length) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  const participantIds = [
    relationship.userId.toString(),
    relationship.partnerId.toString(),
  ];
  const periodKey = getMedalStipendPeriodKey();
  const medalBadges = getBestMedalBadges(relationship.badges);

  let userTotalAwarded = 0;
  let lastBalance = 0;

  for (const badge of medalBadges) {
    const amount = MEDAL_STIPEND_BY_RANK[badge.rank];
    if (!amount) {
      continue;
    }

    for (const participantId of participantIds) {
      const award = await awardCurrency(
        participantId,
        amount,
        'game_medal_stipend',
        `game_medal_stipend:${participantId}:${badge.gameId}:${periodKey}`
      );

      if (award.awarded) {
        notifyCurrencyAward(participantId, award);
        if (participantId === userId) {
          userTotalAwarded += award.amount;
          lastBalance = award.balance;
        }
      }
    }
  }

  if (userTotalAwarded === 0) {
    const { wallet } = await getOrCreateWallet(userId);
    lastBalance = wallet.balance;
  }

  return {
    awarded: userTotalAwarded > 0,
    amount: userTotalAwarded,
    balance: lastBalance,
  };
};
