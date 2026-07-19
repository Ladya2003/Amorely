import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MS_24H = 24 * 60 * 60 * 1000;

interface CountdownTimerProps {
  startedAt: string;
  durationMs?: number;
  sx?: object;
}

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  startedAt,
  durationMs = MS_24H,
  sx,
}) => {
  const { t } = useTranslation();
  const target = new Date(startedAt).getTime() + durationMs;

  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (remaining <= 0) {
    return (
      <Typography variant="caption" sx={sx} color="text.secondary">
        {t('dailyQuestions.timerDone')}
      </Typography>
    );
  }

  return (
    <Typography variant="caption" sx={sx}>
      ⏱ {formatRemaining(remaining)}
    </Typography>
  );
};

export default CountdownTimer;
