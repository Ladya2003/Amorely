import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import MediaFilePicker from '../common/MediaFilePicker';
import { getVideoLimitsHint } from '../../localization/calendarHelpers';

interface ChatReportModalProps {
  open: boolean;
  onClose: () => void;
  contactName: string;
  onSubmit: (text: string, files: File[]) => Promise<void>;
}

const ChatReportModal: React.FC<ChatReportModalProps> = ({
  open,
  onClose,
  contactName,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setText('');
    setFiles([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t('chat.report.textRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(trimmed, files);
      setText('');
      setFiles([]);
      onClose();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || t('chat.report.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportOutlinedIcon color="warning" />
          {t('chat.report.title')}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('chat.report.subtitle', { name: contactName })}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          required
          multiline
          minRows={3}
          maxRows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('chat.report.textPlaceholder')}
          disabled={isSubmitting}
          inputProps={{ maxLength: 5000 }}
        />

        <Box sx={{ mt: 2 }}>
          <MediaFilePicker
            inputId="chat-report-media-upload"
            files={files}
            onFilesChange={setFiles}
            disabled={isSubmitting}
            label={t('chat.report.mediaLabel')}
            onError={(message) => setError(message)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {getVideoLimitsHint(t)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('chat.dialog.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? t('chat.report.submitting') : t('chat.report.submit')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default ChatReportModal;
