import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getFeedHeaderGlowSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { getTabPageBottomPaddingSx, getTabPageDesktopShellSx } from '../../theme/pageLayout';
import { CALENDAR_DRAWER_INNER_RADIUS, CALENDAR_DRAWER_ACTION_RADIUS } from './calendarDrawerStyles';

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const calendarPageEnterSx = {
  '@keyframes calendarPageEnter': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'calendarPageEnter 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getCalendarTabPanelEnterSx = (direction: number) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  animation: 'calendarTabPanelEnter 340ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes calendarTabPanelEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(18px)'
          : direction < 0
            ? 'translateX(-18px)'
            : 'translateY(8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

export const getCalendarMonthPanelEnterSx = (direction: number) => ({
  animation: 'calendarMonthPanelEnter 340ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes calendarMonthPanelEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(22px)'
          : direction < 0
            ? 'translateX(-22px)'
            : 'translateY(8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

export const getCalendarMonthTitleEnterSx = (direction: number) => ({
  animation: 'calendarMonthTitleEnter 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes calendarMonthTitleEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(12px)'
          : direction < 0
            ? 'translateX(-12px)'
            : 'translateY(4px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

export const getCalendarPageRootSx = (theme: Theme) => ({
  ...getTabPageDesktopShellSx(),
  display: 'flex',
  flexDirection: 'column' as const,
  ...getTabPageBottomPaddingSx(),
  ...getChatDialogBackdropSx(theme),
});

export const getCalendarRootSx = () => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
});

export const getCalendarHeaderGlowWrapSx = (theme: Theme) => ({
  ...getFeedHeaderGlowSx(theme, { intensity: 'soft' }),
  px: 0,
  flexShrink: 0,
  pt: {
    xs: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
    sm: theme.spacing(1.5),
  },
  pb: 0.5,
});

export const getCalendarToolbarRowSx = () => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: { xs: 1.5, sm: 2 },
  pb: 1,
});

export const getCalendarMainTabsSx = {
  flex: 1,
  minWidth: 0,
} as const;

export const getCalendarDeleteAllButtonSx = (theme: Theme) => ({
  flexShrink: 0,
  color: 'error.main',
  border: `1px solid ${alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.35 : 0.45)}`,
  borderRadius: `${CALENDAR_DRAWER_ACTION_RADIUS}px`,
  bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
  '&:hover': {
    bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.14 : 0.22),
  },
});

export const getCalendarMonthNavRowSx = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  px: { xs: 1.5, sm: 2 },
  py: 1.25,
});

export const getCalendarIconButtonSx = (theme: Theme) => ({
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${CALENDAR_DRAWER_ACTION_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  boxSizing: 'border-box',
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getCalendarMonthPickerButtonSx = (theme: Theme, isMobile: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  px: isMobile ? 1.5 : 1.25,
  py: isMobile ? 0.75 : 0.5,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  transition: 'background-color 180ms ease, border-color 180ms ease',
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getCalendarMonthTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.0625rem',
  textTransform: 'capitalize' as const,
});

export const getCalendarControlsRowSx = (options?: { gridView?: boolean }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  px: { xs: 1.5, sm: 2 },
  pb: 1.25,
  pt: options?.gridView ? 1.5 : 0,
  gap: 1,
});

export const getCalendarViewToggleGroupSx = {
  p: 0.5,
  borderRadius: '20px',
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '16px !important',
    minWidth: 38,
    minHeight: 38,
    px: 1,
    py: 0.75,
    textTransform: 'none',
    color: 'text.primary',
    transition: 'background-color 0.25s ease, color 0.25s ease',
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

export const getCalendarFilterBadgeSx = (theme: Theme) => ({
  '& .MuiBadge-badge': {
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    px: 0.375,
    fontSize: '0.625rem',
    fontWeight: 700,
    lineHeight: 1,
    boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.35)}`,
  },
});

export const getCalendarFilterButtonSx = (theme: Theme, active?: boolean) => ({
  width: 44,
  minWidth: 44,
  height: 38,
  minHeight: 38,
  px: 0,
  py: 0,
  boxSizing: 'border-box',
  borderRadius: `${CALENDAR_DRAWER_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, active ? 'medium' : 'soft'),
  ...(active
    ? getPrimaryTintSurface(theme, { tint: { light: 0.14, dark: 0.24 } })
    : getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.16 } })),
  color: active ? 'primary.main' : 'text.secondary',
});

export const getCalendarCreateButtonSx = () => ({
  flexShrink: 0,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  minHeight: 38,
  px: 1.75,
  py: 0.75,
  borderRadius: '19px',
  '& .MuiButton-startIcon': {
    marginRight: 0.5,
    '& > svg': {
      fontSize: '1.25rem',
    },
  },
});

export const getCalendarScrollSx = () => ({
  px: { xs: 1.5, sm: 2 },
  py: 1,
});

export const getCalendarWeekdayLabelSx = () => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.03em',
  color: 'text.secondary',
});

export const getCalendarDayEmptySx = (theme: Theme, options?: { isToday?: boolean; isOutsideMonth?: boolean }) => ({
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  ...(options?.isOutsideMonth
    ? { bgcolor: 'transparent' }
    : options?.isToday
      ? {
          bgcolor: 'primary.main',
          boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.35)}`,
        }
      : {
          border: getSurfaceBorder(theme, 'soft'),
          ...getPrimaryTintSurface(theme, { tint: { light: 0.07, dark: 0.12 } }),
        }),
});

export const getCalendarDayContentSx = (theme: Theme) => ({
  width: '100%',
  height: '100%',
  position: 'relative' as const,
  borderRadius: '50%',
  border: getSurfaceBorder(theme, 'medium'),
  overflow: 'hidden',
  boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.1)}`,
});

export const getCalendarDayPlaceholderSx = (theme: Theme) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: getSurfaceBorder(theme, 'medium'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.16, dark: 0.28 } }),
});

export const getCalendarGridMonthTitleSx = (theme: Theme) => ({
  mb: 1.5,
  mt: 1.5,
  py: 0.75,
  px: 1.25,
  fontWeight: 700,
  fontSize: '1rem',
  textTransform: 'capitalize' as const,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.14 } }),
  display: 'inline-block',
});

export const getCalendarGridDayTitleSx = () => ({
  mb: 1,
  fontWeight: 600,
  fontSize: '0.875rem',
});

export const getCalendarGridTileSx = (theme: Theme) => ({
  position: 'relative' as const,
  paddingTop: '100%',
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  overflow: 'hidden',
  cursor: 'pointer',
  border: getSurfaceBorder(theme, 'soft'),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 6px 18px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 8px 22px ${alpha(theme.palette.common.black, 0.24)}`,
});

export const getCalendarGridTextTileSx = (theme: Theme) => ({
  ...getCalendarGridTileSx(theme),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.14, dark: 0.26 } }),
});

export const getCalendarPlanNoteCardSx = (theme: Theme, options?: { completed?: boolean }) => ({
  p: 2,
  cursor: 'pointer',
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, options?.completed ? 'soft' : 'medium'),
  ...(options?.completed
    ? getPrimaryTintSurface(theme, { tint: { light: 0.06, dark: 0.1 } })
    : getPrimaryTintSurface(theme, { tint: { light: 0.1, dark: 0.18 }, interactive: true })),
  opacity: options?.completed ? 0.88 : 1,
  transition: 'background-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    borderColor: alpha(
      options?.completed ? theme.palette.success.main : theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.32 : 0.42
    ),
  },
});

export const getCalendarPlanEmptySx = (theme: Theme) => ({
  p: 4,
  textAlign: 'center' as const,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.14 } }),
});

export const getCalendarPlanCategoryChipSx = (theme: Theme, selected: boolean) =>
  selected
    ? {}
    : {
        borderRadius: `${CALENDAR_DRAWER_ACTION_RADIUS}px`,
        border: getSurfaceBorder(theme, 'soft'),
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
      };

export const getCalendarPlansToolbarSx = () => ({
  mb: 2,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1.5,
});

export const getCalendarPlansSubtitleSx = () => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'text.secondary',
  minWidth: 0,
});
