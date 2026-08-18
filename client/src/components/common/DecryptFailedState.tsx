import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../Feed/feedBannerStyles';
import { APP_OPAQUE_SURFACE_CLASS } from '../../theme/modalStyles';
import type { CryptoRecoveryContext } from '../../services/cryptoRecoveryService';
import CryptoRecoveryRequestDialog from './CryptoRecoveryRequestDialog';
import MemoryRestoreRequestDialog from './MemoryRestoreRequestDialog';
import { usePartnerId } from '../../hooks/usePartnerId';
import { LockOutlinedIcon } from '../UI/icons';

interface DecryptFailedStateProps {
  variant?: 'compact' | 'full';
  context?: CryptoRecoveryContext;
  minHeight?: number;
}

const CLICK_THROUGH_GUARD_MS = 450;

const DecryptFailedState: React.FC<DecryptFailedStateProps> = ({
  variant = 'full',
  context = 'other',
  minHeight,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memoryRestoreOpen, setMemoryRestoreOpen] = useState(false);
  const partnerId = usePartnerId();
  const canAskPartner = Boolean(partnerId);
  const clickThroughGuardTimerRef = useRef<number | null>(null);
  const isCompact = variant === 'compact';
  const isLight = theme.palette.mode === 'light';

  // Opaque surface so glass-drawer white text / light carousel bg don't kill contrast.
  const surfaceBg = isLight
    ? alpha(theme.palette.primary.main, 0.14)
    : alpha(theme.palette.background.paper, 0.92);
  const titleColor = theme.palette.text.primary;
  const bodyColor = theme.palette.text.secondary;
  const border = `1px solid ${alpha(theme.palette.primary.main, isLight ? 0.18 : 0.32)}`;

  // Stop bubble so parent carousel/media-viewer handlers don't open fullscreen first.
  const stopParentMediaOpen = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
  };

  const openRecoveryDialog = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setDialogOpen(true);
  };

  const armClickThroughGuard = () => {
    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('click', blockEvent, true);
    document.addEventListener('mouseup', blockEvent, true);
    document.addEventListener('pointerup', blockEvent, true);

    if (clickThroughGuardTimerRef.current !== null) {
      window.clearTimeout(clickThroughGuardTimerRef.current);
    }

    clickThroughGuardTimerRef.current = window.setTimeout(() => {
      document.removeEventListener('click', blockEvent, true);
      document.removeEventListener('mouseup', blockEvent, true);
      document.removeEventListener('pointerup', blockEvent, true);
      clickThroughGuardTimerRef.current = null;
    }, CLICK_THROUGH_GUARD_MS);
  };

  const handleRecoveryDialogClose = () => {
    setDialogOpen(false);
    armClickThroughGuard();
  };

  return (
    <>
      <Box
        className={APP_OPAQUE_SURFACE_CLASS}
        role="status"
        aria-label={t('crypto.decryptMediaFailed')}
        onClick={isCompact ? openRecoveryDialog : stopParentMediaOpen}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: minHeight ?? (isCompact ? 40 : 120),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCompact ? 0 : 1,
          px: isCompact ? 0.5 : 2,
          py: isCompact ? 0.5 : 2,
          textAlign: 'center',
          borderRadius: isCompact ? 'inherit' : `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
          border: isCompact ? 'none' : border,
          boxSizing: 'border-box',
          cursor: isCompact ? 'pointer' : 'default',
          bgcolor: surfaceBg,
          color: titleColor,
          ...(isCompact
            ? {}
            : {
                boxShadow: isLight
                  ? `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
                  : `0 10px 28px ${alpha(theme.palette.common.black, 0.28)}`,
              }),
        }}
      >
        <Box
          sx={{
            width: isCompact ? 22 : 48,
            height: isCompact ? 22 : 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, isLight ? 0.18 : 0.28),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: isCompact ? 14 : 26 }} />
        </Box>

        {!isCompact && (
          <>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                color: `${titleColor} !important`,
              }}
            >
              {t('crypto.decryptMediaFailed')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                maxWidth: 280,
                lineHeight: 1.4,
                color: `${bodyColor} !important`,
              }}
            >
              {t('crypto.recoveryRequest.hint')}
            </Typography>
            {canAskPartner && (
              <Button
                size="small"
                variant="contained"
                onClick={(event) => {
                  event.stopPropagation();
                  setMemoryRestoreOpen(true);
                }}
                sx={{
                  mt: 0.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 1.5,
                }}
              >
                {t('crypto.memoryRestore.cta')}
              </Button>
            )}
            <Button
              size="small"
              variant={canAskPartner ? 'outlined' : 'contained'}
              onClick={openRecoveryDialog}
              sx={{
                mt: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 1.5,
              }}
            >
              {t('crypto.recoveryRequest.cta')}
            </Button>
          </>
        )}
      </Box>

      <CryptoRecoveryRequestDialog
        open={dialogOpen}
        onClose={handleRecoveryDialogClose}
        context={context}
      />
      <MemoryRestoreRequestDialog
        open={memoryRestoreOpen}
        onClose={() => {
          setMemoryRestoreOpen(false);
          armClickThroughGuard();
        }}
      />
    </>
  );
};

export default DecryptFailedState;
