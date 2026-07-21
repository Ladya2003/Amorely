import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../theme/surfaceStyles';
import { MODAL_TEXT_SECONDARY_LIGHT } from '../../theme/modalStyles';

const PROFILE_SECTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'soft') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const CONTACT_PROFILE_AVATAR_SIZE = 88;

export const getContactProfileRootSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
  width: '100%',
});

export const getContactProfileHeroSx = () => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1.5,
  width: '100%',
});

export const getContactProfileAvatarWrapSx = () => ({
  pt: 1,
  flexShrink: 0,
});

export const getContactProfileIdentitySx = () => ({
  minWidth: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'flex-start',
  textAlign: 'left' as const,
  pt: 0.25,
  gap: 0.25,
});

export const getContactProfileNameSx = () => ({
  fontWeight: 700,
  fontSize: '1.125rem',
  lineHeight: 1.25,
});

export const getContactProfileMetaSx = () => ({
  fontSize: '0.8125rem',
  lineHeight: 1.35,
  color: 'text.secondary',
});

export const getContactProfileBirthdaySx = (theme: Theme) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  mt: 0.5,
  px: 1,
  py: 0.375,
  borderRadius: '999px',
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.16 },
  }),
});

export const getContactProfileBioSx = (theme: Theme, isPlaceholder: boolean) => ({
  width: '100%',
  px: 1.5,
  py: 1.25,
  borderRadius: `${PROFILE_SECTION_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
  textAlign: 'left' as const,
  '& .MuiTypography-root': {
    fontSize: '0.8125rem',
    lineHeight: 1.55,
    color: theme.palette.mode === 'light' ? MODAL_TEXT_SECONDARY_LIGHT : 'text.secondary',
    fontStyle: isPlaceholder ? 'italic' : 'normal',
  },
});

export const getContactProfileSectionSx = (theme: Theme) => ({
  width: '100%',
  px: 1.5,
  py: 1.25,
  borderRadius: `${PROFILE_SECTION_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
});

export const getContactProfileSectionTitleSx = (theme: Theme) => ({
  display: 'block',
  mb: 0.75,
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: theme.palette.mode === 'light' ? MODAL_TEXT_SECONDARY_LIGHT : 'text.secondary',
  textAlign: 'left' as const,
});

export const getContactProfileDialogContentSx = () => ({
  pt: '4px !important',
  pb: '20px !important',
});
