import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';

export const CHAT_DIALOG_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const CHAT_DIALOG_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getChatDialogHeaderWrapSx = () => ({
  px: 1.5,
  pt: 1,
  pb: 0.5,
  flexShrink: 0,
  zIndex: 100,
});

export const getChatDialogHeaderSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  p: 1,
  borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.26 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 10px 32px ${alpha(theme.palette.common.black, 0.28)}`,
});

export const getChatDialogHeaderAvatarSx = () => ({
  width: 44,
  height: 44,
  mr: 1.25,
  cursor: 'pointer',
  flexShrink: 0,
  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
});

export const getChatDialogPresenceTextSx = (options: { isActive?: boolean } = {}) => ({
  display: 'block',
  fontSize: '0.75rem',
  lineHeight: 1.2,
  fontWeight: options.isActive ? 600 : 400,
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
});

export const getChatDialogOptionsButtonSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  flexShrink: 0,
  px: 0.875,
  py: 0.375,
  mb: 0.75,
  color: 'text.secondary',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  cursor: 'pointer',
  font: 'inherit',
  transition: 'background-color 220ms ease, color 220ms ease, border-color 220ms ease',
  '&:hover': {
    color: 'text.primary',
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getChatDialogMessagesAreaSx = () => ({
  flexGrow: 1,
  overflow: 'auto',
  px: { xs: 1.5, sm: 2 },
  py: 1.5,
  bgcolor: 'transparent',
});

export const getChatDayBadgeSx = (theme: Theme) => ({
  px: 1.5,
  py: 0.625,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: 1.2,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  bgcolor: alpha('#000', theme.palette.mode === 'light' ? 0.52 : 0.62),
  border: `1px solid ${alpha('#fff', 0.12)}`,
  boxShadow: `0 8px 24px ${alpha('#000', 0.18)}`,
});

export const getChatDialogScrollButtonSx = (theme: Theme) => ({
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
  color: 'primary.main',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 10px 28px ${alpha(theme.palette.common.black, 0.34)}`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.18 : 0.3),
  },
});

export const getChatComposerShellSx = (theme: Theme) => ({
  p: { xs: 1.25, sm: 1.5 },
  flexShrink: 0,
  zIndex: 100,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.24 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 -4px 24px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 -6px 32px ${alpha(theme.palette.common.black, 0.28)}`,
});

export const getChatComposerWrapSx = () => ({
  px: 1.5,
  pt: 0.5,
  pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
  flexShrink: 0,
});

export const getChatDialogDraftBarSx = (
  theme: Theme,
  accent: 'primary' | 'info' | 'warning'
) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  borderLeft: `3px solid ${theme.palette[accent].main}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.2 },
  }),
  px: 1.25,
  py: 0.875,
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  mb: 1,
  border: getSurfaceBorder(theme, 'soft'),
  borderLeftWidth: 3,
  borderLeftColor: theme.palette[accent].main,
});

export const getChatComposerAttachmentSx = (theme: Theme) => ({
  position: 'relative' as const,
  width: 64,
  height: 64,
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  overflow: 'hidden',
  border: getSurfaceBorder(theme, 'soft'),
  flexShrink: 0,
});

export const getChatMessageBubbleSx = (theme: Theme, isOwn: boolean) => ({
  position: 'relative' as const,
  width: 'fit-content',
  maxWidth: '100%',
  px: 1.5,
  pt: 1,
  pb: 1.15,
  borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
  overflow: 'hidden',
  ...(isOwn
    ? {
        bgcolor: 'primary.main',
        color: theme.palette.primary.contrastText,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
        boxShadow: `0 8px 22px ${alpha(theme.palette.primary.main, 0.24)}`,
      }
    : {
        color: 'text.primary',
        border: getSurfaceBorder(theme, 'soft'),
        ...getPrimaryTintSurface(theme, {
          tint: { light: 0.12, dark: 0.22 },
        }),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }),
});

export const getChatMessageQuoteSx = (theme: Theme, isOwn: boolean) => ({
  px: 1,
  py: 0.5,
  borderLeft: '3px solid',
  borderColor: isOwn ? alpha(theme.palette.common.white, 0.72) : theme.palette.primary.main,
  bgcolor: isOwn
    ? alpha(theme.palette.common.white, 0.14)
    : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  cursor: 'pointer',
});

export const getChatMessageActionsButtonSx = (theme: Theme, isOwn: boolean) => ({
  p: 0.1,
  borderRadius: `${Math.round(CHAT_DIALOG_ACTION_RADIUS * 0.75)}px`,
  bgcolor: 'transparent',
  border: '1px solid',
  opacity: isOwn ? 1 : 0.75,
  borderColor: isOwn
    ? alpha(theme.palette.common.white, 0.55)
    : alpha(theme.palette.text.secondary, 0.55),
  color: isOwn ? alpha(theme.palette.common.white, 0.95) : 'text.secondary',
  '&:hover': {
    bgcolor: 'transparent',
    opacity: 1,
    borderColor: isOwn
      ? alpha(theme.palette.common.white, 0.82)
      : alpha(theme.palette.text.secondary, 0.82),
  },
});

export const getChatComposerInputSx = (theme: Theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: `${CHAT_DIALOG_INNER_RADIUS}px`,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.14),
    paddingLeft: '16px',
    paddingRight: '10px',
    transition: 'background-color 220ms ease, border-color 220ms ease',
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.2 : 0.32),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '16px',
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
  },
  '& .MuiInputAdornment-positionEnd': {
    marginLeft: 6,
  },
});

export const getChatMessageFontSizeControlSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1.5,
  px: 1.25,
  py: 1,
  mb: 1.5,
  borderRadius: `${CHAT_DIALOG_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
});

export const getChatMessageFontSizeButtonSx = (theme: Theme) => ({
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export {
  getAppContextMenuPaperSx as getChatContextMenuPaperSx,
  getAppContextMenuItemSx as getChatContextMenuItemSx,
  getAppModalPaperSx as getChatDialogModalPaperSx,
  getAppModalTitleSx as getChatDialogModalTitleSx,
  getAppModalContentSx as getChatDialogModalContentSx,
  getAppModalActionsSx as getChatDialogModalActionsSx,
  getAppModalOptionsActionButtonSx as getChatOptionsActionButtonSx,
} from '../../theme/modalStyles';
