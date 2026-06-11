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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import socketService from '../services/socketService';
import {
  fetchQuizGameState,
  postQuizAnswer,
  postQuizDismissReveal,
  postQuizPick,
  postQuizReady,
  syncQuizGameState,
  type QuizGameState,
} from '../services/gamesService';
import { fireRoundConfetti } from '../utils/roundConfetti';
import { formatGameWaitDuration } from '../localization/gameHelpers';

const QUIZ_GAME_INFO_PATH = '/chat/games/quiz';
const POINT_TIERS = [100, 200, 300];
const LOVE_LANGUAGE_HINT_KEYS = [
  'affirmation',
  'qualityTime',
  'gifts',
  'service',
  'touch',
] as const;

const QuizGamePlayPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<QuizGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(0);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(0);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'error' | 'success',
  });
  const prevQuestionStatusRef = useRef<string | null>(null);
  const expireSyncRequestedRef = useRef(false);
  const lobbySyncRequestedRef = useRef(false);
  const lobbyExpireSyncDoneRef = useRef(false);

  const applyState = useCallback((nextState: QuizGameState) => {
    const question = nextState.currentQuestion;
    const justRevealed =
      question?.status === 'revealed' &&
      question.reveal &&
      prevQuestionStatusRef.current &&
      prevQuestionStatusRef.current !== 'revealed';

    if (justRevealed && question.reveal) {
      const confettiThreshold = question.points / 2;
      const hasStrongScore = question.reveal.answers.some(
        (entry) => entry.isCorrect && entry.pointsEarned >= confettiThreshold
      );
      if (hasStrongScore) {
        fireRoundConfetti();
      }
    }

    prevQuestionStatusRef.current = question?.status ?? null;

    setState(nextState);

    if (!question) {
      setQuestionSecondsLeft(0);
      setAnswerInput('');
      setLobbySecondsLeft(nextState.lobbySecondsRemaining);
      expireSyncRequestedRef.current = false;
      return;
    }

    setLobbySecondsLeft(0);
    setQuestionSecondsLeft(question.secondsRemaining);

    if (question.status === 'revealed') {
      setAnswerInput('');
    }
  }, []);

  const requestLobbySync = useCallback(() => {
    if (lobbySyncRequestedRef.current) {
      return;
    }
    lobbySyncRequestedRef.current = true;

    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('quiz_game_sync');
      window.setTimeout(() => {
        lobbySyncRequestedRef.current = false;
      }, 800);
    } else {
      syncQuizGameState()
        .then((data) => applyState(data.state))
        .finally(() => {
          lobbySyncRequestedRef.current = false;
        });
    }
  }, [applyState]);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchQuizGameState();
      applyState(data.state);
    } catch (error: any) {
      if (error?.response?.data?.code === 'NO_PARTNER') {
        setBlockedReason(
          error.response.data.error || t('games.common.partnerRequired')
        );
        return;
      }
      setToast({ open: true, message: t('games.common.loadFailed'), severity: 'error' });
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
    socket.emit('quiz_game_subscribe');

    const handleState = (payload: { state: QuizGameState }) => {
      applyState(payload.state);
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload.code === 'NO_PARTNER') {
        setBlockedReason(payload.message || t('games.common.partnerRequiredShort'));
        return;
      }
      if (payload.message) {
        setToast({ open: true, message: payload.message, severity: 'error' });
      }
    };

    socket.on('quiz_game_state', handleState);
    socket.on('quiz_game_error', handleError);

    return () => {
      socket.off('quiz_game_state', handleState);
      socket.off('quiz_game_error', handleError);
    };
  }, [user?._id, applyState]);

  useEffect(() => {
    if (!state?.inLobby) {
      lobbyExpireSyncDoneRef.current = false;
      return;
    }

    setLobbySecondsLeft(state.lobbySecondsRemaining);

    if (state.lobbySecondsRemaining <= 0) {
      if (!lobbyExpireSyncDoneRef.current) {
        lobbyExpireSyncDoneRef.current = true;
        requestLobbySync();
      }
      return;
    }

    lobbyExpireSyncDoneRef.current = false;

    const timerId = window.setInterval(() => {
      setLobbySecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0) {
          requestLobbySync();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.inLobby, state?.lobbySecondsRemaining, requestLobbySync]);

  useEffect(() => {
    const question = state?.currentQuestion;
    if (!question || question.status !== 'answering') {
      return;
    }

    const timerId = window.setInterval(() => {
      setQuestionSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0 && !expireSyncRequestedRef.current) {
          expireSyncRequestedRef.current = true;
          const socket = socketService.getSocket();
          if (socket?.connected) {
            socket.emit('quiz_game_sync');
          } else {
            syncQuizGameState().then((data) => applyState(data.state));
          }
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.currentQuestion?.status, state?.currentQuestion?.cellKey, applyState]);

  const handleReady = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_ready');
      } else {
        const result = await postQuizReady();
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

  const handlePickCell = async (categoryId: string, points: number) => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_pick', { categoryId, points });
      } else {
        const result = await postQuizPick(categoryId, points);
        applyState(result.state);
      }
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.pickFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_answer', { answer: answerInput.trim() });
      } else {
        const result = await postQuizAnswer(answerInput.trim());
        applyState(result.state);
      }
      setAnswerInput('');
    } catch (error: any) {
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.answerFailed'),
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissReveal = async () => {
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_dismiss_reveal');
      } else {
        const result = await postQuizDismissReveal();
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
        <Button variant="contained" onClick={() => navigate('/settings')}>
          {t('games.common.goToSettings')}
        </Button>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t('games.common.loadFailed')}
        </Typography>
        <Button onClick={() => navigate(QUIZ_GAME_INFO_PATH)}>{t('games.common.back')}</Button>
      </Box>
    );
  }

  if (state.onCooldown) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label={t('games.common.back')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('games.quiz.name')}
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
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('games.quiz.play.boardComplete')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('games.quiz.play.pairScore', { score: state.totalScore })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('games.quiz.play.newQuestionsIn', {
              duration: formatGameWaitDuration(t, state.cooldownSecondsRemaining),
            })}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (state.inLobby) {
    const myUserId = user?._id;
    const isMeReady = Boolean(myUserId && state.readyUserIds.includes(myUserId));
    const isPartnerReady = state.readyUserIds.some((id) => id !== myUserId);
    const isCountdownActive = lobbySecondsLeft > 0;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label={t('games.common.back')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('games.quiz.name')}
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
            {isCountdownActive ? t('games.common.startingSoon') : t('games.common.readyToPlay')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('games.quiz.play.pairScore', { score: state.totalScore })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {isCountdownActive
              ? t('games.quiz.play.bothReadyOpen')
              : t('games.quiz.play.pressReadyStart')}
          </Typography>
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
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
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
        <CustomSnackbar
          open={toast.open}
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        />
      </Box>
    );
  }

  const categories = Array.from(
    new Map(state.boardCells.map((cell) => [cell.categoryId, cell.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const question = state.currentQuestion;
  const reveal = question?.reveal;
  const isAnswering = question?.status === 'answering';
  const isRevealed = question?.status === 'revealed';
  const timeProgress = question
    ? Math.max(0, Math.min(100, (questionSecondsLeft / state.questionTimeSec) * 100))
    : 0;

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
          flexShrink: 0,
        }}
      >
        <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label={t('games.common.back')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('games.quiz.name')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('games.quiz.play.scoreRemaining', {
              score: state.totalScore,
              count: state.cellsRemaining,
            })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
        {!state.currentQuestion && (
          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: 1.5,
              py: 1,
              px: 1.5,
              borderRadius: 1,
              bgcolor: state.isMyTurnToPick ? 'primary.main' : 'action.selected',
              color: state.isMyTurnToPick ? 'primary.contrastText' : 'text.secondary',
              fontWeight: 600,
            }}
          >
            {state.isMyTurnToPick
              ? t('games.quiz.play.yourTurnPick')
              : t('games.quiz.play.partnerTurnPick')}
          </Typography>
        )}
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: '28%' }} />
              {POINT_TIERS.map((points) => (
                <TableCell key={points} align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {points}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                  {category.name}
                </TableCell>
                {POINT_TIERS.map((points) => {
                  const cell = state.boardCells.find(
                    (item) => item.categoryId === category.id && item.points === points
                  );
                  const used = cell?.used ?? true;
                  return (
                    <TableCell key={points} align="center" sx={{ p: 0.5 }}>
                      <Button
                        fullWidth
                        variant={used ? 'outlined' : 'contained'}
                        disabled={
                          used ||
                          submitting ||
                          Boolean(state.currentQuestion) ||
                          !state.isMyTurnToPick
                        }
                        onClick={() => handlePickCell(category.id, points)}
                        sx={{
                          minHeight: 44,
                          fontWeight: 700,
                          opacity: used ? 0.45 : 1,
                        }}
                      >
                        {used ? '—' : points}
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {question && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isAnswering && (
            <Box sx={{ flexShrink: 0 }}>
              <Typography variant="caption" align="center" sx={{ display: 'block', py: 0.75, fontWeight: 700 }}>
                {t('games.common.secondsLeft', { seconds: questionSecondsLeft })}
              </Typography>
              <LinearProgress variant="determinate" value={timeProgress} sx={{ height: 6, borderRadius: 0 }} />
            </Box>
          )}

          <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" color="primary.main">
              {question.categoryName} · {question.points}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, flex: 1 }}>
              {question.questionText}
            </Typography>

            {question.showLoveLanguagesHint && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>
                  {t('games.quiz.play.loveLanguagesHint.title')}
                </Typography>
                <Stack spacing={0.25}>
                  {LOVE_LANGUAGE_HINT_KEYS.map((key) => (
                    <Typography key={key} variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {t(`games.quiz.play.loveLanguagesHint.${key}`)}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {isAnswering && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {question.myAnswerSubmitted
                    ? t('games.quiz.play.answerSentWaiting')
                    : question.partnerAnswerSubmitted
                      ? t('games.quiz.play.partnerAnsweredYourTurn')
                      : t('games.quiz.play.oneAnswerUntilTimer')}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={t('games.common.yourAnswer')}
                  value={answerInput}
                  onChange={(event) => setAnswerInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSubmitAnswer();
                    }
                  }}
                  disabled={question.myAnswerSubmitted || submitting}
                  autoComplete="off"
                />
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!answerInput.trim() || question.myAnswerSubmitted || submitting}
                  onClick={handleSubmitAnswer}
                >
                  {question.myAnswerSubmitted
                    ? t('games.quiz.play.answerSent')
                    : t('games.common.send')}
                </Button>
              </Stack>
            )}

            {isRevealed && reveal && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('games.quiz.play.correctAnswer', { answer: reveal.correctAnswer })}
                </Typography>
                {reveal.answers.map((entry) => {
                  const isMe = entry.userId === user?._id;
                  return (
                    <Typography key={entry.userId} variant="body2" align="center">
                      {isMe ? t('games.common.you') : t('games.common.partner')}:{' '}
                      {entry.text ? (
                        t('games.quiz.play.answerLabel', {
                          text: entry.text,
                          points: entry.isCorrect ? entry.pointsEarned : 0,
                        })
                      ) : (
                        t('games.quiz.play.didNotAnswer')
                      )}
                    </Typography>
                  );
                })}
                <Typography variant="body1" align="center" sx={{ fontWeight: 700 }}>
                  {t('games.quiz.play.pointsForQuestionTotal', {
                    points: reveal.pointsAwardedTotal,
                  })}
                </Typography>
                <Button variant="contained" size="large" fullWidth onClick={handleDismissReveal} disabled={submitting}>
                  {t('games.quiz.play.backToBoard')}
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      )}

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default QuizGamePlayPage;
