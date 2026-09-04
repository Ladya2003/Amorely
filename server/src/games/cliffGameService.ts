import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import Pet from '../models/pet';
import CliffGameState from '../models/cliffGameState';
import { getPetImagePath } from '../config/petCatalog';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import { getBalance, spendCurrency } from '../services/currencyService';
import {
  CLIFF_BALLS_ALTITUDE,
  CLIFF_BALLS_EACH,
  CLIFF_BALLS_SCORE_THRESHOLD,
  CLIFF_BALL_ZONE_SCORES,
  CLIFF_BRIDGE_ALTITUDE,
  CLIFF_CAVE_CRAFT_STEPS,
  CLIFF_CAVE_ITEMS,
  CLIFF_CAVES_ALTITUDE,
  CLIFF_GUIDE_PET_MIN_LEVEL,
  CLIFF_GUIDES_ALTITUDE,
  CLIFF_GUIDE_PET_STEP_MS,
  CLIFF_GUIDE_TRAIL_MS,
  CLIFF_WORDS_ALTITUDE,
  CLIFF_WORDS_CAMERA_HEIGHT,
  CLIFF_WORDS_CAMERA_KEEP,
  CLIFF_WORDS_CAMERA_START,
  CLIFF_WORDS_CAMERA_UNLOCK_Y,
  CLIFF_WORDS_FINISH_Y,
  CLIFF_WORDS_FUEL_BOUNCE,
  CLIFF_WORDS_FUEL_MAX,
  CLIFF_WORDS_FUEL_PHRASE,
  CLIFF_WORDS_FUEL_START,
  CLIFF_WORDS_MAX_BOUNCE_DY,
  CLIFF_WORDS_MAX_FALL_DY,
  CLIFF_WORDS_PHRASE_IDS,
  CLIFF_WORDS_PLATFORMS,
  CLIFF_WORDS_PLAYER_WIDTH,
  CLIFF_WORDS_WORLD_WIDTH,
  cliffWordsCheckpointAtY,
  cliffWordsCheckpointY,
  cliffWordsPlaceX,
  cliffWordsStartX,
  cliffWordsStartY,
  isCliffWordsPhraseId,
  CLIFF_MINE_RESET_MS,
  clampGuidePetRuns,
  guideMapOf,
  guidePathFrom,
  isCliffGuideDir,
  isGuideFork,
  shiftGuidePoint,
  createCliffCaveBoulders,
  emptyCliffCaveInventory,
  isCliffCaveItemId,
  pickaxeForCaveResource,
  CLIFF_HOLES_REQUIRED,
  CLIFF_HUB_ALTITUDE,
  CLIFF_LIFT_ALTITUDE,
  CLIFF_LIFT_PET_MIN_LEVEL,
  CLIFF_LIFT_PETS_REQUIRED,
  CLIFF_LIFT_RAISED_ALTITUDE,
  CLIFF_ROPES_ALTITUDE,
  CLIFF_ROPES_CHECKPOINT,
  CLIFF_ROPES_CHECKPOINT_ALTITUDE,
  CLIFF_ROPES_END_ALTITUDE,
  CLIFF_ROPES_FIRST,
  CLIFF_ROPES_SECOND,
  CLIFF_ROPES_TOTAL,
  CLIFF_STONES_EACH,
  createCliffBoulders,
  getCliffShopItem,
  type CliffBallZoneScore,
  type CliffCaveCraftAction,
  type CliffCaveInventory,
  type CliffCaveItemId,
  type CliffCaveResource,
  type CliffCaveSide,
  type CliffGuideCellKind,
  type CliffGuideDir,
  type CliffGuidePoint,
  type CliffIntroLine,
  type CliffPickaxeType,
  type CliffScene,
  type CliffShopItemId,
  type CliffWordsPhraseId,
} from './cliffGameConfig';

export interface CliffGameRelationship {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
}

export interface CliffGameContext {
  relationship: CliffGameRelationship;
  ownerUserId: string;
  partnerUserId: string;
}

export interface CliffPublicUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CliffPublicBoulder {
  id: string;
  metal: 'iron' | 'copper';
  yield: number;
  tapsRequired: number;
  tapsDone: number;
  depleted: boolean;
}

export interface CliffPublicCaveBoulder {
  id: string;
  resource: CliffCaveResource;
  side: CliffCaveSide;
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

export interface CliffLiftPublicPet {
  id: string;
  ownerId: string;
  mine: boolean;
  name: string;
  level: number;
  species: string;
  variant: string;
  imageUrl: string;
}

export interface CliffGamePublicState {
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
  myPurchasedPickaxe: CliffPickaxeType | null;
  partnerPurchasedPickaxe: CliffPickaxeType | null;
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
    eligiblePets: CliffLiftPublicPet[];
    standingPets: CliffLiftPublicPet[];
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
  balls: {
    myRemaining: number;
    partnerRemaining: number;
    myScore: number;
    partnerScore: number;
    pairScore: number;
    each: number;
    threshold: number;
    zoneScores: number[];
    cleared: boolean;
    canRetry: boolean;
  };
  caves: {
    role: CliffCaveSide;
    step: 1 | 2 | 3 | 4;
    action: CliffCaveCraftAction;
    canCraft: boolean;
    canGift: boolean;
    giftables: Array<{ id: CliffCaveItemId; count: number }>;
    my: CliffCaveInventory;
    partner: CliffCaveInventory;
    boulders: CliffPublicCaveBoulder[];
    cleared: boolean;
  };
  guides: {
    role: CliffCaveSide;
    width: number;
    height: number;
    cells: CliffGuideCellKind[][];
    my: {
      x: number;
      y: number;
      escaped: boolean;
      runsLeft: number;
      runsTotal: number;
      lanternWithPet: boolean;
      trail: CliffGuidePoint[];
      trailUntil: string | null;
      lastFork: CliffGuidePoint | null;
      pet: CliffLiftPublicPet | null;
      trapTold: boolean;
    };
    partnerEscaped: boolean;
    bothEscaped: boolean;
    eligiblePets: CliffLiftPublicPet[];
    minLevel: number;
  };
  words: {
    role: CliffCaveSide;
    world: {
      width: number;
      cameraHeight: number;
      finishY: number;
      platforms: Array<{ x: number; y: number; w: number; checkpoint: 0 | 1 | 2 | 3 }>;
    };
    my: {
      x: number;
      y: number;
      fuel: number;
      checkpoint: number;
      cleared: boolean;
      usedPhrases: CliffWordsPhraseId[];
    };
    partner: {
      x: number;
      y: number;
      fuel: number;
      checkpoint: number;
      cleared: boolean;
    };
    phraseIds: CliffWordsPhraseId[];
    fuelStart: number;
    fuelMax: number;
    fuelBounce: number;
    fuelPhrase: number;
    bothCleared: boolean;
    failSeq: number;
    fuelHint: boolean;
    introTold: boolean;
    lastPhrase: { userId: string; phraseId: CliffWordsPhraseId; at: string } | null;
    cameraY: number;
  };
  canReset: boolean;
}

export class CliffGameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const toId = (value: mongoose.Types.ObjectId | string | null | undefined) =>
  value == null ? '' : value.toString();

const includesUser = (ids: mongoose.Types.ObjectId[] | undefined, userId: string) =>
  (ids ?? []).some((id) => toId(id) === userId);

const dedupePresentUserIds = (state: any) => {
  const ids = state.presentUserIds ?? [];
  const seen = new Set<string>();
  const next = ids.filter((id: mongoose.Types.ObjectId) => {
    const uid = toId(id);
    if (seen.has(uid)) {
      return false;
    }
    seen.add(uid);
    return true;
  });
  if (next.length !== ids.length) {
    state.presentUserIds = next;
  }
};

const formatUser = (user: {
  _id: mongoose.Types.ObjectId;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}): CliffPublicUser => ({
  id: user._id.toString(),
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
});

const emptyUser = (userId: string): CliffPublicUser => ({
  id: userId,
  username: '',
});

const createEmptyProgress = (userId: string) => ({
  userId: new mongoose.Types.ObjectId(userId),
  stonesRemaining: CLIFF_STONES_EACH,
  holesCompleted: 0,
  encouragementUses: 0,
  encouragementCooldownUntil: null as Date | null,
  ropeIndex: 0,
  ballsRemaining: CLIFF_BALLS_EACH,
  ballsScore: 0,
  caveIron: 0,
  caveCopper: 0,
  caveQuartz: 0,
  caveResin: 0,
  caveWickCup: 0,
  caveLensFlask: 0,
  caveLampBody: 0,
  caveLantern: 0,
  guideX: 0,
  guideY: 0,
  guideEscaped: false,
  guidePetId: null as mongoose.Types.ObjectId | null,
  guideRunsLeft: 0,
  guideRunsTotal: 0,
  guideScoutIndex: 0,
  guideTrailUntil: null as Date | null,
  guideTrailCells: [] as string[],
  guideLastForkX: null as number | null,
  guideLastForkY: null as number | null,
  guideTrapTold: false,
  wordsX: cliffWordsStartX('owner'),
  wordsY: cliffWordsStartY(),
  wordsBaseY: cliffWordsStartY(),
  wordsFuel: CLIFF_WORDS_FUEL_START,
  wordsCheckpoint: 0,
  wordsCleared: false,
  wordsUsedPhrases: [] as string[],
  wordsShowFuelHint: false,
  wordsFuelHintTold: false,
  wordsIntroTold: false,
});

const resetBallsProgress = (progress: {
  ballsRemaining?: number;
  ballsScore?: number;
}) => {
  progress.ballsRemaining = CLIFF_BALLS_EACH;
  progress.ballsScore = 0;
};

const caveInventoryOf = (progress: {
  caveIron?: number;
  caveCopper?: number;
  caveQuartz?: number;
  caveResin?: number;
  caveWickCup?: number;
  caveLensFlask?: number;
  caveLampBody?: number;
  caveLantern?: number;
}): CliffCaveInventory => ({
  iron: progress.caveIron ?? 0,
  copper: progress.caveCopper ?? 0,
  quartz: progress.caveQuartz ?? 0,
  resin: progress.caveResin ?? 0,
  wick_cup: progress.caveWickCup ?? 0,
  lens_flask: progress.caveLensFlask ?? 0,
  lamp_body: progress.caveLampBody ?? 0,
  lantern: progress.caveLantern ?? 0,
});

const writeCaveInventory = (
  progress: {
    caveIron?: number;
    caveCopper?: number;
    caveQuartz?: number;
    caveResin?: number;
    caveWickCup?: number;
    caveLensFlask?: number;
    caveLampBody?: number;
    caveLantern?: number;
  },
  inventory: CliffCaveInventory
) => {
  progress.caveIron = inventory.iron;
  progress.caveCopper = inventory.copper;
  progress.caveQuartz = inventory.quartz;
  progress.caveResin = inventory.resin;
  progress.caveWickCup = inventory.wick_cup;
  progress.caveLensFlask = inventory.lens_flask;
  progress.caveLampBody = inventory.lamp_body;
  progress.caveLantern = inventory.lantern;
};

const resetCavesProgress = (progress: {
  caveIron?: number;
  caveCopper?: number;
  caveQuartz?: number;
  caveResin?: number;
  caveWickCup?: number;
  caveLensFlask?: number;
  caveLampBody?: number;
  caveLantern?: number;
}) => {
  writeCaveInventory(progress, emptyCliffCaveInventory());
};

type CliffGuideProgress = {
  guideX?: number;
  guideY?: number;
  guideEscaped?: boolean;
  guidePetId?: mongoose.Types.ObjectId | null;
  guideRunsLeft?: number;
  guideRunsTotal?: number;
  guideScoutIndex?: number;
  guideTrailUntil?: Date | null;
  guideTrailCells?: string[];
  guideLastForkX?: number | null;
  guideLastForkY?: number | null;
  guideTrapTold?: boolean;
};

const parseGuideCellKey = (value: string): CliffGuidePoint | null => {
  const [xRaw, yRaw] = value.split(',');
  const x = Number(xRaw);
  const y = Number(yRaw);
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return null;
  }
  return { x, y };
};

const guideTrailCellsOf = (progress: CliffGuideProgress): CliffGuidePoint[] =>
  (progress.guideTrailCells ?? [])
    .map(parseGuideCellKey)
    .filter((point): point is CliffGuidePoint => Boolean(point));

const expireGuideTrail = (progress: CliffGuideProgress, now: Date) => {
  const until = progress.guideTrailUntil ? new Date(progress.guideTrailUntil).getTime() : 0;
  if (!until || until > now.getTime()) {
    return;
  }
  progress.guideTrailUntil = null;
  progress.guideTrailCells = [];
  progress.guideLastForkX = null;
  progress.guideLastForkY = null;
};

const resetGuidesProgress = (progress: CliffGuideProgress, role: CliffCaveSide) => {
  const start = guideMapOf(role).start;
  progress.guideX = start.x;
  progress.guideY = start.y;
  progress.guideEscaped = false;
  progress.guidePetId = null;
  progress.guideRunsLeft = 0;
  progress.guideRunsTotal = 0;
  progress.guideScoutIndex = 0;
  progress.guideTrailUntil = null;
  progress.guideTrailCells = [];
  progress.guideLastForkX = null;
  progress.guideLastForkY = null;
  progress.guideTrapTold = false;
};

const resetGuidesRunFields = (state: any, context: CliffGameContext) => {
  resetGuidesProgress(getProgress(state, context.ownerUserId), 'owner');
  resetGuidesProgress(getProgress(state, context.partnerUserId), 'partner');
};

type CliffWordsProgress = {
  wordsX?: number;
  wordsY?: number;
  wordsBaseY?: number;
  wordsFuel?: number;
  wordsCheckpoint?: number;
  wordsCleared?: boolean;
  wordsUsedPhrases?: string[];
  wordsShowFuelHint?: boolean;
  wordsFuelHintTold?: boolean;
  wordsIntroTold?: boolean;
};

const clampWordsX = (value: number) =>
  Math.min(
    CLIFF_WORDS_WORLD_WIDTH - CLIFF_WORDS_PLAYER_WIDTH / 2,
    Math.max(CLIFF_WORDS_PLAYER_WIDTH / 2, value)
  );

const clampWordsY = (value: number) =>
  Math.min(CLIFF_WORDS_FINISH_Y + 20, Math.max(-4, value));

const standWordsAt = (progress: CliffWordsProgress, x: number, y: number) => {
  progress.wordsX = x;
  progress.wordsY = y;
  progress.wordsBaseY = y;
};

const resetWordsProgress = (progress: CliffWordsProgress, role: CliffCaveSide) => {
  standWordsAt(progress, cliffWordsStartX(role), cliffWordsStartY());
  progress.wordsFuel = CLIFF_WORDS_FUEL_START;
  progress.wordsCheckpoint = 0;
  progress.wordsCleared = false;
  progress.wordsUsedPhrases = [];
  progress.wordsShowFuelHint = false;
  progress.wordsFuelHintTold = false;
  progress.wordsIntroTold = false;
};

const resetWordsRunFields = (state: any, context: CliffGameContext) => {
  resetWordsProgress(getProgress(state, context.ownerUserId), 'owner');
  resetWordsProgress(getProgress(state, context.partnerUserId), 'partner');
  state.wordsCameraY = CLIFF_WORDS_CAMERA_START;
  state.set('wordsLastPhraseUserId', null);
  state.set('wordsLastPhraseId', null);
  state.set('wordsLastPhraseAt', null);
};

const wordsLeadY = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  return Math.max(owner.wordsY ?? 0, partner.wordsY ?? 0);
};

const syncWordsCamera = (state: any, context: CliffGameContext, snap = false) => {
  const lead = wordsLeadY(state, context);
  if (lead < CLIFF_WORDS_CAMERA_UNLOCK_Y) {
    state.wordsCameraY = CLIFF_WORDS_CAMERA_START;
    return;
  }
  const desired = Math.max(CLIFF_WORDS_CAMERA_START, lead - CLIFF_WORDS_CAMERA_KEEP);
  state.wordsCameraY = snap ? desired : Math.max(state.wordsCameraY ?? CLIFF_WORDS_CAMERA_START, desired);
};

const rewindWordsToSharedCheckpoint = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  const checkpoint = Math.min(owner.wordsCheckpoint ?? 0, partner.wordsCheckpoint ?? 0);
  const y = cliffWordsCheckpointY(checkpoint);
  const place = (progress: CliffWordsProgress, role: CliffCaveSide) => {
    if (progress.wordsCleared) {
      return;
    }
    standWordsAt(progress, cliffWordsPlaceX(y, role), y);
    progress.wordsFuel = CLIFF_WORDS_FUEL_START;
    progress.wordsCheckpoint = checkpoint;
  };
  place(owner, 'owner');
  place(partner, 'partner');
  syncWordsCamera(state, context, true);
  state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
};

const rewindWordsPlayer = (progress: CliffWordsProgress, role: CliffCaveSide) => {
  const checkpoint = progress.wordsCheckpoint ?? 0;
  const y = cliffWordsCheckpointY(checkpoint);
  standWordsAt(progress, cliffWordsPlaceX(y, role), y);
  progress.wordsFuel = CLIFF_WORDS_FUEL_START;
};

const restartWordsFromStart = (progress: CliffWordsProgress, role: CliffCaveSide) => {
  standWordsAt(progress, cliffWordsStartX(role), cliffWordsStartY());
  progress.wordsFuel = CLIFF_WORDS_FUEL_START;
  progress.wordsCheckpoint = 0;
};

const bumpWordsFail = (state: any) => {
  state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
};

const failWordsForFuel = (
  state: any,
  context: CliffGameContext,
  progress: CliffWordsProgress,
  role: CliffCaveSide,
  bothPresent: boolean,
  pairStillClimbing: boolean
) => {
  if (progress.wordsCleared) {
    return;
  }
  if (!progress.wordsFuelHintTold) {
    restartWordsFromStart(progress, role);
    progress.wordsShowFuelHint = true;
    progress.wordsIntroTold = true;
    bumpWordsFail(state);
    return;
  }
  if (bothPresent && pairStillClimbing) {
    rewindWordsToSharedCheckpoint(state, context);
    return;
  }
  rewindWordsPlayer(progress, role);
  bumpWordsFail(state);
  syncWordsCamera(state, context, true);
};

const wordsClearedOf = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  return Boolean(owner.wordsCleared) && Boolean(partner.wordsCleared);
};

const guidesClearedOf = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  return Boolean(owner.guideEscaped) && Boolean(partner.guideEscaped);
};

const wordsStandingX = (x: number | undefined, y: number | undefined, role: CliffCaveSide) => {
  const nextY = y ?? cliffWordsStartY();
  const nextX = x ?? cliffWordsPlaceX(nextY, role);
  const platform =
    CLIFF_WORDS_PLATFORMS.find((item) => Math.abs(item.y - nextY) < 0.51) ?? CLIFF_WORDS_PLATFORMS[0];
  const half = platform.w / 2;
  if (nextX > platform.x - half && nextX < platform.x + half) {
    return nextX;
  }
  return cliffWordsPlaceX(nextY, role);
};

const formatWordsPublic = (
  state: any,
  viewerUserId: string,
  context: CliffGameContext
): CliffGamePublicState['words'] => {
  const role = caveRoleOf(viewerUserId, context);
  const partnerRole: CliffCaveSide = role === 'owner' ? 'partner' : 'owner';
  const partnerUserId =
    viewerUserId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const myProgress = getProgress(state, viewerUserId);
  const partnerProgress = getProgress(state, partnerUserId);
  const phraseAt = state.wordsLastPhraseAt ? new Date(state.wordsLastPhraseAt) : null;
  const phraseFresh = Boolean(phraseAt && Date.now() - phraseAt.getTime() < 6000);
  const phraseId = state.wordsLastPhraseId;
  const lastPhrase =
    phraseFresh && isCliffWordsPhraseId(phraseId) && state.wordsLastPhraseUserId
      ? {
          userId: toId(state.wordsLastPhraseUserId),
          phraseId,
          at: phraseAt ? phraseAt.toISOString() : new Date().toISOString(),
        }
      : null;

  return {
    role,
    world: {
      width: CLIFF_WORDS_WORLD_WIDTH,
      cameraHeight: CLIFF_WORDS_CAMERA_HEIGHT,
      finishY: CLIFF_WORDS_FINISH_Y,
      platforms: CLIFF_WORDS_PLATFORMS.map((platform) => ({ ...platform })),
    },
    my: {
      x: wordsStandingX(myProgress.wordsX, myProgress.wordsY, role),
      y:
        (myProgress.wordsCheckpoint ?? 0) <= 0
          ? Math.max(myProgress.wordsY ?? cliffWordsStartY(), cliffWordsStartY())
          : myProgress.wordsY ?? cliffWordsStartY(),
      fuel: myProgress.wordsFuel ?? CLIFF_WORDS_FUEL_START,
      checkpoint: myProgress.wordsCheckpoint ?? 0,
      cleared: Boolean(myProgress.wordsCleared),
      usedPhrases: (myProgress.wordsUsedPhrases ?? []).filter(isCliffWordsPhraseId),
    },
    partner: {
      x: wordsStandingX(partnerProgress.wordsX, partnerProgress.wordsY, partnerRole),
      y:
        (partnerProgress.wordsCheckpoint ?? 0) <= 0
          ? Math.max(partnerProgress.wordsY ?? cliffWordsStartY(), cliffWordsStartY())
          : partnerProgress.wordsY ?? cliffWordsStartY(),
      fuel: partnerProgress.wordsFuel ?? CLIFF_WORDS_FUEL_START,
      checkpoint: partnerProgress.wordsCheckpoint ?? 0,
      cleared: Boolean(partnerProgress.wordsCleared),
    },
    phraseIds: [...CLIFF_WORDS_PHRASE_IDS],
    fuelStart: CLIFF_WORDS_FUEL_START,
    fuelMax: CLIFF_WORDS_FUEL_MAX,
    fuelBounce: CLIFF_WORDS_FUEL_BOUNCE,
    fuelPhrase: CLIFF_WORDS_FUEL_PHRASE,
    bothCleared: wordsClearedOf(state, context),
    failSeq: state.wordsFailSeq ?? 0,
    fuelHint: Boolean(myProgress.wordsShowFuelHint),
    introTold: Boolean(myProgress.wordsIntroTold),
    lastPhrase,
    cameraY: state.wordsCameraY ?? CLIFF_WORDS_CAMERA_START,
  };
};

const cavesClearedOf = (state: any, context: CliffGameContext) => {
  const ownerInv = caveInventoryOf(getProgress(state, context.ownerUserId));
  const partnerInv = caveInventoryOf(getProgress(state, context.partnerUserId));
  return deriveCavesPhase(ownerInv, partnerInv).action === 'done';
};

const caveRoleOf = (userId: string, context: CliffGameContext): CliffCaveSide =>
  userId === context.ownerUserId ? 'owner' : 'partner';

const canPayCaveCost = (inventory: CliffCaveInventory, cost: Partial<CliffCaveInventory>) =>
  (Object.keys(cost) as CliffCaveItemId[]).every((itemId) => (inventory[itemId] ?? 0) >= (cost[itemId] ?? 0));

const spendCaveCost = (inventory: CliffCaveInventory, cost: Partial<CliffCaveInventory>) => {
  (Object.keys(cost) as CliffCaveItemId[]).forEach((itemId) => {
    inventory[itemId] = Math.max(0, inventory[itemId] - (cost[itemId] ?? 0));
  });
};

const caveGiftablesOf = (inventory: CliffCaveInventory) =>
  CLIFF_CAVE_ITEMS.filter((itemId) => inventory[itemId] > 0).map((itemId) => ({
    id: itemId,
    count: inventory[itemId],
  }));

const deriveCavesPhase = (
  ownerInv: CliffCaveInventory,
  partnerInv: CliffCaveInventory
): { step: 1 | 2 | 3 | 4; action: CliffCaveCraftAction } => {
  if (ownerInv.lantern >= 1 && partnerInv.lantern >= 1) {
    return { step: 4, action: 'done' };
  }
  if (partnerInv.lantern >= 1) {
    return { step: 4, action: 'done' };
  }
  if (ownerInv.lantern >= 1) {
    return { step: 4, action: 'gift' };
  }
  if (ownerInv.lamp_body >= 1) {
    return { step: 4, action: 'craft' };
  }
  if (partnerInv.lamp_body >= 1) {
    return { step: 3, action: 'gift' };
  }
  if (partnerInv.lens_flask >= 1) {
    return { step: 3, action: 'craft' };
  }
  if (ownerInv.lens_flask >= 1) {
    return { step: 2, action: 'gift' };
  }
  if (ownerInv.wick_cup >= 1) {
    return { step: 2, action: 'craft' };
  }
  if (partnerInv.wick_cup >= 1) {
    return { step: 1, action: 'gift' };
  }
  return { step: 1, action: 'craft' };
};

const formatCaveBoulder = (boulder: {
  id: string;
  resource: CliffCaveResource;
  side: CliffCaveSide;
  yield: number;
  tapsRequired: number;
  tapsDone: number;
  depleted?: boolean;
}): CliffPublicCaveBoulder => ({
  id: boulder.id,
  resource: boulder.resource,
  side: boulder.side,
  yield: boulder.yield,
  tapsRequired: boulder.tapsRequired,
  tapsDone: boulder.tapsDone,
  depleted: Boolean(boulder.depleted),
});

const formatCavesPublic = (
  state: any,
  viewerUserId: string,
  context: CliffGameContext
): CliffGamePublicState['caves'] => {
  const role = caveRoleOf(viewerUserId, context);
  const myProgress = getProgress(state, viewerUserId);
  const partnerUserId =
    viewerUserId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const partnerProgress = getProgress(state, partnerUserId);
  const ownerInv = caveInventoryOf(getProgress(state, context.ownerUserId));
  const partnerInv = caveInventoryOf(getProgress(state, context.partnerUserId));
  const myInv = caveInventoryOf(myProgress);
  const theirInv = caveInventoryOf(partnerProgress);
  const phase = deriveCavesPhase(ownerInv, partnerInv);
  const recipe = CLIFF_CAVE_CRAFT_STEPS.find((item) => item.step === phase.step);
  const canCraft =
    phase.action === 'craft' &&
    Boolean(recipe) &&
    recipe?.role === role &&
    canPayCaveCost(myInv, recipe?.cost ?? {});
  const canGift =
    phase.action === 'gift' &&
    Boolean(recipe) &&
    recipe?.role === role &&
    (myInv[recipe.result] ?? 0) > 0;

  return {
    role,
    step: phase.step,
    action: phase.action,
    canCraft,
    canGift,
    giftables: canGift ? caveGiftablesOf(myInv) : [],
    my: myInv,
    partner: theirInv,
    boulders: ((state.caveBoulders ?? []) as Array<{
      id: string;
      resource: CliffCaveResource;
      side: CliffCaveSide;
      yield: number;
      tapsRequired: number;
      tapsDone: number;
      depleted?: boolean;
    }>)
      .filter((boulder) => boulder.side === role)
      .map(formatCaveBoulder),
    cleared: phase.action === 'done',
  };
};

const formatGuidesPublic = (
  state: any,
  viewerUserId: string,
  context: CliffGameContext,
  now: Date,
  pets: { eligiblePets: CliffLiftPublicPet[]; selectedPet: CliffLiftPublicPet | null }
): CliffGamePublicState['guides'] => {
  const role = caveRoleOf(viewerUserId, context);
  const map = guideMapOf(role);
  const partnerUserId =
    viewerUserId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const myProgress = getProgress(state, viewerUserId);
  const partnerProgress = getProgress(state, partnerUserId);
  const trailUntil = myProgress.guideTrailUntil ? new Date(myProgress.guideTrailUntil) : null;
  const trailActive = Boolean(trailUntil && trailUntil.getTime() > now.getTime());
  const trail = trailActive ? guideTrailCellsOf(myProgress) : [];
  const lastFork =
    typeof myProgress.guideLastForkX === 'number' && typeof myProgress.guideLastForkY === 'number'
      ? { x: myProgress.guideLastForkX, y: myProgress.guideLastForkY }
      : null;
  const start = map.start;

  return {
    role,
    width: map.width,
    height: map.height,
    cells: map.cells,
    my: {
      x: myProgress.guideX ?? start.x,
      y: myProgress.guideY ?? start.y,
      escaped: Boolean(myProgress.guideEscaped),
      runsLeft: myProgress.guideRunsLeft ?? 0,
      runsTotal: myProgress.guideRunsTotal ?? 0,
      lanternWithPet: trailActive,
      trail: trailActive ? trail : [],
      trailUntil: trailActive && trailUntil ? trailUntil.toISOString() : null,
      lastFork: trailActive ? lastFork : null,
      pet: pets.selectedPet,
      trapTold: Boolean(myProgress.guideTrapTold),
    },
    partnerEscaped: Boolean(partnerProgress.guideEscaped),
    bothEscaped: Boolean(myProgress.guideEscaped) && Boolean(partnerProgress.guideEscaped),
    eligiblePets: pets.eligiblePets,
    minLevel: CLIFF_GUIDE_PET_MIN_LEVEL,
  };
};

const resetCavesRunFields = (state: any, context: CliffGameContext) => {
  const ownerProgress = getProgress(state, context.ownerUserId);
  const partnerProgress = getProgress(state, context.partnerUserId);
  resetCavesProgress(ownerProgress);
  resetCavesProgress(partnerProgress);
  state.set('caveBoulders', createCliffCaveBoulders());
};

type CliffTestResetFrom = 'gate' | 'ropes' | 'balls' | 'caves' | 'guides' | 'words';

const resetBridgeProgress = (progress: {
  stonesRemaining?: number;
  holesCompleted?: number;
  encouragementUses?: number;
  encouragementCooldownUntil?: Date;
}) => {
  progress.stonesRemaining = CLIFF_STONES_EACH;
  progress.holesCompleted = 0;
  progress.encouragementUses = 0;
  progress.encouragementCooldownUntil = undefined;
};

const resetStagesFrom = (state: any, context: CliffGameContext, from: CliffTestResetFrom) => {
  const ownerProgress = getProgress(state, context.ownerUserId);
  const partnerProgress = getProgress(state, context.partnerUserId);
  const players = [ownerProgress, partnerProgress];

  switch (from) {
    case 'gate':
      for (const progress of players) {
        resetBridgeProgress(progress);
        progress.ropeIndex = 0;
        resetBallsProgress(progress);
        resetCavesProgress(progress);
        resetGuidesProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
        resetWordsProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
      }
      state.set('caveBoulders', createCliffCaveBoulders());
      state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
      state.set('wordsLastPhraseUserId', null);
      state.set('wordsLastPhraseId', null);
      state.set('wordsLastPhraseAt', null);
      state.gateDestroyed = false;
      state.bridgeRepaired = false;
      state.liftRaised = false;
      state.liftPetIds = [];
      state.set('holeExpandedForUserId', null);
      state.set('holeExpandedUntil', null);
      state.scene = 'hub';
      state.altitudeM = CLIFF_HUB_ALTITUDE;
      return;
    case 'ropes':
      for (const progress of players) {
        progress.ropeIndex = 0;
        resetBallsProgress(progress);
        resetCavesProgress(progress);
        resetGuidesProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
        resetWordsProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
      }
      state.set('caveBoulders', createCliffCaveBoulders());
      state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
      state.set('wordsLastPhraseUserId', null);
      state.set('wordsLastPhraseId', null);
      state.set('wordsLastPhraseAt', null);
      state.scene = 'ropes';
      state.altitudeM = CLIFF_ROPES_ALTITUDE;
      return;
    case 'balls':
      for (const progress of players) {
        resetBallsProgress(progress);
        resetCavesProgress(progress);
        resetGuidesProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
        resetWordsProgress(progress, progress === ownerProgress ? 'owner' : 'partner');
      }
      state.set('caveBoulders', createCliffCaveBoulders());
      state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
      state.set('wordsLastPhraseUserId', null);
      state.set('wordsLastPhraseId', null);
      state.set('wordsLastPhraseAt', null);
      state.scene = 'balls';
      state.altitudeM = CLIFF_BALLS_ALTITUDE;
      return;
    case 'caves':
      resetCavesRunFields(state, context);
      resetGuidesRunFields(state, context);
      resetWordsRunFields(state, context);
      state.scene = 'caves';
      state.altitudeM = CLIFF_CAVES_ALTITUDE;
      return;
    case 'guides':
      resetGuidesRunFields(state, context);
      resetWordsRunFields(state, context);
      state.scene = 'guides';
      state.altitudeM = CLIFF_GUIDES_ALTITUDE;
      return;
    case 'words':
      resetWordsRunFields(state, context);
      state.wordsFailSeq = (state.wordsFailSeq ?? 0) + 1;
      state.scene = 'words';
      state.altitudeM = CLIFF_WORDS_ALTITUDE;
      return;
    default: {
      const exhaustive: never = from;
      return exhaustive;
    }
  }
};

const bothPartnersPresent = (state: any, context: CliffGameContext) =>
  includesUser(state.presentUserIds, context.ownerUserId) &&
  includesUser(state.presentUserIds, context.partnerUserId);

const normalizeBallZoneScore = (value: unknown): CliffBallZoneScore | null => {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) {
    return null;
  }
  const rounded = Math.round(score);
  if (rounded === 0) {
    return 0;
  }
  if ((CLIFF_BALL_ZONE_SCORES as readonly number[]).includes(rounded)) {
    return rounded as CliffBallZoneScore;
  }
  return null;
};

const ballsPairScoreOf = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  return (owner.ballsScore ?? 0) + (partner.ballsScore ?? 0);
};

const ballsClearedOf = (state: any, context: CliffGameContext) => {
  const owner = getProgress(state, context.ownerUserId);
  const partner = getProgress(state, context.partnerUserId);
  return (
    (owner.ballsRemaining ?? CLIFF_BALLS_EACH) <= 0 &&
    (partner.ballsRemaining ?? CLIFF_BALLS_EACH) <= 0 &&
    ballsPairScoreOf(state, context) >= CLIFF_BALLS_SCORE_THRESHOLD
  );
};

const createRunFields = (ownerUserId: string, partnerUserId: string) => ({
  runId: randomUUID(),
  scene: 'hub' as const,
  altitudeM: CLIFF_HUB_ALTITUDE,
  gateDestroyed: false,
  runStartedAt: null as Date | null,
  runPausedAt: null as Date | null,
  lastTimeMs: null as number | null,
  iron: 0,
  copper: 0,
  hasAxe: false,
  hasIronPickaxe: false,
  hasCopperPickaxe: false,
  purchasedPickaxes: [],
  boulders: createCliffBoulders(),
  caveBoulders: createCliffCaveBoulders(),
  mineCycleStartedAt: null as Date | null,
  presentUserIds: [],
  introPlayedUserIds: [],
  playerProgress: [createEmptyProgress(ownerUserId), createEmptyProgress(partnerUserId)],
  holeExpandedForUserId: null,
  holeExpandedUntil: null,
  bridgeRepaired: false,
  liftRaised: false,
  liftPetIds: [] as mongoose.Types.ObjectId[],
  wordsFailSeq: 0,
  wordsCameraY: CLIFF_WORDS_CAMERA_START,
  wordsLastPhraseUserId: null as mongoose.Types.ObjectId | null,
  wordsLastPhraseId: null as string | null,
  wordsLastPhraseAt: null as Date | null,
});

const getPurchaseType = (state: any, userId: string): CliffPickaxeType | null => {
  const purchase = (state.purchasedPickaxes ?? []).find(
    (item: { userId: mongoose.Types.ObjectId }) => toId(item.userId) === userId
  );
  return purchase?.type ?? null;
};

const getProgress = (state: any, userId: string) => {
  let progress = (state.playerProgress ?? []).find(
    (item: { userId?: mongoose.Types.ObjectId }) => item?.userId && toId(item.userId) === userId
  );
  if (!progress) {
    progress = createEmptyProgress(userId);
    if (!Array.isArray(state.playerProgress)) {
      state.playerProgress = [];
    }
    state.playerProgress.push(progress);
  }
  return progress;
};

const bothPlayersCompletedHoles = (state: any, context: CliffGameContext) => {
  const ownerProgress = getProgress(state, context.ownerUserId);
  const partnerProgress = getProgress(state, context.partnerUserId);
  return (
    (ownerProgress.holesCompleted ?? 0) >= CLIFF_HOLES_REQUIRED &&
    (partnerProgress.holesCompleted ?? 0) >= CLIFF_HOLES_REQUIRED
  );
};

const computeElapsedMs = (state: any, now: Date): number => {
  if (state.scene === 'finished' && typeof state.lastTimeMs === 'number') {
    return state.lastTimeMs;
  }
  if (!state.runStartedAt) {
    return 0;
  }
  const endMs = state.runPausedAt ? new Date(state.runPausedAt).getTime() : now.getTime();
  return Math.max(0, endMs - new Date(state.runStartedAt).getTime());
};

const resumeCliffTimer = (state: any, now: Date) => {
  if (!state.runPausedAt) {
    return;
  }
  if (state.runStartedAt) {
    const pausedMs = now.getTime() - new Date(state.runPausedAt).getTime();
    state.runStartedAt = new Date(new Date(state.runStartedAt).getTime() + pausedMs);
  }
  state.set('runPausedAt', null);
};

const pauseCliffTimerIfEmpty = (state: any, now: Date) => {
  if (state.scene === 'finished' || !state.runStartedAt || state.runPausedAt) {
    return;
  }
  if ((state.presentUserIds ?? []).length > 0) {
    return;
  }
  state.runPausedAt = now;
};

export const reconcileCliffPresenceOnStartup = async () => {
  const now = new Date();
  const states = await CliffGameState.find({
    scene: { $ne: 'finished' },
    $or: [{ presentUserIds: { $exists: true, $not: { $size: 0 } } }, { runStartedAt: { $ne: null } }],
  });

  await Promise.all(
    states.map(async (state) => {
      state.presentUserIds = [];
      pauseCliffTimerIfEmpty(state, now);
      await state.save();
    })
  );
};

const ensureBridgeReady = (state: any, context: CliffGameContext) => {
  if (!state.playerProgress || state.playerProgress.length < 2) {
    state.playerProgress = [
      createEmptyProgress(context.ownerUserId),
      createEmptyProgress(context.partnerUserId),
    ];
  }
};

export const resolveCliffGameContext = async (userId: string): Promise<CliffGameContext> => {
  const relationshipContext = await requireActiveRelationship(userId);

  if (!relationshipContext) {
    throw new CliffGameError(
      'NO_PARTNER',
      'Для игры нужен партнёр. Добавьте его в настройках профиля.'
    );
  }

  const relationship = relationshipContext.relationship as CliffGameRelationship;

  return {
    relationship,
    ownerUserId: relationship.userId.toString(),
    partnerUserId: relationship.partnerId.toString(),
  };
};

export const getCliffGameParticipantIds = (context: CliffGameContext): string[] => [
  context.relationship.userId.toString(),
  context.relationship.partnerId.toString(),
];

export const getOrCreateCliffGameState = async (context: CliffGameContext) => {
  const { relationship } = context;
  let state = await CliffGameState.findOne({ relationshipId: relationship._id });

  if (!state) {
    state = await CliffGameState.create({
      relationshipId: relationship._id,
      bestTimeMs: null,
      ...createRunFields(context.ownerUserId, context.partnerUserId),
    });
  }

  return state;
};

const isVersionError = (error: unknown): boolean =>
  Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'VersionError');

const maybeRefreshMineCycle = (state: any, now: Date): boolean => {
  if (!state.mineCycleStartedAt) {
    return false;
  }
  const startedAt = new Date(state.mineCycleStartedAt).getTime();
  if (!Number.isFinite(startedAt) || now.getTime() - startedAt < CLIFF_MINE_RESET_MS) {
    return false;
  }
  state.boulders = createCliffBoulders();
  state.mineCycleStartedAt = null;
  return true;
};

const saveCliffStateWithRetry = async (
  context: CliffGameContext,
  apply: (state: any) => void
) => {
  const maxAttempts = 5;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const state = await getOrCreateCliffGameState(context);
    apply(state);
    if (typeof state.isModified === 'function' && !state.isModified()) {
      return state;
    }
    try {
      await state.save();
      return state;
    } catch (error) {
      if (!isVersionError(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
};

const formatCliffLiftPet = (pet: any, viewerUserId: string): CliffLiftPublicPet => ({
  id: pet._id.toString(),
  ownerId: toId(pet.ownerId),
  mine: toId(pet.ownerId) === viewerUserId,
  name: pet.name,
  level: pet.level ?? 1,
  species: pet.species,
  variant: pet.variant,
  imageUrl: getPetImagePath(pet.species, pet.variant, pet.level ?? 1),
});

const loadCliffLiftPets = async (
  state: any,
  viewerUserId: string,
  ownerUserId: string,
  partnerUserId: string
): Promise<{ eligiblePets: CliffLiftPublicPet[]; standingPets: CliffLiftPublicPet[] }> => {
  if (state.scene !== 'lift') {
    return { eligiblePets: [], standingPets: [] };
  }

  const coupleOwnerIds = [ownerUserId, partnerUserId];
  const standingIds = (state.liftPetIds ?? []).map((id: mongoose.Types.ObjectId) => toId(id)).filter(Boolean);

  if (state.liftRaised && standingIds.length > 0) {
    const standingDocs = await Pet.find({ _id: { $in: standingIds } }).lean();
    const standingPets = standingIds.flatMap((id: string) => {
      const pet = standingDocs.find((doc: { _id: mongoose.Types.ObjectId }) => doc._id.toString() === id);
      return pet ? [formatCliffLiftPet(pet, viewerUserId)] : [];
    });
    return { eligiblePets: [], standingPets };
  }

  const eligibleDocs = await Pet.find({
    ownerId: { $in: coupleOwnerIds },
    level: { $gte: CLIFF_LIFT_PET_MIN_LEVEL },
  })
    .sort({ level: -1, name: 1 })
    .lean();

  return {
    eligiblePets: eligibleDocs.map((pet) => formatCliffLiftPet(pet, viewerUserId)),
    standingPets: [],
  };
};

const loadCliffGuidePets = async (
  state: any,
  viewerUserId: string,
  ownerUserId: string,
  partnerUserId: string
): Promise<{ eligiblePets: CliffLiftPublicPet[]; selectedPet: CliffLiftPublicPet | null }> => {
  if (state.scene !== 'guides') {
    return { eligiblePets: [], selectedPet: null };
  }

  const viewerProgress = getProgress(state, viewerUserId);
  const selectedId = viewerProgress.guidePetId ? toId(viewerProgress.guidePetId) : '';
  const coupleOwnerIds = [ownerUserId, partnerUserId];

  if (selectedId) {
    const selectedDoc = await Pet.findById(selectedId).lean();
    return {
      eligiblePets: [],
      selectedPet: selectedDoc ? formatCliffLiftPet(selectedDoc, viewerUserId) : null,
    };
  }

  const partnerProgress = getProgress(state, viewerUserId === ownerUserId ? partnerUserId : ownerUserId);
  const takenId = partnerProgress.guidePetId ? toId(partnerProgress.guidePetId) : '';

  const eligibleDocs = await Pet.find({
    ownerId: { $in: coupleOwnerIds },
    level: { $gte: CLIFF_GUIDE_PET_MIN_LEVEL },
  })
    .sort({ level: -1, name: 1 })
    .lean();

  return {
    eligiblePets: eligibleDocs
      .filter((pet) => pet._id.toString() !== takenId)
      .map((pet) => formatCliffLiftPet(pet, viewerUserId)),
    selectedPet: null,
  };
};

const shopLockReason = (
  state: any,
  viewerUserId: string,
  partnerUserId: string,
  itemId: CliffShopItemId,
  amoreCoins: number
): CliffShopPublicItem['lockReason'] => {
  if (itemId === 'axe') {
    if (state.hasAxe) {
      return 'owned';
    }
    if (state.iron < 20 || state.copper < 20) {
      return 'no_ore';
    }
    return null;
  }

  const pickaxeType: CliffPickaxeType = itemId === 'iron_pickaxe' ? 'iron' : 'copper';
  const alreadyHas =
    pickaxeType === 'iron' ? state.hasIronPickaxe : state.hasCopperPickaxe;
  if (alreadyHas && getPurchaseType(state, viewerUserId) === pickaxeType) {
    return 'owned';
  }

  const myPurchase = getPurchaseType(state, viewerUserId);
  if (myPurchase) {
    return 'already_bought';
  }

  const partnerPurchase = getPurchaseType(state, partnerUserId);
  if (partnerPurchase === pickaxeType) {
    return 'taken';
  }

  if (amoreCoins < 50) {
    return 'no_funds';
  }

  return null;
};

export const formatCliffGameState = async (
  state: any,
  viewerUserId: string,
  context: CliffGameContext
): Promise<CliffGamePublicState> => {
  const now = new Date();
  const partnerUserId =
    viewerUserId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;

  const [meDoc, partnerDoc, wallet, liftPets, guidePets] = await Promise.all([
    User.findById(viewerUserId).select('username firstName lastName avatar'),
    User.findById(partnerUserId).select('username firstName lastName avatar'),
    getBalance(viewerUserId),
    loadCliffLiftPets(state, viewerUserId, context.ownerUserId, context.partnerUserId),
    loadCliffGuidePets(state, viewerUserId, context.ownerUserId, context.partnerUserId),
  ]);

  const myProgress = getProgress(state, viewerUserId);
  const partnerProgress = getProgress(state, partnerUserId);

  const shopItems: CliffShopPublicItem[] = (
    ['iron_pickaxe', 'copper_pickaxe', 'axe'] as CliffShopItemId[]
  ).map((id) => {
    const lockReason = shopLockReason(state, viewerUserId, partnerUserId, id, wallet.balance);
    return { id, canBuy: lockReason === null, lockReason };
  });

  return {
    relationshipId: state.relationshipId.toString(),
    hasPartner: true,
    userId: viewerUserId,
    partnerId: partnerUserId,
    me: meDoc ? formatUser(meDoc) : emptyUser(viewerUserId),
    partner: partnerDoc ? formatUser(partnerDoc) : emptyUser(partnerUserId),
    scene: state.scene,
    altitudeM: state.altitudeM,
    gateDestroyed: Boolean(state.gateDestroyed),
    runStartedAt: state.runStartedAt ? new Date(state.runStartedAt).toISOString() : null,
    timerPaused: Boolean(state.runPausedAt) && state.scene !== 'finished',
    elapsedMs: computeElapsedMs(state, now),
    bestTimeMs: typeof state.bestTimeMs === 'number' ? state.bestTimeMs : null,
    lastTimeMs: typeof state.lastTimeMs === 'number' ? state.lastTimeMs : null,
    inventory: {
      iron: state.iron ?? 0,
      copper: state.copper ?? 0,
      hasAxe: Boolean(state.hasAxe),
      hasIronPickaxe: Boolean(state.hasIronPickaxe),
      hasCopperPickaxe: Boolean(state.hasCopperPickaxe),
    },
    amoreCoins: wallet.balance,
    myPurchasedPickaxe: getPurchaseType(state, viewerUserId),
    partnerPurchasedPickaxe: getPurchaseType(state, partnerUserId),
    shopItems,
    boulders: (state.boulders ?? []).map((boulder: CliffPublicBoulder) => ({
      id: boulder.id,
      metal: boulder.metal,
      yield: boulder.yield,
      tapsRequired: boulder.tapsRequired,
      tapsDone: boulder.tapsDone,
      depleted: Boolean(boulder.depleted),
    })),
    mineResetAt: state.mineCycleStartedAt
      ? new Date(new Date(state.mineCycleStartedAt).getTime() + CLIFF_MINE_RESET_MS).toISOString()
      : null,
    presentUserIds: (state.presentUserIds ?? []).map((id: mongoose.Types.ObjectId) => toId(id)),
    myPresent: includesUser(state.presentUserIds, viewerUserId),
    partnerPresent: includesUser(state.presentUserIds, partnerUserId),
    bridge: {
      myStones: myProgress.stonesRemaining ?? CLIFF_STONES_EACH,
      partnerStones: partnerProgress.stonesRemaining ?? CLIFF_STONES_EACH,
      myHolesCompleted: myProgress.holesCompleted ?? 0,
      partnerHolesCompleted: partnerProgress.holesCompleted ?? 0,
      repaired:
        (myProgress.holesCompleted ?? 0) >= CLIFF_HOLES_REQUIRED &&
        (partnerProgress.holesCompleted ?? 0) >= CLIFF_HOLES_REQUIRED,
      canSurrender:
        state.scene === 'bridge' &&
        (myProgress.holesCompleted ?? 0) < CLIFF_HOLES_REQUIRED &&
        (partnerProgress.holesCompleted ?? 0) < CLIFF_HOLES_REQUIRED &&
        (myProgress.stonesRemaining ?? 0) === 0 &&
        (partnerProgress.stonesRemaining ?? 0) === 0,
    },
    lift: {
      raised: Boolean(state.liftRaised),
      minLevel: CLIFF_LIFT_PET_MIN_LEVEL,
      requiredCount: CLIFF_LIFT_PETS_REQUIRED,
      eligiblePets: liftPets.eligiblePets,
      standingPets: liftPets.standingPets,
    },
    ropes: {
      myIndex: myProgress.ropeIndex ?? 0,
      partnerIndex: partnerProgress.ropeIndex ?? 0,
      firstCount: CLIFF_ROPES_FIRST,
      secondCount: CLIFF_ROPES_SECOND,
      total: CLIFF_ROPES_TOTAL,
      checkpointIndex: CLIFF_ROPES_CHECKPOINT,
      cleared:
        (myProgress.ropeIndex ?? 0) >= CLIFF_ROPES_TOTAL &&
        (partnerProgress.ropeIndex ?? 0) >= CLIFF_ROPES_TOTAL,
    },
    balls: (() => {
      const myRemaining = myProgress.ballsRemaining ?? CLIFF_BALLS_EACH;
      const partnerRemaining = partnerProgress.ballsRemaining ?? CLIFF_BALLS_EACH;
      const myScore = myProgress.ballsScore ?? 0;
      const partnerScore = partnerProgress.ballsScore ?? 0;
      const pairScore = myScore + partnerScore;
      const cleared =
        myRemaining <= 0 &&
        partnerRemaining <= 0 &&
        pairScore >= CLIFF_BALLS_SCORE_THRESHOLD;
      return {
        myRemaining,
        partnerRemaining,
        myScore,
        partnerScore,
        pairScore,
        each: CLIFF_BALLS_EACH,
        threshold: CLIFF_BALLS_SCORE_THRESHOLD,
        zoneScores: [...CLIFF_BALL_ZONE_SCORES],
        cleared,
        canRetry: myRemaining <= 0 && partnerRemaining <= 0 && !cleared,
      };
    })(),
    caves: formatCavesPublic(state, viewerUserId, context),
    guides: formatGuidesPublic(state, viewerUserId, context, now, guidePets),
    words: formatWordsPublic(state, viewerUserId, context),
    canReset: state.scene === 'finished',
  };
};

export interface CliffEnterResult {
  state: any;
  playIntro: boolean;
  introLine: CliffIntroLine | null;
  enteringUserId: string;
}

const CLIFF_LEAVE_GRACE_MS = 700;
const pendingCliffLeaves = new Map<string, ReturnType<typeof setTimeout>>();

type CliffPresenceNotify = (state: any, context: CliffGameContext) => void;
let cliffPresenceNotify: CliffPresenceNotify | null = null;

export const bindCliffPresenceNotify = (notify: CliffPresenceNotify) => {
  cliffPresenceNotify = notify;
};

const cliffPresenceKey = (context: CliffGameContext, userId: string) =>
  `${context.relationship._id.toString()}:${userId}`;

export const cancelPendingCliffLeave = (userId: string, context: CliffGameContext) => {
  const key = cliffPresenceKey(context, userId);
  const timer = pendingCliffLeaves.get(key);
  if (!timer) {
    return;
  }
  clearTimeout(timer);
  pendingCliffLeaves.delete(key);
};

const applyCliffLeave = async (userId: string, context: CliffGameContext) => {
  return saveCliffStateWithRetry(context, (state) => {
    const nextPresent = (state.presentUserIds ?? []).filter((id: mongoose.Types.ObjectId) => toId(id) !== userId);
    if (nextPresent.length !== (state.presentUserIds ?? []).length) {
      state.presentUserIds = nextPresent;
    }
    dedupePresentUserIds(state);
    pauseCliffTimerIfEmpty(state, new Date());
  });
};

export const enterCliffGame = async (
  userId: string,
  context: CliffGameContext
): Promise<CliffEnterResult> => {
  cancelPendingCliffLeave(userId, context);
  const userOid = new mongoose.Types.ObjectId(userId);
  let playIntro = false;
  let introLine: CliffIntroLine | null = null;

  const state = await saveCliffStateWithRetry(context, (next) => {
    const now = new Date();
    dedupePresentUserIds(next);
    if (!includesUser(next.presentUserIds, userId)) {
      next.presentUserIds.push(userOid);
    }

    resumeCliffTimer(next, now);
    if (!next.runStartedAt) {
      next.runStartedAt = now;
    }

    playIntro = false;
    introLine = null;
    if (!includesUser(next.introPlayedUserIds, userId) && next.scene === 'hub') {
      playIntro = true;
      introLine = next.introPlayedUserIds.length === 0 ? 'wow' : 'agree';
      next.introPlayedUserIds.push(userOid);
    }
  });

  return { state, playIntro, introLine, enteringUserId: userId };
};

export const leaveCliffGame = async (userId: string, context: CliffGameContext) => {
  cancelPendingCliffLeave(userId, context);
  const key = cliffPresenceKey(context, userId);
  const state = await getOrCreateCliffGameState(context);

  pendingCliffLeaves.set(
    key,
    setTimeout(() => {
      pendingCliffLeaves.delete(key);
      void applyCliffLeave(userId, context)
        .then((next) => {
          cliffPresenceNotify?.(next, context);
        })
        .catch((error) => {
          console.error('cliff delayed leave error:', error);
        });
    }, CLIFF_LEAVE_GRACE_MS)
  );

  return state;
};

export const buyCliffShopItem = async (
  userId: string,
  context: CliffGameContext,
  itemId: string
) => {
  const shopItem = getCliffShopItem(itemId);
  if (!shopItem) {
    throw new CliffGameError('ITEM_NOT_FOUND', 'Предмет не найден');
  }

  const state = await getOrCreateCliffGameState(context);
  if (state.scene === 'finished') {
    throw new CliffGameError('RUN_FINISHED', 'Забег уже завершён. Начните заново.');
  }

  if (shopItem.id === 'axe') {
    if (state.hasAxe) {
      throw new CliffGameError('ALREADY_OWNED', 'Топор уже куплен');
    }
    if (state.iron < shopItem.ironCost || state.copper < shopItem.copperCost) {
      throw new CliffGameError('NOT_ENOUGH_ORE', 'Нужно 20 железа и 20 меди');
    }
    state.iron -= shopItem.ironCost;
    state.copper -= shopItem.copperCost;
    state.hasAxe = true;
    await state.save();
    return state;
  }

  const pickaxeType = shopItem.pickaxeType as CliffPickaxeType;
  const myPurchase = getPurchaseType(state, userId);
  if (myPurchase) {
    throw new CliffGameError('ALREADY_BOUGHT', 'Можно купить только один вид кирки');
  }

  const partnerUserId =
    userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const partnerPurchase = getPurchaseType(state, partnerUserId);
  if (partnerPurchase === pickaxeType) {
    throw new CliffGameError('PICKAXE_TAKEN', 'Партнёр уже купил эту кирку');
  }

  const spent = await spendCurrency(
    userId,
    shopItem.amoreCost,
    'cliff_shop',
    `cliff_shop:${state.relationshipId}:${state.runId}:${userId}:${shopItem.id}`
  );

  if (!spent.success) {
    throw new CliffGameError('NOT_ENOUGH_COINS', 'Недостаточно AmoreCoins');
  }

  state.purchasedPickaxes.push({
    userId: new mongoose.Types.ObjectId(userId),
    type: pickaxeType,
  });
  if (pickaxeType === 'iron') {
    state.hasIronPickaxe = true;
  } else {
    state.hasCopperPickaxe = true;
  }
  await state.save();
  return state;
};

const CLIFF_TAP_BATCH_MAX = 20;

export const normalizeCliffTapCount = (rawCount: unknown): number => {
  const parsed = typeof rawCount === 'number' ? rawCount : 1;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(Math.floor(parsed), CLIFF_TAP_BATCH_MAX);
};

export const enterCliffMine = async (userId: string, context: CliffGameContext) => {
  void userId;
  return saveCliffStateWithRetry(context, (state) => {
    maybeRefreshMineCycle(state, new Date());
  });
};

export const tapCliffBoulder = async (
  userId: string,
  context: CliffGameContext,
  boulderId: string,
  rawCount: unknown = 1
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'hub') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя копать');
  }

  const now = new Date();
  if (maybeRefreshMineCycle(state, now)) {
    await state.save();
    return { state, yielded: 0, metal: 'iron' as const };
  }

  const boulder = (state.boulders ?? []).find((item: { id: string }) => item.id === boulderId);
  if (!boulder) {
    throw new CliffGameError('BOULDER_NOT_FOUND', 'Валун не найден');
  }
  if (boulder.depleted) {
    throw new CliffGameError('BOULDER_DEPLETED', 'Этот валун уже пуст');
  }

  const hasPickaxe = boulder.metal === 'iron' ? state.hasIronPickaxe : state.hasCopperPickaxe;
  if (!hasPickaxe) {
    throw new CliffGameError(
      'NEED_PICKAXE',
      boulder.metal === 'iron' ? 'Нужна кирка железа' : 'Нужна кирка меди'
    );
  }

  const remaining = Math.max(0, boulder.tapsRequired - (boulder.tapsDone ?? 0));
  const applied = Math.min(normalizeCliffTapCount(rawCount), remaining);
  if (applied <= 0) {
    throw new CliffGameError('BOULDER_DEPLETED', 'Этот валун уже пуст');
  }

  if (!state.mineCycleStartedAt) {
    state.mineCycleStartedAt = now;
  }

  boulder.tapsDone = Math.min(boulder.tapsRequired, (boulder.tapsDone ?? 0) + applied);
  let yielded = 0;
  if (boulder.tapsDone >= boulder.tapsRequired) {
    boulder.depleted = true;
    yielded = boulder.yield;
    if (boulder.metal === 'iron') {
      state.iron += boulder.yield;
    } else {
      state.copper += boulder.yield;
    }
  }

  void userId;
  await state.save();
  return { state, yielded, metal: boulder.metal as 'iron' | 'copper' };
};

export const breakCliffGate = async (userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.gateDestroyed) {
    throw new CliffGameError('GATE_ALREADY_OPEN', 'Врата уже открыты');
  }
  if (!state.hasAxe) {
    throw new CliffGameError('NEED_AXE', 'Чтобы войти, нужен топорик');
  }

  ensureBridgeReady(state, context);
  state.gateDestroyed = true;
  state.scene = 'bridge';
  state.altitudeM = CLIFF_BRIDGE_ALTITUDE;
  state.bridgeRepaired = false;
  void userId;
  await state.save();
  return state;
};

export const throwCliffStone = async (
  userId: string,
  context: CliffGameContext,
  hit: boolean
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'bridge' || bothPlayersCompletedHoles(state, context)) {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя бросать');
  }

  const progress = getProgress(state, userId);
  if ((progress.holesCompleted ?? 0) >= CLIFF_HOLES_REQUIRED) {
    throw new CliffGameError('HOLES_COMPLETE', 'Вы уже попали во все отверстия');
  }
  if ((progress.stonesRemaining ?? 0) <= 0) {
    throw new CliffGameError('NO_STONES', 'Камешки кончились');
  }

  progress.stonesRemaining -= 1;
  if (hit) {
    progress.holesCompleted = Math.min(CLIFF_HOLES_REQUIRED, (progress.holesCompleted ?? 0) + 1);
  }

  state.bridgeRepaired = bothPlayersCompletedHoles(state, context);

  await state.save();
  return state;
};

export const surrenderCliffBridge = async (userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'bridge' || bothPlayersCompletedHoles(state, context)) {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя сдаться');
  }

  const myProgress = getProgress(state, userId);
  const partnerUserId =
    userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const partnerProgress = getProgress(state, partnerUserId);

  const bothStuck =
    (myProgress.stonesRemaining ?? 0) === 0 &&
    (partnerProgress.stonesRemaining ?? 0) === 0 &&
    (myProgress.holesCompleted ?? 0) < CLIFF_HOLES_REQUIRED &&
    (partnerProgress.holesCompleted ?? 0) < CLIFF_HOLES_REQUIRED;

  if (!bothStuck) {
    throw new CliffGameError('CANNOT_SURRENDER', 'Сдаться можно, только если у обоих кончились камни');
  }

  for (const progress of [myProgress, partnerProgress]) {
    progress.stonesRemaining = CLIFF_STONES_EACH;
    progress.holesCompleted = 0;
    progress.encouragementUses = 0;
    progress.encouragementCooldownUntil = undefined;
  }
  state.set('holeExpandedForUserId', null);
  state.set('holeExpandedUntil', null);
  await state.save();
  return state;
};

export const finishCliffBridge = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'bridge' || !bothPlayersCompletedHoles(state, context)) {
    throw new CliffGameError('BRIDGE_NOT_READY', 'Сначала восстановите мост');
  }
  state.bridgeRepaired = true;
  state.scene = 'lift';
  state.altitudeM = CLIFF_LIFT_ALTITUDE;
  state.liftRaised = false;
  state.liftPetIds = [];
  await state.save();
  return state;
};

export const activateCliffLift = async (
  _userId: string,
  context: CliffGameContext,
  petIds: string[]
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'lift') {
    throw new CliffGameError('LIFT_NOT_READY', 'Сначала перейдите к каменной плите');
  }
  if (state.liftRaised) {
    throw new CliffGameError('LIFT_ALREADY_RAISED', 'Плита уже сработала');
  }

  const uniqueIds = [...new Set((petIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean))];
  if (uniqueIds.length !== CLIFF_LIFT_PETS_REQUIRED || uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new CliffGameError(
      'NEED_TWO_PETS',
      'Сюда должны встать два питомца 2 уровня или выше'
    );
  }

  const coupleOwnerIds = [context.ownerUserId, context.partnerUserId];
  const pets = await Pet.find({
    _id: { $in: uniqueIds },
    ownerId: { $in: coupleOwnerIds },
    level: { $gte: CLIFF_LIFT_PET_MIN_LEVEL },
  });

  if (pets.length !== CLIFF_LIFT_PETS_REQUIRED) {
    throw new CliffGameError(
      'PETS_NOT_ELIGIBLE',
      'Нужны два питомца 2 уровня или выше — ваши или партнёра'
    );
  }

  state.liftRaised = true;
  state.liftPetIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));
  state.altitudeM = CLIFF_LIFT_RAISED_ALTITUDE;
  await state.save();
  return state;
};

const ropeIndexOf = (progress: { ropeIndex?: number }) =>
  Math.min(CLIFF_ROPES_TOTAL, Math.max(0, progress.ropeIndex ?? 0));

const syncCliffRopesAltitude = (state: any, context: CliffGameContext) => {
  const ownerIndex = ropeIndexOf(getProgress(state, context.ownerUserId));
  const partnerIndex = ropeIndexOf(getProgress(state, context.partnerUserId));
  const furthest = Math.max(ownerIndex, partnerIndex);
  if (furthest >= CLIFF_ROPES_TOTAL) {
    state.altitudeM = CLIFF_ROPES_END_ALTITUDE;
    return;
  }
  if (furthest >= CLIFF_ROPES_CHECKPOINT) {
    state.altitudeM = CLIFF_ROPES_CHECKPOINT_ALTITUDE;
    return;
  }
  state.altitudeM = CLIFF_ROPES_ALTITUDE;
};

export const enterCliffRopes = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'lift' || !state.liftRaised) {
    throw new CliffGameError('ROPES_NOT_READY', 'Сначала поднимите каменную плиту');
  }
  state.scene = 'ropes';
  syncCliffRopesAltitude(state, context);
  await state.save();
  return state;
};

export const jumpCliffRope = async (userId: string, context: CliffGameContext, hit: boolean) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'ropes') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя прыгать');
  }

  const progress = getProgress(state, userId);
  const current = ropeIndexOf(progress);
  if (current >= CLIFF_ROPES_TOTAL) {
    throw new CliffGameError('ROPES_COMPLETE', 'Вы уже переправились');
  }

  if (hit) {
    progress.ropeIndex = current + 1;
  } else {
    progress.ropeIndex = current >= CLIFF_ROPES_CHECKPOINT ? CLIFF_ROPES_CHECKPOINT : 0;
  }

  syncCliffRopesAltitude(state, context);
  await state.save();
  return state;
};

export const resetCliffRopes = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'ropes');
  await state.save();
  return state;
};

export const enterCliffBalls = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'ropes') {
    throw new CliffGameError('BALLS_NOT_READY', 'Сначала переправьтесь по канатам');
  }

  const ownerProgress = getProgress(state, context.ownerUserId);
  const partnerProgress = getProgress(state, context.partnerUserId);
  const cleared =
    ropeIndexOf(ownerProgress) >= CLIFF_ROPES_TOTAL &&
    ropeIndexOf(partnerProgress) >= CLIFF_ROPES_TOTAL;
  if (!cleared) {
    throw new CliffGameError('BALLS_NOT_READY', 'Сначала переправьтесь по канатам');
  }

  if (!bothPartnersPresent(state, context)) {
    throw new CliffGameError('WAIT_PARTNER', 'Подождите партнёра');
  }

  for (const progress of [ownerProgress, partnerProgress]) {
    resetBallsProgress(progress);
  }

  state.scene = 'balls';
  state.altitudeM = CLIFF_BALLS_ALTITUDE;
  await state.save();
  return state;
};

export const throwCliffBall = async (
  userId: string,
  context: CliffGameContext,
  zoneScoreRaw: unknown
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'balls') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя бросать шары');
  }
  if (ballsClearedOf(state, context)) {
    throw new CliffGameError('BALLS_COMPLETE', 'Дорожка с шарами уже пройдена');
  }

  const zoneScore = normalizeBallZoneScore(zoneScoreRaw);
  if (zoneScore === null) {
    throw new CliffGameError('INVALID_ZONE', 'Некорректная зона броска');
  }

  const progress = getProgress(state, userId);
  const remaining = progress.ballsRemaining ?? CLIFF_BALLS_EACH;
  if (remaining <= 0) {
    throw new CliffGameError('NO_BALLS', 'Шары закончились');
  }

  progress.ballsRemaining = remaining - 1;
  progress.ballsScore = (progress.ballsScore ?? 0) + zoneScore;
  state.altitudeM = CLIFF_BALLS_ALTITUDE;
  await state.save();
  return state;
};

export const resetCliffBalls = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'balls');
  await state.save();
  return state;
};

export const enterCliffCaves = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'balls') {
    throw new CliffGameError('CAVES_NOT_READY', 'Сначала пройдите дорожку с шарами');
  }
  if (!ballsClearedOf(state, context)) {
    throw new CliffGameError('CAVES_NOT_READY', 'Сначала пройдите дорожку с шарами');
  }
  if (!bothPartnersPresent(state, context)) {
    throw new CliffGameError('WAIT_PARTNER', 'Подождите партнёра');
  }

  resetCavesRunFields(state, context);
  state.scene = 'caves';
  state.altitudeM = CLIFF_CAVES_ALTITUDE;
  await state.save();
  return state;
};

export const tapCliffCaveBoulder = async (
  userId: string,
  context: CliffGameContext,
  boulderId: string,
  rawCount: unknown = 1
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'caves') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя копать в пещере');
  }

  const role = caveRoleOf(userId, context);
  const boulder = (state.caveBoulders ?? []).find((item: { id: string }) => item.id === boulderId);
  if (!boulder) {
    throw new CliffGameError('BOULDER_NOT_FOUND', 'Валун не найден');
  }
  if (boulder.side !== role) {
    throw new CliffGameError('WRONG_MINE', 'Это шахта партнёра');
  }
  if (boulder.depleted) {
    throw new CliffGameError('BOULDER_DEPLETED', 'Этот валун уже пуст');
  }

  const resource = boulder.resource as CliffCaveResource;
  const pickaxe = pickaxeForCaveResource(resource);
  const hasPickaxe = pickaxe === 'iron' ? state.hasIronPickaxe : state.hasCopperPickaxe;
  if (!hasPickaxe) {
    throw new CliffGameError(
      'NEED_PICKAXE',
      pickaxe === 'iron' ? 'Нужна кирка железа' : 'Нужна кирка меди'
    );
  }

  const remaining = Math.max(0, boulder.tapsRequired - (boulder.tapsDone ?? 0));
  const applied = Math.min(normalizeCliffTapCount(rawCount), remaining);
  if (applied <= 0) {
    throw new CliffGameError('BOULDER_DEPLETED', 'Этот валун уже пуст');
  }

  boulder.tapsDone = Math.min(boulder.tapsRequired, (boulder.tapsDone ?? 0) + applied);
  let yielded = 0;
  if (boulder.tapsDone >= boulder.tapsRequired) {
    boulder.depleted = true;
    yielded = boulder.yield;
    const progress = getProgress(state, userId);
    const inventory = caveInventoryOf(progress);
    inventory[resource] += boulder.yield;
    writeCaveInventory(progress, inventory);
  }

  await state.save();
  return { state, yielded, resource };
};

export const craftCliffCaveItem = async (userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'caves') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя крафтить');
  }

  const role = caveRoleOf(userId, context);
  const ownerInv = caveInventoryOf(getProgress(state, context.ownerUserId));
  const partnerInv = caveInventoryOf(getProgress(state, context.partnerUserId));
  const phase = deriveCavesPhase(ownerInv, partnerInv);
  const recipe = CLIFF_CAVE_CRAFT_STEPS.find((item) => item.step === phase.step);
  if (phase.action !== 'craft' || !recipe || recipe.role !== role) {
    throw new CliffGameError('WRONG_CRAFT_STEP', 'Сейчас не ваш шаг крафта');
  }

  const progress = getProgress(state, userId);
  const inventory = caveInventoryOf(progress);
  if (!canPayCaveCost(inventory, recipe.cost)) {
    throw new CliffGameError('NOT_ENOUGH_ORE', 'Не хватает материалов');
  }

  spendCaveCost(inventory, recipe.cost);
  inventory[recipe.result] += recipe.resultCount;
  writeCaveInventory(progress, inventory);
  await state.save();
  return state;
};

export const giftCliffCaveItem = async (
  userId: string,
  context: CliffGameContext,
  itemIdRaw: unknown
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'caves') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя передавать предметы');
  }
  if (!isCliffCaveItemId(itemIdRaw)) {
    throw new CliffGameError('ITEM_NOT_FOUND', 'Предмет не найден');
  }

  const partnerUserId =
    userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const ownerInv = caveInventoryOf(getProgress(state, context.ownerUserId));
  const partnerOwnedInv = caveInventoryOf(getProgress(state, context.partnerUserId));
  if (deriveCavesPhase(ownerInv, partnerOwnedInv).action === 'done') {
    throw new CliffGameError('WRONG_CRAFT_STEP', 'Передача уже не нужна');
  }

  const myProgress = getProgress(state, userId);
  const partnerProgress = getProgress(state, partnerUserId);
  const myInv = caveInventoryOf(myProgress);
  const partnerInv = caveInventoryOf(partnerProgress);
  if (myInv[itemIdRaw] <= 0) {
    throw new CliffGameError('NOT_ENOUGH_ORE', 'Нечего передавать');
  }

  myInv[itemIdRaw] -= 1;
  partnerInv[itemIdRaw] += 1;
  writeCaveInventory(myProgress, myInv);
  writeCaveInventory(partnerProgress, partnerInv);
  await state.save();
  return state;
};

export const resetCliffCaves = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'caves');
  await state.save();
  return state;
};

export const enterCliffGuides = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'caves') {
    throw new CliffGameError('GUIDES_NOT_READY', 'Сначала соберите фонари');
  }
  if (!cavesClearedOf(state, context)) {
    throw new CliffGameError('GUIDES_NOT_READY', 'Сначала соберите фонари');
  }
  if (!bothPartnersPresent(state, context)) {
    throw new CliffGameError('WAIT_PARTNER', 'Подождите партнёра');
  }

  resetGuidesRunFields(state, context);
  state.scene = 'guides';
  state.altitudeM = CLIFF_GUIDES_ALTITUDE;
  await state.save();
  return state;
};

export const pickCliffGuidePet = async (
  userId: string,
  context: CliffGameContext,
  petIdRaw: unknown
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'guides') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя звать питомца');
  }

  const progress = getProgress(state, userId);
  expireGuideTrail(progress, new Date());
  if (progress.guideEscaped) {
    throw new CliffGameError('GUIDE_ESCAPED', 'Вы уже вышли из лабиринта');
  }
  if (progress.guidePetId) {
    throw new CliffGameError('PET_ALREADY_CHOSEN', 'Питомец уже выбран');
  }

  const petId = String(petIdRaw ?? '');
  if (!mongoose.Types.ObjectId.isValid(petId)) {
    throw new CliffGameError('PETS_NOT_ELIGIBLE', 'Нужен питомец 2 уровня или выше');
  }

  const pet = await Pet.findOne({
    _id: petId,
    ownerId: { $in: [context.ownerUserId, context.partnerUserId] },
    level: { $gte: CLIFF_GUIDE_PET_MIN_LEVEL },
  });
  if (!pet) {
    throw new CliffGameError('PETS_NOT_ELIGIBLE', 'Нужен питомец 2 уровня или выше');
  }

  const partnerUserId = userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
  const partnerProgress = getProgress(state, partnerUserId);
  if (partnerProgress.guidePetId && toId(partnerProgress.guidePetId) === petId) {
    throw new CliffGameError('PET_TAKEN', 'Этот питомец уже выбран партнёром');
  }

  const runs = clampGuidePetRuns(pet.level ?? 1);
  progress.guidePetId = pet._id;
  progress.guideRunsTotal = runs;
  progress.guideRunsLeft = runs;
  await state.save();
  return state;
};

export const sendCliffGuidePet = async (userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'guides') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя отправлять питомца');
  }

  const role = caveRoleOf(userId, context);
  const map = guideMapOf(role);
  const progress = getProgress(state, userId);
  expireGuideTrail(progress, new Date());
  if (progress.guideEscaped) {
    throw new CliffGameError('GUIDE_ESCAPED', 'Вы уже вышли из лабиринта');
  }
  if (!progress.guidePetId) {
    throw new CliffGameError('NEED_GUIDE_PET', 'Сначала выберите питомца');
  }
  if ((progress.guideRunsLeft ?? 0) <= 0) {
    throw new CliffGameError('NO_GUIDE_RUNS', 'Пробежки закончились');
  }

  const from = {
    x: progress.guideX ?? map.start.x,
    y: progress.guideY ?? map.start.y,
  };
  const cells = guidePathFrom(map, from);
  if (cells.length === 0) {
    throw new CliffGameError('NO_GUIDE_RUNS', 'Путь уже показан');
  }

  const lastFork = [...cells].reverse().find((point) => isGuideFork(map, point));
  progress.guideScoutIndex = map.path.length;
  progress.guideRunsLeft = Math.max(0, (progress.guideRunsLeft ?? 0) - 1);
  progress.guideTrailCells = cells.map((point) => `${point.x},${point.y}`);
  progress.guideTrailUntil = new Date(Date.now() + cells.length * CLIFF_GUIDE_PET_STEP_MS + CLIFF_GUIDE_TRAIL_MS);
  progress.guideLastForkX = lastFork?.x ?? null;
  progress.guideLastForkY = lastFork?.y ?? null;
  await state.save();
  return state;
};

const respawnGuidePlayer = (progress: CliffGuideProgress, map: ReturnType<typeof guideMapOf>) => {
  if (!progress.guideTrapTold) {
    progress.guideTrapTold = true;
  }
  progress.guideX = map.start.x;
  progress.guideY = map.start.y;
  progress.guideScoutIndex = 0;
  progress.guideTrailUntil = null;
  progress.guideTrailCells = [];
  progress.guideLastForkX = null;
  progress.guideLastForkY = null;
  progress.guideRunsLeft = progress.guideRunsTotal ?? 0;
};

export const moveCliffGuide = async (
  userId: string,
  context: CliffGameContext,
  dirRaw: unknown
) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'guides') {
    throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя идти');
  }
  if (!isCliffGuideDir(dirRaw)) {
    throw new CliffGameError('INVALID_DIR', 'Некорректное направление');
  }

  const role = caveRoleOf(userId, context);
  const map = guideMapOf(role);
  const progress = getProgress(state, userId);
  const now = new Date();
  expireGuideTrail(progress, now);
  if (progress.guideEscaped) {
    throw new CliffGameError('GUIDE_ESCAPED', 'Вы уже вышли из лабиринта');
  }

  const from = {
    x: progress.guideX ?? map.start.x,
    y: progress.guideY ?? map.start.y,
  };
  const next = shiftGuidePoint(from, dirRaw);
  const kind = map.cells[next.y]?.[next.x];
  if (!kind || kind === 'wall' || kind === 'trap') {
    respawnGuidePlayer(progress, map);
    await state.save();
    return state;
  }

  progress.guideX = next.x;
  progress.guideY = next.y;
  if (isGuideFork(map, next)) {
    const trailActive = Boolean(
      progress.guideTrailUntil && new Date(progress.guideTrailUntil).getTime() > now.getTime()
    );
    const onTrail = guideTrailCellsOf(progress).some((cell) => cell.x === next.x && cell.y === next.y);
    if (trailActive && onTrail) {
      progress.guideLastForkX = next.x;
      progress.guideLastForkY = next.y;
    }
  }
  if (kind === 'exit') {
    progress.guideEscaped = true;
    progress.guideTrailUntil = null;
    progress.guideTrailCells = [];
  }
  await state.save();
  return state;
};

export const resetCliffGuides = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'guides');
  await state.save();
  return state;
};

export const enterCliffWords = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'guides') {
    throw new CliffGameError('WORDS_NOT_READY', 'Сначала выйдите из лабиринта');
  }
  if (!guidesClearedOf(state, context)) {
    throw new CliffGameError('WORDS_NOT_READY', 'Сначала выйдите из лабиринта');
  }
  if (!bothPartnersPresent(state, context)) {
    throw new CliffGameError('WAIT_PARTNER', 'Подождите партнёра');
  }

  resetWordsRunFields(state, context);
  state.wordsFailSeq = 0;
  state.wordsCameraY = CLIFF_WORDS_CAMERA_START;
  state.scene = 'words';
  state.altitudeM = CLIFF_WORDS_ALTITUDE;
  await state.save();
  return state;
};

const applyWordsPosition = (
  progress: CliffWordsProgress,
  xRaw: unknown,
  yRaw: unknown,
  bounce: boolean
) => {
  const storedY = progress.wordsY ?? 0;
  const x = typeof xRaw === 'number' ? xRaw : Number(xRaw);
  const y = typeof yRaw === 'number' ? yRaw : Number(yRaw);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new CliffGameError('INVALID_WORDS_POS', 'Некорректная позиция');
  }

  progress.wordsX = clampWordsX(x);
  const recordedBase = progress.wordsBaseY;
  const baseY = recordedBase && recordedBase > 0 ? recordedBase : storedY;
  if (bounce) {
    const nextY = clampWordsY(y);
    progress.wordsY = Math.min(baseY + CLIFF_WORDS_MAX_BOUNCE_DY, Math.max(baseY, nextY));
    progress.wordsBaseY = progress.wordsY;
  } else {
    progress.wordsY = clampWordsY(
      Math.min(baseY + CLIFF_WORDS_MAX_BOUNCE_DY, Math.max(baseY - CLIFF_WORDS_MAX_FALL_DY, y))
    );
  }

  const reached = cliffWordsCheckpointAtY(progress.wordsY);
  if (reached > (progress.wordsCheckpoint ?? 0)) {
    progress.wordsCheckpoint = reached;
  }
  if ((progress.wordsY ?? 0) >= CLIFF_WORDS_FINISH_Y - 1) {
    progress.wordsCleared = true;
    progress.wordsY = CLIFF_WORDS_FINISH_Y;
  }
};

export const syncCliffWords = async (
  userId: string,
  context: CliffGameContext,
  payload: { x?: unknown; y?: unknown; bounce?: unknown; fall?: unknown }
) =>
  saveCliffStateWithRetry(context, (state) => {
    if (state.scene !== 'words') {
      throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя прыгать');
    }

    const role = caveRoleOf(userId, context);
    const partnerUserId = userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
    const progress = getProgress(state, userId);
    const partnerProgress = getProgress(state, partnerUserId);
    const bounce = payload.bounce === true;
    const bothPresent = bothPartnersPresent(state, context);
    const pairStillClimbing = !progress.wordsCleared && !partnerProgress.wordsCleared;

    if (payload.fall === true && !progress.wordsCleared) {
      restartWordsFromStart(progress, role);
      bumpWordsFail(state);
      return;
    }

    if (bounce) {
      const fuel = progress.wordsFuel ?? CLIFF_WORDS_FUEL_START;
      if (fuel < CLIFF_WORDS_FUEL_BOUNCE) {
        failWordsForFuel(state, context, progress, role, bothPresent, pairStillClimbing);
        return;
      }
      progress.wordsFuel = fuel - CLIFF_WORDS_FUEL_BOUNCE;
    }

    applyWordsPosition(progress, payload.x, payload.y, bounce);

    if (bounce && (progress.wordsFuel ?? 0) <= 0 && !progress.wordsCleared) {
      failWordsForFuel(state, context, progress, role, bothPresent, pairStillClimbing);
    }
  });

export const ackCliffWordsFuelHint = async (userId: string, context: CliffGameContext) =>
  saveCliffStateWithRetry(context, (state) => {
    if (state.scene !== 'words') {
      throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя прыгать');
    }
    const progress = getProgress(state, userId);
    progress.wordsShowFuelHint = false;
    progress.wordsFuelHintTold = true;
    progress.wordsIntroTold = true;
  });

export const ackCliffWordsIntro = async (userId: string, context: CliffGameContext) =>
  saveCliffStateWithRetry(context, (state) => {
    if (state.scene !== 'words') {
      throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя прыгать');
    }
    getProgress(state, userId).wordsIntroTold = true;
  });

export const phraseCliffWords = async (
  userId: string,
  context: CliffGameContext,
  phraseIdRaw: unknown
) =>
  saveCliffStateWithRetry(context, (state) => {
    if (state.scene !== 'words') {
      throw new CliffGameError('WRONG_SCENE', 'Сейчас нельзя подбадривать');
    }
    if (!isCliffWordsPhraseId(phraseIdRaw)) {
      throw new CliffGameError('PHRASE_INVALID', 'Такой фразы нет');
    }

    const partnerUserId = userId === context.ownerUserId ? context.partnerUserId : context.ownerUserId;
    const progress = getProgress(state, userId);
    const partnerProgress = getProgress(state, partnerUserId);
    const used = progress.wordsUsedPhrases ?? [];
    if (used.includes(phraseIdRaw)) {
      throw new CliffGameError('PHRASE_USED', 'Эту фразу уже говорили');
    }

    progress.wordsUsedPhrases = [...used, phraseIdRaw];
    partnerProgress.wordsFuel = Math.min(
      CLIFF_WORDS_FUEL_MAX,
      (partnerProgress.wordsFuel ?? CLIFF_WORDS_FUEL_START) + CLIFF_WORDS_FUEL_PHRASE
    );
    state.wordsLastPhraseUserId = new mongoose.Types.ObjectId(userId);
    state.wordsLastPhraseId = phraseIdRaw;
    state.wordsLastPhraseAt = new Date();
  });

export const resetCliffWords = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'words');
  await state.save();
  return state;
};

export const resetCliffGateAndBridge = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  resetStagesFrom(state, context, 'gate');
  await state.save();
  return state;
};

export const resetCliffRun = async (_userId: string, context: CliffGameContext) => {
  const state = await getOrCreateCliffGameState(context);
  if (state.scene !== 'finished') {
    throw new CliffGameError('RUN_NOT_FINISHED', 'Сбросить забег можно после финиша');
  }

  const bestTimeMs = state.bestTimeMs;
  const presentUserIds = [...(state.presentUserIds ?? [])];
  Object.assign(state, createRunFields(context.ownerUserId, context.partnerUserId));
  state.bestTimeMs = bestTimeMs;
  state.presentUserIds = presentUserIds;
  state.introPlayedUserIds = [...presentUserIds];
  if (presentUserIds.length > 0) {
    state.runStartedAt = new Date();
  }
  await state.save();
  return state;
};

const getRelationshipPairKey = (
  userId: mongoose.Types.ObjectId,
  partnerId: mongoose.Types.ObjectId
) => [userId.toString(), partnerId.toString()].sort().join(':');

interface RankedCliffPairRow {
  relationshipId: string;
  bestTimeMs: number | null;
  elapsedMs: number;
  altitudeM: number;
  status: 'finished' | 'playing';
}

const getRankedCliffPairRows = async (limit: number): Promise<RankedCliffPairRow[]> => {
  const states = await CliffGameState.find({
    relationshipId: { $ne: null },
    $or: [{ bestTimeMs: { $ne: null } }, { runStartedAt: { $ne: null } }],
  }).lean();

  const now = Date.now();
  const pairBest = new Map<string, RankedCliffPairRow>();

  await Promise.all(
    states.map(async (row) => {
      const relationship = await Relationship.findById(row.relationshipId).select(
        'userId partnerId'
      );
      if (!relationship) {
        return;
      }

      const status: 'finished' | 'playing' =
        typeof row.bestTimeMs === 'number' ? 'finished' : 'playing';
      const elapsedMs = computeElapsedMs(row, new Date(now));

      const candidate: RankedCliffPairRow = {
        relationshipId: row.relationshipId.toString(),
        bestTimeMs: typeof row.bestTimeMs === 'number' ? row.bestTimeMs : null,
        elapsedMs,
        altitudeM: row.altitudeM ?? CLIFF_HUB_ALTITUDE,
        status,
      };

      const pairKey = getRelationshipPairKey(relationship.userId, relationship.partnerId);
      const existing = pairBest.get(pairKey);
      if (!existing) {
        pairBest.set(pairKey, candidate);
        return;
      }

      if (candidate.status === 'finished' && existing.status !== 'finished') {
        pairBest.set(pairKey, candidate);
        return;
      }
      if (
        candidate.status === 'finished' &&
        existing.status === 'finished' &&
        (candidate.bestTimeMs ?? Number.POSITIVE_INFINITY) <
          (existing.bestTimeMs ?? Number.POSITIVE_INFINITY)
      ) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  return [...pairBest.values()]
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'finished' ? -1 : 1;
      }
      if (a.status === 'finished') {
        return (a.bestTimeMs ?? 0) - (b.bestTimeMs ?? 0);
      }
      return b.altitudeM - a.altitudeM || a.elapsedMs - b.elapsedMs;
    })
    .slice(0, limit);
};

export const updateCliffGameBadges = async () => {
  const topPairs = (await getRankedCliffPairRows(50))
    .filter((entry) => entry.status === 'finished')
    .slice(0, 3);

  await Relationship.updateMany(
    { 'badges.gameId': 'cliff' },
    { $pull: { badges: { gameId: 'cliff' } } }
  );

  await Promise.all(
    topPairs.map(async (entry, index) => {
      await Relationship.findByIdAndUpdate(entry.relationshipId, {
        $push: {
          badges: {
            gameId: 'cliff',
            rank: index + 1,
            updatedAt: new Date(),
          },
        },
      });
    })
  );
};

export const getCliffLeaderboard = async (limit = 50) => {
  const rankedRows = await getRankedCliffPairRows(limit);

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
        totalScore: entry.bestTimeMs ?? entry.elapsedMs,
        bestTimeMs: entry.bestTimeMs,
        elapsedMs: entry.elapsedMs,
        altitudeM: entry.altitudeM,
        status: entry.status,
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

  return results.filter(Boolean).map((entry, index) => ({ ...entry!, rank: index + 1 }));
};
