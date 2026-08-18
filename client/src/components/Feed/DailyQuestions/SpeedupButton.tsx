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
        setError(t('dailyQuestions.speedupInsufficient', { cost }));
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
            display: { xs: 'none', sm: 'inline' },
          }}
        >
          {t('dailyQuestions.speedupLabel')}
        </Typography>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
          <CurrencyCoinIcon size={18} />
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              lineHeight: 1,
              fontSize: '0.95rem',
              fontVariantNumeric: 'tabular-nums',
              color: theme.palette.mode === 'light' ? '#5A1A52' : '#FFE082',
            }}
          >
            {cost}
          </Typography>
        </Box>
      </Box>

      <ResponsiveDialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t('dailyQuestions.speedupDialogTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('dailyQuestions.speedupDialogBody')}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              mt: 2,
              px: 1.25,
              py: 0.75,
              borderRadius: 999,
              bgcolor: (chipTheme) =>
                chipTheme.palette.mode === 'light'
                  ? 'rgba(255, 215, 0, 0.14)'
                  : 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.28)',
            }}
          >
            <CurrencyCoinIcon size={20} />
            <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {cost}
            </Typography>
          </Box>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {error}
            </Typography>
          )}
          {!canAfford && !error && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {t('dailyQuestions.speedupInsufficient', { cost })}
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
          >
            {t('dailyQuestions.speedupConfirm', { cost })}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </>
  );
};

export default SpeedupButton;
