import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { getChatDialogBackdropSx } from '../Feed/feedBannerStyles';
import { getGameDesktopPanelSx } from './gamePageStyles';

type GameFrameProps = {
  children: React.ReactNode;
  /** Страница правил — высота по контенту; play — на доступную высоту. */
  hugContent?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Центрированная колонка md (как список игр / главная).
 * Outer на 100% ширины Layout, inner — MUI Container maxWidth="md" (надёжнее sx-хаков).
 * Без отступа под bottom nav: на /chat/games/* меню скрыто, safe-area даёт footer.
 */
const GameFrame: React.FC<GameFrameProps> = ({ children, hugContent = false, sx }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="md"
        disableGutters
        sx={[
          {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            maxHeight: '100%',
            height: hugContent ? { xs: '100%', sm: 'auto' } : '100%',
            flex: hugContent ? { xs: 1, sm: '0 1 auto' } : 1,
            ...getChatDialogBackdropSx(theme),
            ...getGameDesktopPanelSx(theme),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
      </Container>
    </Box>
  );
};

export default GameFrame;
