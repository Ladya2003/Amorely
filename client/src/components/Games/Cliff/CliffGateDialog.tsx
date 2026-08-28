import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography } from '@mui/material';
import { CLIFF_ASSETS } from './cliffAssets';
import CliffModalFrame from './CliffModalFrame';
import {
  getCliffModalBodySx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
} from './cliffStyles';

type CliffGateDialogProps = {
  hasAxe: boolean;
  breaking: boolean;
  onBreak: () => void;
  onClose: () => void;
};

const CliffGateDialog: React.FC<CliffGateDialogProps> = ({ hasAxe, breaking, onBreak, onClose }) => {
  const { t } = useTranslation();

  return (
    <CliffModalFrame
      title={t('games.cliff.gate.title')}
      heroSrc={CLIFF_ASSETS.gateClosed}
      actions={
        <>
          {hasAxe && (
            <Button onClick={onBreak} disabled={breaking} sx={getCliffModalPrimaryButtonSx()}>
              {t('games.cliff.gate.break')}
            </Button>
          )}
          <Button onClick={onClose} sx={getCliffModalGhostButtonSx()}>
            {t('games.common.close')}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={getCliffModalBodySx()}>
        {t('games.cliff.gate.lore')}
      </Typography>
      {!hasAxe && (
        <Typography variant="body2" sx={{ color: '#b42318', fontWeight: 700, mb: 0 }}>
          {t('games.cliff.gate.needAxe')}
        </Typography>
      )}
    </CliffModalFrame>
  );
};

export default CliffGateDialog;
