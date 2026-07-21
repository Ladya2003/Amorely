import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from './surfaceStyles';

export const MODAL_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const MODAL_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

/** Текст на glass-поверхности модалки в светлой теме */
export const MODAL_TEXT_PRIMARY_LIGHT = 'rgba(255, 255, 255, 0.95)';
export const MODAL_TEXT_SECONDARY_LIGHT = 'rgba(255, 255, 255, 0.72)';

const getModalSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

/** Белый текст для glass-поверхностей в light-теме (модалки, drawer и т.п.) */
export const getAppGlassSurfaceLightTextSx = (theme: Theme) => {
  if (theme.palette.mode !== 'light') {
    return {};
  }

  const glassField = getModalGlassFieldSx(theme);

  return {
    color: MODAL_TEXT_PRIMARY_LIGHT,
    '& .MuiTypography-root': {
      color: 'inherit',
    },
    '& .MuiTypography-colorTextSecondary': {
      color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
    },
    '& .MuiTypography-colorTextPrimary': {
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
    },
    '& .MuiDialogContentText-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    '& .MuiInputLabel-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: MODAL_TEXT_PRIMARY_LIGHT,
    },
    '& .MuiTextField-root .MuiOutlinedInput-root': glassField,
    '& .MuiAutocomplete-root .MuiOutlinedInput-root': glassField,
    '& .MuiPickersOutlinedInput-root': glassField,
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    '& .MuiFormHelperText-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    '& .MuiFormControlLabel-label': {
      color: MODAL_TEXT_PRIMARY_LIGHT,
    },
    '& .MuiCheckbox-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    '& .MuiCheckbox-root.Mui-checked': {
      color: MODAL_TEXT_PRIMARY_LIGHT,
    },
    '& .MuiChip-root:not(.MuiChip-colorSuccess):not(.MuiChip-colorWarning):not(.MuiChip-colorError):not(.MuiChip-colorInfo):not(.MuiChip-colorSecondary)':
      {
        bgcolor: alpha(theme.palette.common.white, 0.2),
        color: MODAL_TEXT_PRIMARY_LIGHT,
        border: `1px solid ${alpha(theme.palette.common.white, 0.34)}`,
        '& .MuiChip-label': {
          color: MODAL_TEXT_PRIMARY_LIGHT,
        },
        '& .MuiChip-deleteIcon': {
          color: MODAL_TEXT_SECONDARY_LIGHT,
          '&:hover': {
            color: MODAL_TEXT_PRIMARY_LIGHT,
          },
        },
      },
    '& .MuiDivider-root': {
      borderColor: alpha(theme.palette.common.white, 0.24),
    },
    '& .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      borderColor: alpha(theme.palette.common.white, 0.55),
      color: MODAL_TEXT_PRIMARY_LIGHT,
      '&:hover': {
        borderColor: alpha(theme.palette.common.white, 0.85),
        bgcolor: alpha(theme.palette.common.white, 0.12),
      },
    },
    '& .MuiIconButton-root': {
      color: MODAL_TEXT_PRIMARY_LIGHT,
    },
  };
};

const getModalGlassFieldSx = (theme: Theme) => ({
  color: MODAL_TEXT_PRIMARY_LIGHT,
  bgcolor: alpha(theme.palette.common.white, 0.12),
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.32)} !important`,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.48)} !important`,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.72)} !important`,
  },
});

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
  ...getAppGlassSurfaceLightTextSx(theme),
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

export const getAppModalTitleSx = (theme: Theme) => ({
  pb: 1,
  px: 2.5,
  pt: 2.5,
  fontWeight: 700,
  fontSize: '1.125rem',
  ...(theme.palette.mode === 'light' ? { color: MODAL_TEXT_PRIMARY_LIGHT } : {}),
});

export const getAppModalContentSx = (theme: Theme) => ({
  pt: '8px !important',
  px: 2.5,
  pb: 1,
  ...(theme.palette.mode === 'light' ? { color: MODAL_TEXT_PRIMARY_LIGHT } : {}),
});

export const getAppModalActionsSx = (theme: Theme) => ({
  px: 2.5,
  pb: 2.5,
  pt: 0.5,
  ...(theme.palette.mode === 'light' ? { color: MODAL_TEXT_PRIMARY_LIGHT } : {}),
});

/** Обычная модалка (админка и формы) — без glass и без белого текста */
export const getAppPlainDialogPaperSx = (theme: Theme) => ({
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  bgcolor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  backgroundImage: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.9 : 0.35)}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.14)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.48)}`,
  '& .MuiDialogTitle-root': {
    color: theme.palette.text.primary,
  },
  '& .MuiDialogContent-root': {
    color: theme.palette.text.primary,
  },
  '& .MuiDialogActions-root': {
    color: theme.palette.text.primary,
  },
  '& .MuiTypography-colorTextSecondary': {
    color: `${theme.palette.text.secondary} !important`,
  },
  '& .MuiFormControlLabel-label': {
    color: theme.palette.text.primary,
  },
  '& .MuiDialogActions-root .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
  },
  '& .MuiDialogActions-root .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
  },
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
  ...getAppGlassSurfaceLightTextSx(theme),
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
  color:
    theme.palette.mode === 'light'
      ? options?.danger
        ? theme.palette.error.light
        : MODAL_TEXT_PRIMARY_LIGHT
      : options?.danger
        ? 'error.main'
        : 'text.primary',
  transition: 'background-color 180ms ease',
  '&:hover': {
    bgcolor: alpha(
      options?.danger ? theme.palette.error.main : theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.1 : 0.18
    ),
  },
});
