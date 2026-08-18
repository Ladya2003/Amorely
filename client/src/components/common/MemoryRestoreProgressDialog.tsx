import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import type { MemoryRestoreJobProgress } from '../../crypto/memoryRestoreRewrap';

interface MemoryRestoreProgressDialogProps {
  open: boolean;
  progress: MemoryRestoreJobProgress | null;
  error: string | null;
  done: boolean;
  onClose: () => void;
}

const MemoryRestoreProgressDialog: React.FC<MemoryRestoreProgressDialogProps> = ({
  open,
  progress,
  error,
  done,
  onClose
}) => {
  const { t } = useTranslation();
  const total = Math.max(progress?.total || 0, 1);
  const processed = (progress?.events || 0) + (progress?.plans || 0) + (progress?.feed || 0);
  const percent = done ? 100 : Math.min(99, Math.round((processed / total) * 100));

  const stageLabel = (() => {
    switch (progress?.stage) {
      case 'plans':
        return t('crypto.memoryRestore.progress.plans');
      case 'feed':
        return t('crypto.memoryRestore.progress.feed');
      case 'done':
        return t('crypto.memoryRestore.progress.done');
      case 'events':
      default:
        return t('crypto.memoryRestore.progress.events');
    }
  })();

  return (
    <ResponsiveDialog open={open} onClose={done || error ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {error
          ? t('crypto.memoryRestore.progress.failedTitle')
          : done
            ? t('crypto.memoryRestore.progress.doneTitle')
            : t('crypto.memoryRestore.progress.title')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error || (done ? t('crypto.memoryRestore.progress.doneBody') : stageLabel)}
        </Typography>
        <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, height: 8 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
          {t('crypto.memoryRestore.progress.counts', {
            events: progress?.events || 0,
            plans: progress?.plans || 0,
            feed: progress?.feed || 0,
            failed: progress?.failed || 0
          })}
        </Typography>
      </DialogContent>
      {(done || error) && (
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            {t('crypto.memoryRestore.close')}
          </Button>
        </DialogActions>
      )}
    </ResponsiveDialog>
  );
};

export default MemoryRestoreProgressDialog;
