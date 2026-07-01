import { Theme } from '@mui/material/styles';
import { MOBILE_BOTTOM_NAV_FLOAT_OFFSET } from '../components/Layout/bottomNavStyles';

/** Боковые отступы и ширина контента как у Container maxWidth="md" на главной. */
export const getTabPageDesktopShellSx = () => ({
  width: '100%',
  mx: { xs: 0, sm: 'auto' },
  maxWidth: { xs: '100%', sm: (theme: Theme) => theme.breakpoints.values.md },
});

/** Нижний отступ над плавающим меню на мобилках. */
export const getTabPageBottomPaddingSx = () => ({
  pb: { xs: MOBILE_BOTTOM_NAV_FLOAT_OFFSET, sm: 0 },
});
