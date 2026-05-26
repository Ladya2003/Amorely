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

export interface ResponsiveDialogProps extends DialogProps {
  /** Keep centered Dialog on mobile (e.g. fullscreen media viewers). */
  disableMobileDrawer?: boolean;
  /** Breakpoint below which bottom drawer is used. */
  mobileBreakpoint?: Breakpoint;
  mobileMaxHeight?: string | number;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onClose,
  children,
  disableMobileDrawer = false,
  mobileBreakpoint = 'sm',
  mobileMaxHeight = '92vh',
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

  const mergedPaperSx: SxProps<Theme> = [
    ...(isMobile && !disableMobileDrawer
      ? [
          {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: mobileMaxHeight,
            bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : theme.palette.background.paper,
            backgroundImage: 'none'
          } as const
        ]
      : []),
    ...(slotPaperSx ? [slotPaperSx] : []),
    ...(PaperProps?.sx ? [PaperProps.sx] : [])
  ] as SxProps<Theme>;

  const handleDrawerClose = (event: React.SyntheticEvent) => {
    onClose?.(event, 'backdropClick');
  };

  if (isMobile && !disableMobileDrawer) {
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
              bgcolor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.400',
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
