import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  advanceGeoRound,
  expireGeoRound,
  fetchGeoGameState,
  GEO_MAX_POINTS_PER_GUESS,
  postGeoGuess,
  postGeoReady,
  type GeoGameState,
} from '../services/gamesService';
import GeoGuessMap, { type GeoMapMarker } from '../components/Games/GeoGuessMap';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import { fireRoundConfetti } from '../utils/roundConfetti';

const MY_GUESS_COLOR = '#FF4B8D';
const PARTNER_GUESS_COLOR = '#6366f1';
const GEO_GAME_INFO_PATH = '/chat/games/geo';
const GEO_CONFETTI_MIN_POINTS = GEO_MAX_POINTS_PER_GUESS / 2;

const isGeoGameSessionEnded = (gameState: GeoGameState) =>
  !gameState.currentRound && !gameState.inLobby && gameState.dailyLimitReached;

const GeoGamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<GeoGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draftGuess, setDraftGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(0);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const roundLocationRef = useRef<string | null>(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'error' | 'success',
  });
  const expireRequestedRef = useRef(false);
  const expireRetryTimerRef = useRef<number | null>(null);
  const prevRoundStatusRef = useRef<string | null>(null);

  const clearExpireRetry = useCallback(() => {
    if (expireRetryTimerRef.current != null) {
      window.clearTimeout(expireRetryTimerRef.current);
      expireRetryTimerRef.current = null;
    }
  }, []);

  const applyState = useCallback((nextState: GeoGameState) => {
    if (isGeoGameSessionEnded(nextState)) {
      navigate(GEO_GAME_INFO_PATH, { state: { showDailyLimitDialog: true } });
      return;
    }

    const round = nextState.currentRound;
    const justRevealed =
      round?.status === 'revealed' &&
      round.reveal &&
      prevRoundStatusRef.current &&
      prevRoundStatusRef.current !== 'revealed';

    if (justRevealed && round.reveal) {
      const hasStrongGuess = round.reveal.guesses.some(
        (guess) => guess.submitted && guess.pointsEarned >= GEO_CONFETTI_MIN_POINTS
      );
      if (hasStrongGuess) {
        fireRoundConfetti();
      }
    }

    prevRoundStatusRef.current = round?.status ?? null;

    setState(nextState);
    expireRequestedRef.current = false;
    clearExpireRetry();

    if (!round) {
      setDraftGuess(null);
      roundLocationRef.current = null;
      setSecondsLeft(0);
      setLobbySecondsLeft(nextState.lobbySecondsRemaining);
      return;
    }

    setLobbySecondsLeft(0);

    if (round.locationId !== roundLocationRef.current) {
      roundLocationRef.current = round.locationId;
      setDraftGuess(null);
    }

    setSecondsLeft(round.secondsRemaining);

    if (round.status === 'revealed') {
      setDraftGuess(null);
    }
  }, [clearExpireRetry, navigate]);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchGeoGameState();
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
    if (!user?._id) {
      return;
    }

    const socket = socketService.getSocket() || socketService.initialize(user._id);
    socket.emit('geo_game_subscribe');

    const handleState = (payload: { state: GeoGameState }) => {
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

    socket.on('geo_game_state', handleState);
    socket.on('geo_game_error', handleError);

    return () => {
      socket.off('geo_game_state', handleState);
      socket.off('geo_game_error', handleError);
    };
  }, [user?._id, applyState]);

  const requestExpireRound = useCallback(async () => {
    if (expireRequestedRef.current) {
      return;
    }
    expireRequestedRef.current = true;

    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('geo_game_expire');
        expireRetryTimerRef.current = window.setTimeout(() => {
          expireRequestedRef.current = false;
          if (state?.currentRound?.status === 'guessing') {
            requestExpireRound();
          }
        }, 800);
      } else {
        const result = await expireGeoRound();
        applyState(result.state);
      }
    } catch (error: any) {
      if (error?.response?.data?.code === 'ROUND_NOT_EXPIRED') {
        expireRequestedRef.current = false;
        expireRetryTimerRef.current = window.setTimeout(() => requestExpireRound(), 500);
        return;
      }
      expireRequestedRef.current = false;
    }
  }, [applyState, state?.currentRound?.status]);

  useEffect(() => {
    if (!state?.currentRound || state.currentRound.status !== 'guessing') {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0) {
          requestExpireRound();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [
    state?.currentRound?.deadlineAt,
    state?.currentRound?.status,
    state?.currentRound?.locationId,
    requestExpireRound,
  ]);

  useEffect(() => () => clearExpireRetry(), [clearExpireRetry]);

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
          const socket = socketService.getSocket();
          if (socket?.connected) {
            socket.emit('geo_game_sync');
          } else {
            fetchGeoGameState().then((data) => applyState(data.state));
          }
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.inLobby, state?.lobbySecondsRemaining, applyState]);

  const handleReady = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('geo_game_ready');
      } else {
        const result = await postGeoReady();
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

  const handleSubmitGuess = async () => {
    if (!draftGuess || !state?.currentRound || state.currentRound.status !== 'guessing') {
      return;
    }

    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('geo_game_guess', { lat: draftGuess.lat, lng: draftGuess.lng });
      } else {
        const result = await postGeoGuess(draftGuess.lat, draftGuess.lng);
        applyState(result.state);
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

  const handleNextRound = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('geo_game_next_round');
      } else {
        const result = await advanceGeoRound();
        applyState(result.state);
        setDraftGuess(null);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || 'Не удалось начать раунд',
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
          <Button onClick={() => navigate('/chat/games/geo')}>Назад</Button>
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
        <Button onClick={() => navigate('/chat/games/geo')}>Назад</Button>
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
            <IconButton onClick={() => navigate('/chat/games/geo')} aria-label="Назад">
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Угадай локацию
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Раунд {state.roundsCompleted + 1}
              </Typography>
            </Box>
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
              {isCountdownActive ? 'Скоро начнём!' : 'Готовы к раунду?'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Счёт пары: {state.totalScore} · Сегодня: {state.roundsPlayedToday}/{state.maxRoundsPerDay}
              {state.locationsRemaining < state.locationsTotal
                ? ` · в пуле осталось: ${state.locationsRemaining}`
                : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {isCountdownActive
                ? 'Оба партнёра готовы — раунд начнётся одновременно.'
                : 'Нажмите «Готов», когда будете на месте. Раунд стартует, когда оба готовы.'}
            </Typography>

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
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3, textAlign: 'center', maxWidth: 420, mx: 'auto', mt: 6 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {state.dailyLimitReached ? 'На сегодня всё' : 'Раунд не активен'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {state.dailyLimitReached
            ? `Вы угадали ${state.maxRoundsPerDay} мест за сегодня. Новые раунды — завтра.`
            : 'Вернитесь к описанию игры и начните заново.'}
        </Typography>
        <Button onClick={() => navigate('/chat/games/geo')}>К игре</Button>
      </Box>
    );
  }

  const round = state.currentRound;
  const isGuessing = round.status === 'guessing';
  const reveal = round.reveal;
  const actual = reveal ? { lat: reveal.actualLat, lng: reveal.actualLng } : null;
  const myUserId = user?._id;
  const mySubmittedGuess = myUserId
    ? round.guesses.find((guess) => guess.userId === myUserId)
    : undefined;
  const partnerSubmittedGuess = myUserId
    ? round.guesses.find((guess) => guess.userId !== myUserId)
    : undefined;
  const hasSubmittedMyGuess = Boolean(mySubmittedGuess);
  const waitingForPartner = isGuessing && hasSubmittedMyGuess && !partnerSubmittedGuess;

  const mapMarkers: GeoMapMarker[] = [];
  if (isGuessing) {
    if (partnerSubmittedGuess) {
      mapMarkers.push({
        id: 'partner',
        lat: partnerSubmittedGuess.lat,
        lng: partnerSubmittedGuess.lng,
        color: PARTNER_GUESS_COLOR,
      });
    }
    if (mySubmittedGuess) {
      mapMarkers.push({
        id: 'mine',
        lat: mySubmittedGuess.lat,
        lng: mySubmittedGuess.lng,
        color: MY_GUESS_COLOR,
      });
    }
  } else if (reveal) {
    reveal.guesses.forEach((guess) => {
      if (guess.lat == null || guess.lng == null) {
        return;
      }
      mapMarkers.push({
        id: guess.userId,
        lat: guess.lat,
        lng: guess.lng,
        color: guess.userId === myUserId ? MY_GUESS_COLOR : PARTNER_GUESS_COLOR,
      });
    });
  }

  const myRevealResult = reveal?.guesses.find((guess) => guess.userId === myUserId);
  const partnerRevealResult = reveal?.guesses.find((guess) => guess.userId !== myUserId);
  const timeProgress = isGuessing
    ? Math.max(0, Math.min(100, (secondsLeft / state.roundTimeSec) * 100))
    : 0;
  const isTimeLow = isGuessing && secondsLeft <= 10;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isGuessing && (
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
            Осталось {secondsLeft} сек
          </Typography>
          <LinearProgress
            variant="determinate"
            value={timeProgress}
            color={isTimeLow ? 'error' : 'primary'}
            sx={{
              height: 6,
              borderRadius: 0,
              bgcolor: 'action.selected',
              '& .MuiLinearProgress-bar': {
                transition: 'transform 1s linear',
              },
            }}
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
        <IconButton onClick={() => navigate('/chat/games/geo')} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
            Раунд {state.roundsCompleted + (isGuessing ? 1 : 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Счёт пары: {state.totalScore} · Сегодня: {state.roundsPlayedToday}/{state.maxRoundsPerDay}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          component="img"
          src={round.imageUrl}
          alt=""
          sx={{
            width: '100%',
            height: reveal ? { xs: 140, sm: 160 } : { xs: 180, sm: 220 },
            objectFit: 'cover',
            flexShrink: 0,
            bgcolor: 'grey.900',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            flexShrink: reveal ? 0 : undefined,
            flex: reveal ? 'none' : 1,
            height: reveal ? { xs: 150, sm: 180 } : undefined,
            minHeight: reveal ? undefined : { xs: 200, sm: 240 },
          }}
        >
          <GeoGuessMap
            draftGuess={!hasSubmittedMyGuess && isGuessing ? draftGuess : null}
            markers={mapMarkers}
            actual={actual}
            showLines={Boolean(reveal)}
            interactive={isGuessing && secondsLeft > 0 && !hasSubmittedMyGuess}
            onGuessChange={(lat, lng) => setDraftGuess({ lat, lng })}
          />
        </Box>

        {reveal ? (
          <Stack spacing={1.5} sx={{ p: 2, flexShrink: 0 }}>
            {reveal.timedOut && reveal.guesses.length === 0 ? (
              <Typography variant="body1" color="error.main" align="center" sx={{ fontWeight: 600 }}>
                Время вышло — никто не успел поставить метку
              </Typography>
            ) : null}
            <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
              {reveal.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {reveal.continent} · {reveal.country} · {reveal.city}
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="body2" align="center">
                Вы:{' '}
                {myRevealResult?.submitted ? (
                  <>
                    <strong>{myRevealResult.distanceKm} км</strong> · +{myRevealResult.pointsEarned}{' '}
                    очков
                  </>
                ) : (
                  <>не успели (+0)</>
                )}
              </Typography>
              <Typography variant="body2" align="center">
                Партнёр:{' '}
                {partnerRevealResult?.submitted ? (
                  <>
                    <strong>{partnerRevealResult.distanceKm} км</strong> · +
                    {partnerRevealResult.pointsEarned} очков
                  </>
                ) : (
                  <>не успел (+0)</>
                )}
              </Typography>
            </Stack>
            <Typography variant="body1" align="center" sx={{ fontWeight: 700 }}>
              Итого: +{reveal.totalPointsEarned} очков
            </Typography>
          </Stack>
        ) : null}
      </Box>

      <Box
        sx={{
          p: 2,
          pb: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        {isGuessing ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" align="center">
              {waitingForPartner
                ? 'Ваша метка отправлена. Ждём ответ партнёра...'
                : 'Каждый ставит свою метку. Очки обоих партнёров суммируются.'}
            </Typography>
            {!waitingForPartner && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ color: MY_GUESS_COLOR, fontWeight: 700 }}>
                    ●
                  </Box>{' '}
                  Вы
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ color: PARTNER_GUESS_COLOR, fontWeight: 700 }}>
                    ●
                  </Box>{' '}
                  Партнёр
                </Typography>
              </Stack>
            )}
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!draftGuess || submitting || secondsLeft <= 0 || hasSubmittedMyGuess}
              onClick={handleSubmitGuess}
            >
              {hasSubmittedMyGuess ? 'Метка отправлена' : 'Подтвердить мою метку'}
            </Button>
          </Stack>
        ) : reveal ? (
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            onClick={handleNextRound}
          >
            {state.dailyLimitReached || state.roundsRemainingToday <= 0
              ? 'Завершить'
              : 'Следующий раунд'}
          </Button>
        ) : null}
      </Box>

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default GeoGamePlayPage;
