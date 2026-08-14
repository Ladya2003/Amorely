import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import {
  submitAdminRequest,
  type AdminRequestCategory,
} from '../../../services/adminRequestService';
import AdminBadgeExamples from './AdminBadgeExamples';
import { ADMIN_REQUEST_INNER_RADIUS } from './adminRequestStyles';

const CATEGORIES: AdminRequestCategory[] = ['question', 'feature', 'bug', 'other'];
const MIN_TEXT_LENGTH = 8;

const AdminRequestForm: React.FC = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<AdminRequestCategory>('question');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mapSubmitError = (code?: string) => {
    switch (code) {
      case 'text_required':
        return t('feed.adminRequest.textRequired');
      case 'text_too_short':
        return t('feed.adminRequest.textTooShort');
      case 'too_many_open':
        return t('feed.adminRequest.tooManyOpen');
      case 'invalid_category':
      case 'text_too_long':
      case 'submit_failed':
      case undefined:
        return t('feed.adminRequest.error');
      default:
        return t('feed.adminRequest.error');
    }
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t('feed.adminRequest.textRequired'));
      return;
    }
    if (trimmed.length < MIN_TEXT_LENGTH) {
      setError(t('feed.adminRequest.textTooShort'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitAdminRequest({ category, text: trimmed });
      setSuccess(true);
      setText('');
    } catch (submitError: unknown) {
      const axiosError = submitError as { response?: { data?: { error?: string } } };
      setError(mapSubmitError(axiosError.response?.data?.error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2.25,
          p: 1.75,
          borderRadius: `${ADMIN_REQUEST_INNER_RADIUS}px`,
          bgcolor: (currentTheme) =>
            currentTheme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.48)'
              : 'rgba(0,0,0,0.16)',
        }}
      >
        <AdminBadgeExamples />
      </Box>

      {success ? (
        <Alert severity="success" onClose={() => setSuccess(false)}>
          {t('feed.adminRequest.success')}
        </Alert>
      ) : (
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {t('feed.adminRequest.categoryLabel')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
            {CATEGORIES.map((item) => (
              <Chip
                key={item}
                label={t(`feed.adminRequest.categories.${item}`)}
                onClick={() => setCategory(item)}
                color={category === item ? 'primary' : 'default'}
                variant={category === item ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('feed.adminRequest.textPlaceholder')}
            disabled={isSubmitting}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 999,
                px: 2.25,
              }}
            >
              {isSubmitting ? t('feed.adminRequest.submitting') : t('feed.adminRequest.submit')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminRequestForm;
