import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  fetchCoupleDistanceStatus,
  shareCurrentLocation,
  type CoupleDistanceStatus,
} from '../../services/coupleDistanceService';
import { formatDistanceKm, mapGeolocationError, requestCurrentPosition } from '../../utils/geoDistance';
import { getCoupleDistanceAccentColor } from './feedCoupleAvatarsStyles';

type DialogView =
  | 'intro'
  | 'loading'
  | 'distance'
  | 'partnerPending'
  | 'permissionDenied'
  | 'unsupported'
  | 'error';

interface CoupleDistanceDialogProps {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  onDistanceUpdated?: (distanceKm: number | null) => void;
}

const CoupleDistanceDialog: React.FC<CoupleDistanceDialogProps> = ({
  open,
  onClose,
  partnerName,
  onDistanceUpdated,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [view, setView] = useState<DialogView>('intro');
  const [status, setStatus] = useState<CoupleDistanceStatus | null>(null);

  const applyStatus = useCallback(
    (nextStatus: CoupleDistanceStatus) => {
      setStatus(nextStatus);
      onDistanceUpdated?.(nextStatus.distanceKm);

      if (nextStatus.distanceKm != null) {
        setView('distance');
        return;
      }

      if (nextStatus.myLocationShared && !nextStatus.partnerLocationShared) {
        setView('partnerPending');
        return;
      }

      setView('intro');
    },
    [onDistanceUpdated]
  );

  const refreshStatus = useCallback(async () => {
    const nextStatus = await fetchCoupleDistanceStatus();
    applyStatus(nextStatus);
    return nextStatus;
  }, [applyStatus]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setView('loading');
      try {
        const nextStatus = await fetchCoupleDistanceStatus();
        if (cancelled) {
          return;
        }
        applyStatus(nextStatus);
      } catch {
        if (!cancelled) {
          setView('error');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, applyStatus]);

  const handleEnableLocation = async () => {
    setView('loading');

    try {
      const position = await requestCurrentPosition();
      await shareCurrentLocation(position.coords.latitude, position.coords.longitude);
      await refreshStatus();
    } catch (error) {
      const code = mapGeolocationError(error);
      if (code === 'unsupported') {
        setView('unsupported');
        return;
      }
      if (code === 'denied') {
        setView('permissionDenied');
        return;
      }
      setView('error');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const distanceLabel =
    status?.distanceKm != null
      ? t('feed.coupleDistance.result', { distance: formatDistanceKm(status.distanceKm) })
      : null;

  return (
    <ResponsiveDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MyLocationOutlinedIcon color="primary" fontSize="small" />
        {t('feed.coupleDistance.title')}
      </DialogTitle>
      <DialogContent>
        {view === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {view === 'intro' && (
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.65 }}>
            {t('feed.coupleDistance.intro', { partnerName })}
          </Typography>
        )}

        {view === 'distance' && distanceLabel && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography
              variant="h4"
              component="p"
              sx={{ fontWeight: 800, color: getCoupleDistanceAccentColor(theme), mb: 1 }}
            >
              {distanceLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {t('feed.coupleDistance.distanceHint')}
            </Typography>
          </Box>
        )}

        {view === 'partnerPending' && (
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.65 }}>
            {t('feed.coupleDistance.partnerPending', { partnerName })}
          </Typography>
        )}

        {view === 'permissionDenied' && (
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.65 }}>
            {t('feed.coupleDistance.permissionDenied')}
          </Typography>
        )}

        {view === 'unsupported' && (
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.65 }}>
            {t('feed.coupleDistance.unsupported')}
          </Typography>
        )}

        {view === 'error' && (
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.65 }}>
            {t('feed.coupleDistance.error')}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {(view === 'intro' || view === 'partnerPending') && (
          <Button onClick={() => void handleEnableLocation()} variant="contained">
            {t('feed.coupleDistance.enableButton')}
          </Button>
        )}
        {view === 'distance' && (
          <Button onClick={() => void handleEnableLocation()} variant="outlined">
            {t('feed.coupleDistance.refreshButton')}
          </Button>
        )}
        <Button onClick={handleClose} variant={view === 'intro' || view === 'partnerPending' ? 'text' : 'contained'}>
          {t('feed.coupleDistance.close')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default CoupleDistanceDialog;
