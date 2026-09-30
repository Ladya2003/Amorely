import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { ArrowBackIcon } from '../UI/icons';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  FORTUNE_WHEEL_SPIN_DURATION_MS,
  playFortuneWheelResultSound,
  playFortuneWheelSpinStartSound,
  prepareFortuneWheelSounds,
  startFortuneWheelSpinTicks,
  stopFortuneWheelSpinTicks,
  unlockFortuneWheelAudio,
} from '../../utils/fortuneWheelSounds';
import {
  getFortuneWheelChallengeTitleSx,
  getFortuneWheelHeaderIconSx,
  getFortuneWheelHeaderSx,
  getFortuneWheelHintTextSx,
  getFortuneWheelSpinButtonSx,
  getFortuneWheelSpinContentSx,
  getFortuneWheelTitleSx,
  getFortuneWheelWheelStageSx,
} from './fortuneWheelStyles';
import {
  computeSpinDeltaRotation,
  getWinnerIndexFromRotation,
} from './fortuneWheelSpinMath';
import FortuneWheelWheel from './FortuneWheelWheel';

interface FortuneWheelSpinViewProps {
  title: string;
  tasks: string[];
  onBack: () => void;
}

const FortuneWheelSpinView: React.FC<FortuneWheelSpinViewProps> = ({ title, tasks, onBack }) => {
  const theme = useTheme();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultTask, setResultTask] = useState('');
  const rotationRef = useRef(rotation);

  rotationRef.current = rotation;

  const canSpin = tasks.length > 0 && !spinning;

  useEffect(
    () => () => {
      stopFortuneWheelSpinTicks();
    },
    []
  );

  const handleSpin = () => {
    if (!canSpin) {
      return;
    }

    const winnerIndex = Math.floor(Math.random() * tasks.length);
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const startRotation = rotationRef.current;
    const deltaRotation = computeSpinDeltaRotation(
      startRotation,
      winnerIndex,
      tasks.length,
      extraSpins
    );

    unlockFortuneWheelAudio();

    setSpinning(true);
    setResultOpen(false);
    setRotation(startRotation + deltaRotation);

    void prepareFortuneWheelSounds().then(() => {
      playFortuneWheelSpinStartSound();
      startFortuneWheelSpinTicks({
        segmentCount: tasks.length,
        startRotation,
        deltaRotation,
        durationMs: FORTUNE_WHEEL_SPIN_DURATION_MS,
      });
    });
  };

  const handleTransitionEnd = () => {
    if (!spinning) {
      return;
    }

    stopFortuneWheelSpinTicks();

    setSpinning(false);

    const winnerIndex = getWinnerIndexFromRotation(rotationRef.current, tasks.length);
    const winnerTask = tasks[winnerIndex];

    if (!winnerTask) {
      return;
    }

    playFortuneWheelResultSound();
    setResultTask(winnerTask);
    setResultOpen(true);
  };

  const handleCloseResult = () => {
    setResultOpen(false);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <Box sx={getFortuneWheelHeaderSx(theme)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onBack}
            aria-label="Назад"
            disabled={spinning}
            sx={getFortuneWheelHeaderIconSx()}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} sx={getFortuneWheelTitleSx()}>
            Колесо
          </Typography>
        </Box>
      </Box>

      <Box sx={getFortuneWheelSpinContentSx()}>
        <Typography variant="h5" fontWeight={800} sx={getFortuneWheelChallengeTitleSx()}>
          {title.trim() || 'Колесо фортуны'}
        </Typography>

        <Box sx={getFortuneWheelWheelStageSx()}>
          <FortuneWheelWheel
            tasks={tasks}
            rotation={rotation}
            spinning={spinning}
            onTransitionEnd={handleTransitionEnd}
          />
        </Box>

        {tasks.length === 0 ? (
          <Typography sx={getFortuneWheelHintTextSx()}>
            Добавьте задания через кнопку «Задания», чтобы крутить колесо.
          </Typography>
        ) : null}

        <Button
          variant="contained"
          size="large"
          onClick={handleSpin}
          disabled={!canSpin}
          sx={getFortuneWheelSpinButtonSx(theme)}
        >
          {spinning ? 'Крутится...' : 'Крутить'}
        </Button>
      </Box>

      <ResponsiveDialog open={resultOpen} onClose={handleCloseResult} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" fontWeight={800}>
            Выпало задание
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.5 }}>
            {resultTask}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseResult} sx={{ minWidth: 100 }}>
            ОК
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>
  );
};

export default FortuneWheelSpinView;
