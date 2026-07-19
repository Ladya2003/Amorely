import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import { fetchDailyQuestionsHistory } from '../../../services/dailyQuestionsService';
import type { HistoryEntry } from './types';
import { getHistoryRoundSx } from './dailyQuestionsStyles';

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDailyQuestionsHistory();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadHistory();
  }, [open, loadHistory]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('dailyQuestions.historyTitle')}</DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!loading && history.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            {t('dailyQuestions.historyEmpty')}
          </Typography>
        )}

        {!loading &&
          history.map((round) => (
            <Box key={round.roundKey} sx={(theme) => getHistoryRoundSx(theme)}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {formatDate(round.archivedAt)}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {round.categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={
                      cat.similarity !== null
                        ? `${cat.emoji} ${cat.title} — ${cat.similarity}%`
                        : `${cat.emoji} ${cat.title}`
                    }
                    size="small"
                    variant="outlined"
                    color={
                      cat.similarity !== null && cat.similarity >= 75
                        ? 'success'
                        : cat.similarity !== null
                          ? 'default'
                          : 'default'
                    }
                  />
                ))}
              </Box>
            </Box>
          ))}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default HistoryDialog;
