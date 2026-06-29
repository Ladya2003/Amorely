import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import CurrencyGuideDialog from './CurrencyGuideDialog';

const getTintedCurrencyBackground = (theme: Theme, hovered = false) => {
  const { primary } = theme.palette;

  if (theme.palette.mode === 'light') {
    return hovered
      ? `linear-gradient(125deg, ${alpha(primary.dark, 0.72)} 0%, ${alpha(primary.main, 0.88)} 40%, ${alpha(primary.light, 1)} 100%)`
      : `linear-gradient(125deg, ${alpha(primary.dark, 0.62)} 0%, ${alpha(primary.main, 0.78)} 40%, ${alpha(primary.light, 0.96)} 100%)`;
  }

  return hovered
    ? `linear-gradient(125deg, ${alpha(primary.dark, 0.95)} 0%, ${alpha(primary.main, 0.78)} 40%, ${alpha(primary.light, 0.52)} 100%)`
    : `linear-gradient(125deg, ${alpha(primary.dark, 0.88)} 0%, ${alpha(primary.main, 0.68)} 40%, ${alpha(primary.light, 0.42)} 100%)`;
};

interface CurrencyBadgeProps {
  balance: number;
  size?: 'small' | 'medium';
  showGuideOnClick?: boolean;
  variant?: 'gold' | 'tinted';
}

const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  balance,
  size = 'medium',
  showGuideOnClick = true,
  variant = 'gold',
}) => {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);
  const iconSize = size === 'small' ? 22 : 26;
  const fontSize = size === 'small' ? '1rem' : '1.1rem';
  const isTinted = variant === 'tinted';

  const handleClick = () => {
    if (showGuideOnClick) {
      setGuideOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showGuideOnClick) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setGuideOpen(true);
    }
  };

  return (
    <>
      <Box
        role={showGuideOnClick ? 'button' : undefined}
        tabIndex={showGuideOnClick ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={showGuideOnClick ? t('pets.currencyGuide.openHint') : undefined}
        sx={(theme) => ({
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.6,
          borderRadius: 999,
          cursor: showGuideOnClick ? 'pointer' : 'default',
          transition: 'background 0.2s ease, transform 0.15s ease',
          ...(isTinted
            ? {
                background: getTintedCurrencyBackground(theme),
                border: `1px solid ${alpha(theme.palette.primary.dark, theme.palette.mode === 'light' ? 0.42 : 0.55)}`,
                boxShadow: `0 3px 14px ${alpha(theme.palette.primary.main, 0.32)}, inset 0 1px 0 ${alpha('#fff', theme.palette.mode === 'light' ? 0.55 : 0.16)}`,
                '&:hover': showGuideOnClick
                  ? {
                      background: getTintedCurrencyBackground(theme, true),
                    }
                  : {},
              }
            : {
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                '&:hover': showGuideOnClick
                  ? {
                      bgcolor: 'rgba(255, 215, 0, 0.28)',
                    }
                  : {},
              }),
          ...(showGuideOnClick && {
            '&:active': {
              transform: 'scale(0.98)',
            },
          }),
        })}
      >
        <CurrencyCoinIcon size={iconSize} />
        <Typography
          variant="body2"
          fontWeight={700}
          sx={(theme) => ({
            fontSize,
            color: isTinted
              ? theme.palette.mode === 'light'
                ? theme.palette.primary.dark
                : theme.palette.primary.contrastText
              : '#B8860B',
            textShadow: isTinted
              ? theme.palette.mode === 'light'
                ? `0 1px 0 ${alpha('#fff', 0.7)}`
                : '0 1px 3px rgba(0, 0, 0, 0.45)'
              : 'none',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '2.75ch',
            textAlign: 'right',
          })}
        >
          {balance}
        </Typography>
      </Box>

      {showGuideOnClick && (
        <CurrencyGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
      )}
    </>
  );
};

export default CurrencyBadge;
