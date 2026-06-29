import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatGameWaitDuration } from '../../localization/gameHelpers';
import { getMinutesUntilUtcMidnight } from '../../utils/dailyReset';
import { getDailyResetBadgeSx, getDailyResetBadgeTextSx } from './gamePlayPageStyles';

interface DailyResetBadgeProps {
  sx?: object;
  onClick?: (event: React.MouseEvent) => void;
}

const DailyResetBadge: React.FC<DailyResetBadgeProps> = ({ sx, onClick }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [minutesLeft, setMinutesLeft] = useState(() => getMinutesUntilUtcMidnight());

  useEffect(() => {
    const updateCountdown = () => {
      setMinutesLeft(getMinutesUntilUtcMidnight());
    };

    const timerId = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  const countdown = formatGameWaitDuration(t, minutesLeft * 60);

  return (
    <Box
      component={onClick ? 'button' : 'div'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={onClick ? t('games.dailyReset.badgeAria') : undefined}
      sx={{
        ...getDailyResetBadgeSx(theme),
        ...(onClick ? {} : { cursor: 'default', '&:hover': {} }),
        ...sx,
      }}
    >
      <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography component="span" sx={getDailyResetBadgeTextSx()}>
        {countdown}
      </Typography>
    </Box>
  );
};

export default DailyResetBadge;
