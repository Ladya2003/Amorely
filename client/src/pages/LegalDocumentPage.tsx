import React, { useMemo } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import PublicSiteLayout from '../components/Legal/PublicSiteLayout';
import { getLegalArticleSx } from '../components/Legal/legalPageStyles';
import { getLegalDocument, type LegalDocId } from '../legal/legalDocuments';
import { resolveLegalLocale, type LegalLocale } from '../legal/legalLocale';
import { buildLegalArticleJsonLd } from '../legal/publicJsonLd';
import { LEGAL_UPDATED_AT, PUBLIC_PATHS, getPublicHomePath } from '../legal/publicSite';
import { useAuth } from '../contexts/AuthContext';
import { ArrowBackIcon } from '../components/UI/icons';

const formatLegalUpdatedAt = (isoDate: string, locale: LegalLocale): string =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

type LegalDocumentPageProps = {
  docId: LegalDocId;
};

const TITLE_KEYS: Record<LegalDocId, string> = {
  terms: 'legal.pages.terms.title',
  privacy: 'legal.pages.privacy.title',
  offer: 'legal.pages.offer.title',
  payment: 'legal.pages.payment.title',
};

const DESC_KEYS: Record<LegalDocId, string> = {
  terms: 'legal.pages.terms.description',
  privacy: 'legal.pages.privacy.description',
  offer: 'legal.pages.offer.description',
  payment: 'legal.pages.payment.description',
};

const KEYWORD_KEYS: Record<LegalDocId, string> = {
  terms: 'legal.pages.terms.keywords',
  privacy: 'legal.pages.privacy.keywords',
  offer: 'legal.pages.offer.keywords',
  payment: 'legal.pages.payment.keywords',
};

const SEO_PATHS: Record<LegalDocId, string> = {
  terms: PUBLIC_PATHS.terms,
  privacy: PUBLIC_PATHS.privacy,
  offer: PUBLIC_PATHS.offer,
  payment: PUBLIC_PATHS.payment,
};

const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({ docId }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const locale = resolveLegalLocale(i18n.language);
  const document = getLegalDocument(docId, locale);
  const updatedAtLabel = formatLegalUpdatedAt(LEGAL_UPDATED_AT, locale);
  const title = t(TITLE_KEYS[docId]);
  const description = t(DESC_KEYS[docId]);
  const seoPath = SEO_PATHS[docId];
  const jsonLd = useMemo(
    () => [
      buildLegalArticleJsonLd({
        path: seoPath,
        title,
        description,
        locale,
        dateModified: LEGAL_UPDATED_AT,
        document,
      }),
    ],
    [description, document, locale, seoPath, title]
  );

  return (
    <PublicSiteLayout
      documentTitle={title}
      documentDescription={description}
      keywords={t(KEYWORD_KEYS[docId])}
      seoPath={seoPath}
      jsonLd={jsonLd}
    >
      <Box sx={getLegalArticleSx()}>
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

        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
          {t(TITLE_KEYS[docId])}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('legal.updatedAt', { date: updatedAtLabel })}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
          {document.intro}
        </Typography>

        {document.sections.map((section) => (
          <Box key={section.title} component="section" sx={{ mb: 3 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.25 }}>
              {section.title}
            </Typography>
            {section.paragraphs.map((paragraph) => (
              <Typography key={paragraph} variant="body2" sx={{ mb: 1.25, lineHeight: 1.7 }}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </PublicSiteLayout>
  );
};

export default LegalDocumentPage;
