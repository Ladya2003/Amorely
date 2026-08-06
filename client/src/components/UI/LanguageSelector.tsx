import React, { useId, useState } from 'react';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  alpha,
  lighten,
  useTheme,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppLocale,
  BILINGUAL_LANGUAGE_LABEL,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  SUPPORTED_LOCALES,
  resolveAppLocale,
} from '../../localization/locale';
import { getLandingPath, isLandingLocaleSegment } from '../../localization/landingLocale';
import { persistAppLocale } from '../../localization/localeSync';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../theme/surfaceStyles';

const ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);
const MENU_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.65);

interface LanguageSelectorProps {
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  bilingualLabel?: boolean;
  /** When on `/{lang}` landing, change language by navigating to the sibling path. */
  syncLandingPath?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  size = 'small',
  fullWidth = false,
  bilingualLabel = false,
  syncLandingPath = false,
}) => {
  const theme = useTheme();
  const menuId = useId();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, token, updateUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const currentLocale = resolveAppLocale(i18n.language);
  const open = Boolean(anchorEl);
  const isLight = theme.palette.mode === 'light';
  const accent = isLight
    ? theme.palette.primary.main
    : lighten(theme.palette.primary.main, 0.45);
  const ariaLabel = bilingualLabel ? BILINGUAL_LANGUAGE_LABEL : t('settings.language');

  const handleSelect = (locale: AppLocale) => {
    setAnchorEl(null);
    if (locale === currentLocale) {
      return;
    }

    const pathSegment = location.pathname.split('/').filter(Boolean)[0];
    const onLandingPath = syncLandingPath && isLandingLocaleSegment(pathSegment);

    void persistAppLocale(locale, {
      userId: user?._id,
      token: token ?? undefined,
    }).then((savedLocale) => {
      if (user) {
        updateUser({ ...user, locale: savedLocale });
      }
      if (onLandingPath) {
        // Full reload so Ctrl+U / document source match the locale HTML
        // (client-side navigate keeps the previously loaded index.html).
        window.location.assign(
          `${getLandingPath(savedLocale)}${location.search}${location.hash}`
        );
        return;
      }
    });
  };

  return (
    <>
      <Button
        id={`${menuId}-button`}
        aria-controls={open ? `${menuId}-menu` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : undefined}
        aria-label={ariaLabel}
        size={size}
        fullWidth={fullWidth}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<TranslateRoundedIcon sx={{ fontSize: '1.05rem !important' }} />}
        endIcon={
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: '1.15rem !important',
              ml: -0.25,
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        }
        sx={{
          minWidth: fullWidth ? undefined : 88,
          px: 1.25,
          py: size === 'small' ? 0.5 : 0.75,
          borderRadius: `${ACTION_RADIUS}px`,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          color: accent,
          border: `1px solid ${alpha(accent, isLight ? 0.28 : 0.55)}`,
          bgcolor: alpha(accent, isLight ? 0.04 : 0.1),
          boxShadow: 'none',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
          '&:hover': {
            borderColor: alpha(accent, isLight ? 0.42 : 0.75),
            bgcolor: alpha(accent, isLight ? 0.1 : 0.16),
          },
          '& .MuiButton-startIcon': {
            mr: 0.75,
          },
          '& .MuiButton-endIcon': {
            ml: 0.25,
          },
        }}
      >
        {LOCALE_SHORT_LABELS[currentLocale]}
      </Button>

      <Menu
        id={`${menuId}-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': `${menuId}-button`,
          role: 'listbox',
          dense: true,
          sx: { py: 0.75 },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 220,
              overflow: 'hidden',
              borderRadius: `${MENU_RADIUS}px`,
              border: `1px solid ${alpha(
                theme.palette.primary.main,
                isLight ? 0.14 : 0.28
              )}`,
              boxShadow: isLight
                ? `0 16px 40px ${alpha(theme.palette.common.black, 0.1)}`
                : `0 18px 44px ${alpha(theme.palette.common.black, 0.42)}`,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              ...getPrimaryTintSurface(theme, {
                tint: { light: 0.08, dark: 0.22 },
              }),
            },
          },
        }}
      >
        <Box sx={{ px: 1.75, pt: 1, pb: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {ariaLabel}
          </Typography>
        </Box>

        {SUPPORTED_LOCALES.map((locale) => {
          const selected = locale === currentLocale;
          return (
            <MenuItem
              key={locale}
              selected={selected}
              onClick={() => handleSelect(locale)}
              role="option"
              aria-selected={selected}
              sx={{
                mx: 0.75,
                my: 0.15,
                px: 1.1,
                py: 0.85,
                borderRadius: `${ACTION_RADIUS}px`,
                gap: 1.25,
                transition: 'background-color 0.18s ease',
                '&.Mui-selected': {
                  bgcolor: alpha(accent, isLight ? 0.12 : 0.2),
                  '&:hover': {
                    bgcolor: alpha(accent, isLight ? 0.16 : 0.26),
                  },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, isLight ? 0.08 : 0.14),
                },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: `${Math.round(ACTION_RADIUS * 0.75)}px`,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: selected ? accent : 'text.secondary',
                  bgcolor: alpha(accent, selected ? (isLight ? 0.16 : 0.24) : isLight ? 0.08 : 0.14),
                  border: `1px solid ${alpha(accent, selected ? 0.35 : isLight ? 0.12 : 0.22)}`,
                }}
              >
                {LOCALE_SHORT_LABELS[locale]}
              </Box>
              <ListItemText
                primary={LOCALE_LABELS[locale]}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 500,
                  fontSize: '0.9rem',
                  letterSpacing: '-0.01em',
                }}
              />
              <ListItemIcon
                sx={{
                  minWidth: 24,
                  justifyContent: 'flex-end',
                  color: accent,
                  opacity: selected ? 1 : 0,
                  transform: selected ? 'scale(1)' : 'scale(0.7)',
                  transition: 'opacity 0.18s ease, transform 0.18s ease',
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageSelector;
