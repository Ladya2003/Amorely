import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { formatGameWaitDuration } from '../../localization/gameHelpers';
import { getMinutesUntilUtcMidnight } from '../../utils/dailyReset';

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
  const { t } = useTranslation();
  const [minutesLeft, setMinutesLeft] = useState(() => getMinutesUntilUtcMidnight());

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateCountdown = () => {
      setMinutesLeft(getMinutesUntilUtcMidnight());
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(timerId);
  }, [open]);

  const countdown = formatGameWaitDuration(t, minutesLeft * 60);

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('games.dailyReset.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {gameName
            ? t('games.dailyReset.playedTodayNamed', { gameName })
            : t('games.dailyReset.playedTodayGeneric')}
          {t('games.dailyReset.timerHint')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('games.dailyReset.resetHint')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('games.dailyReset.untilReset')} <strong>{countdown}</strong>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          {t('games.dailyReset.understood')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default DailyResetInfoDialog;
