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
import type { ChatHistoryRestoreProgress } from '../../crypto/chatRestoreRewrap';

interface ChatHistoryRestoreProgressDialogProps {
  open: boolean;
  progress: ChatHistoryRestoreProgress | null;
  error: string | null;
  done: boolean;
  onClose: () => void;
}

const ChatHistoryRestoreProgressDialog: React.FC<ChatHistoryRestoreProgressDialogProps> = ({
  open,
  progress,
  error,
  done,
  onClose
}) => {
  const { t } = useTranslation();
  const total = Math.max(progress?.total || 0, 1);
  const processed = (progress?.restored || 0) + (progress?.failed || 0);
  const percent = done ? 100 : Math.min(99, Math.round((processed / total) * 100));

  return (
    <ResponsiveDialog open={open} onClose={done || error ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {error
          ? t('chat.restore.progressFailedTitle')
          : done
            ? t('chat.restore.progressDoneTitle')
            : t('chat.restore.progressTitle')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error || (done ? t('chat.restore.progressDoneBody') : t('chat.restore.progressBody'))}
        </Typography>
        <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, height: 8 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
          {t('chat.restore.progressCounts', {
            restored: progress?.restored || 0,
            failed: progress?.failed || 0,
            total: progress?.total || 0
          })}
        </Typography>
      </DialogContent>
      {(done || error) && (
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            {t('chat.restore.close')}
          </Button>
        </DialogActions>
      )}
    </ResponsiveDialog>
  );
};

export default ChatHistoryRestoreProgressDialog;
