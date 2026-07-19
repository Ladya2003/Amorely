import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { useTranslation } from 'react-i18next';
import CategoryCard from './CategoryCard';
import CategoryFlowDialog from './CategoryFlowDialog';
import CategoryResultsView from './CategoryResultsView';
import HistoryDialog from './HistoryDialog';
import CountdownTimer from './CountdownTimer';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import { DialogContent, DialogTitle } from '@mui/material';
import type { CategoryResults, CategoryStatus, DailyQuestionsState } from './types';
import {
  fetchDailyQuestions,
  fetchCategoryResults,
  notifyPartnerDailyQuestions,
} from '../../../services/dailyQuestionsService';
import { PARTNER_CHANGED_EVENT } from '../../../hooks/useRelationship';
import {
  getDailyQuestionsPaperSx,
  getDailyQuestionsHeaderSx,
  getDailyQuestionsCardsRowSx,
  getCategoryTimerSx,
} from './dailyQuestionsStyles';

const DailyQuestionsSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [state, setState] = useState<DailyQuestionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [flowCategoryId, setFlowCategoryId] = useState<string | null>(null);
  const [resultsCategoryId, setResultsCategoryId] = useState<string | null>(null);
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
  }, [loadState]);

  useEffect(() => {
    const handlePartnerChanged = () => {
      void loadState();
    };
    window.addEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
    return () => window.removeEventListener(PARTNER_CHANGED_EVENT, handlePartnerChanged);
  }, [loadState]);

  const openResults = async (categoryId: string) => {
    setResultsCategoryId(categoryId);
    setResultsLoading(true);
    setNotifySent(false);
    try {
      const data = await fetchCategoryResults(categoryId);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleNotifyPartner = async () => {
    if (!resultsCategoryId) return;
    setNotifyLoading(true);
    try {
      await notifyPartnerDailyQuestions(resultsCategoryId);
      setNotifySent(true);
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={getDailyQuestionsPaperSx(theme)}>
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} />
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
          <Typography variant="h6" fontWeight={700}>
            {t('dailyQuestions.title')}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setHistoryOpen(true)}
            aria-label={t('dailyQuestions.historyTitle')}
            sx={{ color: 'text.secondary' }}
          >
            <HistoryOutlinedIcon />
          </IconButton>
        </Box>

        {showNextRoundTimer && state.bothCompletedAllAt && (
          <Box mb={2} textAlign="center">
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              {t('dailyQuestions.nextRoundIn')}
            </Typography>
            <CountdownTimer
              startedAt={state.bothCompletedAllAt}
              sx={getCategoryTimerSx(theme)}
            />
          </Box>
        )}

        <Box sx={getDailyQuestionsCardsRowSx()}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onOpen={() => setFlowCategoryId(cat.id)}
              onResults={() => void openResults(cat.id)}
            />
          ))}
        </Box>
      </Paper>

      <CategoryFlowDialog
        open={Boolean(flowCategoryId)}
        categoryId={flowCategoryId}
        onClose={() => setFlowCategoryId(null)}
        onComplete={() => void loadState()}
      />

      <ResponsiveDialog
        open={Boolean(resultsCategoryId)}
        onClose={() => {
          setResultsCategoryId(null);
          setResults(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {results ? `${results.emoji} ${results.title}` : t('dailyQuestions.results')}
        </DialogTitle>
        <DialogContent>
          {resultsLoading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          )}
          {!resultsLoading && results && (
            <CategoryResultsView
              results={results}
              onNotifyPartner={() => void handleNotifyPartner()}
              notifyLoading={notifyLoading}
              notifySent={notifySent}
            />
          )}
        </DialogContent>
      </ResponsiveDialog>

      <HistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default DailyQuestionsSection;
