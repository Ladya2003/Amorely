import React, { useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyBadge from '../../Pets/CurrencyBadge';
import CurrencyCoinIcon from '../../Pets/CurrencyCoinIcon';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import { BoltIcon } from '../../UI/icons';
import { purchaseDailyQuestionsSpeedup } from '../../../services/dailyQuestionsService';
import { emitCurrencyUpdated } from '../../../utils/currencyEvents';
import { getSpeedupActiveChipSx, getSpeedupChipSx } from './dailyQuestionsStyles';
import type { DailyQuestionsState } from './types';

interface SpeedupButtonProps {
  fastRotation: boolean;
  cost: number;
  balance: number;
  onUnlocked: (state: DailyQuestionsState) => void;
}

const SpeedupButton: React.FC<SpeedupButtonProps> = ({
  fastRotation,
  cost,
  balance,
  onUnlocked,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAfford = balance >= cost;

  const handleOpen = () => {
    setError(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    if (submitting) return;
    setDialogOpen(false);
    setError(null);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await purchaseDailyQuestionsSpeedup();
      emitCurrencyUpdated(data.balance, 0);
      onUnlocked(data);
      setDialogOpen(false);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409 && axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as DailyQuestionsState;
        emitCurrencyUpdated(data.balance, 0);
        onUnlocked(data);
        setDialogOpen(false);
        return;
      }
      if (status === 402) {
        setError(null);
      } else {
        setError(t('dailyQuestions.speedupError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (fastRotation) {
    return (
      <Box
        sx={getSpeedupActiveChipSx(theme)}
        aria-label={t('dailyQuestions.speedupActiveAria')}
      >
        <BoltIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1, whiteSpace: 'nowrap' }}>
          {t('dailyQuestions.speedupLabel')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
        aria-label={t('dailyQuestions.speedupCostAria', { cost })}
        sx={getSpeedupChipSx(theme, true)}
      >
        <BoltIcon sx={{ fontSize: 16 }} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {t('dailyQuestions.speedupLabel')}
        </Typography>
      </Box>

      <ResponsiveDialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box component="span" sx={{ minWidth: 0 }}>
            {t('dailyQuestions.speedupDialogTitle')}
          </Box>
          <CurrencyBadge balance={balance} size="small" variant="tinted" />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('dailyQuestions.speedupDialogBody')}
          </Typography>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleConfirm()}
            disabled={submitting || !canAfford}
            startIcon={<CurrencyCoinIcon size={20} />}
          >
            {t('dailyQuestions.speedupConfirm', { cost })}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default SpeedupButton;
