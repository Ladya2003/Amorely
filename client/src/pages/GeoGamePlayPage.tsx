import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
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
import ContentViewer from '../components/Calendar/ContentViewer';
import ResponsiveDialog from '../components/UI/ResponsiveDialog';
import { fireRoundConfetti } from '../utils/roundConfetti';

const MY_GUESS_COLOR = '#FF4B8D';
const PARTNER_GUESS_COLOR = '#6366f1';
const GEO_GAME_INFO_PATH = '/chat/games/geo';
const GEO_CONFETTI_MIN_POINTS = GEO_MAX_POINTS_PER_GUESS / 2;

const isGeoGameSessionEnded = (gameState: GeoGameState) =>
  !gameState.currentRound && !gameState.inLobby && gameState.dailyLimitReached;

const GeoGamePlayPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<GeoGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draftGuess, setDraftGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(0);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [mapViewerOpen, setMapViewerOpen] = useState(false);
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
          error.response.data.error || t('games.common.partnerRequired')
        );
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
        setBlockedReason(payload.message || t('games.common.partnerRequired'));
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

  useEffect(() => {
    if (!mapViewerOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => window.clearTimeout(timer);
  }, [mapViewerOpen]);

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
        message: error?.response?.data?.error || t('games.common.errors.readyFailed'),
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
        message: error?.response?.data?.error || t('games.common.errors.guessFailed'),
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
        message: error?.response?.data?.error || t('games.common.errors.startRoundFailed'),
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
          {t('games.common.needPartner')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {blockedReason}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/settings')}>
            {t('games.common.goToSettings')}
          </Button>
          <Button onClick={() => navigate('/chat/games/geo')}>{t('games.common.back')}</Button>
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
        <Button onClick={() => navigate('/chat/games/geo')}>{t('games.common.back')}</Button>
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
            <IconButton onClick={() => navigate('/chat/games/geo')} aria-label={t('games.common.back')}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('games.geo.name')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('games.common.round')} {state.roundsCompleted + 1}
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
              {isCountdownActive ? t('games.common.startingSoon') : t('games.geo.play.readyToRoundQuestion')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('games.geo.play.pairScoreToday', {
                score: state.totalScore,
                today: state.roundsPlayedToday,
                max: state.maxRoundsPerDay,
              })}
              {state.locationsRemaining < state.locationsTotal
                ? t('games.geo.play.poolRemaining', { count: state.locationsRemaining })
                : ''}
            </Typography>
            {state.waitingForPartnerResults ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t('games.common.partnerViewingPastRound')}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {isCountdownActive
                  ? t('games.common.bothReady')
                  : t('games.common.pressReady')}
              </Typography>
            )}

            <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
              <Stack alignItems="center" spacing={1}>
                <Box
                  component="button"
                  type="button"
                  onClick={handleReady}
                  disabled={isMeReady || submitting || isCountdownActive}
                  aria-label={isMeReady ? t('games.common.youReadyAria') : t('games.common.confirmReadyAria')}
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
                    border: 'none',
                    p: 0,
                    cursor:
                      isMeReady || submitting || isCountdownActive ? 'default' : 'pointer',
                  }}
                >
                  {isMeReady ? '✓' : '…'}
                </Box>
                <Typography variant="caption">{t('games.common.you')}</Typography>
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
                <Typography variant="caption">{t('games.common.partner')}</Typography>
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
                {isMeReady ? t('games.common.waitingPartner') : t('games.common.ready')}
              </Button>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3, textAlign: 'center', maxWidth: 420, mx: 'auto', mt: 6 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {state.dailyLimitReached ? t('games.geo.play.dailyAllDone') : t('games.common.roundNotActive')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {state.dailyLimitReached
            ? t('games.geo.play.dailyGuessedAll', { count: state.maxRoundsPerDay })
            : t('games.geo.play.restartGame')}
        </Typography>
        <Button onClick={() => navigate('/chat/games/geo')}>{t('games.common.backToGame')}</Button>
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
  const mapInteractive = isGuessing && secondsLeft > 0 && !hasSubmittedMyGuess;

  const roundTimerBar = isGuessing ? (
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
        {t('games.common.secondsLeft', { seconds: secondsLeft })}
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
  ) : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {roundTimerBar}

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
        <IconButton onClick={() => navigate('/chat/games/geo')} aria-label={t('games.common.back')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
            {t('games.common.round')} {state.roundsCompleted + (isGuessing ? 1 : 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('games.geo.play.pairScoreToday', {
              score: state.totalScore,
              today: state.roundsPlayedToday,
              max: state.maxRoundsPerDay,
            })}
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
          sx={{
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={round.imageUrl}
            alt=""
            sx={{
              display: 'block',
              width: '100%',
              height: reveal ? { xs: 140, sm: 160 } : { xs: 180, sm: 220 },
              objectFit: 'cover',
              bgcolor: 'grey.900',
            }}
          />
          <IconButton
            size="medium"
            aria-label={t('games.geo.play.openPhotoFullscreen')}
            onClick={() => setImageViewerOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.45)',
              color: 'common.white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          >
            <OpenInFullIcon fontSize="medium" />
          </IconButton>
        </Box>

        <Box
          sx={{
            position: 'relative',
            flexShrink: reveal ? 0 : undefined,
            flex: reveal ? 'none' : 1,
            height: reveal ? { xs: 225, sm: 270 } : undefined,
            minHeight: reveal ? undefined : { xs: 200, sm: 240 },
          }}
        >
          <GeoGuessMap
            draftGuess={!hasSubmittedMyGuess && isGuessing ? draftGuess : null}
            markers={mapMarkers}
            actual={actual}
            showLines={Boolean(reveal)}
            interactive={mapInteractive}
            onGuessChange={(lat, lng) => setDraftGuess({ lat, lng })}
          />
          <IconButton
            size="medium"
            aria-label={t('games.geo.play.openMapFullscreen')}
            onClick={() => setMapViewerOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1000,
              bgcolor: 'rgba(0, 0, 0, 0.45)',
              color: 'common.white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          >
            <OpenInFullIcon fontSize="medium" />
          </IconButton>
        </Box>

        {reveal ? (
          <Stack spacing={1.5} sx={{ p: 2, flexShrink: 0 }}>
            {reveal.timedOut && reveal.guesses.length === 0 ? (
              <Typography variant="body1" color="error.main" align="center" sx={{ fontWeight: 600 }}>
                {t('games.geo.play.timedOutNoGuess')}
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
                {t('games.common.you')}:{' '}
                {myRevealResult?.submitted ? (
                  <strong>
                    {t('games.geo.play.youDistance', {
                      distance: myRevealResult.distanceKm,
                      points: myRevealResult.pointsEarned,
                    })}
                  </strong>
                ) : (
                  t('games.geo.play.missedGuessYou')
                )}
              </Typography>
              <Typography variant="body2" align="center">
                {t('games.common.partner')}:{' '}
                {partnerRevealResult?.submitted ? (
                  <strong>
                    {t('games.geo.play.youDistance', {
                      distance: partnerRevealResult.distanceKm,
                      points: partnerRevealResult.pointsEarned,
                    })}
                  </strong>
                ) : (
                  t('games.geo.play.missedGuessPartner')
                )}
              </Typography>
            </Stack>
            <Typography variant="body1" align="center" sx={{ fontWeight: 700 }}>
              {t('games.geo.play.totalEarned', { points: reveal.totalPointsEarned })}
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
                ? t('games.geo.play.markerSentWaiting')
                : t('games.geo.play.markerHintBoth')}
            </Typography>
            {!waitingForPartner && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ color: MY_GUESS_COLOR, fontWeight: 700 }}>
                    ●
                  </Box>{' '}
                  {t('games.common.you')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <Box component="span" sx={{ color: PARTNER_GUESS_COLOR, fontWeight: 700 }}>
                    ●
                  </Box>{' '}
                  {t('games.common.partner')}
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
              {hasSubmittedMyGuess
                ? t('games.geo.play.markerSubmitted')
                : t('games.geo.play.confirmMyMarker')}
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
              ? t('games.common.finish')
              : t('games.common.nextRound')}
          </Button>
        ) : null}
      </Box>

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />

      <ContentViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        fullScreen
        content={{
          mediaUrl: round.imageUrl,
          resourceType: 'image',
        }}
      />

      <ResponsiveDialog
        open={mapViewerOpen}
        onClose={() => setMapViewerOpen(false)}
        fullScreen
        disableMobileDrawer
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.900',
          }}
        >
          {roundTimerBar}
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <IconButton
              onClick={() => setMapViewerOpen(false)}
              aria-label={t('games.common.close')}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1000,
                color: 'common.white',
                bgcolor: 'rgba(0, 0, 0, 0.45)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            <GeoGuessMap
              draftGuess={!hasSubmittedMyGuess && isGuessing ? draftGuess : null}
              markers={mapMarkers}
              actual={actual}
              showLines={Boolean(reveal)}
              interactive={mapInteractive}
              onGuessChange={(lat, lng) => setDraftGuess({ lat, lng })}
            />
          </Box>
          {isGuessing ? (
            <Box
              sx={{
                flexShrink: 0,
                p: 2,
                pb: 'max(16px, env(safe-area-inset-bottom))',
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!draftGuess || submitting || secondsLeft <= 0 || hasSubmittedMyGuess}
                onClick={handleSubmitGuess}
              >
                {hasSubmittedMyGuess
                  ? t('games.geo.play.markerSubmitted')
                  : t('games.geo.play.confirmMyMarker')}
              </Button>
            </Box>
          ) : null}
        </Box>
      </ResponsiveDialog>
    </Box>
  );
};

export default GeoGamePlayPage;
