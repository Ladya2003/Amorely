import React from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import type { CategoryResults } from './types';
import {
  getSimilarityRingSx,
  getResultItemSx,
} from './dailyQuestionsStyles';

interface CategoryResultsViewProps {
  results: CategoryResults;
  onNotifyPartner: () => void;
  notifyLoading?: boolean;
  notifySent?: boolean;
  readOnly?: boolean;
}

const CategoryResultsView: React.FC<CategoryResultsViewProps> = ({
  results,
  onNotifyPartner,
  notifyLoading,
  notifySent,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box>
      {results.bothCompleted && results.similarity !== null && (
        <Box sx={getSimilarityRingSx(theme, results.similarity)}>
          {results.similarity}%
        </Box>
      )}

      {results.bothCompleted && results.similarity !== null && (
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          {t('dailyQuestions.similarityLabel')}
        </Typography>
      )}

      {!readOnly && !results.partnerCompleted && results.userCompleted && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {t('dailyQuestions.partnerNotFinished')}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<NotificationsActiveOutlinedIcon />}
            onClick={onNotifyPartner}
            disabled={notifyLoading || notifySent}
            sx={{ textTransform: 'none' }}
          >
            {notifySent
              ? t('dailyQuestions.notifySent')
              : t('dailyQuestions.notifyPartner')}
          </Button>
        </Box>
      )}

      {results.items.map((item) => (
        <Box key={item.questionId} sx={getResultItemSx(theme, item.isMatch)}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            {item.questionText}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            {t('dailyQuestions.yourAnswer')}: {item.userAnswerLabel || '—'}
          </Typography>
          {item.partnerAnswerLabel ? (
            <Typography variant="body2">
              {t('dailyQuestions.partnerAnswer')}: {item.partnerAnswerLabel}
              {item.isMatch === true && ' ✓'}
              {item.isMatch === false && ' ✗'}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {t('dailyQuestions.partnerNoAnswer')}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CategoryResultsView;
