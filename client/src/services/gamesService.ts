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
}

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

export const postTapGameTap = async () => {
  const response = await axios.post(
    `${API_URL}/api/games/tap/tap`,
    {},
    { headers: authHeaders() }
  );
  return response.data as { state: TapGameState; roundCompletionBonus?: number };
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
  maxScoredRounds: number;
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
  allScoredRoundsDone: boolean;
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
  currentQuestion: {
    cellKey: string;
    categoryId: string;
    categoryName: string;
    points: number;
    questionText: string;
    status: 'answering' | 'revealed';
    secondsRemaining: number;
    myAnswerSubmitted: boolean;
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

export const postQuizAnswer = async (answer: string) => {
  const response = await axios.post(
    `${API_URL}/api/games/quiz/answer`,
    { answer },
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
