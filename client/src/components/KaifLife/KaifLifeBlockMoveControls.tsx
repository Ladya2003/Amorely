import React from 'react';
import { Box, IconButton } from '@mui/material';
import { KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '../UI/icons';
import type { KaifLifeMoveDirection } from './kaifLifeTypes';

interface KaifLifeBlockMoveControlsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: KaifLifeMoveDirection) => void;
}

const KaifLifeBlockMoveControls: React.FC<KaifLifeBlockMoveControlsProps> = ({
  canMoveUp,
  canMoveDown,
  onMove,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0, mt: -0.25 }}>
    <IconButton
      size="small"
      aria-label="Переместить блок вверх"
      disabled={!canMoveUp}
      onClick={() => onMove('up')}
    >
      <KeyboardArrowUpIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      aria-label="Переместить блок вниз"
      disabled={!canMoveDown}
      onClick={() => onMove('down')}
    >
      <KeyboardArrowDownIcon fontSize="small" />
    </IconButton>
  </Box>
);

export default React.memo(KaifLifeBlockMoveControls);
