import React, { useMemo, useState } from 'react';
import { Box, Breadcrumbs, Chip, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import PublicSiteLayout from '../components/Legal/PublicSiteLayout';
import {
  getBlogCardImageSx,
  getBlogCardSx,
  getBlogGridSx,
  getBlogToolbarSx,
} from '../components/Legal/legalPageStyles';
import AppTextField from '../components/UI/AppTextField';
import { useAuth } from '../contexts/AuthContext';
import { filterBlogPosts, type BlogCategoryId } from '../legal/blogPosts';
import { resolveLegalLocale } from '../legal/legalLocale';
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from '../legal/publicJsonLd';
import { PUBLIC_PATHS, getBlogPostPath, getPublicHomePath } from '../legal/publicSite';
import { getPublicAssetPath } from '../utils/publicAssetPath';

const CATEGORIES: Array<BlogCategoryId | 'all'> = ['all', 'product', 'tips', 'updates'];

const getLandingImageSrc = (fileName: string): string =>
  getPublicAssetPath(`landing/${encodeURIComponent(fileName)}`);

const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const locale = resolveLegalLocale(i18n.language);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BlogCategoryId | 'all'>('all');

  const posts = useMemo(
    () => filterBlogPosts(query, category, locale),
    [category, locale, query]
  );
  const jsonLd = useMemo(
    () => [
      buildWebPageJsonLd({
        path: PUBLIC_PATHS.blog,
        title: t('legal.blog.documentTitle'),
        description: t('legal.blog.documentDescription'),
        locale: i18n.language,
        type: 'Blog',
      }),
      buildBreadcrumbJsonLd([
        { name: t('legal.blog.home'), path: '/' },
        { name: t('legal.blog.title'), path: PUBLIC_PATHS.blog },
      ]),
    ],
    [i18n.language, t]
  );

  return (
    <PublicSiteLayout
      documentTitle={t('legal.blog.documentTitle')}
      documentDescription={t('legal.blog.documentDescription')}
      keywords={t('legal.blog.keywords')}
      seoPath={PUBLIC_PATHS.blog}
      jsonLd={jsonLd}
      maxWidth="lg"
    >
      <Breadcrumbs sx={{ mb: 2.5 }}>
        <Link component={RouterLink} to={getPublicHomePath(isAuthenticated)} underline="hover" color="inherit">
          {t('legal.blog.home')}
        </Link>
        <Typography color="text.primary">{t('legal.blog.title')}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
        {t('legal.blog.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 640 }}>
        {t('legal.blog.lead')}
      </Typography>

      <Box sx={getBlogToolbarSx()}>
        <AppTextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label={t('legal.blog.search')}
          inputProps={{ 'aria-label': t('legal.blog.searchAria') }}
          sx={{ maxWidth: { sm: 360 } }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {CATEGORIES.map((id) => (
            <Chip
              key={id}
              label={t(`legal.blog.categories.${id}`)}
              color={category === id ? 'primary' : 'default'}
              variant={category === id ? 'filled' : 'outlined'}
              onClick={() => setCategory(id)}
            />
          ))}
        </Box>
      </Box>

      {posts.length === 0 ? (
        <Typography color="text.secondary">{t('legal.blog.empty')}</Typography>
      ) : (
        <Box sx={getBlogGridSx()}>
          {posts.map((post) => (
            <Box
              key={post.slug}
              component={RouterLink}
              to={getBlogPostPath(post.slug)}
              sx={getBlogCardSx(theme)}
            >
              <Box
                component="img"
                src={getLandingImageSrc(post.imageFile)}
                alt={post.title[locale]}
                sx={getBlogCardImageSx()}
              />
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                <Chip
                  size="small"
                  label={t(`legal.blog.categories.${post.category}`)}
                  sx={{ alignSelf: 'flex-start' }}
                />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {post.title[locale]}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {post.excerpt[locale]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('legal.blog.readMore')}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

    </PublicSiteLayout>
  );
};

export default BlogPage;
