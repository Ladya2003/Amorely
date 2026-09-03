import React, { useMemo } from 'react';
import { Box, Breadcrumbs, Chip, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import PublicSiteLayout from '../components/Legal/PublicSiteLayout';
import { getBlogHeroImageSx, getLegalArticleSx } from '../components/Legal/legalPageStyles';
import { useAuth } from '../contexts/AuthContext';
import { getBlogPostBySlug } from '../legal/blogPosts';
import { resolveLegalLocale } from '../legal/legalLocale';
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  getBlogOgImageUrl,
} from '../legal/publicJsonLd';
import { PUBLIC_PATHS, getBlogPostPath, getPublicHomePath } from '../legal/publicSite';
import { getBlogImageSrc } from '../utils/publicAssetPath';

const BlogPostPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const locale = resolveLegalLocale(i18n.language);
  const post = getBlogPostBySlug(slug);
  const seoPath = post ? getBlogPostPath(post.slug) : PUBLIC_PATHS.blog;
  const ogImageUrl = post ? getBlogOgImageUrl(post.imageFile) : undefined;
  const jsonLd = useMemo(() => {
    if (!post || !ogImageUrl) {
      return [];
    }
    return [
      buildBlogPostingJsonLd({ post, locale, imageUrl: ogImageUrl }),
      buildBreadcrumbJsonLd([
        { name: t('legal.blog.home'), path: '/' },
        { name: t('legal.blog.title'), path: PUBLIC_PATHS.blog },
        { name: post.title[locale], path: seoPath },
      ]),
    ];
  }, [locale, ogImageUrl, post, seoPath, t]);

  if (!post || !ogImageUrl) {
    return <Navigate to={PUBLIC_PATHS.blog} replace />;
  }

  return (
    <PublicSiteLayout
      documentTitle={post.title[locale]}
      documentDescription={post.excerpt[locale]}
      keywords={t('legal.blog.keywords')}
      seoPath={seoPath}
      ogType="article"
      ogImage={{ url: ogImageUrl, alt: post.title[locale] }}
      jsonLd={jsonLd}
    >
      <Box sx={getLegalArticleSx()}>
        <Breadcrumbs sx={{ mb: 2.5 }}>
          <Link component={RouterLink} to={getPublicHomePath(isAuthenticated)} underline="hover" color="inherit">
            {t('legal.blog.home')}
          </Link>
          <Link component={RouterLink} to={PUBLIC_PATHS.blog} underline="hover" color="inherit">
            {t('legal.blog.title')}
          </Link>
          <Typography color="text.primary">{post.title[locale]}</Typography>
        </Breadcrumbs>

        <Chip size="small" label={t(`legal.blog.categories.${post.category}`)} sx={{ mb: 1.5 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
          {post.title[locale]}
        </Typography>
        <Box
          component="img"
          src={getBlogImageSrc(post.imageFile)}
          alt={post.title[locale]}
          sx={getBlogHeroImageSx(theme)}
        />
        {post.paragraphs[locale].map((paragraph) => (
          <Typography key={paragraph} variant="body1" sx={{ mb: 2, lineHeight: 1.75 }}>
            {paragraph}
          </Typography>
        ))}
      </Box>
    </PublicSiteLayout>
  );
};

export default BlogPostPage;
