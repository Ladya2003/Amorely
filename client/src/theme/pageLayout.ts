import { Theme } from '@mui/material/styles';

/** Боковые отступы и ширина контента как у Container maxWidth="md" на главной. */
export const getTabPageDesktopShellSx = () => ({
  width: '100%',
  mx: { xs: 0, sm: 'auto' },
  maxWidth: { xs: '100%', sm: (theme: Theme) => theme.breakpoints.values.md },
});

/** Нижний отступ как на главной — контент может уходить под плавающее меню. */
export const getTabPageBottomPaddingSx = () => ({
  pb: { xs: 10, sm: 0 },
});
