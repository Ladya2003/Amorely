import React from 'react';
import {
  Box,
  Dialog,
  DialogProps,
  Drawer,
  SwipeableDrawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useVisualViewportLayout } from '../../hooks/useVisualViewportLayout';
import type { Breakpoint } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  getAppModalBackdropSx,
  getAppModalDialogPaperSx,
  getAppModalPaperSx,
} from '../../theme/modalStyles';

export interface ResponsiveDialogProps extends DialogProps {
  /** Keep centered Dialog on mobile (e.g. fullscreen media viewers). */
  disableMobileDrawer?: boolean;
  /** Breakpoint below which bottom drawer is used. */
  mobileBreakpoint?: Breakpoint;
  mobileMaxHeight?: string | number;
  /** Fit mobile forms above the keyboard and keep scrolling from dismissing them. */
  mobileKeyboardAware?: boolean;
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
  mobileKeyboardAware = false,
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
  const viewport = useVisualViewportLayout(usesDrawer && open && mobileKeyboardAware);
  const mobileHeight = typeof mobileMaxHeight === 'number' ? `${mobileMaxHeight}px` : mobileMaxHeight;

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
    ...(PaperProps?.sx ? [PaperProps.sx] : []),
    ...(usesDrawer && mobileKeyboardAware
      ? [{
          // Follow Safari's visual viewport instead of extending behind the keyboard.
          position: 'absolute',
          maxHeight: `min(${mobileHeight}, ${viewport.height}px)`,
          overflow: 'hidden',
        } as const]
      : [])
  ] as SxProps<Theme>;

  const handleDrawerClose = (event: React.SyntheticEvent) => {
    onClose?.(event, 'backdropClick');
  };

  if (usesDrawer) {
    const content = (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxHeight: mobileMaxHeight,
          overflow: 'auto',
          ...(mobileKeyboardAware ? {
            maxHeight: 'inherit',
            minHeight: 0,
            overscrollBehaviorY: 'contain',
            // Keep the entire form in this scroller; DialogContent must not shrink.
            '& > .MuiDialogContent-root': { flex: '0 0 auto', overflow: 'visible' },
          } : {}),
          pb: mobileKeyboardAware && viewport.keyboardOpen ? 0 : 'env(safe-area-inset-bottom, 0px)'
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
    );

    if (mobileKeyboardAware) {
      return (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleDrawerClose}
          PaperProps={{ ...PaperProps, sx: mergedPaperSx }}
          ModalProps={{ keepMounted }}
          sx={{ top: viewport.offsetTop, height: viewport.height, bottom: 'auto' }}
        >
          {content}
        </Drawer>
      );
    }

    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={handleDrawerClose}
        onOpen={() => {}}
        disableSwipeToOpen
        disableDiscovery
        PaperProps={{ ...PaperProps, sx: mergedPaperSx }}
        ModalProps={{ keepMounted }}
      >
        {content}
      </SwipeableDrawer>
    );
  }

  const slotBackdropProps = slotProps?.backdrop;
  const slotBackdropSx =
    slotBackdropProps && typeof slotBackdropProps === 'object' && 'sx' in slotBackdropProps
      ? slotBackdropProps.sx
      : undefined;

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
        },
        backdrop: {
          ...(typeof slotBackdropProps === 'object' ? slotBackdropProps : {}),
          sx: [
            (muiTheme: Theme) => getAppModalBackdropSx(muiTheme),
            ...(slotBackdropSx ? (Array.isArray(slotBackdropSx) ? slotBackdropSx : [slotBackdropSx]) : []),
          ],
        },
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
