import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const QUIZ_GAME_INFO_PATH = '/chat/games/quiz';
const POINT_TIERS = [100, 200, 300];

const formatCooldown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
};

const QuizGamePlayPage: React.FC = () => {
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

  const loadState = useCallback(async () => {
    try {
      const data = await fetchQuizGameState();
      applyState(data.state);
    } catch (error: any) {
      if (error?.response?.data?.code === 'NO_PARTNER') {
        setBlockedReason(
          error.response.data.error || 'Для игры нужен партнёр. Добавьте его в настройках профиля.'
        );
        return;
      }
      setToast({ open: true, message: 'Не удалось загрузить игру', severity: 'error' });
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
        setBlockedReason(payload.message || 'Для игры нужен партнёр.');
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
            socket.emit('quiz_game_sync');
          } else {
            syncQuizGameState().then((data) => applyState(data.state));
          }
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [state?.inLobby, state?.lobbySecondsRemaining, applyState]);

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
        message: error?.response?.data?.error || 'Не удалось подтвердить готовность',
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
        message: error?.response?.data?.error || 'Не удалось открыть вопрос',
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
        message: error?.response?.data?.error || 'Не удалось отправить ответ',
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
        <Button variant="contained" onClick={() => navigate('/settings')}>
          Перейти в настройки
        </Button>
      </Box>
    );
  }

  if (!state) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Не удалось загрузить игру
        </Typography>
        <Button onClick={() => navigate(QUIZ_GAME_INFO_PATH)}>Назад</Button>
      </Box>
    );
  }

  if (state.onCooldown) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label="Назад">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Своя игра
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
            Поле пройдено!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Счёт пары: {state.totalScore}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Новые вопросы через {formatCooldown(state.cooldownSecondsRemaining)}
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
          <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label="Назад">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Своя игра
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
            Счёт пары: {state.totalScore}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {isCountdownActive
              ? 'Оба готовы — поле откроется одновременно.'
              : 'Нажмите «Готов». Раунд стартует, когда оба партнёра на месте.'}
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
              {isMeReady ? 'Ждём партнёра…' : 'Готов'}
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
        <IconButton onClick={() => navigate(QUIZ_GAME_INFO_PATH)} aria-label="Назад">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Своя игра
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Счёт: {state.totalScore} · Осталось вопросов: {state.cellsRemaining}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
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
                        disabled={used || submitting || Boolean(state.currentQuestion)}
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
                Осталось {questionSecondsLeft} сек
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

            {isAnswering && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {question.myAnswerSubmitted
                    ? 'Ваш ответ отправлен. Ждём партнёра…'
                    : question.partnerAnswerSubmitted
                      ? 'Партнёр уже ответил. Ваш ход!'
                      : 'Каждый отвечает один раз до конца таймера'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ваш ответ"
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
                  {question.myAnswerSubmitted ? 'Ответ отправлен' : 'Отправить'}
                </Button>
              </Stack>
            )}

            {isRevealed && reveal && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Правильный ответ: <strong>{reveal.correctAnswer}</strong>
                </Typography>
                {reveal.answers.map((entry) => {
                  const isMe = entry.userId === user?._id;
                  return (
                    <Typography key={entry.userId} variant="body2" align="center">
                      {isMe ? 'Вы' : 'Партнёр'}:{' '}
                      {entry.text ? (
                        <>
                          «{entry.text}» — {entry.isCorrect ? `+${entry.pointsEarned}` : '0'} очков
                        </>
                      ) : (
                        <>не ответили</>
                      )}
                    </Typography>
                  );
                })}
                <Typography variant="body1" align="center" sx={{ fontWeight: 700 }}>
                  За вопрос: +{reveal.pointsAwardedTotal} очков
                </Typography>
                <Button variant="contained" size="large" fullWidth onClick={handleDismissReveal} disabled={submitting}>
                  К полю
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
