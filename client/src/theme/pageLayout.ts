import { MOBILE_BOTTOM_NAV_FLOAT_OFFSET } from '../components/Layout/bottomNavStyles';

/** Ширина контента как у Container maxWidth="md" на главной (центрируется на sm+). */
export const getTabPageDesktopShellSx = () => ({
  width: '100%',
  boxSizing: 'border-box' as const,
  mx: { xs: 0, sm: 'auto' },
  // 'md' — ключ breakpoints MUI; callback внутри { sm: (theme) => ... } в sx не резолвится.
  maxWidth: { xs: '100%', sm: 'md' },
});

/** Нижний отступ над плавающим меню на мобилках. */
export const getTabPageBottomPaddingSx = () => ({
  pb: { xs: MOBILE_BOTTOM_NAV_FLOAT_OFFSET, sm: 0 },
});
