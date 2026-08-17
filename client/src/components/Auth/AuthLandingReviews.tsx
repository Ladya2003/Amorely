import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import { SITE_ORIGIN } from '../../localization/landingLocale';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingReviewAvatarSx,
  getAuthLandingReviewCardSx,
  getAuthLandingReviewHeaderSx,
  getAuthLandingReviewNameSx,
  getAuthLandingReviewQuoteSx,
  getAuthLandingReviewsLeadSx,
  getAuthLandingReviewsListSx,
  getAuthLandingReviewsSx,
  getAuthLandingReviewsTitleSx,
} from './authPageStyles';

const REVIEW_IDS = ['anya', 'arseniy', 'tanya', 'lesha', 'andrey'] as const;

const getReviewPhotoSrc = (id: (typeof REVIEW_IDS)[number]): string =>
  getPublicAssetPath(`landing/reviews/${id}.jpg`);

const AuthLandingReviews: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const reviews = useMemo(
    () =>
      REVIEW_IDS.map((id) => ({
        id,
        name: t(`auth.landing.reviews.items.${id}.name`),
        quote: t(`auth.landing.reviews.items.${id}.quote`),
        imageAlt: t(`auth.landing.reviews.items.${id}.imageAlt`),
        photoSrc: getReviewPhotoSrc(id),
      })),
    [t, i18n.language]
  );

  return (
    <Box
      component="section"
      aria-label={t('auth.landing.reviews.ariaLabel')}
      sx={getAuthLandingReviewsSx()}
    >
      <RevealOnScroll>
        <Typography component="h2" sx={getAuthLandingReviewsTitleSx()}>
          {t('auth.landing.reviews.title')}
        </Typography>
        <Typography sx={getAuthLandingReviewsLeadSx()}>
          {t('auth.landing.reviews.lead')}
        </Typography>
      </RevealOnScroll>

      <Box sx={getAuthLandingReviewsListSx()}>
        {reviews.map((review, index) => (
          <RevealOnScroll key={review.id} delayMs={(index % 3) * 40}>
            <Box
              component="article"
              itemScope
              itemType="https://schema.org/Review"
              sx={getAuthLandingReviewCardSx(theme)}
            >
              <Box sx={getAuthLandingReviewHeaderSx()}>
                <Box
                  component="img"
                  src={review.photoSrc}
                  alt={review.imageAlt}
                  width={160}
                  height={160}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  itemProp="image"
                  sx={getAuthLandingReviewAvatarSx()}
                />
                <Typography
                  component="h3"
                  itemScope
                  itemProp="author"
                  itemType="https://schema.org/Person"
                  sx={getAuthLandingReviewNameSx()}
                >
                  <Box component="span" itemProp="name">
                    {review.name}
                  </Box>
                </Typography>
              </Box>
              <Typography
                component="blockquote"
                itemProp="reviewBody"
                sx={getAuthLandingReviewQuoteSx()}
              >
                {review.quote}
              </Typography>
              <Box
                itemScope
                itemProp="itemReviewed"
                itemType="https://schema.org/WebApplication"
                sx={{ display: 'none' }}
              >
                <meta itemProp="name" content="Amorely" />
                <meta itemProp="url" content={`${SITE_ORIGIN}/`} />
              </Box>
            </Box>
          </RevealOnScroll>
        ))}
      </Box>
    </Box>
  );
};

export default AuthLandingReviews;
