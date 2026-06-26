import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Portal, Typography } from '@mui/material';
import CurrencyCoinIcon from './CurrencyCoinIcon';
import { CURRENCY_UPDATED_EVENT } from '../../utils/currencyEvents';

const FLOAT_ANIMATION_MS = 2200;

interface FloatAward {
  id: number;
  amount: number;
  offsetX: number;
}

const floatTextSx = {
  color: '#fff',
  fontWeight: 800,
  fontSize: '1.85rem',
  lineHeight: 1,
  textShadow: '0 2px 12px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.8)',
} as const;

const CurrencyAwardOverlay: React.FC = () => {
  const [floats, setFloats] = useState<FloatAward[]>([]);
  const idRef = useRef(0);

  const spawnAward = useCallback((amount: number) => {
    const id = idRef.current + 1;
    idRef.current = id;
    const offsetX = Math.round((Math.random() - 0.5) * 48);

    setFloats((prev) => [...prev, { id, amount, offsetX }]);

    window.setTimeout(() => {
      setFloats((prev) => prev.filter((item) => item.id !== id));
    }, FLOAT_ANIMATION_MS);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ awardedAmount?: number }>).detail;
      if (detail?.awardedAmount && detail.awardedAmount > 0) {
        spawnAward(detail.awardedAmount);
      }
    };

    window.addEventListener(CURRENCY_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CURRENCY_UPDATED_EVENT, handler);
  }, [spawnAward]);

  if (floats.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: (theme) => theme.zIndex.snackbar + 2,
          '@keyframes currencyAwardFloatUp': {
            '0%': {
              opacity: 1,
              transform: 'translate(-50%, -50%) scale(0.92)',
            },
            '15%': {
              opacity: 1,
              transform: 'translate(-50%, -50%) scale(1.08)',
            },
            '70%': {
              opacity: 1,
              transform: 'translate(-50%, calc(-50% - 72px)) scale(1.08)',
            },
            '100%': {
              opacity: 0,
              transform: 'translate(-50%, calc(-50% - 96px)) scale(1.12)',
            },
          },
        }}
      >
        {floats.map((item) => (
          <Box
            key={item.id}
            sx={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${item.offsetX}px)`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2.25,
              py: 1.25,
              borderRadius: 3,
              bgcolor: 'rgba(20, 20, 24, 0.82)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              animation: `currencyAwardFloatUp ${FLOAT_ANIMATION_MS}ms ease-in-out forwards`,
            }}
          >
            <Typography component="span" sx={floatTextSx}>
              +
            </Typography>
            <CurrencyCoinIcon size={36} sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
            <Typography component="span" sx={floatTextSx}>
              {item.amount}
            </Typography>
          </Box>
        ))}
      </Box>
    </Portal>
  );
};

export default CurrencyAwardOverlay;
