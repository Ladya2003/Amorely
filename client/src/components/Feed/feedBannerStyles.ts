import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../theme/surfaceStyles';

export { SURFACE_BORDER_RADIUS, getPrimaryTintSurface };

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

/** Пустая лента — карточка в стиле баннеров и блока «Дней вместе» */
export const getFeedContentEmptySx = (theme: Theme, interactive: boolean) => {
  const hoverAlpha = theme.palette.mode === 'light' ? 0.17 : 0.28;

  return {
    height: 400,
    mb: 3,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    px: 3,
    textAlign: 'center' as const,
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    border: getSurfaceBorder(theme),
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 10px 32px ${alpha(theme.palette.common.black, 0.06)}`
        : `0 12px 40px ${alpha(theme.palette.common.black, 0.34)}`,
    overflow: 'hidden',
    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease',
    ...getPrimaryTintSurface(theme, {
      tint: { light: 0.1, dark: 0.18 },
    }),
    ...(interactive && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        bgcolor: alpha(theme.palette.primary.main, hoverAlpha),
      },
    }),
  };
};
export const getFeedContentEmptyIconSx = (theme: Theme) => ({
  width: 72,
  height: 72,
  mb: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  color: theme.palette.primary.main,
});

export const getFeedBannerPaperSx = (theme: Theme) => ({
  p: 2,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  position: 'relative' as const,
  ...getPrimaryTintSurface(theme, { interactive: true }),
});

/** Плавное закрытие баннеров на главной — схлопывание + лёгкий fade/slide */
export const feedBannerCollapseSx = {
  '& .feed-banner-shell': {
    transition: 'opacity 320ms ease, transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&.MuiCollapse-exiting .feed-banner-shell': {
    opacity: 0,
    transform: 'translateY(-8px)',
  },
} as const;

export const getPetSectionPaperSx = (theme: Theme) => ({
  px: 2.75,
  py: 2,
  mb: 3,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  width: '100%',
  ...getPrimaryTintSurface(theme),
});

export const getPetHintSurfaceSx = (theme: Theme) => ({
  px: 1.5,
  py: 1.25,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
  textAlign: 'center' as const,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.24 },
  }),
});

const getPageTopGlowBackground = (theme: Theme, fadeTo: string) => {
  const { primary } = theme.palette;
  const isLight = theme.palette.mode === 'light';

  return isLight
    ? `radial-gradient(120% 72% at 50% -6%, ${alpha(primary.light, 0.58)} 0%, ${alpha(primary.main, 0.16)} 44%, ${fadeTo} 74%)`
    : `radial-gradient(120% 72% at 50% -6%, ${alpha(primary.main, 0.38)} 0%, ${alpha(primary.dark, 0.24)} 42%, ${fadeTo} 74%)`;
};

/** Фон страницы питомца — мягкое свечение primary сверху */
export const getPetPageBackdropSx = (theme: Theme) => ({
  flex: 1,
  minHeight: '100%',
  width: '100%',
  background: getPageTopGlowBackground(theme, theme.palette.background.default),
});

/** Фон диалога чата с собеседником */
export const getChatDialogBackdropSx = (theme: Theme) => ({
  background: getPageTopGlowBackground(theme, theme.palette.background.default),
});

type FeedHeaderGlowOptions = {
  /** Растянуть glow до краёв родителя (нужен внутри MUI Container на главной). */
  bleed?: boolean;
};

/** Свечение primary за шапкой («Привет, …» и вкладки). */
export const getFeedHeaderGlowSx = (theme: Theme, options: FeedHeaderGlowOptions = {}) => {
  const { bleed = false } = options;
  const gutterXs = theme.spacing(2);
  const gutterSm = theme.spacing(3);

  return {
    position: 'relative' as const,
    mx: bleed
      ? { xs: `calc(-1 * ${gutterXs})`, sm: `calc(-1 * ${gutterSm})` }
      : 0,
    px: { xs: gutterXs, sm: gutterSm },
    pt: { xs: 0.5, sm: 0 },
    mt: { xs: -1, sm: -0.5 },
    pb: 0.5,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: { xs: -24, sm: -32 },
      left: 0,
      right: 0,
      height: { xs: 300, sm: 320 },
      background: getPageTopGlowBackground(theme, 'transparent'),
      pointerEvents: 'none',
      zIndex: 0,
    },
  };
};

/** Фон блока с фото питомца */
export const getPetHeroBackground = (theme: Theme) => {
  const { primary } = theme.palette;

  if (theme.palette.mode === 'light') {
    return `linear-gradient(145deg, ${alpha(primary.light, 0.78)} 0%, ${alpha(primary.main, 0.42)} 46%, ${alpha(primary.dark, 0.24)} 100%)`;
  }

  return `linear-gradient(145deg, ${alpha(primary.dark, 0.62)} 0%, ${alpha(primary.main, 0.38)} 46%, ${alpha(primary.light, 0.2)} 100%)`;
};

/** Подсказка «Контент дня» — стекло с затемнением и blur как у блоков ленты */
export const getFeedContentUpdateTooltipSlotProps = (theme: Theme) => {
  const glassBg = alpha('#000', theme.palette.mode === 'light' ? 0.62 : 0.72);

  return {
    tooltip: {
      sx: {
        borderRadius: `${SURFACE_BORDER_RADIUS}px`,
        px: 2,
        py: 1.5,
        maxWidth: 300,
        fontSize: '0.8125rem',
        lineHeight: 1.45,
        color: '#fff',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        bgcolor: glassBg,
        boxShadow: `0 12px 40px ${alpha('#000', 0.28)}`,
        border: `1px solid ${alpha('#fff', 0.1)}`,
      },
    },
    arrow: {
      sx: {
        color: glassBg,
      },
    },
  };
};

export const petCardEnterAnimation = (index: number) => ({
  animation: `petCardIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.06}s both`,
  '@keyframes petCardIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.9) translateY(6px)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1) translateY(0)',
    },
  },
});

export const petViewEnterSx = {
  '@keyframes petViewEnter': {
    from: {
      opacity: 0,
      transform: 'translateY(10px) scale(0.98)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
    },
  },
  animation: 'petViewEnter 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const petHorizontalScrollSx = {
  display: 'flex',
  gap: 1.5,
  overflowX: 'auto',
  pb: 0.5,
  mx: -0.25,
  px: 0.25,
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
} as const;

export const PET_SCROLL_CARD_WIDTH = 160;

export const petScrollItemSx = {
  flex: `0 0 ${PET_SCROLL_CARD_WIDTH}px`,
  width: PET_SCROLL_CARD_WIDTH,
  scrollSnapAlign: 'start',
  minHeight: 220,
} as const;
