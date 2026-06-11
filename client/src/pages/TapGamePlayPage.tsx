import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  fetchTapGameState,
  postTapGameTap,
  postTapGameTapKeepalive,
  type TapGameState,
  type TapShopItem,
} from '../services/gamesService';
import TapGameShop from '../components/Games/TapGameShop';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import { fireRoundConfetti } from '../utils/roundConfetti';

interface TapFloatText {
  id: number;
  offsetX: number;
  value: number;
}

const FLOAT_ANIMATION_MS = 750;
const TAP_FLUSH_DEBOUNCE_MS = 400;
const TAP_BATCH_MAX = 100;

const applyOptimisticTap = (state: TapGameState, viewerUserId: string): TapGameState | null => {
  if (!state.isMyTurn) {
    return null;
  }

  const isPrimary = state.userId === viewerUserId;
  const progressGain =
    state.activeBoost && state.activeBoost.remainingUses > 0
      ? state.activeBoost.multiplier
      : 1;
  const remaining = Math.max(0, state.targetTaps - state.myTapsThisRound);
  const appliedProgress = Math.min(progressGain, remaining);

  if (appliedProgress <= 0) {
    return null;
  }

  let activeBoost = state.activeBoost;
  if (activeBoost && activeBoost.remainingUses > 0) {
    const remainingUses = activeBoost.remainingUses - 1;
    activeBoost = remainingUses > 0 ? { ...activeBoost, remainingUses } : null;
  }

  const myTapsThisRound = state.myTapsThisRound + appliedProgress;
  const myPartComplete = myTapsThisRound >= state.targetTaps;

  return {
    ...state,
    myTapsThisRound,
    userTapsThisRound: isPrimary
      ? state.userTapsThisRound + appliedProgress
      : state.userTapsThisRound,
    partnerTapsThisRound: isPrimary
      ? state.partnerTapsThisRound
      : state.partnerTapsThisRound + appliedProgress,
    points: state.points + 1,
    totalTaps: state.totalTaps + 1,
    activeBoost,
    isMyTurn: !myPartComplete,
    waitingForPartner: myPartComplete && state.partnerProgressThisRound < state.targetTaps,
  };
};

const projectTapState = (
  baseState: TapGameState,
  pendingTapCount: number,
  viewerUserId: string
): TapGameState => {
  let projected = baseState;
  for (let index = 0; index < pendingTapCount; index += 1) {
    const next = applyOptimisticTap(projected, viewerUserId);
    if (!next) {
      break;
    }
    projected = next;
  }
  return projected;
};

const tapBlockInteractionSx = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  WebkitUserDrag: 'none',
  userDrag: 'none',
} as const;

const showRoundCompletionToast = (
  setToast: React.Dispatch<
    React.SetStateAction<{ open: boolean; message: string; severity: 'info' | 'error' | 'success' }>
  >,
  t: TFunction,
  roundCompletionBonus?: number
) => {
  if (!roundCompletionBonus || roundCompletionBonus <= 0) {
    return;
  }

  fireRoundConfetti();

  setToast({
    open: true,
    message: t('games.tap.play.roundCompleteBonus', { bonus: roundCompletionBonus }),
    severity: 'success',
  });
};

const TapGamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [state, setState] = useState<TapGameState | null>(null);
  const [shopItems, setShopItems] = useState<TapShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' as 'info' | 'error' | 'success' });
  const [floatTexts, setFloatTexts] = useState<TapFloatText[]>([]);
  const floatIdRef = useRef(0);
  const serverStateRef = useRef<TapGameState | null>(null);
  const pendingTapCountRef = useRef(0);
  const isFlushingRef = useRef(false);
  const flushDebounceRef = useRef<number | null>(null);

  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const syncDisplayState = useCallback(
    (baseState: TapGameState) => {
      serverStateRef.current = baseState;
      if (!user?._id) {
        setState(baseState);
        return;
      }
      setState(projectTapState(baseState, pendingTapCountRef.current, user._id));
    },
    [user?._id]
  );

  const spawnFloatText = useCallback((value: number) => {
    const id = floatIdRef.current + 1;
    floatIdRef.current = id;
    const offsetX = Math.round((Math.random() - 0.5) * 48);

    setFloatTexts((prev) => [...prev, { id, offsetX, value }]);

    window.setTimeout(() => {
      setFloatTexts((prev) => prev.filter((item) => item.id !== id));
    }, FLOAT_ANIMATION_MS);
  }, []);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchTapGameState();
      pendingTapCountRef.current = 0;
      syncDisplayState(data.state);
      setShopItems(data.shopItems);
    } catch (error: any) {
      if (error?.response?.data?.code === 'NO_PARTNER') {
        setBlockedReason(error.response.data.error || t('games.common.partnerRequired'));
        return;
      }
      setToast({
        open: true,
        message: t('games.common.loadFailed'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [syncDisplayState, t]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    socket.emit('tap_game_subscribe');

    const handleState = (payload: { state: TapGameState; roundCompletionBonus?: number }) => {
      syncDisplayState(payload.state);
      if (pendingTapCountRef.current === 0) {
        showRoundCompletionToast(setToast, t, payload.roundCompletionBonus);
      }
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload.code === 'NO_PARTNER') {
        setBlockedReason(payload.message || t('games.common.partnerRequired'));
        return;
      }
      if (payload.message) {
        setToast({ open: true, message: payload.message, severity: 'error' });
      }
    };

    socket.on('tap_game_state', handleState);
    socket.on('tap_game_error', handleError);

    return () => {
      socket.off('tap_game_state', handleState);
      socket.off('tap_game_error', handleError);
    };
  }, [syncDisplayState, user?._id, t]);

  const sendTapBatch = useCallback(
    async (count: number) => {
      const tapCount = Math.min(Math.max(1, count), TAP_BATCH_MAX);
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('tap_game_tap', { count: tapCount });
        return null;
      }

      return postTapGameTap(tapCount);
    },
    []
  );

  const flushPendingTaps = useCallback(async () => {
    if (isFlushingRef.current || pendingTapCountRef.current <= 0) {
      return;
    }

    const countToSend = Math.min(pendingTapCountRef.current, TAP_BATCH_MAX);
    isFlushingRef.current = true;

    try {
      const result = await sendTapBatch(countToSend);
      pendingTapCountRef.current = Math.max(0, pendingTapCountRef.current - countToSend);

      if (result) {
        syncDisplayState(result.state);
        showRoundCompletionToast(setToast, t, result.roundCompletionBonus);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.tapFailed'),
        severity: 'error',
      });
      if (serverStateRef.current && user?._id) {
        setState(projectTapState(serverStateRef.current, pendingTapCountRef.current, user._id));
      }
    } finally {
      isFlushingRef.current = false;
      if (pendingTapCountRef.current > 0) {
        void flushPendingTaps();
      }
    }
  }, [sendTapBatch, syncDisplayState, t, user?._id]);

  const scheduleFlush = useCallback(() => {
    if (flushDebounceRef.current !== null) {
      window.clearTimeout(flushDebounceRef.current);
    }
    flushDebounceRef.current = window.setTimeout(() => {
      flushDebounceRef.current = null;
      void flushPendingTaps();
    }, TAP_FLUSH_DEBOUNCE_MS);
  }, [flushPendingTaps]);

  useEffect(() => {
    return () => {
      if (flushDebounceRef.current !== null) {
        window.clearTimeout(flushDebounceRef.current);
      }

      const pendingCount = pendingTapCountRef.current;
      if (pendingCount > 0) {
        const countToSend = Math.min(pendingCount, TAP_BATCH_MAX);
        const socket = socketService.getSocket();
        if (socket?.connected) {
          socket.emit('tap_game_tap', { count: countToSend });
        } else {
          void postTapGameTapKeepalive(countToSend);
        }
        pendingTapCountRef.current = 0;
      }
    };
  }, []);

  const handleTap = () => {
    if (!state?.isMyTurn || !user?._id || !serverStateRef.current) {
      return;
    }

    const optimisticNext = applyOptimisticTap(state, user._id);
    if (!optimisticNext) {
      return;
    }

    const progressGain = optimisticNext.myTapsThisRound - state.myTapsThisRound;
    spawnFloatText(progressGain);

    pendingTapCountRef.current += 1;
    setState(projectTapState(serverStateRef.current, pendingTapCountRef.current, user._id));
    scheduleFlush();
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (blockedReason) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', maxWidth: 420, mx: 'auto', mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('games.common.needPartner')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {blockedReason}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/settings')}>
            {t('games.common.goToSettings')}
          </Button>
          <Button onClick={() => navigate('/chat/games/tap')}>{t('games.common.back')}</Button>
        </Stack>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t('games.common.loadFailed')}
        </Typography>
        <Button onClick={() => navigate('/chat/games/tap')}>{t('games.common.back')}</Button>
      </Box>
    );
  }

  const myProgress = Math.min(100, (state.myTapsThisRound / state.targetTaps) * 100);
  const partnerProgress = Math.min(100, (state.partnerProgressThisRound / state.targetTaps) * 100);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        sx={{
          px: 1,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={() => {
            if (flushDebounceRef.current !== null) {
              window.clearTimeout(flushDebounceRef.current);
              flushDebounceRef.current = null;
            }
            void flushPendingTaps().finally(() => navigate('/chat/games/tap'));
          }}
          aria-label={t('games.common.back')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('games.common.round')} {state.round}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('games.tap.play.targetAndPoints', { target: state.targetTaps, points: state.points })}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<StorefrontIcon />}
          onClick={() => setShopOpen(true)}
        >
          {t('games.tap.play.shop')}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 420 }}>
          {state.activeBoost && (
            <Typography variant="body2" color="primary.main" align="center">
              {t('games.tap.play.activeBoostLine', {
                multiplier: state.activeBoost.multiplier,
                remaining: state.activeBoost.remainingUses,
              })}
            </Typography>
          )}

          {state.isMyTurn ? (
            <Typography
              variant="body2"
              color="primary.main"
              align="center"
              sx={{ fontWeight: 600 }}
            >
              {t('games.tap.play.tapPinkBlock')}
            </Typography>
          ) : state.waitingForPartner ? (
            <Typography variant="body2" color="text.secondary" align="center">
              {t('games.tap.play.finishedWaiting')}
            </Typography>
          ) : null}

          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              overflow: 'visible',
              '@keyframes tapFloatUp': {
                '0%': {
                  opacity: 1,
                  transform: 'translate(-50%, 0) scale(1)',
                },
                '100%': {
                  opacity: 0,
                  transform: 'translate(-50%, -64px) scale(1.15)',
                },
              },
            }}
          >
            {floatTexts.map((floatText) => (
              <Typography
                key={floatText.id}
                component="span"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: `calc(50% + ${floatText.offsetX}px)`,
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                  pointerEvents: 'none',
                  zIndex: 3,
                  animation: `tapFloatUp ${FLOAT_ANIMATION_MS}ms ease-out forwards`,
                }}
              >
                +{floatText.value}
              </Typography>
            ))}

            <Box
              component="button"
              type="button"
              onClick={handleTap}
              onContextMenu={(event) => event.preventDefault()}
              disabled={!state.isMyTurn}
              aria-label={
                state.isMyTurn
                  ? t('games.tap.play.tapBlockAria')
                  : state.waitingForPartner
                    ? t('games.tap.play.tapBlockDoneAria')
                    : t('games.tap.play.tapBlockDisabledAria')
              }
              sx={{
                position: 'relative',
                display: 'block',
                width: '100%',
                maxWidth: 320,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                border: state.isMyTurn ? '3px solid' : '2px solid',
                borderColor: state.isMyTurn ? 'primary.main' : 'divider',
                borderRadius: 4,
                p: 0,
                overflow: 'hidden',
                cursor: state.isMyTurn ? 'pointer' : 'not-allowed',
                opacity: state.isMyTurn ? 1 : 0.55,
                transition: 'transform 0.1s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                boxShadow: state.isMyTurn
                  ? '0 12px 32px rgba(255, 75, 141, 0.45)'
                  : '0 4px 16px rgba(0,0,0,0.12)',
                animation: state.isMyTurn ? 'tapBlockPulse 1.6s ease-in-out infinite' : 'none',
                ...tapBlockInteractionSx,
                '&, & *': tapBlockInteractionSx,
                '@keyframes tapBlockPulse': {
                  '0%, 100%': { boxShadow: '0 12px 32px rgba(255, 75, 141, 0.35)' },
                  '50%': { boxShadow: '0 16px 40px rgba(255, 75, 141, 0.65)' },
                },
                '&:active': state.isMyTurn ? { transform: 'scale(0.94)' } : undefined,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  bgcolor: state.block.color || 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {state.block.imageUrl && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${state.block.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.35,
                    }}
                  />
                )}
                {state.isMyTurn && (
                  <Typography
                    variant="h5"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: '#fff',
                      fontWeight: 800,
                      textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      pointerEvents: 'none',
                    }}
                  >
                    {t('games.tap.play.tapCta')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {t('games.tap.play.youProgress', {
                current: state.myTapsThisRound,
                goal: state.targetTaps,
              })}
            </Typography>
            <LinearProgress variant="determinate" value={myProgress} sx={{ height: 8, borderRadius: 999 }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {t('games.tap.play.partnerProgress', {
                current: state.partnerProgressThisRound,
                goal: state.targetTaps,
              })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={partnerProgress}
              color="secondary"
              sx={{ height: 8, borderRadius: 999 }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" align="center">
            {t('games.tap.play.totalPairTaps', { count: state.totalTaps })}
          </Typography>
        </Stack>
      </Box>

      <TapGameShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        shopItems={shopItems}
        state={state}
        onPurchased={setState}
        onError={(message: string) => setToast({ open: true, message, severity: 'error' })}
      />

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default TapGamePlayPage;
