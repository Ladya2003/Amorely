import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import DrawCanvas from '../components/Games/DrawCanvas';
import GameLobbyRemindButton from '../components/Games/GameLobbyRemindButton';
import {
  getGamePlayBlockedCardSx,
  getGamePlayBlockedPanelSx,
  getGamePlayCenterCardSx,
  getGamePlayCenterPanelSx,
  getGamePlayChipSx,
  getGamePlayContentSx,
  getGamePlayCountdownSx,
  getGamePlayFooterSx,
  getGamePlayHeaderIconButtonSx,
  getGamePlayHeaderSx,
  getGamePlayHeaderSubtitleSx,
  getGamePlayHeaderTitleSx,
  getGamePlayHintCardSx,
  getGamePlayLoadingWrapSx,
  getGamePlayPrimaryButtonSx,
  getGamePlayReadyDotSx,
  getGamePlayReadyLabelSx,
  getGamePlayRevealStackSx,
  getGamePlayRootSx,
  getGamePlayTimerBarSx,
  getGamePlayTimerProgressSx,
  getGamePlayTimerTextSx,
} from '../components/Games/gamePlayPageStyles';
import DrawGuessChat from '../components/Games/DrawGuessChat';
import DrawingToolsToolbar, { type DrawingTool } from '../components/Games/DrawingToolsToolbar';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { fireRoundConfetti } from '../utils/roundConfetti';
import {
  playRoundFailureSound,
  playRoundSuccessSound,
  playGameReadySound,
  playNextRoundSound,
  unlockGameAudio,
  useLobbyCountdownSound,
  useRoundTimerSound,
} from '../utils/gameSounds';
import socketService from '../services/socketService';
import {
  advanceDrawRound,
  fetchDrawGameState,
  postDrawClearGuessAttempts,
  postDrawClearStrokes,
  postDrawGuess,
  postDrawReady,
  postDrawRedo,
  postDrawStroke,
  postDrawUndo,
  type DrawGameState,
  type DrawStroke,
} from '../services/gamesService';

const DRAW_GAME_INFO_PATH = '/chat/games/draw';

const drawPageNoSelectSx = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
} as const;

const getDailyLimitAckStorageKey = (relationshipId: string) => {
  const dayKey = new Date().toISOString().slice(0, 10);
  return `amorely_draw_daily_limit_ack_${relationshipId}_${dayKey}`;
};

const hasAcknowledgedDailyLimitToday = (relationshipId: string) =>
  localStorage.getItem(getDailyLimitAckStorageKey(relationshipId)) === '1';

const acknowledgeDailyLimitToday = (relationshipId: string) => {
  localStorage.setItem(getDailyLimitAckStorageKey(relationshipId), '1');
};

const DrawGamePlayPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<DrawGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [drawingSecondsLeft, setDrawingSecondsLeft] = useState(0);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(0);
  const [brushSize, setBrushSize] = useState(4);
  const [drawTool, setDrawTool] = useState<DrawingTool>('pen');
  const [penColor, setPenColor] = useState('#111111');
  const [dailyLimitDialogOpen, setDailyLimitDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'error' | 'success',
  });
  const syncRequestedRef = useRef(false);
  const prevRoundStatusRef = useRef<string | null>(null);
  const stateRef = useRef<DrawGameState | null>(null);
  stateRef.current = state;

  const tryOpenDailyLimitDialog = useCallback((relationshipId: string) => {
    if (!hasAcknowledgedDailyLimitToday(relationshipId)) {
      setDailyLimitDialogOpen(true);
    }
  }, []);

  const handleDismissDailyLimitDialog = useCallback(() => {
    if (state?.relationshipId) {
      acknowledgeDailyLimitToday(state.relationshipId);
    }
    setDailyLimitDialogOpen(false);
  }, [state?.relationshipId]);

  const applyState = useCallback(
    (nextState: DrawGameState) => {
      const round = nextState.currentRound;
      const justRevealed =
        round?.status === 'revealed' &&
        round.reveal &&
        prevRoundStatusRef.current &&
        prevRoundStatusRef.current !== 'revealed';

      if (justRevealed && round.reveal) {
        if (round.reveal.wasCorrect) {
          fireRoundConfetti();
          void playRoundSuccessSound();

          const { reveal } = round;
          const earnedPoints = reveal?.pointsEarned ?? 0;

          if (nextState.dailyScoredLimitReached) {
            tryOpenDailyLimitDialog(nextState.relationshipId);
            if (earnedPoints === 0) {
              setToast({
                open: true,
                message: t('games.draw.play.limitExhaustedToast'),
                severity: 'info',
              });
            } else {
              setToast({
                open: true,
                message: t('games.draw.play.lastScoredRound', {
                  points: earnedPoints,
                  scored: nextState.scoredRoundsToday,
                  max: nextState.maxScoredRoundsPerDay,
                }),
                severity: 'success',
              });
            }
          } else if (nextState.canEarnRatingPoints) {
            const remaining = Math.max(
              0,
              nextState.maxScoredRoundsPerDay - nextState.scoredRoundsToday
            );
            setToast({
              open: true,
              message: t('games.draw.play.remainingRounds', {
                points: earnedPoints,
                remaining,
              }),
              severity: 'success',
            });
          }
        } else {
          void playRoundFailureSound();
        }
      }
      prevRoundStatusRef.current = round?.status ?? null;

      setState(nextState);
      syncRequestedRef.current = false;

      if (!nextState.currentRound) {
        setDrawingSecondsLeft(0);
        setLobbySecondsLeft(nextState.lobbySecondsRemaining);
        return;
      }

      setLobbySecondsLeft(0);
      setDrawingSecondsLeft(nextState.currentRound.drawingSecondsRemaining);

      if (nextState.currentRound.status === 'revealed') {
        setGuessInput('');
      }
    },
    [t, tryOpenDailyLimitDialog]
  );

  const loadState = useCallback(async () => {
    try {
      const data = await fetchDrawGameState();
      applyState(data.state);
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
  }, [applyState, t]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    return () => {
      const relationshipId = stateRef.current?.relationshipId;
      if (!relationshipId) {
        return;
      }

      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_leave');
      } else {
        postDrawClearGuessAttempts().catch(() => undefined);
      }
    };
  }, []);

  const requestSync = useCallback(() => {
    if (syncRequestedRef.current) {
      return;
    }
    syncRequestedRef.current = true;

    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('draw_game_sync');
      window.setTimeout(() => {
        syncRequestedRef.current = false;
      }, 800);
    } else {
      fetchDrawGameState()
        .then((data) => applyState(data.state))
        .finally(() => {
          syncRequestedRef.current = false;
        });
    }
  }, [applyState]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    socket.emit('draw_game_subscribe');

    const handleState = (payload: { state: DrawGameState }) => {
      applyState(payload.state);
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload.code === 'NO_PARTNER') {
        setBlockedReason(payload.message || t('games.common.partnerRequired'));
        return;
      }
      if (payload.code === 'NOT_DRAWING') {
        return;
      }
      if (payload.message) {
        setToast({ open: true, message: payload.message, severity: 'error' });
      }
    };

    socket.on('draw_game_state', handleState);
    socket.on('draw_game_error', handleError);

    return () => {
      socket.off('draw_game_state', handleState);
      socket.off('draw_game_error', handleError);
    };
  }, [user?._id, applyState, t]);

  useEffect(() => {
    if (!state?.inLobby) {
      return;
    }

    setLobbySecondsLeft(state.lobbySecondsRemaining);

    if (state.lobbySecondsRemaining <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setLobbySecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0) {
          requestSync();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.inLobby, state?.lobbySecondsRemaining, requestSync]);

  useLobbyCountdownSound(
    lobbySecondsLeft,
    Boolean(state?.inLobby),
    Boolean(state?.currentRound && !state.inLobby)
  );
  useRoundTimerSound(drawingSecondsLeft, state?.currentRound?.status === 'drawing');

  useEffect(() => {
    const round = state?.currentRound;
    if (!round || round.status !== 'drawing') {
      return;
    }

    const timerId = window.setInterval(() => {
      setDrawingSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0) {
          requestSync();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.currentRound?.status, requestSync]);

  const handleReady = async () => {
    unlockGameAudio();
    void playGameReadySound();
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_ready');
      } else {
        const result = await postDrawReady();
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.readyFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStroke = async (stroke: DrawStroke) => {
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_stroke', stroke);
      } else {
        const result = await postDrawStroke(stroke);
        applyState(result.state);
      }
    } catch (error: any) {
      if (error?.response?.data?.code === 'NOT_DRAWING') {
        return;
      }
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.strokeFailed'),
        severity: 'error',
      });
    }
  };

  const handleClearStrokes = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_clear_strokes');
      } else {
        const result = await postDrawClearStrokes();
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.clearCanvasFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_undo');
      } else {
        const result = await postDrawUndo();
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.undoFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedo = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_redo');
      } else {
        const result = await postDrawRedo();
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.redoFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGuess = async () => {
    const trimmed = guessInput.trim();
    const roundStatus = state?.currentRound?.status;
    if (
      !trimmed ||
      !state?.currentRound ||
      (roundStatus !== 'drawing' && roundStatus !== 'guessing')
    ) {
      return;
    }

    setSubmitting(true);
    unlockGameAudio();
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_guess', { guess: trimmed });
        setGuessInput('');
      } else {
        const result = await postDrawGuess(trimmed);
        applyState(result.state);
        setGuessInput('');
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.guessFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDailyLimitDialog = () => (
    <ResponsiveDialog
      open={dailyLimitDialogOpen}
      onClose={handleDismissDailyLimitDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('games.draw.play.dailyLimitDialogTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t('games.draw.play.dailyLimitDialogBodyFull')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={handleDismissDailyLimitDialog}>
          {t('games.common.understood')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );

  const renderClearAllDialog = () => (
    <ResponsiveDialog
      open={clearAllDialogOpen}
      onClose={() => setClearAllDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{t('drawingTools.clearAllConfirmTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t('drawingTools.clearAllConfirmBody')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setClearAllDialogOpen(false)} disabled={submitting}>
          {t('calendar.common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={submitting}
          onClick={async () => {
            setClearAllDialogOpen(false);
            await handleClearStrokes();
          }}
        >
          {t('drawingTools.clearAll')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );

  const handleNextRound = async () => {
    unlockGameAudio();
    void playNextRoundSound();
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('draw_game_next_round');
      } else {
        const result = await advanceDrawRound();
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.advanceFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={getGamePlayLoadingWrapSx(theme)}>
        <CircularProgress />
      </Box>
    );
  }

  if (blockedReason) {
    return (
      <Box sx={getGamePlayBlockedPanelSx(theme)}>
        <Box sx={getGamePlayBlockedCardSx(theme)}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('games.common.needPartner')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {blockedReason}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" sx={getGamePlayPrimaryButtonSx()} onClick={() => navigate('/settings')}>
              {t('games.common.goToSettings')}
            </Button>
            <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>{t('games.common.back')}</Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={getGamePlayBlockedPanelSx(theme)}>
        <Box sx={getGamePlayBlockedCardSx(theme)}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('games.common.loadFailed')}
          </Typography>
          <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>{t('games.common.back')}</Button>
        </Box>
      </Box>
    );
  }

  if (!state.currentRound) {
    const myUserId = user?._id;
    const isMeReady = Boolean(myUserId && state.readyUserIds.includes(myUserId));
    const isPartnerReady = state.readyUserIds.some((id) => id !== myUserId);
    const isCountdownActive = state.inLobby && lobbySecondsLeft > 0;

    if (state.inLobby) {
      return (
        <Box sx={getGamePlayRootSx(theme)}>
          <Box sx={getGamePlayHeaderSx(theme)}>
            <IconButton
              sx={getGamePlayHeaderIconButtonSx(theme)}
              onClick={() => navigate(DRAW_GAME_INFO_PATH)}
              aria-label={t('games.common.back')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={getGamePlayHeaderTitleSx()}>{t('games.draw.name')}</Typography>
          </Box>

          <Box sx={getGamePlayCenterPanelSx(theme)}>
            <Box sx={getGamePlayCenterCardSx(theme)}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {isCountdownActive ? t('games.common.startingSoon') : t('games.common.readyToPlay')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('games.draw.play.pairScoreTodayScored', {
                  score: state.totalScore,
                  today: state.scoredRoundsToday,
                  max: state.maxScoredRoundsPerDay,
                })}
              </Typography>
              {state.dailyScoredLimitReached && (
                <Box sx={getGamePlayHintCardSx(theme)}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    {t('games.draw.play.dailyLimitLobby')}
                  </Typography>
                </Box>
              )}
              {state.waitingForPartnerResults ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  {t('games.draw.play.waitingPartnerResults')}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  {isCountdownActive
                    ? t('games.common.bothReady')
                    : t('games.common.pressReady')}
                </Typography>
              )}

              <Stack direction="row" spacing={4} sx={{ mb: 4, justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={1}>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleReady}
                    disabled={isMeReady || submitting || isCountdownActive}
                    aria-label={
                      isMeReady ? t('games.common.youReadyAria') : t('games.common.confirmReadyAria')
                    }
                    sx={getGamePlayReadyDotSx(theme, {
                      ready: isMeReady,
                      clickable: !isMeReady && !submitting && !isCountdownActive,
                    })}
                  >
                    {isMeReady ? '✓' : '…'}
                  </Box>
                  <Typography sx={getGamePlayReadyLabelSx()}>{t('games.common.you')}</Typography>
                </Stack>
                <Stack alignItems="center" spacing={1}>
                  <Box sx={getGamePlayReadyDotSx(theme, { ready: isPartnerReady })}>
                    {isPartnerReady ? '✓' : '…'}
                  </Box>
                  <Typography sx={getGamePlayReadyLabelSx()}>{t('games.common.partner')}</Typography>
                </Stack>
              </Stack>

              {isCountdownActive ? (
                <Typography sx={{ ...getGamePlayCountdownSx(), mb: 3 }}>{lobbySecondsLeft}</Typography>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={getGamePlayPrimaryButtonSx()}
                    disabled={isMeReady || submitting}
                    onClick={handleReady}
                  >
                    {isMeReady ? t('games.common.waitingPartner') : t('games.common.ready')}
                  </Button>
                  <GameLobbyRemindButton
                    gameId="draw"
                    visible={isMeReady && !isPartnerReady && !isCountdownActive}
                  />
                </>
              )}
            </Box>
          </Box>

          {renderDailyLimitDialog()}
          {renderClearAllDialog()}

          <CustomSnackbar
            open={toast.open}
            message={toast.message}
            severity={toast.severity}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          />
        </Box>
      );
    }

    return (
      <Box sx={getGamePlayBlockedPanelSx(theme)}>
        <Box sx={getGamePlayBlockedCardSx(theme)}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {state.dailyScoredLimitReached
              ? t('games.draw.play.dailyLimitExhaustedTitle')
              : t('games.common.roundNotActive')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {state.dailyScoredLimitReached
              ? t('games.draw.play.scoredTodaySummary', {
                  scored: state.scoredRoundsToday,
                  max: state.maxScoredRoundsPerDay,
                })
              : t('games.draw.play.roundStartFailedBody')}
          </Typography>
          <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>{t('games.common.backToGame')}</Button>
        </Box>
      </Box>
    );
  }

  const round = state.currentRound;
  const reveal = round.reveal;
  const isDrawing = round.status === 'drawing';
  const isGuessing = round.status === 'guessing';
  const isRevealed = round.status === 'revealed';
  const isRoundActive = isDrawing || isGuessing;
  const canDrawOnCanvas = isDrawing && round.isDrawer && drawingSecondsLeft > 0;
  const showGuessInput =
    round.isGuesser && isRoundActive && !isRevealed && drawingSecondsLeft > 0;
  const guessAttempts = Array.isArray(round.guessAttempts) ? round.guessAttempts : [];
  const myGuessAttempts = guessAttempts.filter((attempt) => attempt.isOwnGuess);
  const showGuessChat = isRoundActive && !isRevealed;
  const showMyGuessChat = showGuessChat && myGuessAttempts.length > 0;

  const activeSeconds = drawingSecondsLeft;
  const activeMax = state.roundTimeDrawingSec;
  const timeProgress = Math.max(0, Math.min(100, (activeSeconds / activeMax) * 100));
  const isTimeLow = activeSeconds <= 10 && isRoundActive;

  return (
    <Box
      sx={{
        ...getGamePlayRootSx(theme),
        ...drawPageNoSelectSx,
      }}
    >
      {isRoundActive && (
        <Box sx={getGamePlayTimerBarSx(theme)}>
          <Typography component="span" sx={getGamePlayTimerTextSx(isTimeLow)}>
            {t('games.common.secondsLeft', { seconds: activeSeconds })}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={timeProgress}
            color={isTimeLow ? 'error' : 'primary'}
            sx={getGamePlayTimerProgressSx()}
          />
        </Box>
      )}

      <Box sx={getGamePlayHeaderSx(theme)}>
        <IconButton
          sx={getGamePlayHeaderIconButtonSx(theme)}
          onClick={() => navigate(DRAW_GAME_INFO_PATH)}
          aria-label={t('games.common.back')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
            <Typography sx={getGamePlayHeaderTitleSx()}>
              {t('games.common.round')} {state.roundsCompleted + (isRevealed ? 0 : 1)}
            </Typography>
            {!state.canEarnRatingPoints && (
              <Chip
                label={t('games.common.forFun')}
                size="small"
                color="default"
                sx={getGamePlayChipSx(theme)}
              />
            )}
          </Stack>
          <Typography component="span" sx={getGamePlayHeaderSubtitleSx()}>
            {t('games.draw.play.scoreLine', {
              score: state.totalScore,
              today: state.scoredRoundsToday,
              max: state.maxScoredRoundsPerDay,
            })}
          </Typography>
        </Box>
      </Box>

      <Box sx={getGamePlayContentSx()}>
        {round.isDrawer && round.yourWord && isDrawing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {round.yourWord}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  right: '100%',
                  bottom: 0,
                  mr: 1,
                  fontWeight: 400,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('games.common.drawWord')}
              </Typography>
            </Box>
          </Box>
        )}

        {canDrawOnCanvas && (
          <DrawingToolsToolbar
            tool={drawTool}
            onToolChange={setDrawTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            penColor={penColor}
            onPenColorChange={setPenColor}
            onUndo={handleUndo}
            onRedo={handleRedo}
            undoDisabled={submitting || !(round.canUndo ?? round.strokes.length > 0)}
            redoDisabled={submitting || !round.canRedo}
            onClearAll={() => setClearAllDialogOpen(true)}
            clearAllDisabled={submitting || round.strokes.length === 0}
            showFillTool
            sideContent={
              showGuessChat ? (
                <DrawGuessChat
                  attempts={round.guessAttempts}
                  title={t('games.common.partnerGuesses')}
                  maxHeight={96}
                  titleColor="primary.main"
                />
              ) : undefined
            }
          />
        )}

        <DrawCanvas
          strokes={round.strokes}
          canDraw={canDrawOnCanvas}
          tool={drawTool}
          strokeColor={penColor}
          strokeWidth={brushSize}
          onStroke={canDrawOnCanvas ? handleStroke : undefined}
        />

        {isRevealed && reveal && (
          <Box sx={getGamePlayRevealStackSx(theme)}>
            <Stack spacing={1}>
            {reveal.wasCorrect ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {reveal.word}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {reveal.pointsEarned > 0
                    ? t('games.draw.play.guessedWithPoints', { points: reveal.pointsEarned })
                    : t('games.draw.play.guessedLimitForFun')}
                </Typography>
                {state.dailyScoredLimitReached && (
                  <Typography variant="body2" color="text.secondary">
                    {reveal.pointsEarned > 0
                      ? t('games.draw.play.scoredTodayExhausted', {
                          scored: state.scoredRoundsToday,
                          max: state.maxScoredRoundsPerDay,
                        })
                      : t('games.draw.play.dailyLimitShort')}
                  </Typography>
                )}
                {!state.dailyScoredLimitReached && state.canEarnRatingPoints && (
                  <Typography variant="body2" color="text.secondary">
                    {t('games.draw.play.remainingRoundsLabel', {
                      remaining: Math.max(
                        0,
                        state.maxScoredRoundsPerDay - state.scoredRoundsToday
                      ),
                    })}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography variant="body1" color="error.main" sx={{ fontWeight: 600 }}>
                  {reveal.guessText
                    ? t('games.draw.play.wrongGuessText', { guess: reveal.guessText })
                    : t('games.draw.play.nobodyGuessed')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('games.draw.play.secretWordLabel')} <strong>{reveal.word}</strong>
                </Typography>
              </>
            )}
            </Stack>
          </Box>
        )}
      </Box>

      <Box sx={getGamePlayFooterSx(theme)}>
        {showGuessInput && (
          <Stack spacing={1}>
            {showMyGuessChat ? (
              <DrawGuessChat
                attempts={myGuessAttempts}
                title={t('games.common.yourGuesses')}
                ownGuessSide="left"
              />
            ) : null}
            <Typography variant="body2" color="text.secondary" align="center">
              {state.canEarnRatingPoints
                ? t('games.draw.play.guessHintRated')
                : t('games.draw.play.guessHintForFun')}
            </Typography>
            <TextField
              fullWidth
              placeholder={t('games.common.yourAnswer')}
              value={guessInput}
              onChange={(event) => setGuessInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSubmitGuess();
                }
              }}
              disabled={submitting}
              autoComplete="off"
              sx={{
                '& input': {
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={getGamePlayPrimaryButtonSx()}
              disabled={!guessInput.trim() || submitting}
              onClick={handleSubmitGuess}
            >
              {t('games.common.send')}
            </Button>
          </Stack>
        )}

        {isRevealed && reveal && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={getGamePlayPrimaryButtonSx()}
            disabled={submitting}
            onClick={handleNextRound}
          >
            {reveal.wasCorrect ? t('games.common.nextRound') : t('games.common.playMore')}
          </Button>
        )}
      </Box>

      {renderDailyLimitDialog()}
      {renderClearAllDialog()}

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default DrawGamePlayPage;
