import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import PublicSiteLayout from '../components/Legal/PublicSiteLayout';
import {
  getSupportCardSx,
  getSupportIconWrapSx,
} from '../components/Legal/legalPageStyles';
import AppTextField from '../components/UI/AppTextField';
import { ArrowBackIcon, FavoriteIcon, SendIcon } from '../components/UI/icons';
import { getAuthPrimaryButtonSx } from '../components/Auth/authPageStyles';
import { useAuth } from '../contexts/AuthContext';
import { buildWebPageJsonLd } from '../legal/publicJsonLd';
import { PUBLIC_PATHS, SUPPORT_EMAIL, getPublicHomePath } from '../legal/publicSite';
import { submitPublicSupportMessage } from '../services/supportService';

const MIN_MESSAGE_LENGTH = 8;

const SupportPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const jsonLd = useMemo(
    () => [
      buildWebPageJsonLd({
        path: PUBLIC_PATHS.support,
        title: t('legal.support.documentTitle'),
        description: t('legal.support.documentDescription'),
        locale: i18n.language,
        type: 'ContactPage',
      }),
    ],
    [i18n.language, t]
  );
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError(t('legal.support.errors.fillAllFields'));
      return;
    }
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError(t('legal.support.errors.tooShort'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitPublicSupportMessage({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError(t('legal.support.errors.sendFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicSiteLayout
      documentTitle={t('legal.support.documentTitle')}
      documentDescription={t('legal.support.documentDescription')}
      keywords={t('legal.support.keywords')}
      seoPath={PUBLIC_PATHS.support}
      jsonLd={jsonLd}
      maxWidth="sm"
    >
      <Link
        component={RouterLink}
        to={getPublicHomePath(isAuthenticated)}
        underline="none"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 2.5,
          color: 'text.secondary',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        {t('legal.backHome')}
      </Link>

      <Box component="form" onSubmit={handleSubmit} sx={getSupportCardSx(theme)}>
        <Box sx={getSupportIconWrapSx(theme)}>
          <FavoriteIcon />
        </Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.75 }}>
          {t('legal.support.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('legal.support.subtitle')}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }} onClose={() => setSuccess(false)}>
            {t('legal.support.success')}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <AppTextField
          margin="normal"
          required
          fullWidth
          label={t('legal.support.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
        />
        <AppTextField
          margin="normal"
          required
          fullWidth
          type="email"
          label={t('legal.support.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        <AppTextField
          margin="normal"
          required
          fullWidth
          multiline
          minRows={4}
          label={t('legal.support.message')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          startIcon={<SendIcon />}
          disabled={isSubmitting}
          sx={{ ...getAuthPrimaryButtonSx(theme), mt: 2 }}
        >
          {isSubmitting ? t('legal.support.submitting') : t('legal.support.submit')}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, textAlign: 'center' }}>
        {t('legal.support.orWrite')}{' '}
        <Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover" color="primary" sx={{ fontWeight: 700 }}>
          {SUPPORT_EMAIL}
        </Link>
      </Typography>
    </PublicSiteLayout>
  );
};

export default SupportPage;
