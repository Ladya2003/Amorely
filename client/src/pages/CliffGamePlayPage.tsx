import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  postCliffActivateLift,
  postCliffBreakGate,
  postCliffBuy,
  postCliffEnter,
  postCliffEnterMine,
  postCliffEnterRopes,
  postCliffFinish,
  postCliffLeave,
  postCliffReset,
  postCliffResetGate,
  postCliffResetRopes,
  postCliffRopeJump,
  postCliffSurrender,
  postCliffTapBoulder,
  postCliffThrow,
  type CliffGameState,
  type CliffIntroLine,
  type CliffMetal,
  type CliffPublicBoulder,
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
import CliffOverlayPresence from '../components/Games/Cliff/CliffOverlayPresence';
import CliffItemAward from '../components/Games/Cliff/CliffItemAward';
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
  const [oreBurst, setOreBurst] = useState<{ amount: number; metal: CliffMetal } | null>(null);
  const [itemBurst, setItemBurst] = useState<CliffShopItemId | null>(null);
  const [buying, setBuying] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [ropesEpoch, setRopesEpoch] = useState(0);
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
      const prevBoulder = prev.boulders.find((boulder) => boulder.id === openId);
      const nextBoulder = next.boulders.find((boulder) => boulder.id === openId);
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
        setItemBurst(purchased);
        void playCliffBuySound(purchased);
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
    const normalized: CliffGameState = withLift.ropes
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
        setActiveBoulderId(null);
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
      return normalized;
    });
  }, []);

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
      metal?: CliffMetal;
      throwEvent?: { userId: string; hit: boolean };
    }) => {
      syncState(payload.state);
      applyIntro(payload, user._id);
      if (typeof payload.yielded === 'number' && payload.yielded > 0 && payload.metal) {
        void playCliffOreDropSound();
        const openId = activeBoulderIdRef.current;
        const openBoulder = openId
          ? payload.state.boulders.find((item) => item.id === openId)
          : null;
        if (openBoulder?.depleted) {
          setOreBurst({ amount: payload.yielded, metal: payload.metal });
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
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('cliff_game_tap_boulder', { boulderId, count: tapCount });
      return null;
    }
    return postCliffTapBoulder(boulderId, tapCount);
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
          setOreBurst({ amount: result.yielded, metal: result.metal });
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
          socket.emit('cliff_game_tap_boulder', { boulderId, count: countToSend });
        } else {
          void postCliffTapBoulder(boulderId, countToSend);
        }
        pendingMineTapsRef.current = 0;
      }
    };
  }, []);

  const handleSelectBoulder = (boulder: CliffPublicBoulder) => {
    unlockGameAudio();
    const hasPickaxe =
      boulder.metal === 'iron' ? Boolean(state?.inventory.hasIronPickaxe) : Boolean(state?.inventory.hasCopperPickaxe);
    if (!hasPickaxe) {
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

  const handleTapBoulder = () => {
    const boulderId = activeBoulderId;
    const boulder = state?.boulders.find((item) => item.id === boulderId);
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
        {overlay !== 'mine' && (
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
            onResetGate={handleResetGate}
            onResetRopes={handleResetRopes}
          />
          {itemBurst && <CliffItemAward itemId={itemBurst} />}
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
            <CliffRopes key={ropesEpoch} state={state} onJump={handleRopeJump} />
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
