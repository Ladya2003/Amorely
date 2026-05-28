import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import GeoGameState from '../models/geoGameState';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import {
  GEO_LOBBY_COUNTDOWN_SEC,
  GEO_MAX_ROUNDS_PER_DAY,
  GEO_ROUND_TIME_SEC,
  calculateGeoRoundScore,
  getGeoLocation,
  getGeoLocationCount,
  haversineDistanceKm,
  pickNextGeoLocation,
} from './geoGameConfig';

export interface GeoGameRelationship {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
}

export interface GeoGameContext {
  relationship: GeoGameRelationship;
  ownerUserId: string;
  partnerUserId: string;
}

export interface GeoGuessResult {
  userId: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  pointsEarned: number;
  submitted: boolean;
}

export interface GeoRoundReveal {
  locationId: string;
  name: string;
  imageUrl: string;
  actualLat: number;
  actualLng: number;
  guesses: GeoGuessResult[];
  totalPointsEarned: number;
  timedOut: boolean;
  continent: string;
  country: string;
  city: string;
}

export interface GeoGamePublicState {
  relationshipId: string;
  hasPartner: true;
  totalScore: number;
  roundsCompleted: number;
  points: number;
  roundTimeSec: number;
  locationsTotal: number;
  locationsRemaining: number;
  roundsPlayedToday: number;
  maxRoundsPerDay: number;
  roundsRemainingToday: number;
  dailyLimitReached: boolean;
  nextRoundsAvailableAt: string | null;
  secondsUntilNextRounds: number;
  inLobby: boolean;
  lobbyCountdownSec: number;
  readyUserIds: string[];
  lobbySecondsRemaining: number;
  currentRound: {
    locationId: string;
    imageUrl: string;
    startedAt: string;
    deadlineAt: string;
    status: 'guessing' | 'revealed';
    secondsRemaining: number;
    guesses: Array<{ userId: string; lat: number; lng: number }>;
    reveal: GeoRoundReveal | null;
  } | null;
}

export class GeoGameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const resolveGeoGameContext = async (userId: string): Promise<GeoGameContext> => {
  const relationshipContext = await requireActiveRelationship(userId);

  if (!relationshipContext) {
    throw new GeoGameError(
      'NO_PARTNER',
      'Для игры нужен партнёр. Добавьте его в настройках профиля.'
    );
  }

  const relationship = relationshipContext.relationship as GeoGameRelationship;

  return {
    relationship,
    ownerUserId: relationship.userId.toString(),
    partnerUserId: relationshipContext.partnerId,
  };
};

const getSecondsRemaining = (deadlineAt: Date) =>
  Math.max(0, Math.ceil((deadlineAt.getTime() - Date.now()) / 1000));

const buildRoundReveal = (
  locationId: string,
  roundGuesses: Array<{ userId: mongoose.Types.ObjectId | string; lat: number; lng: number }>,
  timedOut: boolean
): GeoRoundReveal => {
  const location = getGeoLocation(locationId);
  if (!location) {
    throw new GeoGameError('LOCATION_NOT_FOUND', 'Локация не найдена');
  }

  const guessResults: GeoGuessResult[] = roundGuesses.map((guess) => {
    const distanceKm = haversineDistanceKm(guess.lat, guess.lng, location.lat, location.lng);
    const pointsEarned = calculateGeoRoundScore(distanceKm);

    return {
      userId: guess.userId.toString(),
      lat: guess.lat,
      lng: guess.lng,
      distanceKm: Math.round(distanceKm * 100) / 100,
      pointsEarned,
      submitted: true,
    };
  });

  const totalPointsEarned = guessResults.reduce((sum, guess) => sum + guess.pointsEarned, 0);

  return {
    locationId: location.id,
    name: location.name,
    imageUrl: location.imageUrl,
    actualLat: location.lat,
    actualLng: location.lng,
    guesses: guessResults,
    totalPointsEarned,
    timedOut,
    continent: location.continent,
    country: location.country,
    city: location.city,
  };
};

const buildTimeoutReveal = (locationId: string): GeoRoundReveal => {
  const location = getGeoLocation(locationId);
  if (!location) {
    throw new GeoGameError('LOCATION_NOT_FOUND', 'Локация не найдена');
  }

  return {
    locationId: location.id,
    name: location.name,
    imageUrl: location.imageUrl,
    actualLat: location.lat,
    actualLng: location.lng,
    guesses: [],
    totalPointsEarned: 0,
    timedOut: true,
    continent: location.continent,
    country: location.country,
    city: location.city,
  };
};

const getRoundGuesses = (round: any) => {
  if (Array.isArray(round.guesses) && round.guesses.length > 0) {
    return round.guesses;
  }

  if (round.guessLat != null && round.guessLng != null && round.submittedByUserId) {
    return [{ userId: round.submittedByUserId, lat: round.guessLat, lng: round.guessLng }];
  }

  return [];
};

const calculateRoundTotalPoints = (
  locationId: string,
  roundGuesses: Array<{ lat: number; lng: number }>
) => {
  const location = getGeoLocation(locationId);
  if (!location) {
    return 0;
  }

  return roundGuesses.reduce((sum, guess) => {
    const distanceKm = haversineDistanceKm(guess.lat, guess.lng, location.lat, location.lng);
    return sum + calculateGeoRoundScore(distanceKm);
  }, 0);
};

const finalizeRound = (state: any, timedOut: boolean) => {
  if (!state.currentRound || state.currentRound.status !== 'guessing') {
    return;
  }

  const roundGuesses = getRoundGuesses(state.currentRound);
  const totalPoints = calculateRoundTotalPoints(state.currentRound.locationId, roundGuesses);

  state.currentRound.status = 'revealed';
  state.currentRound.pointsEarned = totalPoints;
  state.currentRound.timedOut = timedOut;
  state.roundsCompleted += 1;
  awardRoundPoints(state, totalPoints);
  recordCompletedRound(state);
};

const getTodayDayKey = () => new Date().toISOString().slice(0, 10);

const syncDailyRoundCounters = (state: any) => {
  const today = getTodayDayKey();
  if (state.roundsDayKey !== today) {
    state.roundsDayKey = today;
    state.roundsPlayedToday = 0;
  }
};

const getRoundsPlayedToday = (state: any) => {
  syncDailyRoundCounters(state);
  return state.roundsPlayedToday ?? 0;
};

const getScoredLocationsRemaining = (usedLocationIds: string[]) =>
  Math.max(0, getGeoLocationCount() - usedLocationIds.length);

const hasReachedDailyRoundLimit = (state: any) =>
  getRoundsPlayedToday(state) >= GEO_MAX_ROUNDS_PER_DAY;

const canPlayMoreRoundsToday = (state: any) => !hasReachedDailyRoundLimit(state);

const recordCompletedRound = (state: any) => {
  state.roundsPlayedToday = getRoundsPlayedToday(state) + 1;
  state.roundsDayKey = getTodayDayKey();
};

const finalizeRoundWithoutGuess = (state: any) => {
  finalizeRound(state, true);
};

const awardRoundPoints = (state: any, pointsEarned: number) => {
  if (hasReachedDailyRoundLimit(state)) {
    return;
  }
  state.totalScore += pointsEarned;
  state.points += pointsEarned;
};

const getNextRoundsAvailableAt = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
};

const buildGeoDailyMeta = (state: any) => {
  const roundsPlayedToday = getRoundsPlayedToday(state);
  const dailyLimitReached = roundsPlayedToday >= GEO_MAX_ROUNDS_PER_DAY;
  const nextRoundsAvailableAt = dailyLimitReached ? getNextRoundsAvailableAt() : null;
  const secondsUntilNextRounds = nextRoundsAvailableAt
    ? Math.max(0, Math.ceil((nextRoundsAvailableAt.getTime() - Date.now()) / 1000))
    : 0;

  return {
    roundsPlayedToday,
    maxRoundsPerDay: GEO_MAX_ROUNDS_PER_DAY,
    roundsRemainingToday: Math.max(0, GEO_MAX_ROUNDS_PER_DAY - roundsPlayedToday),
    dailyLimitReached,
    nextRoundsAvailableAt: nextRoundsAvailableAt?.toISOString() ?? null,
    secondsUntilNextRounds,
  };
};

const getUniqueParticipantIds = (context: GeoGameContext): string[] => [
  ...new Set(getGeoGameParticipantIds(context)),
];

const startNewRoundOnDocument = (state: any) => {
  if (!canPlayMoreRoundsToday(state)) {
    state.currentRound = null;
    return false;
  }

  const picked = pickNextGeoLocation(state.usedLocationIds || []);

  if (!picked) {
    state.currentRound = null;
    return false;
  }

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + GEO_ROUND_TIME_SEC * 1000);

  state.usedLocationIds = picked.usedLocationIds;
  state.currentRound = {
    locationId: picked.location.id,
    startedAt,
    deadlineAt,
    status: 'guessing',
    guesses: [],
    pointsEarned: null,
    timedOut: false,
  };

  return true;
};

const buildNewRoundPayload = (state: any) => {
  if (!canPlayMoreRoundsToday(state)) {
    return {
      currentRound: null,
    };
  }

  const picked = pickNextGeoLocation(state.usedLocationIds || []);

  if (!picked) {
    return {
      currentRound: null,
    };
  }

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + GEO_ROUND_TIME_SEC * 1000);

  return {
    usedLocationIds: picked.usedLocationIds,
    currentRound: {
      locationId: picked.location.id,
      startedAt,
      deadlineAt,
      status: 'guessing',
      guesses: [],
      pointsEarned: null,
      timedOut: false,
    },
  };
};

const startNewRoundAtomic = async (stateId: mongoose.Types.ObjectId) => {
  const state = await GeoGameState.findById(stateId);
  if (!state || state.currentRound) {
    return state;
  }

  const roundPayload = buildNewRoundPayload(state);

  if (!roundPayload.currentRound) {
    return GeoGameState.findByIdAndUpdate(
      stateId,
      {
        $set: {
          currentRound: null,
          readyUserIds: [],
          lobbyCountdownEndsAt: null,
        },
      },
      { new: true }
    );
  }

  const started = await GeoGameState.findOneAndUpdate(
    {
      _id: stateId,
      currentRound: null,
    },
    {
      $set: {
        ...roundPayload,
        readyUserIds: [],
        lobbyCountdownEndsAt: null,
      },
    },
    { new: true }
  );

  return started || GeoGameState.findById(stateId);
};

const startNewRound = (state: any) => {
  startNewRoundOnDocument(state);
};

export const formatGeoGameState = (state: any): GeoGamePublicState => {
  const currentRound = state.currentRound
    ? (() => {
        const location = getGeoLocation(state.currentRound.locationId);
        const roundGuesses = getRoundGuesses(state.currentRound);
        let reveal: GeoRoundReveal | null = null;

        if (state.currentRound.status === 'revealed') {
          if (state.currentRound.timedOut && roundGuesses.length === 0) {
            reveal = buildTimeoutReveal(state.currentRound.locationId);
          } else {
            reveal = buildRoundReveal(
              state.currentRound.locationId,
              roundGuesses,
              Boolean(state.currentRound.timedOut)
            );
          }
        }

        return {
          locationId: state.currentRound.locationId,
          imageUrl: location?.imageUrl || '',
          startedAt: new Date(state.currentRound.startedAt).toISOString(),
          deadlineAt: new Date(state.currentRound.deadlineAt).toISOString(),
          status: state.currentRound.status,
          secondsRemaining: getSecondsRemaining(new Date(state.currentRound.deadlineAt)),
          guesses: roundGuesses.map((guess: { userId: { toString(): string }; lat: number; lng: number }) => ({
            userId: guess.userId.toString(),
            lat: guess.lat,
            lng: guess.lng,
          })),
          reveal,
        };
      })()
    : null;

  const dailyMeta = buildGeoDailyMeta(state);
  const locationsRemaining = getScoredLocationsRemaining(state.usedLocationIds || []);
  const inLobby = !currentRound && canPlayMoreRoundsToday(state);
  const readyUserIds = (state.readyUserIds || []).map((id: { toString(): string }) => id.toString());
  const lobbyCountdownEndsAt = state.lobbyCountdownEndsAt
    ? new Date(state.lobbyCountdownEndsAt)
    : null;

  return {
    relationshipId: state.relationshipId.toString(),
    hasPartner: true,
    totalScore: state.totalScore ?? 0,
    roundsCompleted: state.roundsCompleted ?? 0,
    points: state.points ?? 0,
    roundTimeSec: GEO_ROUND_TIME_SEC,
    locationsTotal: getGeoLocationCount(),
    locationsRemaining,
    ...dailyMeta,
    inLobby,
    lobbyCountdownSec: GEO_LOBBY_COUNTDOWN_SEC,
    readyUserIds,
    lobbySecondsRemaining: lobbyCountdownEndsAt
      ? getSecondsRemaining(lobbyCountdownEndsAt)
      : 0,
    currentRound,
  };
};

export const expireGeoRoundIfNeeded = async (state: any): Promise<boolean> => {
  if (!state.currentRound || state.currentRound.status !== 'guessing') {
    return false;
  }

  if (getSecondsRemaining(new Date(state.currentRound.deadlineAt)) > 0) {
    return false;
  }

  finalizeRoundWithoutGuess(state);
  await state.save();
  return true;
};

const syncGeoGameState = async (state: any) => {
  await expireGeoRoundIfNeeded(state);
};

const syncGeoLobby = async (state: any) => {
  if (state.currentRound) {
    return state;
  }

  if (
    state.lobbyCountdownEndsAt &&
    getSecondsRemaining(new Date(state.lobbyCountdownEndsAt)) <= 0
  ) {
    const started = await startNewRoundAtomic(state._id as mongoose.Types.ObjectId);
    if (!started) {
      throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
    }
    return started;
  }

  return state;
};

export const getOrCreateGeoGameState = async (context: GeoGameContext) => {
  const relationshipId = context.relationship._id;
  let state = await GeoGameState.findOne({ relationshipId });

  if (!state) {
    try {
      state = await GeoGameState.create({
        relationshipId,
        totalScore: 0,
        roundsCompleted: 0,
        points: 0,
        usedLocationIds: [],
        roundsDayKey: getTodayDayKey(),
        roundsPlayedToday: 0,
        readyUserIds: [],
        lobbyCountdownEndsAt: null,
        currentRound: null,
      });
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
      state = await GeoGameState.findOne({ relationshipId });
    }
  }

  if (!state) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  await syncGeoGameState(state);
  const refreshedState = await GeoGameState.findById(state._id);
  if (!refreshedState) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  return syncGeoLobby(refreshedState);
};

export const setGeoPlayerReady = async (userId: string, context: GeoGameContext) => {
  let state = await getOrCreateGeoGameState(context);

  if (state.currentRound) {
    throw new GeoGameError('ROUND_ALREADY_ACTIVE', 'Раунд уже идёт');
  }

  if (!canPlayMoreRoundsToday(state)) {
    throw new GeoGameError(
      'DAILY_LIMIT_REACHED',
      `Сегодня можно угадать не больше ${GEO_MAX_ROUNDS_PER_DAY} мест. Новые раунды — завтра.`
    );
  }

  const participantIds = getUniqueParticipantIds(context);

  const withReady = await GeoGameState.findOneAndUpdate(
    { _id: state._id, currentRound: null },
    { $addToSet: { readyUserIds: new mongoose.Types.ObjectId(userId) } },
    { new: true }
  );

  if (!withReady) {
    state = await GeoGameState.findById(state._id);
    if (!state) {
      throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
    }
    if (state.currentRound) {
      throw new GeoGameError('ROUND_ALREADY_ACTIVE', 'Раунд уже идёт');
    }
  } else {
    state = withReady;
  }

  const readyIds = new Set<string>(
    (state.readyUserIds || []).map((id: { toString(): string }) => id.toString())
  );
  const allReady = participantIds.every((participantId) => readyIds.has(participantId));

  if (allReady && !state.lobbyCountdownEndsAt) {
    const countdownEndsAt = new Date(Date.now() + GEO_LOBBY_COUNTDOWN_SEC * 1000);
    const withCountdown = await GeoGameState.findOneAndUpdate(
      {
        _id: state._id,
        currentRound: null,
        lobbyCountdownEndsAt: null,
      },
      { $set: { lobbyCountdownEndsAt: countdownEndsAt } },
      { new: true }
    );
    if (withCountdown) {
      state = withCountdown;
    }
  }

  return syncGeoLobby(state);
};

export const getGeoGameState = async (context: GeoGameContext) => {
  const state = await GeoGameState.findOne({ relationshipId: context.relationship._id });
  if (!state) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  await syncGeoGameState(state);
  return GeoGameState.findById(state._id);
};

export const submitGeoGuess = async (
  userId: string,
  context: GeoGameContext,
  guessLat: number,
  guessLng: number
) => {
  if (!Number.isFinite(guessLat) || !Number.isFinite(guessLng)) {
    throw new GeoGameError('INVALID_GUESS', 'Некорректные координаты');
  }

  if (guessLat < -90 || guessLat > 90 || guessLng < -180 || guessLng > 180) {
    throw new GeoGameError('INVALID_GUESS', 'Координаты вне допустимого диапазона');
  }

  const state = await getGeoGameState(context);
  if (!state) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  if (!state.currentRound || state.currentRound.status !== 'guessing') {
    throw new GeoGameError('ROUND_NOT_ACTIVE', 'Сейчас нельзя отправить ответ');
  }

  if (getSecondsRemaining(new Date(state.currentRound.deadlineAt)) <= 0) {
    await expireGeoRoundIfNeeded(state);
    throw new GeoGameError('ROUND_EXPIRED', 'Время раунда истекло');
  }

  const participantIds = getUniqueParticipantIds(context);
  const roundGuesses = getRoundGuesses(state.currentRound);

  if (roundGuesses.some((guess: { userId: { toString(): string } }) => guess.userId.toString() === userId)) {
    throw new GeoGameError('GUESS_ALREADY_SUBMITTED', 'Вы уже отправили ответ');
  }

  if (!Array.isArray(state.currentRound.guesses)) {
    state.currentRound.guesses = [];
  }

  state.currentRound.guesses.push({
    userId: new mongoose.Types.ObjectId(userId),
    lat: guessLat,
    lng: guessLng,
  });

  if (state.currentRound.guesses.length >= participantIds.length) {
    finalizeRound(state, false);
  }

  await state.save();

  const freshState = await GeoGameState.findById(state._id);
  if (!freshState?.currentRound) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  const roundStatus = freshState.currentRound.status as 'guessing' | 'revealed';
  const reveal =
    roundStatus === 'revealed'
      ? buildRoundReveal(freshState.currentRound.locationId, getRoundGuesses(freshState.currentRound), false)
      : null;

  return { state: freshState, reveal };
};

export const expireGeoRound = async (context: GeoGameContext) => {
  const state = await GeoGameState.findOne({ relationshipId: context.relationship._id });

  if (!state) {
    throw new GeoGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  const expired = await expireGeoRoundIfNeeded(state);
  if (!expired) {
    throw new GeoGameError('ROUND_NOT_EXPIRED', 'Раунд ещё не завершён');
  }

  return state;
};

export const advanceGeoRound = async (context: GeoGameContext) => {
  const state = await GeoGameState.findOne({ relationshipId: context.relationship._id });

  if (!state?.currentRound || state.currentRound.status !== 'revealed') {
    throw new GeoGameError('ROUND_NOT_REVEALED', 'Сначала завершите текущий раунд');
  }

  state.currentRound = null;
  state.readyUserIds = [];
  state.lobbyCountdownEndsAt = null;
  await state.save();

  return syncGeoLobby(state);
};

export const getGeoGameParticipantIds = (context: GeoGameContext): string[] => [
  context.relationship.userId.toString(),
  context.relationship.partnerId.toString(),
];

export const getGeoLeaderboard = async (limit = 50) => {
  const entries = await GeoGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(limit)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    entries.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select('userId partnerId');
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()].sort().join(':');
      const candidate = {
        relationshipId: entry.relationshipId!.toString(),
        totalScore: entry.totalScore ?? 0,
      };

      const existing = pairBest.get(pairKey);
      if (!existing || candidate.totalScore > existing.totalScore) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  const rankedRows = [...pairBest.values()]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

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
        totalScore: entry.totalScore,
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

export const updateGeoGameBadges = async () => {
  const topPairs = await GeoGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(10)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    topPairs.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select('userId partnerId');
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()].sort().join(':');
      const candidate = {
        relationshipId: entry.relationshipId!.toString(),
        totalScore: entry.totalScore ?? 0,
      };

      const existing = pairBest.get(pairKey);
      if (!existing || candidate.totalScore > existing.totalScore) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  const ranked = [...pairBest.values()].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

  await Relationship.updateMany(
    { 'badges.gameId': 'geo' },
    { $pull: { badges: { gameId: 'geo' } } }
  );

  const assignedRelationshipIds = new Set<string>();

  await Promise.all(
    ranked.map(async (entry, index) => {
      if (assignedRelationshipIds.has(entry.relationshipId)) {
        return;
      }
      assignedRelationshipIds.add(entry.relationshipId);

      await Relationship.findByIdAndUpdate(entry.relationshipId, {
        $push: {
          badges: {
            gameId: 'geo',
            rank: index + 1,
            updatedAt: new Date(),
          },
        },
      });
    })
  );
};
