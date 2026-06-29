import React from 'react';
import {
  Box,
  Dialog,
  DialogProps,
  SwipeableDrawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import type { Breakpoint } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { getAppModalDialogPaperSx, getAppModalPaperSx } from '../../theme/modalStyles';

export interface ResponsiveDialogProps extends DialogProps {
  /** Keep centered Dialog on mobile (e.g. fullscreen media viewers). */
  disableMobileDrawer?: boolean;
  /** Breakpoint below which bottom drawer is used. */
  mobileBreakpoint?: Breakpoint;
  mobileMaxHeight?: string | number;
  /** Skip glass/tint styling (e.g. fullscreen black media viewer). */
  variant?: 'default' | 'plain';
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onClose,
  children,
  disableMobileDrawer = false,
  mobileBreakpoint = 'sm',
  mobileMaxHeight = '92vh',
  variant = 'default',
  maxWidth,
  fullWidth,
  slotProps,
  PaperProps,
  sx,
  keepMounted,
  ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));

  const slotPaperProps = slotProps?.paper;
  const slotPaperSx =
    slotPaperProps && typeof slotPaperProps === 'object' && 'sx' in slotPaperProps
      ? slotPaperProps.sx
      : undefined;

  const usesDrawer = isMobile && !disableMobileDrawer;

  const mergedPaperSx: SxProps<Theme> = [
    ...(variant === 'default'
      ? [usesDrawer ? getAppModalPaperSx(theme) : getAppModalDialogPaperSx(theme)]
      : []),
    ...(usesDrawer
      ? [
          {
            maxHeight: mobileMaxHeight,
          } as const
        ]
      : []),
    ...(slotPaperSx ? [slotPaperSx] : []),
    ...(PaperProps?.sx ? [PaperProps.sx] : [])
  ] as SxProps<Theme>;

  const handleDrawerClose = (event: React.SyntheticEvent) => {
    onClose?.(event, 'backdropClick');
  };

  if (usesDrawer) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={handleDrawerClose}
        onOpen={() => {}}
        disableSwipeToOpen
        disableDiscovery
        PaperProps={{
          ...PaperProps,
          sx: mergedPaperSx
        }}
        ModalProps={{
          keepMounted
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxHeight: mobileMaxHeight,
            overflow: 'auto',
            pb: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.32),
              borderRadius: 2,
              mx: 'auto',
              mt: 1.5,
              mb: 0.5,
              flexShrink: 0
            }}
          />
          {children}
        </Box>
      </SwipeableDrawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      keepMounted={keepMounted}
      slotProps={{
        ...slotProps,
        paper: {
          ...(typeof slotPaperProps === 'object' ? slotPaperProps : {}),
          sx: mergedPaperSx
        }
      }}
      PaperProps={PaperProps}
      sx={sx}
      {...rest}
    >
      {children}
    </Dialog>
  );
};

export default ResponsiveDialog;
