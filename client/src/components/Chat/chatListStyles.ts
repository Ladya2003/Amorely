import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getFeedHeaderGlowSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { chatSearchInputSx } from './chatInputStyles';

export const CHAT_LIST_ITEM_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getChatListPageBackdropSx = (theme: Theme) => getChatDialogBackdropSx(theme);

export const getChatListHeaderShellSx = () => ({
  flexShrink: 0,
  bgcolor: 'transparent',
  boxShadow: 'none',
  borderBottom: 0,
});

export const getChatListHeaderGlowWrapSx = (theme: Theme) => ({
  ...getFeedHeaderGlowSx(theme),
  mt: 0,
  pt: {
    xs: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
    sm: theme.spacing(1.5),
  },
  pb: 0.5,
});

export const getChatTabToggleGroupSx = {
  p: 0.5,
  borderRadius: '20px',
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '16px !important',
    flex: 1,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.8125rem',
    gap: 0.5,
    color: 'text.primary',
    transition: 'background-color 0.25s ease, color 0.25s ease, transform 0.2s ease',
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
    },
    '&:hover': {
      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.24),
    },
  },
  '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
    borderLeft: 'none',
    marginLeft: 0,
  },
} as const;

export const getChatListSearchWrapSx = () => ({
  px: 2,
  pb: 1.5,
  pt: 0.25,
});

export const getChatListSearchFieldSx = (theme: Theme) => ({
  ...chatSearchInputSx,
  '& .MuiOutlinedInput-root': {
    borderRadius: `${CHAT_LIST_ITEM_RADIUS}px`,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
    paddingLeft: '12px',
    transition: 'background-color 220ms ease, border-color 220ms ease',
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.32),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    },
  },
  '& .MuiInputBase-inputSizeSmall': {
    paddingLeft: '0 !important',
  },
});

export const getChatListPanelSx = (theme: Theme, options?: { withSideBorder?: boolean }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
  ...(options?.withSideBorder && {
    borderRight: getSurfaceBorder(theme, 'soft'),
  }),
});

export const getChatListScrollSx = () => ({
  px: 2,
  py: 2,
});

export const getChatListStackSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
});

export const getChatListItemButtonSx = (theme: Theme, selected = false) => ({
  alignItems: 'flex-start',
  width: '100%',
  p: 1.5,
  borderRadius: `${CHAT_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, selected ? 'medium' : 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: {
      light: selected ? 0.17 : 0.1,
      dark: selected ? 0.28 : 0.18,
    },
    hover: {
      light: selected ? 0.2 : 0.15,
      dark: selected ? 0.32 : 0.24,
    },
  }),
  transition: 'background-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
  ...(selected && {
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.32 : 0.42),
  }),
});

export const getChatListSectionLabelSx = () => ({
  px: 0.5,
  pt: 0.5,
  pb: 1,
  display: 'block',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  fontSize: '0.6875rem',
  color: 'text.secondary',
});

export const getChatListEmptyStateSx = (theme: Theme) => ({
  height: '100%',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
  px: 3,
  py: 4,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getChatListUnreadBadgeSx = (theme: Theme) => ({
  minWidth: 20,
  height: 20,
  px: 0.625,
  borderRadius: '999px',
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 700,
  lineHeight: 1,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
});

export const getChatListAvatarSx = () => ({
  width: 52,
  height: 52,
  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
});

export const getChatRulesConsentPaperSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  p: { xs: 2.5, sm: 3 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.45)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.24 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
});

/** Переключение вкладок «Чат» ↔ «Игры» */
export const getChatTabPanelEnterSx = (direction: number) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: 0,
  overflow: 'hidden' as const,
  animation: 'chatTabPanelEnter 340ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes chatTabPanelEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(20px)'
          : direction < 0
            ? 'translateX(-20px)'
            : 'translateY(8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

/** Вход в диалог с собеседником */
export const getChatDialogPanelEnterSx = (options?: { mobile?: boolean }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: 0,
  overflow: 'hidden' as const,
  height: '100%',
  animation: `chatDialogPanelEnter ${options?.mobile ? 360 : 320}ms cubic-bezier(0.22, 1, 0.36, 1)`,
  '@keyframes chatDialogPanelEnter': {
    from: {
      opacity: 0,
      transform: options?.mobile ? 'translateX(28px)' : 'translateX(14px) scale(0.992)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    },
  },
});

/** Возврат к списку чатов на мобиле */
export const getChatListPanelEnterSx = () => ({
  animation: 'chatListPanelEnter 340ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes chatListPanelEnter': {
    from: {
      opacity: 0,
      transform: 'translateX(-24px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
});
