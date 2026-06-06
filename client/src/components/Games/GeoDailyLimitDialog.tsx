import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { formatGameWaitDuration } from '../../localization/gameHelpers';

interface GeoDailyLimitDialogProps {
  open: boolean;
  onClose: () => void;
  maxRoundsPerDay: number;
  secondsUntilNextRounds: number;
}

const GeoDailyLimitDialog: React.FC<GeoDailyLimitDialogProps> = ({
  open,
  onClose,
  maxRoundsPerDay,
  secondsUntilNextRounds: initialSeconds,
}) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds, open]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [open, secondsLeft]);

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('games.geoDailyLimit.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('games.geoDailyLimit.body', { count: maxRoundsPerDay })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('games.geoDailyLimit.nextAvailable')}{' '}
          <strong>{formatGameWaitDuration(t, secondsLeft)}</strong>.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          {t('games.geoDailyLimit.understood')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default GeoDailyLimitDialog;
