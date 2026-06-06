import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  formatDailyResetCountdown,
  getMinutesUntilUtcMidnight,
} from '../../utils/dailyReset';

interface DailyResetBadgeProps {
  sx?: object;
  onClick?: (event: React.MouseEvent) => void;
}

const DailyResetBadge: React.FC<DailyResetBadgeProps> = ({ sx, onClick }) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(() =>
    formatDailyResetCountdown(getMinutesUntilUtcMidnight())
  );

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatDailyResetCountdown(getMinutesUntilUtcMidnight()));
    };

    const timerId = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <Box
      component={onClick ? 'button' : 'div'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={onClick ? t('games.dailyReset.badgeAria') : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        ...(onClick
          ? {
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }
          : {}),
        ...sx,
      }}
    >
      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
      >
        {countdown}
      </Typography>
    </Box>
  );
};

export default DailyResetBadge;
