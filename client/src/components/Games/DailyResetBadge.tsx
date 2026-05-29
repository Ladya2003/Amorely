import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  formatDailyResetCountdown,
  getMinutesUntilUtcMidnight,
} from '../../utils/dailyReset';

interface DailyResetBadgeProps {
  sx?: object;
}

const DailyResetBadge: React.FC<DailyResetBadgeProps> = ({ sx }) => {
  const countdown = formatDailyResetCountdown(getMinutesUntilUtcMidnight());

  return (
    <Box
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
