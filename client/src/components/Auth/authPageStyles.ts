import { alpha, lighten, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { getWebkitAutofillInputSx } from '../../theme/surfaceStyles';
export const AUTH_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const AUTH_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const authPageEnterSx = {
  '@keyframes authPageEnter': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'authPageEnter 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getAuthPageRootSx = (theme: Theme) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  ...getChatDialogBackdropSx(theme, {
    containGlow: true,
    glowHeight: { xs: 440, sm: 480 },
    glowIntensity: 'muted',
  }),
});

export const getAuthPageContainerSx = (options?: { safeAreaTop?: boolean }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  py: { xs: 2, sm: 3 },
  ...(options?.safeAreaTop
    ? {
        pt: {
          xs: 'calc(16px + env(safe-area-inset-top, 0px))',
          sm: 3,
        },
      }
    : {}),
  px: { xs: 2, sm: 3 },
  pb: { xs: 6, sm: 8 },
  ...authPageEnterSx,
});

export const getAuthPageTopBarSx = () => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  mb: 2,
  pt: { xs: 'env(safe-area-inset-top, 0px)', sm: 0 },
});

export const getAuthLandingTopBarSx = (theme: Theme) => ({
  width: '100%',
  position: 'sticky' as const,
  top: 0,
  zIndex: 10,
  borderBottomLeftRadius: SURFACE_BORDER_RADIUS,
  borderBottomRightRadius: SURFACE_BORDER_RADIUS,
  bgcolor: alpha(
    theme.palette.background.default,
    theme.palette.mode === 'light' ? 0.78 : 0.72
  ),
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 28px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 12px 32px ${alpha(theme.palette.common.black, 0.28)}`,
});

export const getAuthLandingTopBarInnerSx = () => ({
  width: '100%',
  maxWidth: 900,
  mx: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1.5,
  pt: {
    xs: 'calc(10px + env(safe-area-inset-top, 0px))',
    sm: 1.25,
  },
  pb: 1.25,
  px: { xs: 2, sm: 3 },
});

export const getAuthPageTopBarActionsSx = () => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexShrink: 0,
});

export const getAuthPageLogoRowSx = () => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  minWidth: 0,
});

export const getAuthLandingHeroSx = () => ({
  textAlign: 'center' as const,
  maxWidth: 560,
  mx: 'auto',
  mb: { xs: 22, sm: 28 },
  pt: { xs: 22, sm: 28 },
});

export const getAuthLandingHeroTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.85rem', sm: '2.35rem' },
  letterSpacing: '-0.035em',
  lineHeight: 1.15,
  mb: 1.5,
});

export const getAuthLandingLeadSx = () => ({
  fontSize: { xs: '1rem', sm: '1.0625rem' },
  color: 'text.secondary',
  lineHeight: 1.55,
  mb: 3,
});

export const getAuthLandingCtaRowSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
  gap: 1.25,
  '& > .MuiButton-root': {
    minWidth: { xs: 160, sm: 180 },
    px: { xs: 3.5, sm: 4.5 },
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  },
});

export const getAuthLandingFeaturesSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  mb: { xs: 14, sm: 18 },
  pt: { xs: 2, sm: 3 },
});

export const getAuthLandingFeaturesListSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: { xs: 14, sm: 18 },
});

export const getAuthLandingSectionTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.25rem', sm: '1.5rem' },
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  mb: { xs: 4, sm: 2.5 },
  pt: { xs: 2, sm: 3 },
});

export const getAuthLandingFeatureRowSx = (reverse: boolean) => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: { xs: 2, md: 3.5 },
  alignItems: 'center',
  direction: reverse ? ('rtl' as const) : ('ltr' as const),
  '& > *': {
    direction: 'ltr' as const,
  },
});

export const getAuthLandingFeatureCopySx = () => ({
  maxWidth: 420,
});

export const getAuthLandingFeatureTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.0625rem',
  letterSpacing: '-0.02em',
  lineHeight: 1.3,
});

export const getAuthLandingFeatureBodySx = () => ({
  fontSize: '0.9375rem',
  color: 'text.secondary',
  lineHeight: 1.55,
});

export const getAuthLandingImageFrameSx = (theme: Theme, width: number, height: number) => ({
  width: '100%',
  aspectRatio: `${width} / ${height}`,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  overflow: 'hidden',
  border: `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? 0.14 : 0.24
  )}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 12px 36px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 14px 40px ${alpha(theme.palette.common.black, 0.32)}`,
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.1),
});

export const getAuthLandingImageSx = () => ({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  verticalAlign: 'middle' as const,
});

export const getAuthSectionSx = () => ({
  width: '100%',
  maxWidth: 420,
  mx: 'auto',
  scrollMarginTop: 88,
  mb: { xs: 14, sm: 18 },
});

export const getAuthLandingClosingSx = (theme: Theme) => ({
  textAlign: 'center' as const,
  maxWidth: 640,
  mx: 'auto',
  px: { xs: 1, sm: 2 },
  py: { xs: 4, sm: 5 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
});

export const getAuthLandingClosingTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.35rem', sm: '1.65rem' },
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  mb: 1.25,
});

export const getAuthLandingClosingLeadSx = () => ({
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  color: 'text.secondary',
  lineHeight: 1.55,
  maxWidth: 480,
  mx: 'auto',
  mb: { xs: 3, sm: 3.5 },
});

export const getAuthLandingValuesSx = () => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: { xs: 2.5, sm: 2 },
  mb: { xs: 3.5, sm: 4 },
  textAlign: 'left' as const,
});

export const getAuthLandingValueItemSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 0.75,
  px: { sm: 1 },
});

export const getAuthLandingFooterSx = () => ({
  mt: { xs: 5, sm: 6 },
  pt: { xs: 2, sm: 2.5 },
  pb: { xs: 1, sm: 2 },
  textAlign: 'center' as const,
});

export const getAuthLandingFooterMetaSx = () => ({
  fontSize: '0.8125rem',
  color: 'text.secondary',
  lineHeight: 1.45,
});

export const getAuthLandingFreeSx = (theme: Theme) => ({
  textAlign: 'center' as const,
  maxWidth: 640,
  mx: 'auto',
  mb: { xs: 14, sm: 18 },
  px: { xs: 2, sm: 3 },
  py: { xs: 4.5, sm: 5.5 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getAuthLandingFreeTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.5rem', sm: '1.85rem' },
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  mb: 1.5,
});

export const getAuthLandingFreeLeadSx = () => ({
  fontSize: { xs: '1rem', sm: '1.0625rem' },
  color: 'text.secondary',
  lineHeight: 1.55,
  maxWidth: 480,
  mx: 'auto',
  mb: { xs: 2.5, sm: 3 },
});

export const getAuthLandingFreePointsSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
  textAlign: 'left' as const,
  maxWidth: 420,
  mx: 'auto',
});

export const getAuthLandingFreePointSx = () => ({
  fontSize: '0.9375rem',
  color: 'text.secondary',
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1,
});

export const getAuthLandingReviewsSx = () => ({
  maxWidth: 640,
  mx: 'auto',
  mt: { xs: 10, sm: 12 },
});

export const getAuthLandingReviewsTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.35rem', sm: '1.65rem' },
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  textAlign: 'center' as const,
  mb: 1.25,
});

export const getAuthLandingReviewsLeadSx = () => ({
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  color: 'text.secondary',
  lineHeight: 1.55,
  textAlign: 'center' as const,
  maxWidth: 480,
  mx: 'auto',
  mb: { xs: 2.5, sm: 3 },
});

export const getAuthLandingReviewsListSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: { xs: 1.5, sm: 2 },
});

export const getAuthLandingReviewCardSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
  px: { xs: 2, sm: 2.5 },
  py: { xs: 2, sm: 2.25 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.06, dark: 0.12 },
  }),
});

export const getAuthLandingReviewHeaderSx = () => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  minWidth: 0,
});

export const getAuthLandingReviewAvatarSx = () => ({
  width: { xs: 52, sm: 56 },
  height: { xs: 52, sm: 56 },
  borderRadius: '50%',
  objectFit: 'cover' as const,
  flexShrink: 0,
});

export const getAuthLandingReviewNameSx = () => ({
  fontWeight: 600,
  fontSize: '0.9375rem',
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
  minWidth: 0,
});

export const getAuthLandingReviewQuoteSx = () => ({
  m: 0,
  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
  color: 'text.secondary',
  lineHeight: 1.55,
});

export const getAuthLandingFaqSx = () => ({
  maxWidth: 640,
  mx: 'auto',
  mb: { xs: 2, sm: 3 },
  mt: { xs: 10, sm: 12 },
});

export const getAuthLandingFaqTitleSx = () => ({
  fontWeight: 700,
  fontSize: { xs: '1.35rem', sm: '1.65rem' },
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  textAlign: 'center' as const,
  mb: { xs: 2.5, sm: 3 },
});

export const getAuthLandingFaqAccordionSx = (theme: Theme) => ({
  bgcolor: 'transparent',
  backgroundImage: 'none',
  boxShadow: 'none',
  borderBottom: getSurfaceBorder(theme, 'soft'),
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
});

export const getAuthLandingFaqSummarySx = () => ({
  px: 0,
  minHeight: 52,
  '& .MuiAccordionSummary-content': {
    my: 1.25,
  },
});

export const getAuthLandingFaqQuestionSx = () => ({
  fontWeight: 600,
  fontSize: '0.9375rem',
  letterSpacing: '-0.01em',
  lineHeight: 1.4,
  pr: 1,
});

export const getAuthLandingFaqAnswerSx = () => ({
  fontSize: '0.875rem',
  color: 'text.secondary',
  lineHeight: 1.55,
  pb: 1.5,
});

export const getAuthScrollTopFabSx = (theme: Theme) => ({
  position: 'fixed' as const,
  right: { xs: 16, sm: 24 },
  bottom: { xs: 20, sm: 56, md: 72 },
  zIndex: 20,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 28px ${alpha(theme.palette.primary.main, 0.35)}`
      : `0 12px 32px ${alpha(theme.palette.common.black, 0.4)}`,
  '&:hover': {
    bgcolor: 'primary.dark',
  },
});

export const getAuthPageLogoIconSx = (theme: Theme) => ({
  color: 'primary.main',
  fontSize: 40,
  filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.35)})`,
});

export const getAuthPageLogoTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.75rem',
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
});

export const getAuthPageCardSx = (theme: Theme) => ({
  p: { xs: 3, sm: 4 },
  width: '100%',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.34)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  // Chrome autofill: прозрачный фон + тот же размер шрифта, что после фокуса
  '& .MuiOutlinedInput-root:has(.MuiInputBase-input:-webkit-autofill)': {
    bgcolor: 'transparent',
  },
  '& .MuiInputBase-input:-webkit-autofill, & .MuiInputBase-input:-webkit-autofill:hover, & .MuiInputBase-input:-webkit-autofill:focus, & .MuiInputBase-input:-webkit-autofill:active':
    getWebkitAutofillInputSx(theme),
});

export const getAuthFormTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  mb: 2.5,
});

export const getAuthAlertSx = (_theme: Theme) => ({
  mb: 2,
});

/** Переливающийся градиент для главных CTA (Sign in / Create account) */
export const getAuthGradientCtaSx = (theme: Theme) => {
  const { main, dark, light, contrastText } = theme.palette.primary;
  const gradient = `linear-gradient(120deg, ${dark}, ${main}, ${light}, ${main}, ${dark})`;

  return {
    py: 1.125,
    fontWeight: 600,
    fontSize: '0.9375rem',
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    color: `${contrastText} !important`,
    border: 'none',
    backgroundColor: 'transparent',
    backgroundImage: gradient,
    backgroundSize: '220% 220%',
    backgroundPosition: '0% 50%',
    boxShadow: `0 10px 28px ${alpha(main, theme.palette.mode === 'light' ? 0.38 : 0.45)}`,
    animation: 'authCtaGradientShift 7.5s ease infinite',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
    '@keyframes authCtaGradientShift': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
    '&:hover': {
      backgroundColor: 'transparent',
      backgroundImage: gradient,
      filter: 'brightness(1.07)',
      boxShadow: `0 14px 36px ${alpha(main, theme.palette.mode === 'light' ? 0.48 : 0.55)}`,
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&.Mui-disabled': {
      animation: 'none',
      filter: 'none',
      backgroundImage: 'none',
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
      boxShadow: 'none',
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      backgroundPosition: '50% 50%',
    },
  };
};

export const getAuthPrimaryButtonSx = (theme: Theme) => ({
  mt: 3,
  mb: 2,
  ...getAuthGradientCtaSx(theme),
});

export const getAuthLandingCtaButtonSx = (theme: Theme) => ({
  ...getAuthGradientCtaSx(theme),
  mt: 0,
  mb: 0,
});

/** Outlined secondary CTA — matches auth card surfaces (Google sign-in, etc.) */
export const getAuthGoogleButtonSx = (theme: Theme) => ({
  width: '100%',
  py: 1.125,
  px: 2,
  minHeight: 48,
  fontWeight: 600,
  fontSize: '0.9375rem',
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  color: theme.palette.text.primary,
  border: getSurfaceBorder(theme),
  bgcolor: alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'light' ? 0.72 : 0.28
  ),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 6px 18px ${alpha(theme.palette.common.black, 0.05)}`
      : `0 8px 22px ${alpha(theme.palette.common.black, 0.22)}`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    border: `1px solid ${alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.28 : 0.4
    )}`,
    bgcolor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.06 : 0.14
    ),
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 10px 26px ${alpha(theme.palette.common.black, 0.08)}`
        : `0 12px 30px ${alpha(theme.palette.common.black, 0.3)}`,
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
  '&.Mui-disabled': {
    border: getSurfaceBorder(theme, 'soft'),
    bgcolor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    boxShadow: 'none',
  },
});

export const getAuthDividerSx = (theme: Theme) => ({
  my: 2.25,
  width: '100%',
  '&::before, &::after': {
    borderColor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.12 : 0.22
    ),
  },
  '& .MuiDivider-wrapper': {
    px: 1.5,
  },
});

export const getAuthLinkButtonSx = () => ({
  p: 0,
  minWidth: 'auto',
  fontWeight: 600,
  textTransform: 'none' as const,
  verticalAlign: 'baseline',
});

export const getAuthSwitchTextSx = () => ({
  textAlign: 'center' as const,
  fontSize: '0.875rem',
  color: 'text.secondary',
  lineHeight: 1.5,
});

export const getAuthTaglineSx = () => ({
  mt: 3,
  textAlign: 'center' as const,
  fontSize: '0.8125rem',
  color: 'text.secondary',
  lineHeight: 1.45,
  maxWidth: 280,
  mx: 'auto',
});

export const getAuthToggleGroupSx = {
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

export const getAuthBackButtonSx = (theme: Theme) => ({
  alignSelf: 'flex-start',
  ml: -0.5,
  px: 1.25,
  py: 0.625,
  borderRadius: `${AUTH_ACTION_RADIUS}px`,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'text.primary',
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
  '& .MuiButton-startIcon': {
    margin: 0,
    marginRight: 0.75,
  },
});

export const getAuthOutlinedButtonSx = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';
  // Dark primary is muted for filled buttons; outlined text/border needs a brighter accent.
  const accent = isLight
    ? theme.palette.primary.main
    : lighten(theme.palette.primary.main, 0.45);

  return {
    borderRadius: `${AUTH_ACTION_RADIUS}px`,
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: accent,
    borderColor: alpha(accent, isLight ? 0.28 : 0.55),
    '&:hover': {
      borderColor: alpha(accent, isLight ? 0.42 : 0.75),
      bgcolor: alpha(accent, isLight ? 0.08 : 0.14),
    },
  };
};

/** Hero Sign in: slightly stronger outline than default outlined CTA */
export const getAuthLandingOutlinedCtaSx = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';
  const accent = isLight
    ? theme.palette.primary.main
    : lighten(theme.palette.primary.main, 0.45);

  return {
    ...getAuthOutlinedButtonSx(theme),
    py: 1.125,
    fontSize: '0.9375rem',
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    borderColor: alpha(accent, isLight ? 0.48 : 0.78),
    '&:hover': {
      borderColor: alpha(accent, isLight ? 0.62 : 0.9),
      bgcolor: alpha(accent, isLight ? 0.08 : 0.14),
    },
  };
};

export const getAuthCryptoDescriptionSx = () => ({
  mb: 2.5,
  whiteSpace: 'pre-line' as const,
  fontSize: '1rem',
  color: 'text.primary',
  lineHeight: 1.6,
});

export const getAuthCryptoTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.375rem',
  letterSpacing: '-0.02em',
  mb: 1.25,
});

export const getAuthCryptoActionRowSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 1,
  mb: 2,
});

export const getAuthCryptoPanelEnterSx = (tab: number) => ({
  animation: 'authCryptoPanelEnter 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes authCryptoPanelEnter': {
    from: {
      opacity: 0,
      transform: tab === 0 ? 'translateX(-10px)' : 'translateX(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
});
