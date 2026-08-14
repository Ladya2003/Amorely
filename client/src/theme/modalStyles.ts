import { alpha, lighten, Theme } from '@mui/material/styles';
import {
  HIDE_INPUT_LABELS,
  SURFACE_BORDER_RADIUS,
  getPrimaryTintLabelNotchBg,
  getPrimaryTintSurface,
} from './surfaceStyles';

export const MODAL_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const MODAL_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

/** Ширина action-sheet / контекстного меню на desktop (эмодзи иначе раздувают Menu). */
export const APP_CONTEXT_MENU_MAX_WIDTH = 280;

/** Текст на glass-поверхности модалки в светлой теме */
export const MODAL_TEXT_PRIMARY_LIGHT = 'rgba(255, 255, 255, 0.95)';
export const MODAL_TEXT_SECONDARY_LIGHT = 'rgba(255, 255, 255, 0.72)';

/** Вложенная непрозрачная поверхность внутри glass-модалки (белая карточка и т.п.) */
export const APP_OPAQUE_SURFACE_CLASS = 'app-opaque-surface';

const getModalSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

/** Белый текст для glass-поверхностей в light-теме (модалки, drawer и т.п.) */
export type GlassSurfaceLightTextOptions = {
  /** Прозрачность tint фона родительской поверхности — для notch лейбла */
  surfaceTint?: number;
};

export const getAppGlassSurfaceLightTextSx = (
  theme: Theme,
  options?: GlassSurfaceLightTextOptions
): Record<string, unknown> => {
  if (theme.palette.mode !== 'light') {
    return {};
  }

  const surfaceTint = options?.surfaceTint ?? 0.12;
  const labelNotchBg = HIDE_INPUT_LABELS
    ? null
    : getPrimaryTintLabelNotchBg(theme, surfaceTint);
  const glassField = getModalGlassFieldSx(theme);
  const successOnGlass = lighten(theme.palette.success.light, 0.28);

  return {
    color: MODAL_TEXT_PRIMARY_LIGHT,
    '& .MuiTypography-root:not(.MuiAlert-message)': {
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiTypography-root:not(.MuiAlert-message)`]: {
      color: `${theme.palette.text.primary} !important`,
    },
    '& .MuiTypography-colorTextSecondary': {
      color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiTypography-colorTextSecondary`]: {
      color: `${theme.palette.text.secondary} !important`,
    },
    '& .MuiTypography-colorTextPrimary': {
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
    },
    '& .MuiDialogContentText-root': {
      color: MODAL_TEXT_SECONDARY_LIGHT,
    },
    ...(HIDE_INPUT_LABELS
      ? {}
      : {
          '& .MuiInputLabel-root, & .MuiFormLabel-root': {
            color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
          },
          '& .MuiInputLabel-root.Mui-focused, & .MuiFormLabel-root.Mui-focused': {
            color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
          },
          '& .MuiInputLabel-root.MuiInputLabel-shrink, & .MuiFormLabel-root.MuiInputLabel-shrink': {
            bgcolor: `${labelNotchBg} !important`,
            px: 0.75,
            ml: -0.75,
            zIndex: 1,
          },
          [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiInputLabel-root.MuiInputLabel-shrink, & .${APP_OPAQUE_SURFACE_CLASS} .MuiFormLabel-root.MuiInputLabel-shrink`]:
            {
              bgcolor: `${theme.palette.mode === 'light' ? theme.palette.common.white : '#242424'} !important`,
            },
          '& .MuiInputLabel-root.MuiInputLabel-shrink + .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline legend, & .MuiInputLabel-root.MuiInputLabel-shrink + .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline legend':
            {
              maxWidth: '100% !important',
            },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline legend, & .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline legend':
            {
              maxWidth: '100% !important',
            },
        }),
    '& .MuiOutlinedInput-root': glassField,
    '& .MuiTextField-root .MuiOutlinedInput-root': glassField,
    '& .MuiAutocomplete-root .MuiOutlinedInput-root': glassField,
    '& .MuiPickersTextField-root .MuiPickersOutlinedInput-root': glassField,
    '& .MuiFormControl-root .MuiPickersOutlinedInput-root': glassField,
    '& .MuiPickersOutlinedInput-root': glassField,
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiOutlinedInput-root`]: getOpaqueSurfaceFieldSx(theme),
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiTextField-root .MuiOutlinedInput-root`]:
      getOpaqueSurfaceFieldSx(theme),
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiInputLabel-root, & .${APP_OPAQUE_SURFACE_CLASS} .MuiFormLabel-root`]:
      {
        color: `${theme.palette.text.secondary} !important`,
      },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiInputLabel-root.Mui-focused, & .${APP_OPAQUE_SURFACE_CLASS} .MuiFormLabel-root.Mui-focused`]:
      {
        color: `${theme.palette.primary.main} !important`,
      },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiFormHelperText-root`]: {
      color: `${theme.palette.text.secondary} !important`,
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiInputAdornment-root .MuiSvgIcon-root`]: {
      color: `${theme.palette.text.secondary} !important`,
    },
    '& .MuiFormHelperText-root': {
      color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
    },
    '& .MuiFormControlLabel-label': {
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
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
    /** Success на розовом glass — тёмный success.main почти не читается */
    '& .MuiChip-colorSuccess': {
      color: `${successOnGlass} !important`,
      borderColor: `${alpha(successOnGlass, 0.92)} !important`,
      bgcolor: `${alpha(theme.palette.success.light, 0.22)} !important`,
      '& .MuiChip-label': {
        color: `${successOnGlass} !important`,
      },
      '& .MuiChip-icon': {
        color: `${successOnGlass} !important`,
      },
    },
    '& .MuiDivider-root': {
      borderColor: alpha(theme.palette.common.white, 0.24),
    },
    '& .MuiToggleButton-root': {
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
      '& .MuiSvgIcon-root': {
        color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
      },
      '&:hover': {
        bgcolor: `${alpha(theme.palette.common.white, 0.12)} !important`,
      },
      '&.Mui-selected': {
        color: `${theme.palette.primary.contrastText} !important`,
        bgcolor: `${theme.palette.primary.main} !important`,
        '& .MuiSvgIcon-root': {
          color: `${theme.palette.primary.contrastText} !important`,
        },
        '&:hover': {
          bgcolor: `${theme.palette.primary.dark} !important`,
        },
      },
    },
    '& .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      borderColor: `${alpha(theme.palette.common.white, 0.75)} !important`,
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
      '&:hover': {
        borderColor: `${alpha(theme.palette.common.white, 0.95)} !important`,
        bgcolor: `${alpha(theme.palette.common.white, 0.12)} !important`,
      },
    },
    /** Белая карточка внутри glass — кнопки в цветах opaque-поверхности, не glass/white */
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)`]:
      {
        borderColor: `${alpha(theme.palette.primary.main, 0.45)} !important`,
        color: `${theme.palette.text.primary} !important`,
        bgcolor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
        '&:hover': {
          borderColor: `${theme.palette.primary.main} !important`,
          bgcolor: `${alpha(theme.palette.primary.main, 0.14)} !important`,
        },
      },
    '& .MuiButton-contained:not(.MuiButton-colorError):not(.MuiButton-colorWarning):not(.Mui-disabled)': {
      bgcolor: `${theme.palette.primary.main} !important`,
      color: `${theme.palette.primary.contrastText} !important`,
      boxShadow: 'none !important',
      '&:hover': {
        bgcolor: `${theme.palette.primary.dark} !important`,
        boxShadow: 'none !important',
      },
    },
    '& .MuiButton-contained.Mui-disabled:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      bgcolor: `${alpha(theme.palette.common.white, 0.22)} !important`,
      color: `${alpha(theme.palette.common.white, 0.55)} !important`,
      border: `1px solid ${alpha(theme.palette.common.white, 0.35)} !important`,
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiButton-contained.Mui-disabled:not(.MuiButton-colorError):not(.MuiButton-colorWarning)`]:
      {
        bgcolor: `${alpha(theme.palette.primary.main, 0.16)} !important`,
        color: `${alpha(theme.palette.text.primary, 0.55)} !important`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.28)} !important`,
      },
    '& .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      border: `1px solid ${alpha(theme.palette.common.white, 0.55)} !important`,
      color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
      '&:hover': {
        borderColor: `${alpha(theme.palette.common.white, 0.85)} !important`,
        bgcolor: `${alpha(theme.palette.common.white, 0.12)} !important`,
      },
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)`]:
      {
        border: `1px solid ${alpha(theme.palette.primary.main, 0.45)} !important`,
        color: `${theme.palette.primary.main} !important`,
        bgcolor: 'transparent !important',
        '&:hover': {
          borderColor: `${theme.palette.primary.main} !important`,
          bgcolor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
        },
      },
    '& .MuiIconButton-root': {
      color: MODAL_TEXT_PRIMARY_LIGHT,
    },
    [`& .${APP_OPAQUE_SURFACE_CLASS} .MuiIconButton-root`]: {
      color: theme.palette.text.secondary,
    },
  };
};

const getModalGlassFieldSx = (theme: Theme) => ({
  color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
  bgcolor: `${alpha(theme.palette.primary.main, 0.1)} !important`,
  '& .MuiInputBase-input, & .MuiInputBase-inputMultiline': {
    color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
    WebkitTextFillColor: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
  },
  '& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder': {
    color: `${MODAL_TEXT_SECONDARY_LIGHT} !important`,
  },
  // Без floating label placeholder должен быть виден и в blur
  '&:not(.Mui-focused) .MuiInputBase-input::placeholder, &:not(.Mui-focused) .MuiInputBase-inputMultiline::placeholder':
    {
      opacity: HIDE_INPUT_LABELS ? '0.72 !important' : '0 !important',
    },
  '&.Mui-focused .MuiInputBase-input::placeholder, &.Mui-focused .MuiInputBase-inputMultiline::placeholder': {
    opacity: '1 !important',
  },
  '& .MuiPickersSectionList-root, & .MuiPickersSectionList-sectionContent': {
    color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
  },
  '& .MuiPickersInputBase-sectionContent, & .MuiPickersOutlinedInput-sectionContent': {
    color: `${MODAL_TEXT_PRIMARY_LIGHT} !important`,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.32)} !important`,
  },
  '& .MuiPickersOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.32)} !important`,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.48)} !important`,
  },
  '&:hover .MuiPickersOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.48)} !important`,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.72)} !important`,
  },
  '&.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
    borderColor: `${alpha(theme.palette.common.white, 0.72)} !important`,
  },
});

/** Поля внутри белой/opaque карточки — тёмный текст, без glass white */
const getOpaqueSurfaceFieldSx = (theme: Theme) => {
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const fieldBg =
    theme.palette.mode === 'light' ? theme.palette.grey[100] : alpha(theme.palette.common.white, 0.1);
  const border = alpha(
    theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    theme.palette.mode === 'light' ? 0.16 : 0.28
  );
  const borderHover = alpha(
    theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    theme.palette.mode === 'light' ? 0.28 : 0.42
  );

  return {
    color: `${textPrimary} !important`,
    bgcolor: `${fieldBg} !important`,
    '& .MuiInputBase-input, & .MuiInputBase-inputMultiline': {
      color: `${textPrimary} !important`,
      WebkitTextFillColor: `${textPrimary} !important`,
    },
    '& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder': {
      color: `${textSecondary} !important`,
      opacity: '0.8 !important',
    },
    '&:not(.Mui-focused) .MuiInputBase-input::placeholder, &:not(.Mui-focused) .MuiInputBase-inputMultiline::placeholder':
      {
        opacity: '0.8 !important',
      },
    '&.Mui-focused .MuiInputBase-input::placeholder, &.Mui-focused .MuiInputBase-inputMultiline::placeholder': {
      opacity: '0.8 !important',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: `${border} !important`,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: `${borderHover} !important`,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: `${theme.palette.primary.main} !important`,
    },
  };
};

const MODAL_PAPER_TINT = { light: 0.26, dark: 0.42 } as const;

/** Общая glass-поверхность модалки */
const getAppModalPaperBase = (theme: Theme) => ({
  border: getModalSurfaceBorder(theme, 'medium'),
  ...getPrimaryTintSurface(theme, {
    tint: MODAL_PAPER_TINT,
  }),
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  backgroundImage: 'none',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 20px 56px ${alpha(theme.palette.common.black, 0.28)}`
      : `0 24px 64px ${alpha(theme.palette.common.black, 0.62)}`,
  ...getAppGlassSurfaceLightTextSx(theme, { surfaceTint: MODAL_PAPER_TINT.light }),
});

/** Backdrop модалки на desktop — страница чуть темнее (MUI default ≈ 0.5). */
export const getAppModalBackdropSx = (theme: Theme) => ({
  backgroundColor: alpha(
    theme.palette.common.black,
    theme.palette.mode === 'light' ? 0.58 : 0.72
  ),
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
export const getAppPlainDialogPaperSx = (theme: Theme) => {
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const opaqueField = getOpaqueSurfaceFieldSx(theme);
  const primaryBorder = `${theme.palette.primary.main} !important`;

  return {
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    bgcolor: theme.palette.background.paper,
    color: `${textPrimary} !important`,
    backgroundImage: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.9 : 0.35)}`,
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 16px 48px ${alpha(theme.palette.common.black, 0.14)}`
        : `0 20px 56px ${alpha(theme.palette.common.black, 0.48)}`,
    '& .MuiDialogTitle-root': {
      color: `${textPrimary} !important`,
    },
    '& .MuiDialogContent-root': {
      color: `${textPrimary} !important`,
    },
    '& .MuiDialogActions-root': {
      color: `${textPrimary} !important`,
    },
    // Theme glass dialogs force white text with !important — beat that on opaque paper
    '& .MuiTypography-root:not(.MuiAlert-message)': {
      color: `${textPrimary} !important`,
    },
    '& .MuiTypography-colorTextSecondary, & .MuiDialogContentText-root': {
      color: `${textSecondary} !important`,
    },
    '& .MuiTypography-colorTextPrimary': {
      color: `${textPrimary} !important`,
    },
    '& .MuiInputLabel-root, & .MuiFormLabel-root': {
      color: `${textSecondary} !important`,
    },
    '& .MuiInputLabel-root.Mui-focused, & .MuiFormLabel-root.Mui-focused': {
      color: `${theme.palette.primary.main} !important`,
    },
    '& .MuiOutlinedInput-root': opaqueField,
    '& .MuiTextField-root .MuiOutlinedInput-root': opaqueField,
    '& .MuiAutocomplete-root .MuiOutlinedInput-root': opaqueField,
    '& .MuiPickersTextField-root .MuiPickersOutlinedInput-root': opaqueField,
    '& .MuiFormControl-root .MuiPickersOutlinedInput-root': opaqueField,
    '& .MuiPickersOutlinedInput-root': opaqueField,
    '& .MuiFormHelperText-root': {
      color: `${textSecondary} !important`,
    },
    '& .MuiFormControlLabel-label': {
      color: `${textPrimary} !important`,
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: `${textSecondary} !important`,
    },
    '& .MuiCheckbox-root': {
      color: textSecondary,
    },
    '& .MuiCheckbox-root.Mui-checked': {
      color: theme.palette.primary.main,
    },
    '& .MuiIconButton-root': {
      color: `${textSecondary} !important`,
    },
    '& .MuiDivider-root': {
      borderColor: theme.palette.divider,
    },
    '& .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      borderColor: primaryBorder,
      color: `${theme.palette.primary.main} !important`,
      bgcolor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
      '&:hover': {
        borderColor: primaryBorder,
        bgcolor: `${alpha(theme.palette.primary.main, 0.14)} !important`,
      },
    },
    '& .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      border: `1px solid ${theme.palette.primary.main} !important`,
      color: `${theme.palette.primary.main} !important`,
      bgcolor: 'transparent !important',
      '&:hover': {
        borderColor: primaryBorder,
        bgcolor: `${alpha(theme.palette.primary.main, 0.08)} !important`,
      },
    },
    '& .MuiButton-contained.Mui-disabled:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      bgcolor: `${alpha(theme.palette.primary.main, 0.16)} !important`,
      color: `${alpha(textPrimary, 0.55)} !important`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.28)} !important`,
    },
    '& .MuiDialogActions-root .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      border: `1px solid ${theme.palette.primary.main} !important`,
      color: `${theme.palette.primary.main} !important`,
    },
    '& .MuiDialogActions-root .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
      borderColor: primaryBorder,
      color: `${theme.palette.primary.main} !important`,
    },
  };
};

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
  maxWidth: APP_CONTEXT_MENU_MAX_WIDTH,
  width: 'max-content',
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
    width: '100%',
    boxSizing: 'border-box',
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
