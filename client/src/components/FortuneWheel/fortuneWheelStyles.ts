import { alpha, type Theme } from '@mui/material/styles';
import { getAuthLandingCtaButtonSx } from '../Auth/authPageStyles';

export const FORTUNE_WHEEL_SCENE_IMAGE = `${process.env.PUBLIC_URL ?? ''}/images/fortune-wheel/casino-bg.jpg`;

export const getFortuneWheelPageShellSx = (theme: Theme) => ({
  position: 'fixed' as const,
  inset: 0,
  zIndex: theme.zIndex.drawer,
  width: '100%',
  height: '100dvh',
  maxHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  overscrollBehavior: 'none' as const,
  bgcolor: '#120a07',
  color: '#fff',
});

export const getFortuneWheelSceneBackgroundSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none' as const,
});

export const getFortuneWheelPageRootSx = () => ({
  position: 'relative' as const,
  zIndex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
  minHeight: 0,
});

export const getFortuneWheelHeaderSx = (theme: Theme) => ({
  flexShrink: 0,
  pt: {
    xs: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
    sm: theme.spacing(1.5),
  },
  pb: 0.5,
  px: { xs: 1.5, sm: 2 },
});

export const getFortuneWheelHeaderIconSx = () => ({
  color: '#fff',
  bgcolor: alpha('#fff', 0.1),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  '&:hover': {
    bgcolor: alpha('#fff', 0.18),
  },
  '&.Mui-disabled': {
    color: alpha('#fff', 0.45),
  },
});

export const getFortuneWheelTitleSx = () => ({
  flex: 1,
  minWidth: 0,
  overflowWrap: 'anywhere' as const,
  lineHeight: 1.25,
  color: '#fff',
  textShadow: '0 2px 12px rgba(0,0,0,0.45)',
});

export const getFortuneWheelSpinContentSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  px: 2,
  py: 2,
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

export const getFortuneWheelChallengeTitleSx = () => ({
  maxWidth: 480,
  overflowWrap: 'anywhere' as const,
  lineHeight: 1.3,
  color: '#fff',
  textAlign: 'center' as const,
  textShadow: '0 2px 16px rgba(0,0,0,0.5)',
});

export const getFortuneWheelWheelStageSx = () => ({
  position: 'relative' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: { xs: 1.5, sm: 2 },
  borderRadius: '50%',
  bgcolor: alpha('#fff', 0.06),
  boxShadow: `0 0 0 1px ${alpha('#fff', 0.12)}, 0 18px 48px ${alpha('#000', 0.35)}`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
});

export const getFortuneWheelHintTextSx = () => ({
  maxWidth: 360,
  textAlign: 'center' as const,
  color: alpha('#fff', 0.78),
  textShadow: '0 1px 8px rgba(0,0,0,0.45)',
});

export const getFortuneWheelSpinButtonSx = (theme: Theme) => ({
  ...getAuthLandingCtaButtonSx(theme),
  minWidth: 180,
  borderRadius: 999,
  px: 4,
  py: 1.25,
  fontSize: '1rem',
  textTransform: 'none' as const,
  boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.45)}`,
});

export const getFortuneWheelHubButtonPrimarySx = (theme: Theme) => ({
  ...getFortuneWheelSpinButtonSx(theme),
  minWidth: 220,
});

export const getFortuneWheelHubButtonSecondarySx = () => ({
  minWidth: 220,
  borderRadius: 999,
  px: 4,
  py: 1.25,
  fontSize: '1rem',
  textTransform: 'none' as const,
  color: '#fff',
  borderColor: alpha('#fff', 0.42),
  bgcolor: alpha('#fff', 0.08),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow: `0 8px 24px ${alpha('#000', 0.28)}`,
  '&:hover': {
    borderColor: alpha('#fff', 0.62),
    bgcolor: alpha('#fff', 0.14),
  },
});

export const getFortuneWheelHubContentSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  py: 6,
  px: 2,
  flex: 1,
  minHeight: 0,
});
