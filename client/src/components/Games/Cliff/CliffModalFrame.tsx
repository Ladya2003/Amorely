import React from 'react';
import { Box, Typography } from '@mui/material';
import { CLIFF_ASSETS } from './cliffAssets';
import {
  getCliffModalBackdropSx,
  getCliffModalCardSx,
  getCliffModalHeroSx,
  getCliffModalOverlaySx,
  getCliffModalTitleSx,
} from './cliffStyles';

type CliffModalFrameProps = {
  title: string;
  heroSrc?: string;
  hero?: React.ReactNode;
  roomy?: boolean;
  zIndex?: number;
  pinned?: 'absolute' | 'fixed';
  children: React.ReactNode;
  actions: React.ReactNode;
};

const CliffModalFrame: React.FC<CliffModalFrameProps> = ({
  title,
  heroSrc,
  hero,
  roomy = false,
  zIndex,
  pinned = 'absolute',
  children,
  actions,
}) => (
  <Box sx={getCliffModalOverlaySx(zIndex, pinned)}>
    <Box sx={getCliffModalBackdropSx()} aria-hidden>
      <Box component="img" src={CLIFF_ASSETS.hubBg} alt="" />
    </Box>
    <Box sx={getCliffModalCardSx(roomy)}>
      {hero ? (
        <Box sx={{ ...getCliffModalHeroSx(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hero}
        </Box>
      ) : (
        heroSrc && <Box component="img" src={heroSrc} alt="" sx={getCliffModalHeroSx()} />
      )}
      <Typography variant="h6" sx={getCliffModalTitleSx()}>
        {title}
      </Typography>
      <Box sx={{ minHeight: 0, overflow: 'auto', flex: 1 }}>{children}</Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, flexShrink: 0 }}>{actions}</Box>
    </Box>
  </Box>
);

export default CliffModalFrame;
