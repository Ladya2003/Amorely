import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import CurrencyGuideDialog from './CurrencyGuideDialog';

interface CurrencyBadgeProps {
  balance: number;
  size?: 'small' | 'medium';
  showGuideOnClick?: boolean;
}

const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  balance,
  size = 'medium',
  showGuideOnClick = true,
}) => {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);
  const iconSize = size === 'small' ? 20 : 28;
  const fontSize = size === 'small' ? '0.85rem' : '1rem';

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
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: 'rgba(255, 215, 0, 0.15)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          cursor: showGuideOnClick ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          ...(showGuideOnClick && {
            '&:hover': {
              bgcolor: 'rgba(255, 215, 0, 0.28)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }),
        }}
      >
        <CurrencyCoinIcon size={iconSize} />
        <Typography variant="body2" fontWeight={700} sx={{ fontSize, color: '#B8860B' }}>
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
