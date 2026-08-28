import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography } from '@mui/material';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffModalFrame from './CliffModalFrame';
import {
  formatCliffTime,
  getCliffModalBodySx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
} from './cliffStyles';

type CliffFinishProps = {
  lastTimeMs: number | null;
  bestTimeMs: number | null;
  resetting: boolean;
  onReset: () => void;
  onBack: () => void;
};

const CliffFinish: React.FC<CliffFinishProps> = ({ lastTimeMs, bestTimeMs, resetting, onReset, onBack }) => {
  const { t } = useTranslation();

  return (
    <CliffModalFrame
      title={t('games.cliff.finish.title')}
      heroSrc={CLIFF_ASSETS.bridgeRepaired}
      actions={
        <>
          <Button onClick={onReset} disabled={resetting} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.finish.playAgain')}
          </Button>
          <Button onClick={onBack} sx={getCliffModalGhostButtonSx()}>
            {t('games.common.backToGame')}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={getCliffModalBodySx()}>
        {t('games.cliff.finish.time', { time: formatCliffTime(lastTimeMs ?? 0) })}
      </Typography>
      {bestTimeMs !== null && (
        <Typography variant="body2" sx={{ ...getCliffModalBodySx(), fontWeight: 700, mb: 0 }}>
          {t('games.cliff.finish.best', { time: formatCliffTime(bestTimeMs) })}
        </Typography>
      )}
    </CliffModalFrame>
  );
};

export default CliffFinish;
