import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import TapGameState from '../models/tapGameState';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import { awardGameRoundToParticipants } from './gameCurrencyAwards';
import {
  TAP_BLOCKS,
  TAP_INITIAL_TARGET,
  TAP_TARGET_MULTIPLIER,
  getTapRoundCompletionBonus,
  getTapShopItem,
} from './tapGameConfig';

export interface TapGameRelationship {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
}

export interface TapGameContext {
  relationship: TapGameRelationship;
  ownerUserId: string;
  partnerUserId: string;
}

export interface TapGamePublicState {
  relationshipId: string;
  hasPartner: true;
  round: number;
  targetTaps: number;
  activeUserId: string | null;
  userTapsThisRound: number;
  partnerTapsThisRound: number;
  userId: string;
  partnerId: string;
  blockIndex: number;
  block: (typeof TAP_BLOCKS)[number];
  points: number;
  totalTaps: number;
  activeBoost: {
    itemId: string;
    multiplier: number;
    remainingUses: number;
  } | null;
  isMyTurn: boolean;
  waitingForPartner: boolean;
  isOpenRound1Start: boolean;
  roundStarterUserId: string | null;
  myTapsThisRound: number;
  partnerProgressThisRound: number;
}

const isRelationshipPrimaryUser = (relationship: TapGameRelationship, userId: string): boolean =>
  relationship.userId.toString() === userId;

const getViewerTapCounts = (
  state: any,
  relationship: TapGameRelationship,
  viewerUserId: string
) => {
  const viewerIsPrimary = isRelationshipPrimaryUser(relationship, viewerUserId);
  const userTapsThisRound = state.userTapsThisRound ?? 0;
  const partnerTapsThisRound = state.partnerTapsThisRound ?? 0;

  return {
    myTapsThisRound: viewerIsPrimary ? userTapsThisRound : partnerTapsThisRound,
    partnerProgressThisRound: viewerIsPrimary ? partnerTapsThisRound : userTapsThisRound,
  };
};

export const formatTapGameState = (
  state: any,
  viewerUserId: string,
  context: TapGameContext
): TapGamePublicState => {
  const blockIndex = state.blockIndex ?? 0;
  const activeUserId = state.activeUserId ? state.activeUserId.toString() : null;
  const { myTapsThisRound, partnerProgressThisRound } = getViewerTapCounts(
    state,
    context.relationship,
    viewerUserId
  );

  const myPartComplete = myTapsThisRound >= state.targetTaps;
  const partnerPartComplete = partnerProgressThisRound >= state.targetTaps;
  const isMyTurn = !myPartComplete;
  const waitingForPartner = myPartComplete && !partnerPartComplete;

  return {
    relationshipId: state.relationshipId.toString(),
    hasPartner: true,
    round: state.round,
    targetTaps: state.targetTaps,
    activeUserId,
    userTapsThisRound: state.userTapsThisRound ?? 0,
    partnerTapsThisRound: state.partnerTapsThisRound ?? 0,
    userId: context.relationship.userId.toString(),
    partnerId: context.partnerUserId,
    blockIndex,
    block: TAP_BLOCKS[blockIndex % TAP_BLOCKS.length],
    points: state.points,
    totalTaps: state.totalTaps,
    activeBoost: state.activeBoost
      ? {
          itemId: state.activeBoost.itemId,
          multiplier: state.activeBoost.multiplier,
          remainingUses: state.activeBoost.remainingUses,
        }
      : null,
    isMyTurn,
    waitingForPartner,
    isOpenRound1Start: false,
    roundStarterUserId: state.roundStarterUserId
      ? state.roundStarterUserId.toString()
      : null,
    myTapsThisRound,
    partnerProgressThisRound,
  };
};

const assignActiveUserAfterProgress = (state: any) => {
  const primaryDone = state.userTapsThisRound >= state.targetTaps;
  const secondaryDone = state.partnerTapsThisRound >= state.targetTaps;

  if (!primaryDone || !secondaryDone) {
    return;
  }

  state.round += 1;
  state.targetTaps *= TAP_TARGET_MULTIPLIER;
  state.userTapsThisRound = 0;
  state.partnerTapsThisRound = 0;
  state.blockIndex = (state.round - 1) % TAP_BLOCKS.length;
  state.activeUserId = null;
};

const normalizeTapGameStateDocument = async (
  state: any,
  relationship: TapGameRelationship
) => {
  if (state.ownerUserId) {
    return state;
  }

  state.ownerUserId = relationship.userId;
  state.waitingForPartnerLink = false;
  await state.save();
  return state;
};

export class TapGameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const resolveTapGameContext = async (userId: string): Promise<TapGameContext> => {
  const relationshipContext = await requireActiveRelationship(userId);

  if (!relationshipContext) {
    throw new TapGameError(
      'NO_PARTNER',
      'Для игры нужен партнёр. Добавьте его в настройках профиля.'
    );
  }

  const relationship = relationshipContext.relationship as TapGameRelationship;

  return {
    relationship,
    ownerUserId: relationship.userId.toString(),
    partnerUserId: relationshipContext.partnerId,
  };
};

export const getOrCreateTapGameState = async (userId: string, context: TapGameContext) => {
  const { relationship } = context;
  let state = await TapGameState.findOne({ relationshipId: relationship._id });

  if (!state) {
    state = await TapGameState.create({
      ownerUserId: relationship.userId,
      relationshipId: relationship._id,
      round: 1,
      targetTaps: TAP_INITIAL_TARGET,
      activeUserId: null,
      roundStarterUserId: null,
      userTapsThisRound: 0,
      partnerTapsThisRound: 0,
      blockIndex: 0,
      points: 0,
      totalTaps: 0,
      activeBoost: null,
      waitingForPartnerLink: false,
    });
    return state;
  }

  return normalizeTapGameStateDocument(state, relationship);
};

const TAP_BATCH_MAX = 100;

const tapGameLocks = new Map<string, Promise<unknown>>();

const withTapGameLock = async <T>(relationshipId: string, fn: () => Promise<T>): Promise<T> => {
  const previous = tapGameLocks.get(relationshipId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = () => resolve();
  });
  const chained = previous.then(() => gate);
  tapGameLocks.set(relationshipId, chained);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (tapGameLocks.get(relationshipId) === chained) {
      tapGameLocks.delete(relationshipId);
    }
  }
};

type ApplyTapResult = {
  applied: boolean;
  roundCompletionBonus: number;
};

const applySingleTap = (state: any, userId: string, context: TapGameContext): ApplyTapResult => {
  const primary = isRelationshipPrimaryUser(context.relationship, userId);
  const currentTaps = primary ? state.userTapsThisRound : state.partnerTapsThisRound;

  if (currentTaps >= state.targetTaps) {
    return { applied: false, roundCompletionBonus: 0 };
  }

  if (!state.roundStarterUserId && state.totalTaps === 0) {
    state.roundStarterUserId = new mongoose.Types.ObjectId(userId);
  }

  let effectiveProgress = 1;
  if (state.activeBoost && state.activeBoost.remainingUses > 0) {
    effectiveProgress = state.activeBoost.multiplier;
    state.activeBoost.remainingUses -= 1;
    if (state.activeBoost.remainingUses <= 0) {
      state.set('activeBoost', undefined);
    }
  }

  const remaining = Math.max(0, state.targetTaps - currentTaps);
  const appliedProgress = Math.min(effectiveProgress, remaining);

  if (primary) {
    state.userTapsThisRound = currentTaps + appliedProgress;
  } else {
    state.partnerTapsThisRound = currentTaps + appliedProgress;
  }

  state.points += 1;
  state.totalTaps += 1;

  const completedRound = state.round;
  assignActiveUserAfterProgress(state);

  let roundCompletionBonus = 0;
  if (state.round > completedRound) {
    roundCompletionBonus = getTapRoundCompletionBonus(completedRound);
    state.points += roundCompletionBonus;
  }

  return { applied: true, roundCompletionBonus };
};

export const normalizeTapBatchCount = (rawCount: unknown): number => {
  const parsed = typeof rawCount === 'number' ? rawCount : 1;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(Math.floor(parsed), TAP_BATCH_MAX);
};

export const processTap = async (userId: string, context: TapGameContext) => {
  return processTapBatch(userId, context, 1);
};

export const processTapBatch = async (
  userId: string,
  context: TapGameContext,
  tapCount: number
) => {
  const count = normalizeTapBatchCount(tapCount);
  const relationshipId = context.relationship._id.toString();

  return withTapGameLock(relationshipId, async () => {
    const state = await getOrCreateTapGameState(userId, context);

    let roundCompletionBonus = 0;
    let appliedCount = 0;

    for (let index = 0; index < count; index += 1) {
      const result = applySingleTap(state, userId, context);
      if (!result.applied) {
        break;
      }
      appliedCount += 1;
      roundCompletionBonus += result.roundCompletionBonus;
    }

    if (appliedCount === 0) {
      throw new TapGameError('ROUND_PART_COMPLETE', 'Вы уже завершили свою часть раунда');
    }

    await state.save();

    if (roundCompletionBonus > 0) {
      await awardGameRoundToParticipants(
        getTapGameParticipantIds(context),
        'tap',
        `${relationshipId}:r${state.round - 1}`
      );
    }

    return { state, roundCompletionBonus, appliedCount };
  });
};

export const buyTapShopItem = async (userId: string, context: TapGameContext, itemId: string) => {
  const shopItem = getTapShopItem(itemId);
  if (!shopItem) {
    throw new TapGameError('ITEM_NOT_FOUND', 'Предмет не найден');
  }

  const state = await getOrCreateTapGameState(userId, context);

  if (state.activeBoost) {
    throw new TapGameError('BOOST_ALREADY_ACTIVE', 'Уже активен другой инструмент');
  }

  if (state.round < shopItem.minRound) {
    throw new TapGameError(
      'ITEM_LOCKED',
      `Предмет доступен после ${shopItem.minRound - 1}-го раунда`
    );
  }

  if (state.points < shopItem.cost) {
    throw new TapGameError('NOT_ENOUGH_POINTS', 'Недостаточно баллов');
  }

  state.points -= shopItem.cost;
  state.activeBoost = {
    itemId: shopItem.id,
    multiplier: shopItem.multiplier,
    remainingUses: shopItem.uses,
  };

  await state.save();
  return state;
};

export const getTapGameParticipantIds = (context: TapGameContext): string[] => [
  context.relationship.userId.toString(),
  context.relationship.partnerId.toString(),
];

const getRelationshipPairKey = (userId: mongoose.Types.ObjectId, partnerId: mongoose.Types.ObjectId) =>
  [userId.toString(), partnerId.toString()].sort().join(':');

interface RankedTapPairRow {
  relationshipId: string;
  totalTaps: number;
}

const getRankedTapPairRows = async (limit: number): Promise<RankedTapPairRow[]> => {
  const byRelationship = await TapGameState.aggregate<{ _id: mongoose.Types.ObjectId; totalTaps: number }>([
    { $match: { relationshipId: { $ne: null } } },
    {
      $group: {
        _id: '$relationshipId',
        totalTaps: { $max: '$totalTaps' },
      },
    },
    { $match: { totalTaps: { $gt: 0 } } },
  ]);

  const pairBest = new Map<string, RankedTapPairRow>();

  await Promise.all(
    byRelationship.map(async (row) => {
      const relationship = await Relationship.findById(row._id).select('userId partnerId');
      if (!relationship) {
        return;
      }

      const pairKey = getRelationshipPairKey(relationship.userId, relationship.partnerId);
      const candidate: RankedTapPairRow = {
        relationshipId: row._id.toString(),
        totalTaps: row.totalTaps,
      };

      const existing = pairBest.get(pairKey);
      if (!existing || candidate.totalTaps > existing.totalTaps) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  return [...pairBest.values()]
    .sort((a, b) => b.totalTaps - a.totalTaps)
    .slice(0, limit);
};

export const dedupeTapGameStates = async () => {
  const duplicateGroups = await TapGameState.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
    docs: Array<{ id: mongoose.Types.ObjectId; totalTaps: number; updatedAt: Date }>;
  }>([
    { $match: { relationshipId: { $ne: null } } },
    {
      $group: {
        _id: '$relationshipId',
        count: { $sum: 1 },
        docs: {
          $push: {
            id: '$_id',
            totalTaps: '$totalTaps',
            updatedAt: '$updatedAt',
          },
        },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  await Promise.all(
    duplicateGroups.map(async (group) => {
      const sortedDocs = [...group.docs].sort(
        (a, b) =>
          b.totalTaps - a.totalTaps ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const removeIds = sortedDocs.slice(1).map((doc) => doc.id);
      if (removeIds.length > 0) {
        await TapGameState.deleteMany({ _id: { $in: removeIds } });
      }
    })
  );

  const linkedOwnerIds = await TapGameState.distinct('ownerUserId', {
    relationshipId: { $ne: null },
  });

  if (linkedOwnerIds.length > 0) {
    await TapGameState.deleteMany({
      relationshipId: null,
      ownerUserId: { $in: linkedOwnerIds },
    });
  }
};

export const updateTapGameBadges = async () => {
  const topPairs = await getRankedTapPairRows(3);

  await Relationship.updateMany(
    { 'badges.gameId': 'tap' },
    { $pull: { badges: { gameId: 'tap' } } }
  );

  const assignedRelationshipIds = new Set<string>();

  await Promise.all(
    topPairs.map(async (entry, index) => {
      if (assignedRelationshipIds.has(entry.relationshipId)) {
        return;
      }
      assignedRelationshipIds.add(entry.relationshipId);

      await Relationship.findByIdAndUpdate(entry.relationshipId, {
        $push: {
          badges: {
            gameId: 'tap',
            rank: index + 1,
            updatedAt: new Date(),
          },
        },
      });
    })
  );
};

export const dedupeRelationshipTapBadges = async () => {
  const relationships = await Relationship.find({ 'badges.gameId': 'tap' });

  await Promise.all(
    relationships.map(async (relationship) => {
      const tapBadges = relationship.badges.filter((badge) => badge.gameId === 'tap');
      if (tapBadges.length <= 1) {
        return;
      }

      const bestBadge = tapBadges.sort((a, b) => a.rank - b.rank)[0];
      const otherBadges = relationship.badges
        .filter((badge) => badge.gameId !== 'tap')
        .map((badge) => ({
          gameId: badge.gameId,
          rank: badge.rank,
          updatedAt: badge.updatedAt,
        }));

      await Relationship.findByIdAndUpdate(relationship._id, {
        $set: {
          badges: [
            ...otherBadges,
            {
              gameId: bestBadge.gameId,
              rank: bestBadge.rank,
              updatedAt: bestBadge.updatedAt,
            },
          ],
        },
      });
    })
  );
};

export const migrateLegacyTapGameStates = async () => {
  await dedupeTapGameStates();
  await dedupeRelationshipTapBadges();

  const legacyStates = await TapGameState.find({
    $or: [
      { ownerUserId: { $exists: false } },
      { ownerUserId: null },
      { roundStarterUserId: { $exists: false } },
      { roundStarterUserId: null, totalTaps: { $gt: 0 } },
    ],
  });

  await Promise.all(
    legacyStates.map(async (state) => {
      if (!state.relationshipId) {
        await TapGameState.deleteOne({ _id: state._id });
        return;
      }

      const relationship = await Relationship.findById(state.relationshipId);
      if (!relationship) {
        await TapGameState.deleteOne({ _id: state._id });
        return;
      }

      if (!state.ownerUserId) {
        state.ownerUserId = relationship.userId;
      }
      state.waitingForPartnerLink = false;

      if (!state.roundStarterUserId) {
        if (state.totalTaps > 0 && state.activeUserId) {
          state.roundStarterUserId = state.activeUserId;
        } else if (state.totalTaps > 0) {
          state.roundStarterUserId = relationship.userId;
        }
      }

      if (!state.activeUserId && state.roundStarterUserId) {
        state.activeUserId = state.roundStarterUserId;
      }

      await state.save();
    })
  );

  await dedupeTapGameStates();
  await dedupeRelationshipTapBadges();
  await updateTapGameBadges();
};

export const getTapLeaderboard = async (limit = 50) => {
  const rankedRows = await getRankedTapPairRows(limit);

  const results = await Promise.all(
    rankedRows.map(async (entry, index) => {
      const relationship = await Relationship.findById(entry.relationshipId);
      if (!relationship) {
        return null;
      }

      const [user, partner] = await Promise.all([
        User.findById(relationship.userId).select('username firstName lastName avatar'),
        User.findById(relationship.partnerId).select('username firstName lastName avatar'),
      ]);

      if (!user || !partner) {
        return null;
      }

      return {
        rank: index + 1,
        relationshipId: entry.relationshipId,
        totalScore: entry.totalTaps,
        users: [
          {
            id: user._id.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          {
            id: partner._id.toString(),
            username: partner.username,
            firstName: partner.firstName,
            lastName: partner.lastName,
            avatar: partner.avatar,
          },
        ],
      };
    })
  );

  return results
    .filter(Boolean)
    .map((entry, index) => ({ ...entry!, rank: index + 1 }));
};
