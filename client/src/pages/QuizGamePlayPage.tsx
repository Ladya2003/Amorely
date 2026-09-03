import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import GameLobbyRemindButton from '../components/Games/GameLobbyRemindButton';
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
  getGamePlayLoadingWrapSx,
  getGamePlayOverlaySx,
  getGamePlayPrimaryButtonSx,
  getGamePlayCenteredBodySx,
  getGamePlayQuizCellButtonSx,
  getGamePlayQuizQuestionBodySx,
  getGamePlayQuizOptionButtonSx,
  type QuizOptionVisualState,
  getGamePlayReadyDotSx,
  getGamePlayReadyLabelSx,
  getGamePlayRootSx,
  getGamePlayTimerBarSx,
  getGamePlayTimerProgressSx,
  getGamePlayTimerTextSx,
  getGamePlayTurnBannerSx,
} from '../components/Games/gamePlayPageStyles';
import GameFrame from '../components/Games/GameFrame';
import BrandLoader from '../components/common/BrandLoader';
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
import { ArrowBackIcon } from '../components/UI/icons';

const QUIZ_GAME_INFO_PATH = '/chat/games/quiz';
const POINT_TIERS = [100, 200, 300];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const getQuizOptionVisualState = (
  optionId: string,
  isRevealed: boolean,
  myOptionId: string | null,
  partnerOptionId: string | null,
  correctOptionId?: string
): QuizOptionVisualState => {
  if (isRevealed) {
    if (optionId === correctOptionId) {
      return 'correct';
    }
    if (myOptionId === optionId || partnerOptionId === optionId) {
      return 'wrong';
    }
    return 'dimmed';
  }

  return myOptionId === optionId ? 'selected' : 'idle';
};

const QuizGamePlayPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<QuizGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lobbySecondsLeft, setLobbySecondsLeft] = useState(0);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(0);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'error' | 'success',
  });
  const prevQuestionStatusRef = useRef<string | null>(null);
  const revealedCellKeysRef = useRef<Set<string>>(new Set());
  const expireSyncRequestedRef = useRef(false);
  const lobbySyncRequestedRef = useRef(false);
  const lobbyExpireSyncDoneRef = useRef(false);
  const stateRef = useRef<QuizGameState | null>(null);
  const pickFallbackTimerRef = useRef<number | null>(null);

  const clearPickFallback = useCallback(() => {
    if (pickFallbackTimerRef.current != null) {
      window.clearTimeout(pickFallbackTimerRef.current);
      pickFallbackTimerRef.current = null;
    }
  }, []);

  const applyState = useCallback((nextState: QuizGameState) => {
    if (!nextState.sessionActive) {
      revealedCellKeysRef.current.clear();
    }

    const question = nextState.currentQuestion;
    const isStaleAnsweringAfterReveal =
      question?.status === 'answering' && revealedCellKeysRef.current.has(question.cellKey);

    if (isStaleAnsweringAfterReveal) {
      return;
    }

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
    if (question?.status === 'revealed') {
      revealedCellKeysRef.current.add(question.cellKey);
    }

    stateRef.current = nextState;
    setState(nextState);
    if (question) {
      clearPickFallback();
      setSubmitting(false);
    }

    if (!question) {
      setQuestionSecondsLeft(0);
      setSelectedOptionId(null);
      setLobbySecondsLeft(nextState.lobbySecondsRemaining);
      expireSyncRequestedRef.current = false;
      return;
    }

    setLobbySecondsLeft(0);
    setQuestionSecondsLeft(question.secondsRemaining);

    if (question.status === 'revealed') {
      setSelectedOptionId(null);
    } else {
      setSelectedOptionId(question.myOptionId);
    }
  }, [clearPickFallback]);

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

  const recoverQuizState = useCallback(async () => {
    try {
      const data = await fetchQuizGameState();
      applyState(data.state);
    } catch {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_sync');
      }
    }
  }, [applyState]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => () => clearPickFallback(), [clearPickFallback]);

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
      if (payload.code === 'QUESTION_ALREADY_ACTIVE') {
        clearPickFallback();
        void recoverQuizState().finally(() => {
          if (!stateRef.current?.currentQuestion) {
            setSubmitting(false);
          }
        });
        return;
      }
      clearPickFallback();
      setSubmitting(false);
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
  }, [user?._id, applyState, recoverQuizState, clearPickFallback, t]);

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
  const bothAnswersIn =
    Boolean(state?.currentQuestion?.myAnswerSubmitted) &&
    Boolean(state?.currentQuestion?.partnerAnswerSubmitted);
  useRoundTimerSound(
    questionSecondsLeft,
    state?.currentQuestion?.status === 'answering' && !bothAnswersIn
  );

  useEffect(() => {
    const question = state?.currentQuestion;
    if (
      !question ||
      question.status !== 'answering' ||
      (question.myAnswerSubmitted && question.partnerAnswerSubmitted)
    ) {
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
    if (submitting || stateRef.current?.currentQuestion) {
      return;
    }

    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_pick', { categoryId, points });
        clearPickFallback();
        pickFallbackTimerRef.current = window.setTimeout(() => {
          pickFallbackTimerRef.current = null;
          if (stateRef.current?.currentQuestion) {
            setSubmitting(false);
            return;
          }
          void recoverQuizState().finally(() => {
            if (!stateRef.current?.currentQuestion) {
              setSubmitting(false);
            }
          });
        }, 800);
        return;
      }

      const result = await postQuizPick(categoryId, points);
      applyState(result.state);
    } catch (error: any) {
      if (error?.response?.data?.code === 'QUESTION_ALREADY_ACTIVE') {
        await recoverQuizState();
        return;
      }
      setToast({
        open: true,
        message: error?.response?.data?.error || t('games.common.errors.pickFailed'),
        severity: 'error',
      });
    } finally {
      if (!socketService.getSocket()?.connected) {
        setSubmitting(false);
      }
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (selectedOptionId || state?.currentQuestion?.myAnswerSubmitted) {
      return;
    }

    unlockGameAudio();
    setSelectedOptionId(optionId);
    setSubmitting(true);
    try {
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('quiz_game_answer', { optionId });
      } else {
        const result = await postQuizAnswer(optionId);
        applyState(result.state);
      }
    } catch (error: any) {
      setSelectedOptionId(state?.currentQuestion?.myOptionId ?? null);
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
      <GameFrame>
      <Box sx={getGamePlayLoadingWrapSx()}>
        <BrandLoader />
      </Box>
    </GameFrame>
    );
  }

  if (blockedReason) {
    return (
      <GameFrame>
      <Box sx={getGamePlayBlockedPanelSx()}>
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
    </GameFrame>
    );
  }

  if (!state) {
    return (
      <GameFrame>
      <Box sx={getGamePlayBlockedPanelSx()}>
        <Box sx={getGamePlayBlockedCardSx(theme)}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('games.common.loadFailed')}
          </Typography>
          <Button onClick={() => navigate(QUIZ_GAME_INFO_PATH)}>{t('games.common.back')}</Button>
        </Box>
      </Box>
    </GameFrame>
    );
  }

  if (state.onCooldown) {
    return (
      <GameFrame>
      <Box sx={getGamePlayRootSx()}>
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
    </GameFrame>
    );
  }

  if (state.inLobby) {
    const myUserId = user?._id;
    const isMeReady = Boolean(myUserId && state.readyUserIds.includes(myUserId));
    const isPartnerReady = state.readyUserIds.some((id) => id !== myUserId);
    const isCountdownActive = lobbySecondsLeft > 0;

    return (
      <GameFrame>
      <Box sx={getGamePlayRootSx()}>
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
                  gameId="quiz"
                  visible={isMeReady && !isPartnerReady && !isCountdownActive}
                />
              </>
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
    </GameFrame>
    );
  }

  const categories = Array.from(
    new Map(state.boardCells.map((cell) => [cell.categoryId, cell.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const question = state.currentQuestion;
  const reveal = question?.reveal;
  const isAnswering = question?.status === 'answering';
  const isRevealed = question?.status === 'revealed';
  const bothAnswered = Boolean(question?.myAnswerSubmitted && question?.partnerAnswerSubmitted);
  const showQuestionTimer = isAnswering && !bothAnswered;
  const isTimeLow = showQuestionTimer && questionSecondsLeft <= GAME_TIMER_LOW_THRESHOLD;
  const timeProgress = question
    ? Math.max(0, Math.min(100, (questionSecondsLeft / state.questionTimeSec) * 100))
    : 0;

  return (
    <GameFrame>
    <Box sx={getGamePlayRootSx()}>
      <Box
        sx={{
          ...(question ? getGamePlayBoardHiddenSx() : {}),
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
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

        <Box sx={{ ...getGamePlayContentSx(), p: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={getGamePlayCenteredBodySx(560)}>
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
      </Box>

      {question && (
        <Box sx={getGamePlayOverlaySx(theme)}>
          {showQuestionTimer && (
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
            <Box sx={getGamePlayQuizQuestionBodySx()}>
            <Typography variant="overline" color="primary.main">
              {question.categoryName} · {question.points}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {question.questionText}
            </Typography>

            <Stack spacing={1.5} sx={{ mb: isRevealed ? 2 : 0 }}>
              {(question.options || []).map((option, index) => {
                const visualState = getQuizOptionVisualState(
                  option.id,
                  isRevealed,
                  selectedOptionId ?? question.myOptionId,
                  question.partnerOptionId,
                  reveal?.correctOptionId
                );
                const letter = OPTION_LETTERS[index] ?? String(index + 1);

                return (
                  <Button
                    key={option.id}
                    variant="outlined"
                    fullWidth
                    disabled={
                      isAnswering &&
                      (Boolean(selectedOptionId) || question.myAnswerSubmitted || submitting)
                    }
                    onClick={() => {
                      if (isAnswering) {
                        void handleSelectOption(option.id);
                      }
                    }}
                    sx={getGamePlayQuizOptionButtonSx(theme, visualState)}
                  >
                    {letter}. {option.text}
                  </Button>
                );
              })}
            </Stack>

            {isAnswering && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1.5 }}>
                {question.myAnswerSubmitted || selectedOptionId
                  ? t('games.quiz.play.answerSentWaiting')
                  : question.partnerAnswerSubmitted
                    ? t('games.quiz.play.partnerAnsweredYourTurn')
                    : t('games.quiz.play.oneAnswerUntilTimer')}
              </Typography>
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
        </Box>
      )}

      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  </GameFrame>
  );
};

export default QuizGamePlayPage;
