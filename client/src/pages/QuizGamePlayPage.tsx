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
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import {
  getGamePlayBlockedCardSx,
  getGamePlayBlockedPanelSx,
  getGamePlayBoardHiddenSx,
  getGamePlayBoardWrapSx,
  getGamePlayCenterCardSx,
  getGamePlayCenterPanelSx,
  getGamePlayContentSx,
  getGamePlayCountdownSx,
  getGamePlayHeaderIconButtonSx,
  getGamePlayHeaderSx,
  getGamePlayHeaderSubtitleSx,
  getGamePlayHeaderTitleSx,
  getGamePlayHintCardSx,
  getGamePlayLoadingWrapSx,
  getGamePlayOverlaySx,
  getGamePlayPrimaryButtonSx,
  getGamePlayQuizCellButtonSx,
  getGamePlayReadyDotSx,
  getGamePlayReadyLabelSx,
  getGamePlayRootSx,
  getGamePlayTimerBarSx,
  getGamePlayTimerProgressSx,
  getGamePlayTimerTextSx,
  getGamePlayTurnBannerSx,
} from '../components/Games/gamePlayPageStyles';
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
import {
  GAME_TIMER_LOW_THRESHOLD,
  playRoundFailureSound,
  playRoundSuccessSound,
  playGameReadySound,
  playNextRoundSound,
  unlockGameAudio,
  useLobbyCountdownSound,
  useRoundTimerSound,
} from '../utils/gameSounds';
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
  const theme = useTheme();
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
        void playRoundSuccessSound();
      } else {
        void playRoundFailureSound();
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
  }, [applyState, t]);

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
  }, [user?._id, applyState, t]);

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

  useLobbyCountdownSound(
    lobbySecondsLeft,
    Boolean(state?.inLobby),
    Boolean(state?.currentQuestion && !state.inLobby)
  );
  useRoundTimerSound(questionSecondsLeft, state?.currentQuestion?.status === 'answering');

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
  }, [state?.currentQuestion, applyState]);

  const handleReady = async () => {
    unlockGameAudio();
    void playGameReadySound();
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

    unlockGameAudio();
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
    unlockGameAudio();
    void playNextRoundSound();
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
          <Button variant="contained" sx={getGamePlayPrimaryButtonSx()} onClick={() => navigate('/settings')}>
            {t('games.common.goToSettings')}
          </Button>
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
          <Button onClick={() => navigate(QUIZ_GAME_INFO_PATH)}>{t('games.common.back')}</Button>
        </Box>
      </Box>
    );
  }

  if (state.onCooldown) {
    return (
      <Box sx={getGamePlayRootSx(theme)}>
        <Box sx={getGamePlayHeaderSx(theme)}>
          <IconButton
            sx={getGamePlayHeaderIconButtonSx(theme)}
            onClick={() => navigate(QUIZ_GAME_INFO_PATH)}
            aria-label={t('games.common.back')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={getGamePlayHeaderTitleSx()}>{t('games.quiz.name')}</Typography>
        </Box>
        <Box sx={getGamePlayCenterPanelSx(theme)}>
          <Box sx={getGamePlayCenterCardSx(theme)}>
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
      </Box>
    );
  }

  if (state.inLobby) {
    const myUserId = user?._id;
    const isMeReady = Boolean(myUserId && state.readyUserIds.includes(myUserId));
    const isPartnerReady = state.readyUserIds.some((id) => id !== myUserId);
    const isCountdownActive = lobbySecondsLeft > 0;

    return (
      <Box sx={getGamePlayRootSx(theme)}>
        <Box sx={getGamePlayHeaderSx(theme)}>
          <IconButton
            sx={getGamePlayHeaderIconButtonSx(theme)}
            onClick={() => navigate(QUIZ_GAME_INFO_PATH)}
            aria-label={t('games.common.back')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={getGamePlayHeaderTitleSx()}>{t('games.quiz.name')}</Typography>
        </Box>
        <Box sx={getGamePlayCenterPanelSx(theme)}>
          <Box sx={getGamePlayCenterCardSx(theme)}>
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
            <Stack direction="row" spacing={4} sx={{ mb: 4, justifyContent: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <Box
                  component="button"
                  type="button"
                  onClick={handleReady}
                  disabled={isMeReady || submitting || isCountdownActive}
                  aria-label={isMeReady ? t('games.common.youReadyAria') : t('games.common.confirmReadyAria')}
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
              <Typography sx={getGamePlayCountdownSx()}>{lobbySecondsLeft}</Typography>
            ) : (
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
            )}
          </Box>
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
  const isTimeLow = isAnswering && questionSecondsLeft <= GAME_TIMER_LOW_THRESHOLD;
  const timeProgress = question
    ? Math.max(0, Math.min(100, (questionSecondsLeft / state.questionTimeSec) * 100))
    : 0;

  return (
    <Box sx={getGamePlayRootSx(theme)}>
      <Box
        sx={question ? getGamePlayBoardHiddenSx() : undefined}
        aria-hidden={Boolean(question)}
      >
        <Box sx={getGamePlayHeaderSx(theme)}>
          <IconButton
            sx={getGamePlayHeaderIconButtonSx(theme)}
            onClick={() => navigate(QUIZ_GAME_INFO_PATH)}
            aria-label={t('games.common.back')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={getGamePlayHeaderTitleSx()}>{t('games.quiz.name')}</Typography>
            <Typography component="span" sx={getGamePlayHeaderSubtitleSx()}>
              {t('games.quiz.play.scoreRemaining', {
                score: state.totalScore,
                count: state.cellsRemaining,
              })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ ...getGamePlayContentSx(), p: 1 }}>
          {!state.currentQuestion && (
            <Typography component="div" sx={getGamePlayTurnBannerSx(theme, state.isMyTurnToPick)}>
              {state.isMyTurnToPick
                ? t('games.quiz.play.yourTurnPick')
                : t('games.quiz.play.partnerTurnPick')}
            </Typography>
          )}
          <Box sx={getGamePlayBoardWrapSx(theme)}>
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
                          sx={getGamePlayQuizCellButtonSx(theme, used)}
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
        </Box>
      </Box>

      {question && (
        <Box sx={getGamePlayOverlaySx(theme)}>
          {isAnswering && (
            <Box sx={getGamePlayTimerBarSx(theme)}>
              <Typography component="span" sx={getGamePlayTimerTextSx(isTimeLow)}>
                {t('games.common.secondsLeft', { seconds: questionSecondsLeft })}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={timeProgress}
                color={isTimeLow ? 'error' : 'primary'}
                sx={getGamePlayTimerProgressSx()}
              />
            </Box>
          )}

          <Box sx={{ ...getGamePlayContentSx(), display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" color="primary.main">
              {question.categoryName} · {question.points}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, flex: 1 }}>
              {question.questionText}
            </Typography>

            {question.showLoveLanguagesHint && (
              <Box sx={getGamePlayHintCardSx(theme)}>
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
                  sx={getGamePlayPrimaryButtonSx()}
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
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={getGamePlayPrimaryButtonSx()}
                  onClick={handleDismissReveal}
                  disabled={submitting}
                >
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
