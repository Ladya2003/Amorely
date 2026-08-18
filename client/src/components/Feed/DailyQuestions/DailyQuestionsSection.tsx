import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CategoryCard from './CategoryCard';
import CategoryFlowDialog from './CategoryFlowDialog';
import CategoryResultsView from './CategoryResultsView';
import { CategoryResultsSkeleton } from './DailyQuestionsDialogSkeletons';
import HistoryDialog from './HistoryDialog';
import CountdownTimer from './CountdownTimer';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import type { CategoryResults, CategoryStatus, DailyQuestionsState } from './types';
import {
  fetchDailyQuestions,
  fetchCategoryResults,
  fetchHistoricalCategoryResults,
  notifyPartnerDailyQuestions,
  submitDailyAnswer,
} from '../../../services/dailyQuestionsService';
import { PARTNER_CHANGED_EVENT } from '../../../hooks/useRelationship';
import { usePartnerId } from '../../../hooks/usePartnerId';
import { CURRENCY_UPDATED_EVENT } from '../../../utils/currencyEvents';
import { SURFACE_BORDER_RADIUS } from '../../../theme/surfaceStyles';
import {
  getDailyQuestionsPaperSx,
  getDailyQuestionsHeaderSx,
  getDailyQuestionsHeaderActionsSx,
  getDailyQuestionsCardsRowSx,
  getCategoryTimerSx,
} from './dailyQuestionsStyles';
import { CloseIcon, HistoryOutlinedIcon } from '../../UI/icons';
import SpeedupButton from './SpeedupButton';

const DailyQuestionsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const partnerId = usePartnerId();
  const [state, setState] = useState<DailyQuestionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [flowCategoryId, setFlowCategoryId] = useState<string | null>(null);
  const [resultsCategoryId, setResultsCategoryId] = useState<string | null>(null);
  const [resultsRoundKey, setResultsRoundKey] = useState<string | null>(null);
  const [results, setResults] = useState<CategoryResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchDailyQuestions();
      setState(data);
    } catch {
      setState({ hasPartner: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState, i18n.language]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      void loadState();
    };
    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    return () => window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
  }, [loadState]);

  useEffect(() => {
    const handleCurrencyUpdated = (event: Event) => {
      const balance = (event as CustomEvent<{ balance?: number }>).detail?.balance;
      if (typeof balance !== 'number') return;
      setState((prev) => (prev ? { ...prev, balance } : prev));
    };
    window.addEventListener(CURRENCY_UPDATED_EVENT, handleCurrencyUpdated);
    return () => window.removeEventListener(CURRENCY_UPDATED_EVENT, handleCurrencyUpdated);
  }, []);

  const openResults = useCallback(async (categoryId: string, roundKey?: string | null) => {
    setResultsCategoryId(categoryId);
    setResultsRoundKey(roundKey ?? null);
    setResults(null);
    setResultsLoading(true);
    setNotifySent(false);
    try {
      const data = roundKey
        ? await fetchHistoricalCategoryResults(roundKey, categoryId)
        : await fetchCategoryResults(categoryId);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const handleFlowClose = useCallback(() => {
    setFlowCategoryId(null);
  }, []);

  const handleFlowComplete = useCallback(() => {
    void loadState();
  }, [loadState]);

  const handleShowResults = useCallback((categoryId: string) => {
    void openResults(categoryId);
  }, [openResults]);

  const handleEditAnswer = async (questionId: string, value: string) => {
    if (!resultsCategoryId || resultsRoundKey) return null;

    await submitDailyAnswer(resultsCategoryId, questionId, value);
    const updated = await fetchCategoryResults(resultsCategoryId);
    setResults(updated);
    void loadState();
    return updated;
  };

  const handleNotifyPartner = async () => {
    if (!resultsCategoryId || resultsRoundKey) return;
    setNotifyLoading(true);
    try {
      await notifyPartnerDailyQuestions(resultsCategoryId);
      setNotifySent(true);
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) {
    // Без партнёра секция скрыта — не резервируем место, чтобы не прыгала вёрстка
    if (!partnerId) {
      return null;
    }

    return (
      <Paper elevation={0} sx={getDailyQuestionsPaperSx(theme)} aria-busy="true">
        <Box sx={getDailyQuestionsHeaderSx()}>
          <Skeleton variant="text" width={180} height={32} animation="wave" />
          <Box sx={getDailyQuestionsHeaderActionsSx()}>
            <Skeleton variant="rounded" width={72} height={32} animation="wave" sx={{ borderRadius: 999 }} />
            <Skeleton variant="circular" width={32} height={32} animation="wave" />
          </Box>
        </Box>
        <Box sx={getDailyQuestionsCardsRowSx()}>
          {[0, 1, 2].map((key) => (
            <Skeleton
              key={key}
              variant="rounded"
              animation="wave"
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                minHeight: 140,
                borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.85)}px`,
              }}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  if (!state?.hasPartner || !state.categories?.length) {
    return null;
  }

  const categories: CategoryStatus[] = state.categories;
  const showNextRoundTimer =
    Boolean(state.bothCompletedAllAt) &&
    state.msUntilNextRound != null &&
    state.msUntilNextRound > 0;

  return (
    <>
      <Paper elevation={0} sx={getDailyQuestionsPaperSx(theme)}>
        <Box sx={getDailyQuestionsHeaderSx()}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              flex: '1 1 8rem',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t('dailyQuestions.title')}
          </Typography>
          <Box sx={getDailyQuestionsHeaderActionsSx()}>
            <SpeedupButton
              fastRotation={Boolean(state.fastRotation)}
              cost={state.speedupCost ?? 350}
              balance={state.balance ?? 0}
              onUnlocked={setState}
            />
            <IconButton
              size="small"
              onClick={() => setHistoryOpen(true)}
              aria-label={t('dailyQuestions.historyTitle')}
              sx={{ color: 'text.secondary' }}
            >
              <HistoryOutlinedIcon />
            </IconButton>
          </Box>
        </Box>

        {showNextRoundTimer && state.bothCompletedAllAt && (
          <Box mb={2} textAlign="center">
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              {t('dailyQuestions.nextRoundIn')}
            </Typography>
            <CountdownTimer
              startedAt={state.bothCompletedAllAt}
              endsAt={state.nextRoundAt}
              durationMs={state.rotationMs}
              sx={getCategoryTimerSx(theme)}
              onExpire={loadState}
            />
          </Box>
        )}

        <Box sx={getDailyQuestionsCardsRowSx()}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              nextRoundAt={showNextRoundTimer ? state.nextRoundAt : null}
              rotationMs={state.rotationMs}
              onOpen={() => {
                if (cat.userCompleted) {
                  void openResults(cat.id);
                } else {
                  setFlowCategoryId(cat.id);
                }
              }}
              onResults={() => void openResults(cat.id)}
            />
          ))}
        </Box>
      </Paper>

      <CategoryFlowDialog
        open={Boolean(flowCategoryId)}
        categoryId={flowCategoryId}
        onClose={handleFlowClose}
        onComplete={handleFlowComplete}
        onShowResults={handleShowResults}
      />

      <ResponsiveDialog
        open={Boolean(resultsCategoryId)}
        onClose={() => {
          setResultsCategoryId(null);
          setResultsRoundKey(null);
          setResults(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
            {results ? (
              `${results.emoji} ${results.title}`
            ) : resultsLoading ? (
              <Skeleton variant="text" animation="wave" width="50%" height={28} />
            ) : (
              t('dailyQuestions.results')
            )}
          </Box>
          <IconButton
            onClick={() => {
              setResultsCategoryId(null);
              setResultsRoundKey(null);
              setResults(null);
            }}
            size="small"
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {resultsLoading && <CategoryResultsSkeleton />}
          {!resultsLoading && results && (
            <CategoryResultsView
              results={results}
              onNotifyPartner={() => void handleNotifyPartner()}
              onEditAnswer={handleEditAnswer}
              notifyLoading={notifyLoading}
              notifySent={notifySent}
              readOnly={Boolean(resultsRoundKey)}
            />
          )}
        </DialogContent>
      </ResponsiveDialog>

      <HistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onOpenCategoryResults={(roundKey, categoryId) => {
          void openResults(categoryId, roundKey);
        }}
      />
    </>
  );
};

export default DailyQuestionsSection;
