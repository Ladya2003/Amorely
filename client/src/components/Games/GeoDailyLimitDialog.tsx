import React, { useEffect, useState } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';

const formatWaitDuration = (seconds: number) => {
  if (seconds <= 0) {
    return 'скоро';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  if (minutes > 0) {
    return `${minutes} мин`;
  }
  return 'меньше минуты';
};

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
      <DialogTitle>На сегодня всё</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Каждый день можно угадать не больше {maxRoundsPerDay} мест. Вы уже прошли все раунды на
          сегодня.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Следующие места будут доступны через{' '}
          <strong>{formatWaitDuration(secondsLeft)}</strong>.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Понятно
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default GeoDailyLimitDialog;
