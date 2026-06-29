import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../theme/appTheme';
import { getPrimaryTintSurface } from '../Feed/feedBannerStyles';

const BOTTOM_NAV_ITEM_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
const BOTTOM_NAV_TAB_COUNT = 5;
const BOTTOM_NAV_HEIGHT = 62;
/** Pill чуть шире слота — горизонтальный «воздух» у текста через padding контента */
const BOTTOM_NAV_INDICATOR_PILL_OUTSET_X = 5;
const BOTTOM_NAV_ACTION_PADDING_X = 1.75;
/** Вертикальный зазор между pill-подсветкой и краями трека навигации */
const BOTTOM_NAV_INDICATOR_PILL_INSET_Y = 6;

/** Отступ контента над плавающей нижней навигацией */
export const MOBILE_BOTTOM_NAV_FLOAT_OFFSET =
  'calc(102px + max(12px, env(safe-area-inset-bottom, 0px)))';

const getSelectedNavColor = (theme: Theme) =>
  theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.common.white;

export const getBottomNavIndicatorSx = (theme: Theme, selectedIndex: number, tabCount: number) => {
  const isLight = theme.palette.mode === 'light';
  const pillOutsetX = BOTTOM_NAV_INDICATOR_PILL_OUTSET_X;
  const pillInsetY = BOTTOM_NAV_INDICATOR_PILL_INSET_Y;
  const slotSharePercent = 100 / tabCount;

  return {
    position: 'absolute',
    top: pillInsetY,
    bottom: pillInsetY,
    left: `${(selectedIndex + 0.5) * slotSharePercent}%`,
    width: `calc(${slotSharePercent}% + ${pillOutsetX * 2}px)`,
    transform: 'translateX(-50%)',
    borderRadius: `${BOTTOM_NAV_ITEM_RADIUS}px`,
    bgcolor: alpha(theme.palette.primary.main, isLight ? 0.16 : 0.34),
    transition: 'left 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'left, transform',
    pointerEvents: 'none',
    zIndex: 0,
  };
};

export const getAnimatedBottomNavActionStyles = (theme: Theme) => {
  const selectedColor = getSelectedNavColor(theme);

  return {
    minWidth: 0,
    maxWidth: 'none',
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${theme.spacing(BOTTOM_NAV_ACTION_PADDING_X)}`,
    borderRadius: `${BOTTOM_NAV_ITEM_RADIUS}px`,
    color: theme.palette.text.secondary,
    transition: 'color 220ms ease',
    '& .MuiBottomNavigationAction-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: 0,
    },
    '& .bottom-nav-tab-content': {
      color: 'inherit',
    },
    '& .bottom-nav-tab-label': {
      color: 'inherit',
      fontWeight: 600,
      transition: 'font-weight 220ms ease',
    },
    '& .MuiSvgIcon-root': {
      fontSize: 24,
      width: 24,
      height: 24,
      display: 'block',
      flexShrink: 0,
      transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
    },
    '& .MuiBadge-root': {
      display: 'inline-flex',
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    '&.Mui-selected': {
      color: selectedColor,
      bgcolor: 'transparent',
      '& .bottom-nav-tab-label': {
        fontWeight: 600,
      },
      '& .bottom-nav-tab-icon .MuiSvgIcon-root': {
        transform: 'scale(1.04)',
      },
    },
    '@media (max-width:360px)': {
      padding: `0 ${theme.spacing(1.25)}`,
    },
  };
};

export const getTabPageEnterSx = (direction: number) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  animation: 'tabPageEnter 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes tabPageEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(16px)'
          : direction < 0
            ? 'translateX(-16px)'
            : 'translateY(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

export { BOTTOM_NAV_TAB_COUNT, BOTTOM_NAV_HEIGHT };

export const getMobileBottomNavOuterSx = () => ({
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  px: 2,
  pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
  pt: 0.5,
});

export const getMobileBottomNavShellSx = (theme: Theme) => ({
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24)}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 32px ${alpha(theme.palette.common.black, 0.12)}`
      : `0 12px 40px ${alpha(theme.palette.common.black, 0.48)}`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.28 },
  }),
  px: 0.75,
  py: 0.75,
  overflow: 'visible',
});

export const getMobileBottomNavSx = (theme: Theme) => ({
  '& .MuiBottomNavigationAction-root': getAnimatedBottomNavActionStyles(theme),
});

export const getDesktopBottomNavSx = (theme: Theme) => ({
  '& .MuiBottomNavigationAction-root': {
    ...getAnimatedBottomNavActionStyles(theme),
    padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
    mx: 0.25,
    maxWidth: 'none',
  },
});
