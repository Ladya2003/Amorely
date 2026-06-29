import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from './surfaceStyles';

export const MODAL_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const MODAL_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getModalSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

/** Общая glass-поверхность модалки */
const getAppModalPaperBase = (theme: Theme) => ({
  border: getModalSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.24 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundImage: 'none',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.14)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.48)}`,
});

/** Центрированный Dialog — скругление со всех сторон */
export const getAppModalDialogPaperSx = (theme: Theme) => ({
  ...getAppModalPaperBase(theme),
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  overflow: 'hidden',
});

/** Bottom drawer — на mobile скругление только сверху */
export const getAppModalPaperSx = (theme: Theme) => ({
  ...getAppModalPaperBase(theme),
  borderRadius: {
    xs: `${SURFACE_BORDER_RADIUS}px ${SURFACE_BORDER_RADIUS}px 0 0`,
    sm: `${SURFACE_BORDER_RADIUS}px`,
  },
  overflow: 'hidden',
});

export const getAppModalTitleSx = () => ({
  pb: 1,
  px: 2.5,
  pt: 2.5,
  fontWeight: 700,
  fontSize: '1.125rem',
});

export const getAppModalContentSx = () => ({
  pt: '8px !important',
  px: 2.5,
  pb: 1,
});

export const getAppModalActionsSx = () => ({
  px: 2.5,
  pb: 2.5,
  pt: 0.5,
});

export type ModalOptionsActionColor = 'warning' | 'error' | 'primary';

export const getAppModalOptionsActionButtonSx = (
  theme: Theme,
  color: ModalOptionsActionColor
) => ({
  justifyContent: 'flex-start',
  py: 1.25,
  mb: 1,
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: `${MODAL_ACTION_RADIUS}px`,
  border: `1px solid ${alpha(theme.palette[color].main, theme.palette.mode === 'light' ? 0.35 : 0.45)}`,
  bgcolor: alpha(theme.palette[color].main, theme.palette.mode === 'light' ? 0.08 : 0.14),
  color: `${color}.main`,
  boxShadow: 'none',
  '&:hover': {
    bgcolor: alpha(theme.palette[color].main, theme.palette.mode === 'light' ? 0.14 : 0.22),
    borderColor: alpha(theme.palette[color].main, theme.palette.mode === 'light' ? 0.5 : 0.55),
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    borderColor: alpha(theme.palette.action.disabled, 0.28),
    color: 'action.disabled',
  },
});

/** Контекстное меню (три точки) */
export const getAppContextMenuPaperSx = (theme: Theme) => ({
  mt: 0.5,
  ml: 0.5,
  minWidth: 176,
  overflow: 'hidden',
  borderRadius: `${MODAL_INNER_RADIUS}px`,
  border: getModalSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.28 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundImage: 'none',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 12px 36px ${alpha(theme.palette.common.black, 0.12)}`
      : `0 16px 44px ${alpha(theme.palette.common.black, 0.42)}`,
  '& .MuiList-root': {
    p: 0.75,
  },
});

export const getAppContextMenuItemSx = (
  theme: Theme,
  options?: { danger?: boolean }
) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  minHeight: 40,
  py: 0.75,
  px: 1.25,
  borderRadius: `${MODAL_ACTION_RADIUS}px`,
  mx: 0.25,
  color: options?.danger ? 'error.main' : 'text.primary',
  transition: 'background-color 180ms ease',
  '&:hover': {
    bgcolor: alpha(
      options?.danger ? theme.palette.error.main : theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.1 : 0.18
    ),
  },
});
