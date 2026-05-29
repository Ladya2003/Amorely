import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import DrawCanvas from '../components/Games/DrawCanvas';
import DrawGuessChat from '../components/Games/DrawGuessChat';
import DrawingToolsToolbar, { type DrawingTool } from '../components/Games/DrawingToolsToolbar';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { fireRoundConfetti } from '../utils/roundConfetti';
import socketService from '../services/socketService';
import {
  advanceDrawRound,
  fetchDrawGameState,
  postDrawClearGuessAttempts,
  postDrawGuess,
  postDrawReady,
  postDrawStroke,
  type DrawGameState,
  type DrawStroke,
} from '../services/gamesService';

const DRAW_GAME_INFO_PATH = '/chat/games/draw';

const isDrawSessionEnded = (gameState: DrawGameState) =>
  gameState.allScoredRoundsDone && !gameState.currentRound && !gameState.inLobby;

const DAILY_LIMIT_DIALOG_TEXT =
  'Очки засчитываются только за 10 игр в день. Можете продолжить играть за интерес — угадывания по-прежнему засчитываются, но баллы в рейтинг не идут.';

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
      if (isDrawSessionEnded(nextState)) {
        navigate(DRAW_GAME_INFO_PATH);
        return;
      }

      const round = nextState.currentRound;
      const justRevealedCorrect =
        round?.status === 'revealed' &&
        round.reveal?.wasCorrect &&
        prevRoundStatusRef.current &&
        prevRoundStatusRef.current !== 'revealed';

      if (justRevealedCorrect) {
        fireRoundConfetti();

        const { reveal } = round;
        const earnedPoints = reveal?.pointsEarned ?? 0;

        if (nextState.dailyScoredLimitReached) {
          tryOpenDailyLimitDialog(nextState.relationshipId);
          if (earnedPoints === 0) {
            setToast({
              open: true,
              message:
                'Очки засчитываются только за 10 игр в день. Сегодня лимит исчерпан — играйте за интерес.',
              severity: 'info',
            });
          } else {
            setToast({
              open: true,
              message: `+${earnedPoints} очков. Это была последняя игра с очками на сегодня (${nextState.scoredRoundsToday}/${nextState.maxScoredRoundsPerDay}). Дальше — за интерес.`,
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
            message: `+${earnedPoints} очков. Сегодня осталось раундов: ${remaining}`,
            severity: 'success',
          });
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
    [navigate, tryOpenDailyLimitDialog]
  );

  const loadState = useCallback(async () => {
    try {
      const data = await fetchDrawGameState();
      applyState(data.state);
    } catch (error: any) {
      if (error?.response?.data?.code === 'NO_PARTNER') {
        setBlockedReason(
          error.response.data.error || 'Для игры нужен партнёр. Добавьте его в настройках профиля.'
        );
        return;
      }
      setToast({
        open: true,
        message: 'Не удалось загрузить игру',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [applyState]);

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
        setBlockedReason(payload.message || 'Для игры нужен партнёр. Добавьте его в настройках профиля.');
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
  }, [user?._id, applyState]);

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
        message: error?.response?.data?.error || 'Не удалось подтвердить готовность',
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
      setToast({
        open: true,
        message: error?.response?.data?.error || 'Не удалось сохранить штрих',
        severity: 'error',
      });
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
        message: error?.response?.data?.error || 'Не удалось отправить ответ',
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
      <DialogTitle>Лимит очков на сегодня</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {DAILY_LIMIT_DIALOG_TEXT}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={handleDismissDailyLimitDialog}>
          Понятно
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );

  const handleNextRound = async () => {
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
        message: error?.response?.data?.error || 'Не удалось продолжить',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
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
          Нужен партнёр
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {blockedReason}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/settings')}>
            Перейти в настройки
          </Button>
          <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>Назад</Button>
        </Stack>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Не удалось загрузить игру
        </Typography>
        <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>Назад</Button>
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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              px: 1,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <IconButton onClick={() => navigate(DRAW_GAME_INFO_PATH)} aria-label="Назад">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Угадай рисунок
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              maxWidth: 420,
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              {isCountdownActive ? 'Скоро начнём!' : 'Готовы к игре?'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Счёт пары: {state.totalScore} · Сегодня с очками: {state.scoredRoundsToday}/
              {state.maxScoredRoundsPerDay}
            </Typography>
            {state.dailyScoredLimitReached && (
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                Очки засчитываются только за 10 игр в день. Можете продолжить играть за интерес.
              </Alert>
            )}
            {state.waitingForPartnerResults ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Партнёр ещё смотрит результаты прошлого раунда. Можете нажать «Готов», когда будете
                на месте.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {isCountdownActive
                  ? 'Оба партнёра готовы — раунд начнётся одновременно.'
                  : 'Нажмите «Готов», когда будете на месте. Раунд стартует, когда оба готовы.'}
              </Typography>
            )}

            <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: isMeReady ? 'success.main' : 'action.selected',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMeReady ? 'success.contrastText' : 'text.secondary',
                    fontWeight: 700,
                  }}
                >
                  {isMeReady ? '✓' : '…'}
                </Box>
                <Typography variant="caption">Вы</Typography>
              </Stack>
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: isPartnerReady ? 'success.main' : 'action.selected',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPartnerReady ? 'success.contrastText' : 'text.secondary',
                    fontWeight: 700,
                  }}
                >
                  {isPartnerReady ? '✓' : '…'}
                </Box>
                <Typography variant="caption">Партнёр</Typography>
              </Stack>
            </Stack>

            {isCountdownActive ? (
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                {lobbySecondsLeft}
              </Typography>
            ) : (
              <Button
                variant="contained"
                size="large"
                disabled={isMeReady || submitting}
                onClick={handleReady}
              >
                {isMeReady ? 'Ждём партнёра…' : 'Готов'}
              </Button>
            )}
          </Box>

          {renderDailyLimitDialog()}

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
      <Box sx={{ p: 3, textAlign: 'center', maxWidth: 420, mx: 'auto', mt: 6 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {state.allScoredRoundsDone ? 'Все раунды рейтинга пройдены' : 'Раунд не активен'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {state.allScoredRoundsDone
            ? `Вы набрали ${state.totalScore} очков за ${state.maxScoredRounds} раундов.`
            : 'Все слова из набора уже использованы. Можно продолжить позже или сбросить прогресс в базе.'}
        </Typography>
        <Button onClick={() => navigate(DRAW_GAME_INFO_PATH)}>К игре</Button>
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
  const showGuessChat = isRoundActive && !isRevealed && guessAttempts.length > 0;

  const activeSeconds = drawingSecondsLeft;
  const activeMax = state.roundTimeDrawingSec;
  const timeProgress = Math.max(0, Math.min(100, (activeSeconds / activeMax) * 100));
  const isTimeLow = activeSeconds <= 10 && isRoundActive;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isRoundActive && (
        <Box
          sx={{
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pt: 0.75,
            pb: 0,
          }}
        >
          <Typography
            variant="caption"
            align="center"
            sx={{
              display: 'block',
              mb: 0.5,
              fontWeight: 700,
              color: isTimeLow ? 'error.main' : 'text.secondary',
            }}
          >
            Осталось {activeSeconds} сек
          </Typography>
          <LinearProgress
            variant="determinate"
            value={timeProgress}
            color={isTimeLow ? 'error' : 'primary'}
            sx={{ height: 6, borderRadius: 0 }}
          />
        </Box>
      )}

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
        <IconButton onClick={() => navigate(DRAW_GAME_INFO_PATH)} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Раунд {state.roundsCompleted + (isRevealed ? 0 : 1)}
            </Typography>
            {!state.canEarnRatingPoints && (
              <Chip label="За интерес" size="small" color="default" sx={{ height: 22 }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Счёт: {state.totalScore} · Сегодня: {state.scoredRoundsToday}/{state.maxScoredRoundsPerDay}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {round.isDrawer && round.yourWord && isDrawing && (
          <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 2 }}>
            {round.yourWord}
          </Typography>
        )}

        {canDrawOnCanvas && (
          <DrawingToolsToolbar
            tool={drawTool}
            onToolChange={setDrawTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            penColor={penColor}
            onPenColorChange={setPenColor}
            sideContent={
              showGuessChat && (round.guessAttempts?.length ?? 0) > 0 ? (
                <DrawGuessChat
                  attempts={round.guessAttempts}
                  title="Догадки"
                  maxHeight={176}
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
          <Stack spacing={1} sx={{ mt: 2, textAlign: 'center' }}>
            {reveal.wasCorrect ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {reveal.word}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {reveal.pointsEarned > 0
                    ? `Угадано! +${reveal.pointsEarned} очков`
                    : 'Угадано! Сегодня лимит очков — играете за интерес'}
                </Typography>
                {state.dailyScoredLimitReached && (
                  <Typography variant="body2" color="text.secondary">
                    {reveal.pointsEarned > 0
                      ? `Сегодня с очками: ${state.scoredRoundsToday}/${state.maxScoredRoundsPerDay} — лимит исчерпан`
                      : 'Очки засчитываются только за 10 игр в день'}
                  </Typography>
                )}
                {!state.dailyScoredLimitReached && state.canEarnRatingPoints && (
                  <Typography variant="body2" color="text.secondary">
                    Сегодня осталось раундов:{' '}
                    {Math.max(0, state.maxScoredRoundsPerDay - state.scoredRoundsToday)}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography variant="body1" color="error.main" sx={{ fontWeight: 600 }}>
                  {reveal.guessText
                    ? `Ответ «${reveal.guessText}» — неверно`
                    : 'Никто не угадал — увы и жаль'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Загаданное слово: <strong>{reveal.word}</strong>
                </Typography>
              </>
            )}
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        {showGuessInput && (
          <Stack spacing={1}>
            {showGuessChat ? (
              <DrawGuessChat
                attempts={guessAttempts}
                title="Ваши догадки"
                ownGuessSide="left"
              />
            ) : null}
            <Typography variant="body2" color="text.secondary" align="center">
              {state.canEarnRatingPoints
                ? 'Угадывайте, пока партнёр рисует — чем быстрее, тем больше очков'
                : 'Угадывайте за интерес — сегодня лимит очков в рейтинг уже исчерпан'}
            </Typography>
            <TextField
              fullWidth
              placeholder="Ваш ответ"
              value={guessInput}
              onChange={(event) => setGuessInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSubmitGuess();
                }
              }}
              disabled={submitting}
              autoComplete="off"
            />
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!guessInput.trim() || submitting}
              onClick={handleSubmitGuess}
            >
              Отправить
            </Button>
          </Stack>
        )}

        {isRevealed && reveal && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            onClick={handleNextRound}
          >
            {state.allScoredRoundsDone
              ? 'Завершить'
              : reveal.wasCorrect
                ? 'Следующий раунд'
                : 'Играть дальше'}
          </Button>
        )}
      </Box>

      {renderDailyLimitDialog()}

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
