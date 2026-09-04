import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  postCliffActivateLift,
  postCliffBallThrow,
  postCliffBreakGate,
  postCliffBuy,
  postCliffCaveCraft,
  postCliffCaveGift,
  postCliffEnter,
  postCliffEnterBalls,
  postCliffEnterCaves,
  postCliffEnterGuides,
  postCliffEnterMine,
  postCliffEnterWords,
  postCliffEnterRopes,
  postCliffFinish,
  postCliffLeave,
  postCliffReset,
  postCliffResetBalls,
  postCliffMoveGuide,
  postCliffPickGuidePet,
  postCliffResetCaves,
  postCliffResetGate,
  postCliffResetGuides,
  postCliffResetRopes,
  postCliffResetWords,
  postCliffSendGuidePet,
  postCliffSyncWords,
  postCliffWordsFuelHint,
  postCliffWordsIntro,
  postCliffWordsPhrase,
  postCliffRopeJump,
  postCliffSurrender,
  postCliffTapBoulder,
  postCliffTapCaveBoulder,
  postCliffThrow,
  type CliffCaveItemId,
  type CliffCaveInventory,
  type CliffCaveResource,
  type CliffGameState,
  type CliffGuideDir,
  type CliffIntroLine,
  type CliffWordsPhraseId,
  type CliffPublicBoulder,
  type CliffPublicCaveBoulder,
  type CliffShopItemId,
} from '../services/gamesService';
import GameFrame from '../components/Games/GameFrame';
import BrandLoader from '../components/common/BrandLoader';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import CliffInventoryBar from '../components/Games/Cliff/CliffInventoryBar';
import CliffHub from '../components/Games/Cliff/CliffHub';
import CliffShop from '../components/Games/Cliff/CliffShop';
import CliffMine from '../components/Games/Cliff/CliffMine';
import CliffGateDialog from '../components/Games/Cliff/CliffGateDialog';
import CliffClimb from '../components/Games/Cliff/CliffClimb';
import CliffBridgeGame from '../components/Games/Cliff/CliffBridgeGame';
import CliffFinish from '../components/Games/Cliff/CliffFinish';
import CliffLift from '../components/Games/Cliff/CliffLift';
import CliffLiftDialog from '../components/Games/Cliff/CliffLiftDialog';
import CliffRopes from '../components/Games/Cliff/CliffRopes';
import CliffBalls from '../components/Games/Cliff/CliffBalls';
import CliffCaves from '../components/Games/Cliff/CliffCaves';
import CliffCaveFall from '../components/Games/Cliff/CliffCaveFall';
import CliffGuides from '../components/Games/Cliff/CliffGuides';
import CliffWords from '../components/Games/Cliff/CliffWords';
import CliffOverlayPresence from '../components/Games/Cliff/CliffOverlayPresence';
import CliffItemAward from '../components/Games/Cliff/CliffItemAward';
import { cliffCaveItemImage, cliffItemImage } from '../components/Games/Cliff/cliffAssets';
import { CLIFF_ITEM_AWARD_MS } from '../components/Games/Cliff/cliffStyles';
import {
  getGamePlayBlockedCardSx,
  getGamePlayBlockedPanelSx,
  getGamePlayHeaderIconButtonSx,
  getGamePlayHeaderSx,
  getGamePlayHeaderTitleSx,
  getGamePlayLoadingWrapSx,
  getGamePlayOutlinedButtonSx,
  getGamePlayRootSx,
} from '../components/Games/gamePlayPageStyles';
import {
  playCliffBuySound,
  playCliffHitSound,
  playCliffMineTapSound,
  playCliffMissSound,
  playCliffOreDropSound,
  playCliffSpeechSound,
  playCliffThrowSound,
  playCliffWoodBreakSound,
  unlockGameAudio,
} from '../utils/gameSounds';
import { ArrowBackIcon } from '../components/UI/icons';

type HubOverlay = 'none' | 'shop' | 'mine' | 'gate';

const SPEECH_MS = 4200;
const WALK_MS = 1300;
const CLIMB_MS = 2800;
const LEAVE_GRACE_MS = 400;
const CLIFF_TAP_FLUSH_DEBOUNCE_MS = 400;
const CLIFF_TAP_BATCH_MAX = 20;

const detectCliffPurchase = (prev: CliffGameState, next: CliffGameState): CliffShopItemId | null => {
  if (!prev.inventory.hasAxe && next.inventory.hasAxe) {
    return 'axe';
  }
  if (!prev.inventory.hasIronPickaxe && next.inventory.hasIronPickaxe) {
    return 'iron_pickaxe';
  }
  if (!prev.inventory.hasCopperPickaxe && next.inventory.hasCopperPickaxe) {
    return 'copper_pickaxe';
  }
  return null;
};

const CLIFF_CAVE_CRAFTED_ITEMS: CliffCaveItemId[] = ['wick_cup', 'lens_flask', 'lamp_body', 'lantern'];

const detectCliffCaveItemGain = (
  prev: CliffGameState,
  next: CliffGameState
): { itemId: CliffCaveItemId; amount: number } | null => {
  if (!prev.caves || !next.caves) {
    return null;
  }
  for (const itemId of CLIFF_CAVE_CRAFTED_ITEMS) {
    const amount = next.caves.my[itemId] - prev.caves.my[itemId];
    if (amount > 0) {
      return { itemId, amount };
    }
  }
  return null;
};

const emptyCaveInventory = (): CliffCaveInventory => ({
  iron: 0,
  copper: 0,
  quartz: 0,
  resin: 0,
  wick_cup: 0,
  lens_flask: 0,
  lamp_body: 0,
  lantern: 0,
});

const emptyCavesState = (): CliffGameState['caves'] => ({
  role: 'owner',
  step: 1,
  action: 'craft',
  canCraft: false,
  canGift: false,
  giftables: [],
  my: emptyCaveInventory(),
  partner: emptyCaveInventory(),
  boulders: [],
  cleared: false,
});

const emptyGuidesState = (): CliffGameState['guides'] => ({
  role: 'owner',
  width: 0,
  height: 0,
  cells: [],
  my: {
    x: 0,
    y: 0,
    escaped: false,
    runsLeft: 0,
    runsTotal: 0,
    lanternWithPet: false,
    trail: [],
    trailUntil: null,
    lastFork: null,
    pet: null,
    trapTold: false,
  },
  partnerEscaped: false,
  bothEscaped: false,
  eligiblePets: [],
  minLevel: 2,
});

const emptyWordsState = (): CliffGameState['words'] => ({
  role: 'owner',
  world: {
    width: 100,
    cameraHeight: 100,
    finishY: 522,
    platforms: [],
  },
  my: {
    x: 18,
    y: 16,
    fuel: 12,
    checkpoint: 0,
    cleared: false,
    usedPhrases: [],
  },
  partner: {
    x: 26,
    y: 16,
    fuel: 12,
    checkpoint: 0,
    cleared: false,
  },
  phraseIds: ['cheer', 'believe', 'together', 'proud'],
  fuelStart: 12,
  fuelMax: 12,
  fuelBounce: 1,
  fuelPhrase: 4,
  bothCleared: false,
  failSeq: 0,
  fuelHint: false,
  introTold: false,
  lastPhrase: null,
  cameraY: 0,
});

const projectCliffBoulderTaps = (
  state: CliffGameState,
  boulderId: string | null,
  extraTaps: number
): CliffGameState => {
  if (!boulderId || extraTaps <= 0) {
    return state;
  }
  return {
    ...state,
    boulders: state.boulders.map((boulder) => {
      if (boulder.id !== boulderId) {
        return boulder;
      }
      const tapsDone = Math.min(boulder.tapsRequired, boulder.tapsDone + extraTaps);
      return { ...boulder, tapsDone };
    }),
  };
};

const findCliffVein = (game: CliffGameState | null | undefined, id: string | null) => {
  if (!game || !id) {
    return null;
  }
  return (
    game.boulders.find((boulder) => boulder.id === id) ??
    game.caves?.boulders.find((boulder) => boulder.id === id) ??
    null
  );
};

const projectCliffCaveBoulderTaps = (
  boulders: CliffPublicCaveBoulder[],
  boulderId: string | null,
  extraTaps: number
): CliffPublicCaveBoulder[] => {
  if (!boulderId || extraTaps <= 0) {
    return boulders;
  }
  return boulders.map((boulder) => {
    if (boulder.id !== boulderId) {
      return boulder;
    }
    const tapsDone = Math.min(boulder.tapsRequired, boulder.tapsDone + extraTaps);
    return { ...boulder, tapsDone };
  });
};

let scheduledCliffLeave: number | null = null;

const cancelScheduledCliffLeave = () => {
  if (!scheduledCliffLeave) {
    return;
  }
  window.clearTimeout(scheduledCliffLeave);
  scheduledCliffLeave = null;
};

const scheduleCliffLeave = (leave: () => void) => {
  cancelScheduledCliffLeave();
  scheduledCliffLeave = window.setTimeout(() => {
    scheduledCliffLeave = null;
    leave();
  }, LEAVE_GRACE_MS);
};

const CliffGamePlayPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState<CliffGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<HubOverlay>('none');
  const [activeBoulderId, setActiveBoulderId] = useState<string | null>(null);
  const [oreBurst, setOreBurst] = useState<{ amount: number; resource: CliffCaveResource } | null>(null);
  const [itemBurst, setItemBurst] = useState<{ src: string; amount?: number } | null>(null);
  const [buying, setBuying] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [ropesEpoch, setRopesEpoch] = useState(0);
  const [ballsEpoch, setBallsEpoch] = useState(0);
  const [cavesEpoch, setCavesEpoch] = useState(0);
  const [guidesEpoch, setGuidesEpoch] = useState(0);
  const [wordsEpoch, setWordsEpoch] = useState(0);
  const [caveMineOpen, setCaveMineOpen] = useState(false);
  const [showCaveFall, setShowCaveFall] = useState(false);
  const [caveFallEpoch, setCaveFallEpoch] = useState(0);
  const [showClimb, setShowClimb] = useState(false);
  const [showLiftDialog, setShowLiftDialog] = useState(false);
  const [activatingLift, setActivatingLift] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [myWalking, setMyWalking] = useState(false);
  const [partnerWalking, setPartnerWalking] = useState(false);
  const [mySpeech, setMySpeech] = useState<string | null>(null);
  const [partnerSpeech, setPartnerSpeech] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const climbPlayedRef = useRef(false);
  const seenIntroRef = useRef<Set<string>>(new Set());
  const stateRef = useRef<CliffGameState | null>(null);
  const activeBoulderIdRef = useRef<string | null>(null);
  const pendingMineTapsRef = useRef(0);
  const inFlightMineTapsRef = useRef(0);
  const flushingMineTapsRef = useRef(false);
  const mineTapFlushRef = useRef<number | null>(null);
  const playCaveFall = useCallback(() => {
    setCaveFallEpoch((value) => value + 1);
    setShowCaveFall(true);
  }, []);
  const [pendingMineTaps, setPendingMineTaps] = useState(0);
  const [inFlightMineTaps, setInFlightMineTaps] = useState(0);
  activeBoulderIdRef.current = activeBoulderId;

  const introText = useCallback(
    (line: CliffIntroLine | null | undefined) => {
      if (line === 'wow') {
        return t('games.cliff.intro.wow');
      }
      if (line === 'agree') {
        return t('games.cliff.intro.agree');
      }
      return null;
    },
    [t]
  );

  const applyIntro = useCallback(
    (payload: { playIntro?: boolean; introLine?: CliffIntroLine | null; enteringUserId?: string }, viewerId: string) => {
      const enteringUserId = payload.enteringUserId;
      if (!enteringUserId || !payload.introLine) {
        return;
      }
      const key = `${enteringUserId}:${payload.introLine}`;
      if (seenIntroRef.current.has(key)) {
        return;
      }
      seenIntroRef.current.add(key);
      const speech = introText(payload.introLine);
      void playCliffSpeechSound();
      if (enteringUserId === viewerId) {
        setMyWalking(true);
        setMySpeech(speech);
        window.setTimeout(() => setMyWalking(false), WALK_MS);
        window.setTimeout(() => setMySpeech(null), SPEECH_MS);
        return;
      }
      setPartnerWalking(true);
      setPartnerSpeech(speech);
      window.setTimeout(() => setPartnerWalking(false), WALK_MS);
      window.setTimeout(() => setPartnerSpeech(null), SPEECH_MS);
    },
    [introText]
  );

  const clearMineTapProjection = useCallback(() => {
    pendingMineTapsRef.current = 0;
    inFlightMineTapsRef.current = 0;
    setPendingMineTaps(0);
    setInFlightMineTaps(0);
  }, []);

  const syncState = useCallback((next: CliffGameState) => {
    const prev = stateRef.current;
    const openId = activeBoulderIdRef.current;
    if (openId && prev) {
      const prevBoulder = findCliffVein(prev, openId);
      const nextBoulder = findCliffVein(next, openId);
      if (prevBoulder && nextBoulder) {
        const applied = Math.max(0, nextBoulder.tapsDone - prevBoulder.tapsDone);
        if (applied > 0 && inFlightMineTapsRef.current > 0) {
          inFlightMineTapsRef.current = Math.max(0, inFlightMineTapsRef.current - applied);
          setInFlightMineTaps(inFlightMineTapsRef.current);
        }
      } else if (!nextBoulder) {
        pendingMineTapsRef.current = 0;
        inFlightMineTapsRef.current = 0;
        setPendingMineTaps(0);
        setInFlightMineTaps(0);
        setActiveBoulderId(null);
        setOreBurst(null);
      }
    }
    if (prev) {
      const purchased = detectCliffPurchase(prev, next);
      if (purchased) {
        setItemBurst({ src: cliffItemImage(purchased) });
        void playCliffBuySound(purchased);
      }
      const caveGain = detectCliffCaveItemGain(prev, next);
      if (caveGain) {
        setItemBurst({ src: cliffCaveItemImage(caveGain.itemId), amount: caveGain.amount });
        void playCliffOreDropSound();
      }
      if (!prev.gateDestroyed && next.gateDestroyed) {
        void playCliffWoodBreakSound();
      }
    }
    if (prev?.scene === 'finished' && next.scene === 'hub') {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('cliff_game_subscribe');
      }
    }
    const withLift: CliffGameState = next.lift
      ? next
      : {
          ...next,
          lift: {
            raised: false,
            minLevel: 2,
            requiredCount: 2,
            eligiblePets: [],
            standingPets: [],
          },
        };
    const withRopes: CliffGameState = withLift.ropes
      ? withLift
      : {
          ...withLift,
          ropes: {
            myIndex: 0,
            partnerIndex: 0,
            firstCount: 3,
            secondCount: 5,
            total: 8,
            checkpointIndex: 3,
            cleared: false,
          },
        };
    const withBalls: CliffGameState = withRopes.balls
      ? withRopes
      : {
          ...withRopes,
          balls: {
            myRemaining: 5,
            partnerRemaining: 5,
            myScore: 0,
            partnerScore: 0,
            pairScore: 0,
            each: 5,
            threshold: 170,
            zoneScores: [10, 20, 30, 40],
            cleared: false,
            canRetry: false,
          },
        };
    const withCaves: CliffGameState = withBalls.caves
      ? withBalls
      : {
          ...withBalls,
          caves: emptyCavesState(),
        };
    const withGuides: CliffGameState = withCaves.guides
      ? withCaves
      : {
          ...withCaves,
          guides: emptyGuidesState(),
        };
    const normalized: CliffGameState = withGuides.words
      ? withGuides
      : {
          ...withGuides,
          words: emptyWordsState(),
        };
    stateRef.current = normalized;
    setState((current) => {
      if (normalized.scene === 'bridge' && current?.scene === 'hub' && !climbPlayedRef.current) {
        climbPlayedRef.current = true;
        setShowClimb(true);
        window.setTimeout(() => setShowClimb(false), CLIMB_MS);
      }
      if (normalized.scene === 'hub') {
        climbPlayedRef.current = false;
      }
      if (normalized.scene !== 'hub') {
        setOverlay('none');
        if (normalized.scene !== 'caves') {
          setActiveBoulderId(null);
          setCaveMineOpen(false);
        }
      }
      if (prev && prev.scene === 'balls' && normalized.scene === 'caves') {
        playCaveFall();
      }
      if (normalized.scene !== 'lift') {
        setShowLiftDialog(false);
      }
      if (
        prev &&
        normalized.scene === 'ropes' &&
        normalized.ropes.myIndex === 0 &&
        normalized.ropes.partnerIndex === 0 &&
        !normalized.ropes.cleared &&
        (prev.scene !== 'ropes' ||
          prev.ropes.myIndex !== 0 ||
          prev.ropes.partnerIndex !== 0 ||
          prev.ropes.cleared)
      ) {
        setRopesEpoch((value) => value + 1);
      }
      if (
        prev &&
        normalized.scene === 'balls' &&
        normalized.balls.myRemaining === normalized.balls.each &&
        normalized.balls.partnerRemaining === normalized.balls.each &&
        normalized.balls.pairScore === 0 &&
        !normalized.balls.cleared &&
        (prev.scene !== 'balls' ||
          prev.balls.myRemaining !== prev.balls.each ||
          prev.balls.partnerRemaining !== prev.balls.each ||
          prev.balls.pairScore !== 0 ||
          prev.balls.cleared)
      ) {
        setBallsEpoch((value) => value + 1);
      }
      if (
        prev &&
        normalized.scene === 'caves' &&
        normalized.caves.my.iron === 0 &&
        normalized.caves.my.copper === 0 &&
        normalized.caves.my.quartz === 0 &&
        normalized.caves.my.resin === 0 &&
        normalized.caves.my.lantern === 0 &&
        !normalized.caves.cleared &&
        (prev.scene !== 'caves' || prev.caves.cleared || prev.caves.my.lantern > 0 || prev.caves.my.iron > 0)
      ) {
        setCavesEpoch((value) => value + 1);
        setCaveMineOpen(false);
        setActiveBoulderId(null);
        playCaveFall();
      }
      if (
        prev &&
        normalized.scene === 'guides' &&
        !normalized.guides.my.escaped &&
        !normalized.guides.my.pet &&
        normalized.guides.my.runsLeft === 0 &&
        (prev.scene !== 'guides' || prev.guides.my.escaped || Boolean(prev.guides.my.pet))
      ) {
        setGuidesEpoch((value) => value + 1);
      }
      if (
        prev &&
        normalized.scene === 'words' &&
        normalized.words.my.y <= (normalized.words.world.platforms[0]?.y ?? 0) + 0.8 &&
        normalized.words.my.fuel === normalized.words.fuelStart &&
        normalized.words.my.usedPhrases.length === 0 &&
        !normalized.words.my.cleared &&
        (prev.scene !== 'words' ||
          prev.words.my.cleared ||
          prev.words.my.usedPhrases.length > 0 ||
          prev.words.my.y > (normalized.words.world.platforms[0]?.y ?? 0) + 0.8)
      ) {
        setWordsEpoch((value) => value + 1);
      }
      return normalized;
    });
  }, [playCaveFall]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await postCliffEnter();
        if (cancelled) {
          return;
        }
        cancelScheduledCliffLeave();
        syncState(data.state);
        if (user?._id) {
          applyIntro(data, user._id);
        }
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        if (error?.response?.data?.code === 'NO_PARTNER') {
          setBlockedReason(error.response.data.error || t('games.common.partnerRequired'));
          return;
        }
        window.setTimeout(() => {
          if (!cancelled && !stateRef.current) {
            setToast({ open: true, message: t('games.common.loadFailed'), severity: 'error' });
          }
        }, 400);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [applyIntro, syncState, t, user?._id]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    cancelScheduledCliffLeave();
    socket.emit('cliff_game_subscribe');

    const handleState = (payload: {
      state: CliffGameState;
      playIntro?: boolean;
      introLine?: CliffIntroLine | null;
      enteringUserId?: string;
      yielded?: number;
      metal?: CliffCaveResource;
      resource?: CliffCaveResource;
      throwEvent?: { userId: string; hit: boolean };
    }) => {
      syncState(payload.state);
      applyIntro(payload, user._id);
      const yieldedResource = payload.resource ?? payload.metal;
      if (typeof payload.yielded === 'number' && payload.yielded > 0 && yieldedResource) {
        void playCliffOreDropSound();
        const openId = activeBoulderIdRef.current;
        const openHub = openId ? payload.state.boulders.find((item) => item.id === openId) : null;
        const openCave = openId ? payload.state.caves.boulders.find((item) => item.id === openId) : null;
        if (openHub?.depleted || openCave?.depleted) {
          setOreBurst({ amount: payload.yielded, resource: yieldedResource });
        }
      }
      if (payload.throwEvent?.userId === user._id) {
        void (payload.throwEvent.hit ? playCliffHitSound() : playCliffMissSound());
      }
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload.code === 'NO_PARTNER') {
        setBlockedReason(payload.message || t('games.common.partnerRequired'));
        return;
      }
      if (
        payload.code === 'BOULDER_NOT_FOUND' ||
        payload.code === 'BOULDER_DEPLETED' ||
        payload.code === 'NEED_PICKAXE'
      ) {
        pendingMineTapsRef.current = 0;
        inFlightMineTapsRef.current = 0;
        setPendingMineTaps(0);
        setInFlightMineTaps(0);
      }
      if (payload.code === 'WAIT_PARTNER') {
        setToast({ open: true, message: t('games.cliff.waitPartner'), severity: 'info' });
        return;
      }
      if (payload.code === 'PET_TAKEN') {
        setToast({ open: true, message: t('games.cliff.guides.petTaken'), severity: 'error' });
        return;
      }
      if (payload.code === 'INVALID_DIR') {
        return;
      }
      if (payload.message) {
        setToast({ open: true, message: payload.message, severity: 'error' });
      }
    };

    socket.on('cliff_game_state', handleState);
    socket.on('cliff_game_error', handleError);

    return () => {
      socket.off('cliff_game_state', handleState);
      socket.off('cliff_game_error', handleError);
      scheduleCliffLeave(() => {
        socket.emit('cliff_game_leave');
        void postCliffLeave();
      });
    };
  }, [applyIntro, syncState, t, user?._id]);

  useEffect(() => {
    if (!state?.runStartedAt || state.scene === 'finished' || state.timerPaused) {
      setElapsedMs(state?.lastTimeMs ?? state?.elapsedMs ?? 0);
      return;
    }
    const started = new Date(state.runStartedAt).getTime();
    const tick = () => setElapsedMs(Math.max(0, Date.now() - started));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [state?.runStartedAt, state?.scene, state?.lastTimeMs, state?.elapsedMs, state?.timerPaused]);

  useEffect(() => {
    if (!itemBurst) {
      return undefined;
    }
    const id = window.setTimeout(() => setItemBurst(null), CLIFF_ITEM_AWARD_MS);
    return () => window.clearTimeout(id);
  }, [itemBurst]);

  const emitOrPost = useCallback(
    async (event: string, payload: Record<string, unknown>, fallback: () => Promise<CliffGameState>) => {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit(event, payload);
        return;
      }
      syncState(await fallback());
    },
    [syncState]
  );

  const finishOreBurst = useCallback(() => {
    clearMineTapProjection();
    setOreBurst(null);
    setActiveBoulderId(null);
  }, [clearMineTapProjection]);

  const handleBuy = async (itemId: CliffShopItemId) => {
    unlockGameAudio();
    setBuying(true);
    try {
      await emitOrPost('cliff_game_buy', { itemId }, () => postCliffBuy(itemId));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.buyFailed'),
        severity: 'error',
      });
    } finally {
      setBuying(false);
    }
  };

  const sendMineTapBatch = useCallback(async (boulderId: string, count: number) => {
    const tapCount = Math.min(Math.max(1, count), CLIFF_TAP_BATCH_MAX);
    const caveScene = stateRef.current?.scene === 'caves';
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit(caveScene ? 'cliff_game_tap_cave_boulder' : 'cliff_game_tap_boulder', {
        boulderId,
        count: tapCount,
      });
      return null;
    }
    return caveScene ? postCliffTapCaveBoulder(boulderId, tapCount) : postCliffTapBoulder(boulderId, tapCount);
  }, []);

  const flushMineTaps = useCallback(async () => {
    const boulderId = activeBoulderIdRef.current;
    if (flushingMineTapsRef.current || pendingMineTapsRef.current <= 0 || !boulderId) {
      return;
    }

    const countToSend = Math.min(pendingMineTapsRef.current, CLIFF_TAP_BATCH_MAX);
    flushingMineTapsRef.current = true;
    pendingMineTapsRef.current = Math.max(0, pendingMineTapsRef.current - countToSend);
    inFlightMineTapsRef.current += countToSend;
    setPendingMineTaps(pendingMineTapsRef.current);
    setInFlightMineTaps(inFlightMineTapsRef.current);
    try {
      const result = await sendMineTapBatch(boulderId, countToSend);
      if (result) {
        syncState(result.state);
        if (result.yielded > 0) {
          void playCliffOreDropSound();
          const resource = 'resource' in result ? result.resource : result.metal;
          setOreBurst({ amount: result.yielded, resource });
        }
      }
    } catch (error: any) {
      clearMineTapProjection();
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.mine.tapFailed'),
        severity: 'error',
      });
    } finally {
      flushingMineTapsRef.current = false;
      if (pendingMineTapsRef.current > 0) {
        void flushMineTaps();
      }
    }
  }, [clearMineTapProjection, sendMineTapBatch, syncState, t]);

  const closeActiveBoulder = useCallback(async () => {
    if (mineTapFlushRef.current !== null) {
      window.clearTimeout(mineTapFlushRef.current);
      mineTapFlushRef.current = null;
    }
    await flushMineTaps();
    setOreBurst(null);
    setActiveBoulderId(null);
  }, [flushMineTaps]);

  const scheduleMineTapFlush = useCallback(() => {
    if (mineTapFlushRef.current !== null) {
      window.clearTimeout(mineTapFlushRef.current);
    }
    mineTapFlushRef.current = window.setTimeout(() => {
      mineTapFlushRef.current = null;
      void flushMineTaps();
    }, CLIFF_TAP_FLUSH_DEBOUNCE_MS);
  }, [flushMineTaps]);

  useEffect(() => {
    return () => {
      if (mineTapFlushRef.current !== null) {
        window.clearTimeout(mineTapFlushRef.current);
      }
      const boulderId = activeBoulderIdRef.current;
      const pendingCount = pendingMineTapsRef.current;
      if (boulderId && pendingCount > 0) {
        const countToSend = Math.min(pendingCount, CLIFF_TAP_BATCH_MAX);
        const socket = socketService.getSocket();
        if (socket?.connected) {
          socket.emit(
            stateRef.current?.scene === 'caves' ? 'cliff_game_tap_cave_boulder' : 'cliff_game_tap_boulder',
            { boulderId, count: countToSend }
          );
        } else if (stateRef.current?.scene === 'caves') {
          void postCliffTapCaveBoulder(boulderId, countToSend);
        } else {
          void postCliffTapBoulder(boulderId, countToSend);
        }
        pendingMineTapsRef.current = 0;
      }
    };
  }, []);

  const pickaxeReadyFor = (resource: CliffCaveResource) => {
    const pickaxe = resource === 'iron' || resource === 'quartz' ? 'iron' : 'copper';
    return pickaxe === 'iron'
      ? Boolean(state?.inventory.hasIronPickaxe)
      : Boolean(state?.inventory.hasCopperPickaxe);
  };

  const handleSelectBoulder = (boulder: CliffPublicBoulder) => {
    unlockGameAudio();
    if (!pickaxeReadyFor(boulder.metal)) {
      setToast({
        open: true,
        message: t(boulder.metal === 'iron' ? 'games.cliff.mine.needIronPickaxe' : 'games.cliff.mine.needCopperPickaxe'),
        severity: 'info',
      });
      return;
    }
    if (boulder.depleted) {
      return;
    }
    setActiveBoulderId(boulder.id);
  };

  const handleSelectCaveBoulder = (boulder: CliffPublicCaveBoulder) => {
    unlockGameAudio();
    if (!pickaxeReadyFor(boulder.resource)) {
      setToast({
        open: true,
        message: t(
          boulder.resource === 'iron' || boulder.resource === 'quartz'
            ? 'games.cliff.mine.needIronPickaxe'
            : 'games.cliff.mine.needCopperPickaxe'
        ),
        severity: 'info',
      });
      return;
    }
    if (boulder.depleted) {
      return;
    }
    setActiveBoulderId(boulder.id);
  };

  const handleTapBoulder = () => {
    const boulderId = activeBoulderId;
    const boulder =
      state?.scene === 'caves'
        ? state.caves.boulders.find((item) => item.id === boulderId)
        : state?.boulders.find((item) => item.id === boulderId);
    if (!boulderId || !boulder || boulder.depleted || oreBurst) {
      return;
    }
    const remaining =
      boulder.tapsRequired - boulder.tapsDone - pendingMineTapsRef.current - inFlightMineTapsRef.current;
    if (remaining <= 0) {
      return;
    }
    unlockGameAudio();
    void playCliffMineTapSound();
    pendingMineTapsRef.current += 1;
    setPendingMineTaps(pendingMineTapsRef.current);
    scheduleMineTapFlush();
  };

  const handleBreakGate = async () => {
    unlockGameAudio();
    setBreaking(true);
    try {
      await emitOrPost('cliff_game_break_gate', {}, postCliffBreakGate);
      setOverlay('none');
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.gate.breakFailed'),
        severity: 'error',
      });
    } finally {
      setBreaking(false);
    }
  };

  const handleThrow = async (hit: boolean, angle: number, power: number) => {
    unlockGameAudio();
    void playCliffThrowSound();
    try {
      await emitOrPost('cliff_game_throw', { hit, angle, power }, () => postCliffThrow(hit, angle, power));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.bridge.throwFailed'),
        severity: 'error',
      });
    }
  };

  const handleSurrender = async () => {
    try {
      await emitOrPost('cliff_game_surrender', {}, postCliffSurrender);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.bridge.surrenderFailed'),
        severity: 'error',
      });
    }
  };

  const handleEnterRopes = async () => {
    unlockGameAudio();
    try {
      setShowLiftDialog(false);
      await emitOrPost('cliff_game_enter_ropes', {}, postCliffEnterRopes);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.ropes.enterFailed'),
        severity: 'error',
      });
    }
  };

  const handleRopeJump = async (hit: boolean) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_rope_jump', { hit }, () => postCliffRopeJump(hit));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.ropes.jumpFailed'),
        severity: 'error',
      });
    }
  };

  const handleEnterBalls = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_enter_balls', {}, postCliffEnterBalls);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setToast({
        open: true,
        message:
          code === 'WAIT_PARTNER'
            ? t('games.cliff.waitPartner')
            : error?.response?.data?.error || t('games.cliff.balls.enterFailed'),
        severity: code === 'WAIT_PARTNER' ? 'info' : 'error',
      });
    }
  };

  const handleEnterCaves = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_enter_caves', {}, postCliffEnterCaves);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setToast({
        open: true,
        message:
          code === 'WAIT_PARTNER'
            ? t('games.cliff.waitPartner')
            : error?.response?.data?.error || t('games.cliff.caves.enterFailed'),
        severity: code === 'WAIT_PARTNER' ? 'info' : 'error',
      });
    }
  };

  const handleEnterGuides = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_enter_guides', {}, postCliffEnterGuides);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setToast({
        open: true,
        message:
          code === 'WAIT_PARTNER'
            ? t('games.cliff.waitPartner')
            : error?.response?.data?.error || t('games.cliff.guides.enterFailed'),
        severity: code === 'WAIT_PARTNER' ? 'info' : 'error',
      });
    }
  };

  const handlePickGuidePet = async (petId: string) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_guides_pick_pet', { petId }, () => postCliffPickGuidePet(petId));
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setToast({
        open: true,
        message:
          code === 'PET_TAKEN'
            ? t('games.cliff.guides.petTaken')
            : error?.response?.data?.error || t('games.cliff.guides.pickFailed'),
        severity: 'error',
      });
    }
  };

  const handleSendGuidePet = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_guides_send_pet', {}, postCliffSendGuidePet);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.guides.sendFailed'),
        severity: 'error',
      });
    }
  };

  const handleGuideMove = async (dir: CliffGuideDir) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_guides_move', { dir }, () => postCliffMoveGuide(dir));
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === 'INVALID_DIR') {
        return;
      }
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.guides.moveFailed'),
        severity: 'error',
      });
    }
  };

  const handleEnterWords = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_enter_words', {}, postCliffEnterWords);
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setToast({
        open: true,
        message:
          code === 'WAIT_PARTNER'
            ? t('games.cliff.waitPartner')
            : error?.response?.data?.error || t('games.cliff.words.enterFailed'),
        severity: code === 'WAIT_PARTNER' ? 'info' : 'error',
      });
    }
  };

  const handleWordsSync = useCallback(
    (x: number, y: number, bounce: boolean, fall = false) => {
      void emitOrPost('cliff_game_words_sync', { x, y, bounce, fall }, () =>
        postCliffSyncWords(x, y, bounce, fall)
      );
    },
    [emitOrPost]
  );

  const handleWordsFuelHint = useCallback(() => {
    void emitOrPost('cliff_game_words_fuel_hint', {}, postCliffWordsFuelHint);
  }, [emitOrPost]);

  const handleWordsIntro = useCallback(() => {
    void emitOrPost('cliff_game_words_intro', {}, postCliffWordsIntro);
  }, [emitOrPost]);

  const handleWordsPhrase = async (phraseId: CliffWordsPhraseId) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_words_phrase', { phraseId }, () => postCliffWordsPhrase(phraseId));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.words.phraseFailed'),
        severity: 'error',
      });
    }
  };

  const handleWordsNext = () => {
    if (!stateRef.current?.partnerPresent) {
      setToast({
        open: true,
        message: t('games.cliff.waitPartner'),
        severity: 'info',
      });
      return;
    }
    setToast({
      open: true,
      message: t('games.cliff.words.campSoon'),
      severity: 'info',
    });
  };

  const handleCaveCraft = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_cave_craft', {}, postCliffCaveCraft);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.caves.craftFailed'),
        severity: 'error',
      });
    }
  };

  const handleCaveGift = async (itemId: CliffCaveItemId) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_cave_gift', { itemId }, () => postCliffCaveGift(itemId));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.caves.giftFailed'),
        severity: 'error',
      });
    }
  };

  const handleBallThrow = async (zoneScore: number) => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_ball_throw', { zoneScore }, () => postCliffBallThrow(zoneScore));
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.balls.throwFailed'),
        severity: 'error',
      });
    }
  };

  const handleActivateLift = async (petIds: string[]) => {
    unlockGameAudio();
    setActivatingLift(true);
    try {
      await emitOrPost('cliff_game_activate_lift', { petIds }, () => postCliffActivateLift(petIds));
      setShowLiftDialog(false);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.lift.activateFailed'),
        severity: 'error',
      });
    } finally {
      setActivatingLift(false);
    }
  };

  const handleFinish = async () => {
    unlockGameAudio();
    try {
      await emitOrPost('cliff_game_finish', {}, postCliffFinish);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.finish.failed'),
        severity: 'error',
      });
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      setOverlay('none');
      setShowClimb(false);
      setMyWalking(false);
      setPartnerWalking(false);
      setMySpeech(null);
      setPartnerSpeech(null);
      await emitOrPost('cliff_game_reset', {}, postCliffReset);
      seenIntroRef.current.clear();
      climbPlayedRef.current = false;
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.finish.resetFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetGate = async () => {
    setResetting(true);
    try {
      setShowClimb(false);
      climbPlayedRef.current = false;
      setCaveMineOpen(false);
      setShowCaveFall(false);
      setActiveBoulderId(null);
      setShowLiftDialog(false);
      await emitOrPost('cliff_game_reset_gate', {}, postCliffResetGate);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetGateFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetRopes = async () => {
    setResetting(true);
    try {
      setCaveMineOpen(false);
      setShowCaveFall(false);
      setActiveBoulderId(null);
      await emitOrPost('cliff_game_reset_ropes', {}, postCliffResetRopes);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetRopesFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetBalls = async () => {
    setResetting(true);
    try {
      setCaveMineOpen(false);
      setShowCaveFall(false);
      await emitOrPost('cliff_game_reset_balls', {}, postCliffResetBalls);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetBallsFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetCaves = async () => {
    setResetting(true);
    try {
      setCaveMineOpen(false);
      setActiveBoulderId(null);
      setCavesEpoch((value) => value + 1);
      playCaveFall();
      await emitOrPost('cliff_game_reset_caves', {}, postCliffResetCaves);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetCavesFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetGuides = async () => {
    setResetting(true);
    try {
      setCaveMineOpen(false);
      setGuidesEpoch((value) => value + 1);
      await emitOrPost('cliff_game_reset_guides', {}, postCliffResetGuides);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetGuidesFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleResetWords = async () => {
    setResetting(true);
    try {
      setWordsEpoch((value) => value + 1);
      await emitOrPost('cliff_game_reset_words', {}, postCliffResetWords);
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.cliff.inventory.resetWordsFailed'),
        severity: 'error',
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <GameFrame>
        <Box sx={getGamePlayLoadingWrapSx()}>
          <BrandLoader size={56} />
        </Box>
      </GameFrame>
    );
  }

  if (blockedReason || !state) {
    return (
      <GameFrame>
        <Box sx={getGamePlayBlockedPanelSx()}>
          <Box sx={getGamePlayBlockedCardSx(theme)}>
            <Typography sx={{ mb: 2 }}>{blockedReason || t('games.common.partnerRequired')}</Typography>
            <Button onClick={() => navigate('/chat/games/cliff')} sx={getGamePlayOutlinedButtonSx(theme)}>
              {t('games.common.backToGame')}
            </Button>
          </Box>
        </Box>
      </GameFrame>
    );
  }

  const showHub = state.scene === 'hub' && !showClimb;

  return (
    <GameFrame>
      <Box sx={getGamePlayRootSx()}>
        {overlay !== 'mine' && !caveMineOpen && (
          <Box sx={getGamePlayHeaderSx(theme)}>
            <IconButton
              aria-label={t('games.common.back')}
              onClick={() => navigate('/chat/games/cliff')}
              sx={getGamePlayHeaderIconButtonSx(theme)}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={getGamePlayHeaderTitleSx()}>{t('games.cliff.name')}</Typography>
          </Box>
        )}

        <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <CliffInventoryBar
            state={state}
            elapsedMs={elapsedMs}
            resettingGate={resetting}
            resettingRopes={resetting}
            resettingBalls={resetting}
            resettingCaves={resetting}
            resettingGuides={resetting}
            resettingWords={resetting}
            onResetGate={handleResetGate}
            onResetRopes={handleResetRopes}
            onResetBalls={handleResetBalls}
            onResetCaves={handleResetCaves}
            onResetGuides={handleResetGuides}
            onResetWords={handleResetWords}
          />
          {itemBurst && <CliffItemAward src={itemBurst.src} amount={itemBurst.amount} />}
          {showHub && (
            <CliffHub
              state={state}
              myWalking={myWalking}
              partnerWalking={partnerWalking}
              mySpeech={mySpeech}
              partnerSpeech={partnerSpeech}
              onOpenShop={() => setOverlay('shop')}
              onOpenMine={() => {
                setOverlay('mine');
                void emitOrPost('cliff_game_enter_mine', {}, postCliffEnterMine).catch((error: any) => {
                  setToast({
                    open: true,
                    message: error?.response?.data?.error || t('games.cliff.mine.tapFailed'),
                    severity: 'error',
                  });
                });
              }}
              onOpenGate={() => setOverlay('gate')}
            />
          )}
          {showClimb && <CliffClimb state={state} />}
          {state.scene === 'bridge' && !showClimb && (
            <CliffBridgeGame
              state={state}
              onThrow={handleThrow}
              onSurrender={handleSurrender}
              onFinish={handleFinish}
            />
          )}
          {state.scene === 'lift' && !showClimb && (
            <CliffLift
              state={state}
              onOpenPlate={() => setShowLiftDialog(true)}
              onContinue={() => {
                void handleEnterRopes();
              }}
            />
          )}
          {state.scene === 'ropes' && !showClimb && (
            <CliffRopes
              key={ropesEpoch}
              state={state}
              onJump={handleRopeJump}
              onNext={() => {
                void handleEnterBalls();
              }}
            />
          )}
          {state.scene === 'balls' && !showClimb && (
            <CliffBalls
              key={ballsEpoch}
              state={state}
              onThrow={(zoneScore) => {
                void handleBallThrow(zoneScore);
              }}
              onRetry={() => {
                void handleResetBalls();
              }}
              onNext={() => {
                void handleEnterCaves();
              }}
            />
          )}
          {state.scene === 'caves' && !showClimb && !showCaveFall && (
            <CliffCaves
              key={cavesEpoch}
              state={state}
              showMine={caveMineOpen}
              activeBoulderId={activeBoulderId}
              breakAward={oreBurst}
              projectedBoulders={projectCliffCaveBoulderTaps(
                state.caves.boulders,
                activeBoulderId,
                pendingMineTaps + inFlightMineTaps
              )}
              onOpenMine={() => {
                const needIron = state.caves.role === 'owner';
                const ready = needIron
                  ? state.inventory.hasIronPickaxe
                  : state.inventory.hasCopperPickaxe;
                if (!ready) {
                  setToast({
                    open: true,
                    message: t(needIron ? 'games.cliff.mine.needIronPickaxe' : 'games.cliff.mine.needCopperPickaxe'),
                    severity: 'info',
                  });
                  return;
                }
                setCaveMineOpen(true);
              }}
              onCloseMine={() => {
                void closeActiveBoulder();
                setCaveMineOpen(false);
              }}
              onSelectBoulder={handleSelectCaveBoulder}
              onTapBoulder={handleTapBoulder}
              onBreakDone={finishOreBurst}
              onCloseBoulder={() => {
                void closeActiveBoulder();
              }}
              onCraft={() => {
                void handleCaveCraft();
              }}
              onGift={(itemId) => {
                void handleCaveGift(itemId);
              }}
              onOpenPassage={() => {
                if (!state.caves.cleared) {
                  setToast({
                    open: true,
                    message: t('games.cliff.caves.darkLocked'),
                    severity: 'info',
                  });
                  return;
                }
                void handleEnterGuides();
              }}
              onNext={() => {
                void handleEnterGuides();
              }}
            />
          )}
          {showCaveFall && (
            <CliffCaveFall
              key={caveFallEpoch}
              state={state}
              onContinue={() => setShowCaveFall(false)}
            />
          )}
          {state.scene === 'guides' && !showClimb && (
            <CliffGuides
              key={guidesEpoch}
              state={state}
              onPickPet={(petId) => {
                void handlePickGuidePet(petId);
              }}
              onSendPet={() => {
                void handleSendGuidePet();
              }}
              onMove={(dir) => {
                void handleGuideMove(dir);
              }}
              onNext={() => {
                void handleEnterWords();
              }}
            />
          )}
          {state.scene === 'words' && !showClimb && (
            <CliffWords
              key={wordsEpoch}
              state={state}
              onSync={handleWordsSync}
              onPhrase={(phraseId) => {
                void handleWordsPhrase(phraseId);
              }}
              onAckFuelHint={handleWordsFuelHint}
              onAckIntro={handleWordsIntro}
              onNext={handleWordsNext}
            />
          )}
          {state.scene === 'finished' && (
            <CliffFinish
              lastTimeMs={state.lastTimeMs}
              bestTimeMs={state.bestTimeMs}
              resetting={resetting}
              onReset={handleReset}
              onBack={() => navigate('/chat/games/cliff')}
            />
          )}
          <CliffOverlayPresence open={showHub && overlay === 'shop'} variant="modal">
            <CliffShop state={state} buying={buying} onBuy={handleBuy} onClose={() => setOverlay('none')} />
          </CliffOverlayPresence>
          <CliffOverlayPresence open={showHub && overlay === 'mine'} variant="cave">
            <CliffMine
              state={projectCliffBoulderTaps(state, activeBoulderId, pendingMineTaps + inFlightMineTaps)}
              activeBoulderId={activeBoulderId}
              breakAward={oreBurst}
              onSelectBoulder={handleSelectBoulder}
              onTapBoulder={handleTapBoulder}
              onBreakDone={finishOreBurst}
              onCloseBoulder={() => {
                void closeActiveBoulder();
              }}
              onClose={() => {
                void closeActiveBoulder();
                setOverlay('none');
              }}
            />
          </CliffOverlayPresence>
          <CliffOverlayPresence open={showHub && overlay === 'gate'} variant="modal">
            <CliffGateDialog
              hasAxe={state.inventory.hasAxe}
              breaking={breaking}
              onBreak={handleBreakGate}
              onClose={() => setOverlay('none')}
            />
          </CliffOverlayPresence>
          <CliffOverlayPresence open={state.scene === 'lift' && showLiftDialog} variant="modal">
            <CliffLiftDialog
              raised={state.lift.raised}
              requiredCount={state.lift.requiredCount}
              eligiblePets={state.lift.eligiblePets}
              standingPets={state.lift.standingPets}
              activating={activatingLift}
              onActivate={handleActivateLift}
              onClose={() => setShowLiftDialog(false)}
            />
          </CliffOverlayPresence>
        </Box>
      </Box>
      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </GameFrame>
  );
};

export default CliffGamePlayPage;
