import React, { useEffect, useState } from 'react';
import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  formatDailyResetCountdown,
  getMinutesUntilUtcMidnight,
} from '../../utils/dailyReset';

interface DailyResetInfoDialogProps {
  open: boolean;
  onClose: () => void;
  gameName?: string;
}

const DailyResetInfoDialog: React.FC<DailyResetInfoDialogProps> = ({
  open,
  onClose,
  gameName,
}) => {
  const [countdown, setCountdown] = useState(() =>
    formatDailyResetCountdown(getMinutesUntilUtcMidnight())
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateCountdown = () => {
      setCountdown(formatDailyResetCountdown(getMinutesUntilUtcMidnight()));
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(timerId);
  }, [open]);

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Таймер сброса</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {gameName
            ? `Вы уже играли в «${gameName}» сегодня. `
            : 'Вы уже играли в эту игру сегодня. '}
          Таймер показывает, сколько осталось до обновления дневного лимита.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Лимит сбрасывается в 03:00 по Москве (00:00 UTC). После этого можно снова играть.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          До сброса: <strong>{countdown}</strong>
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

export default DailyResetInfoDialog;
