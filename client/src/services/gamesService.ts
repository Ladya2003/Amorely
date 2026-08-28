import axios from 'axios';
import { API_URL } from '../config';
import type { GameCatalogEntry } from '../components/Chat/gamesData';

export interface GamePartnerInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface GameDetailsResponse {
  game: GameCatalogEntry;
  hasPartner: boolean;
  partner: GamePartnerInfo | null;
  dailyReset: GameDailyResetStatus | null;
}

export interface GameDailyResetStatus {
  hasPlayed: boolean;
}

export type DailyResetGameId = 'geo' | 'draw' | 'quiz';

export type GameDailyResetMap = Record<DailyResetGameId, GameDailyResetStatus | null>;

export interface LeaderboardUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface LeaderboardEntry {
  rank: number;
  relationshipId: string;
  totalScore: number;
  users: LeaderboardUser[];
  bestTimeMs?: number | null;
  elapsedMs?: number;
  altitudeM?: number;
  status?: 'finished' | 'playing';
}

export interface TapGameBlock {
  id: string;
  imageUrl: string;
  label: string;
  color?: string;
}

export interface TapGameState {
  relationshipId: string;
  hasPartner: boolean;
  round: number;
  targetTaps: number;
  activeUserId: string | null;
  userTapsThisRound: number;
  partnerTapsThisRound: number;
  userId: string;
  partnerId: string;
  blockIndex: number;
  block: TapGameBlock;
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

export interface TapShopItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  multiplier: number;
  uses: number;
  minRound: number;
}

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchGamesCatalog = async () => {
  const response = await axios.get(`${API_URL}/api/games/catalog`, {
    headers: authHeaders(),
  });
  return response.data.games as GameCatalogEntry[];
};

export const fetchGamesDailyReset = async () => {
  const response = await axios.get(`${API_URL}/api/games/daily-reset`, {
    headers: authHeaders(),
  });
  return response.data.games as GameDailyResetMap;
};

export const fetchGameDetails = async (gameId: string) => {
  const response = await axios.get(`${API_URL}/api/games/${gameId}`, {
    headers: authHeaders(),
  });
  return response.data as GameDetailsResponse;
};

export const fetchGameLeaderboard = async (gameId: string) => {
  const response = await axios.get(`${API_URL}/api/games/${gameId}/leaderboard`, {
    headers: authHeaders(),
  });
  return response.data.entries as LeaderboardEntry[];
};

export const fetchTapGameState = async () => {
  const response = await axios.get(`${API_URL}/api/games/tap/state`, {
    headers: authHeaders(),
  });
  return response.data as { state: TapGameState; shopItems: TapShopItem[] };
};

export const postTapGameTap = async (count = 1) => {
  const response = await axios.post(
    `${API_URL}/api/games/tap/tap`,
    { count },
    { headers: authHeaders() }
  );
  return response.data as { state: TapGameState; roundCompletionBonus?: number };
};

export const postTapGameTapKeepalive = (count: number) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}/api/games/tap/tap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ count }),
    keepalive: true,
  });
};

export const buyTapShopItem = async (itemId: string) => {
  const response = await axios.post(
    `${API_URL}/api/games/tap/shop/buy`,
    { itemId },
    { headers: authHeaders() }
  );
  return response.data.state as TapGameState;
};

/** Синхронизировать с GEO_MAX_ROUND_POINTS в server/src/games/geoGameConfig.ts */
export const GEO_MAX_POINTS_PER_GUESS = 5000;

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

export interface GeoGameState {
  relationshipId: string;
  hasPartner: boolean;
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
  waitingForPartnerResults: boolean;
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

export const fetchGeoGameState = async () => {
  const response = await axios.get(`${API_URL}/api/games/geo/state`, {
    headers: authHeaders(),
  });
  return response.data as { state: GeoGameState };
};

export const postGeoReady = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/geo/ready`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: GeoGameState };
};

export const postGeoGuess = async (lat: number, lng: number) => {
  const response = await axios.post(
    `${API_URL}/api/games/geo/guess`,
    { lat, lng },
    { headers: authHeaders() }
  );
  return response.data as { state: GeoGameState };
};

export const advanceGeoRound = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/geo/next-round`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: GeoGameState };
};

export const expireGeoRound = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/geo/expire`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: GeoGameState };
};

export interface DrawStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isEraser?: boolean;
  isFill?: boolean;
}

export interface DrawGuessAttempt {
  userId: string;
  text: string;
  isOwnGuess: boolean;
}

export interface DrawRoundReveal {
  word: string;
  guessText: string | null;
  wasCorrect: boolean;
  pointsEarned: number;
}

export interface DrawGameState {
  relationshipId: string;
  hasPartner: boolean;
  totalScore: number;
  roundsCompleted: number;
  scoredRoundsCompleted: number;
  scoredRoundsToday: number;
  maxScoredRoundsPerDay: number;
  dailyScoredLimitReached: boolean;
  canEarnRatingPoints: boolean;
  roundTimeDrawingSec: number;
  roundTimeGuessingSec: number;
  inLobby: boolean;
  lobbyCountdownSec: number;
  readyUserIds: string[];
  lobbySecondsRemaining: number;
  waitingForPartnerResults: boolean;
  currentRound: {
    wordId: string;
    drawerUserId: string;
    status: 'drawing' | 'awaiting_guesser' | 'guessing' | 'revealed';
    drawingSecondsRemaining: number;
    guessingSecondsRemaining: number;
    strokes: DrawStroke[];
    guessAttempts: DrawGuessAttempt[];
    yourWord: string | null;
    isDrawer: boolean;
    isGuesser: boolean;
    canUndo: boolean;
    canRedo: boolean;
    reveal: DrawRoundReveal | null;
  } | null;
}

export const fetchDrawGameState = async () => {
  const response = await axios.get(`${API_URL}/api/games/draw/state`, {
    headers: authHeaders(),
  });
  return response.data as { state: DrawGameState };
};

export const postDrawReady = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/ready`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawStroke = async (stroke: DrawStroke) => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/stroke`,
    stroke,
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawFinishDrawing = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/finish-drawing`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawGuess = async (guess: string) => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/guess`,
    { guess },
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawClearStrokes = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/clear-strokes`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawUndo = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/undo`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawRedo = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/redo`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const postDrawClearGuessAttempts = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/clear-guess-attempts`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export const advanceDrawRound = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/draw/next-round`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: DrawGameState };
};

export interface QuizAnswerResult {
  userId: string;
  text: string;
  isCorrect: boolean;
  pointsEarned: number;
  submitted: boolean;
}

export interface QuizQuestionReveal {
  cellKey: string;
  categoryId: string;
  points: number;
  questionText: string;
  correctAnswer: string;
  correctOptionId: string;
  answers: QuizAnswerResult[];
  pointsAwardedTotal: number;
  secondsRemaining: number;
}

export interface QuizBoardCell {
  cellKey: string;
  categoryId: string;
  categoryName: string;
  points: number;
  used: boolean;
}

export interface QuizGameState {
  relationshipId: string;
  hasPartner: boolean;
  totalScore: number;
  questionTimeSec: number;
  inLobby: boolean;
  lobbyCountdownSec: number;
  readyUserIds: string[];
  lobbySecondsRemaining: number;
  sessionActive: boolean;
  onCooldown: boolean;
  cooldownSecondsRemaining: number;
  nextBoardAvailableAt: string | null;
  boardCells: QuizBoardCell[];
  cellsRemaining: number;
  isMyTurnToPick: boolean;
  currentQuestion: {
    cellKey: string;
    categoryId: string;
    categoryName: string;
    points: number;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    status: 'answering' | 'revealed';
    secondsRemaining: number;
    myOptionId: string | null;
    myAnswerSubmitted: boolean;
    partnerOptionId: string | null;
    partnerAnswerSubmitted: boolean;
    reveal: QuizQuestionReveal | null;
  } | null;
}

export const fetchQuizGameState = async () => {
  const response = await axios.get(`${API_URL}/api/games/quiz/state`, {
    headers: authHeaders(),
  });
  return response.data as { state: QuizGameState };
};

export const postQuizReady = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/ready`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: QuizGameState };
};

export const postQuizPick = async (categoryId: string, points: number) => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/pick`,
    { categoryId, points },
    { headers: authHeaders() }
  );
  return response.data as { state: QuizGameState };
};

export const postQuizAnswer = async (optionId: string) => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/answer`,
    { optionId },
    { headers: authHeaders() }
  );
  return response.data as { state: QuizGameState };
};

export const postQuizDismissReveal = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/dismiss-reveal`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: QuizGameState };
};

export const syncQuizGameState = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/sync`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: QuizGameState };
};

export type CliffScene = 'hub' | 'bridge' | 'lift' | 'ropes' | 'finished';

export interface CliffLiftPet {
  id: string;
  ownerId: string;
  mine: boolean;
  name: string;
  level: number;
  species: string;
  variant: string;
  imageUrl: string;
}
export type CliffMetal = 'iron' | 'copper';
export type CliffShopItemId = 'iron_pickaxe' | 'copper_pickaxe' | 'axe';
export type CliffIntroLine = 'wow' | 'agree';

export interface CliffPublicUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CliffPublicBoulder {
  id: string;
  metal: CliffMetal;
  yield: number;
  tapsRequired: number;
  tapsDone: number;
  depleted: boolean;
}

export interface CliffShopPublicItem {
  id: CliffShopItemId;
  canBuy: boolean;
  lockReason: 'owned' | 'already_bought' | 'taken' | 'no_funds' | 'no_ore' | null;
}

export interface CliffGameState {
  relationshipId: string;
  hasPartner: true;
  userId: string;
  partnerId: string;
  me: CliffPublicUser;
  partner: CliffPublicUser;
  scene: CliffScene;
  altitudeM: number;
  gateDestroyed: boolean;
  runStartedAt: string | null;
  timerPaused: boolean;
  elapsedMs: number;
  bestTimeMs: number | null;
  lastTimeMs: number | null;
  inventory: {
    iron: number;
    copper: number;
    hasAxe: boolean;
    hasIronPickaxe: boolean;
    hasCopperPickaxe: boolean;
  };
  amoreCoins: number;
  myPurchasedPickaxe: CliffMetal | null;
  partnerPurchasedPickaxe: CliffMetal | null;
  shopItems: CliffShopPublicItem[];
  boulders: CliffPublicBoulder[];
  mineResetAt: string | null;
  presentUserIds: string[];
  myPresent: boolean;
  partnerPresent: boolean;
  bridge: {
    myStones: number;
    partnerStones: number;
    myHolesCompleted: number;
    partnerHolesCompleted: number;
    repaired: boolean;
    canSurrender: boolean;
  };
  lift: {
    raised: boolean;
    minLevel: number;
    requiredCount: number;
    eligiblePets: CliffLiftPet[];
    standingPets: CliffLiftPet[];
  };
  ropes: {
    myIndex: number;
    partnerIndex: number;
    firstCount: number;
    secondCount: number;
    total: number;
    checkpointIndex: number;
    cleared: boolean;
  };
  canReset: boolean;
}

export interface CliffEnterPayload {
  state: CliffGameState;
  playIntro?: boolean;
  introLine?: CliffIntroLine | null;
  enteringUserId?: string;
}

export interface CliffThrowEvent {
  userId: string;
  hit: boolean;
  angle: number;
  power: number;
}

const postCliffAction = async (path: string, body: Record<string, unknown> = {}) => {
  const response = await axios.post(`${API_URL}/api/games/cliff/${path}`, body, {
    headers: authHeaders(),
  });
  return response.data as { state: CliffGameState } & Record<string, unknown>;
};

export const fetchCliffGameState = async () => {
  const response = await axios.get(`${API_URL}/api/games/cliff/state`, {
    headers: authHeaders(),
  });
  return response.data as { state: CliffGameState };
};

export const postCliffEnter = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/cliff/enter`,
    {},
    { headers: authHeaders() }
  );
  return response.data as CliffEnterPayload;
};

export const postCliffLeave = async () => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}/api/games/cliff/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: '{}',
    keepalive: true,
  });
};

export const postCliffBuy = async (itemId: CliffShopItemId) =>
  (await postCliffAction('shop/buy', { itemId })).state;

export const postCliffEnterMine = async () => (await postCliffAction('mine/enter')).state;

export const postCliffTapBoulder = async (boulderId: string, count = 1) => {
  const response = await axios.post(
    `${API_URL}/api/games/cliff/boulder/tap`,
    { boulderId, count },
    { headers: authHeaders() }
  );
  return response.data as { state: CliffGameState; yielded: number; metal: CliffMetal };
};

export const postCliffBreakGate = async () => (await postCliffAction('gate/break')).state;

export const postCliffThrow = async (hit: boolean, angle: number, power: number) =>
  (await postCliffAction('throw', { hit, angle, power })).state;

export const postCliffSurrender = async () => (await postCliffAction('surrender')).state;

export const postCliffFinish = async () => (await postCliffAction('finish')).state;

export const postCliffActivateLift = async (petIds: string[]) =>
  (await postCliffAction('lift/activate', { petIds })).state;

export const postCliffEnterRopes = async () => (await postCliffAction('ropes/enter')).state;

export const postCliffRopeJump = async (hit: boolean) =>
  (await postCliffAction('ropes/jump', { hit })).state;

export const postCliffReset = async () => (await postCliffAction('reset')).state;

export const postCliffResetGate = async () => (await postCliffAction('reset-gate')).state;

export const postCliffResetRopes = async () => (await postCliffAction('reset-ropes')).state;
