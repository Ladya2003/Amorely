import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import UserProfileChip from '../components/UI/UserProfileChip';
import { formatCalendarDate } from '../localization/calendarHelpers';
import { getNewsCategoryLabel } from '../localization/newsHelpers';
import NewsDetail from '../components/News/NewsDetail';
import { NewsItem } from '../components/News/NewsCard';
import { useUnreadNews } from '../contexts/UnreadNewsContext';
import { HOME_SCREEN_NEWS_QUERY, isHomeScreenNewsItem } from '../constants/homeScreenNews';
import {
  getNewsCardContentSx,
  getNewsCardDateSx,
  getNewsCardEnterSx,
  getNewsCardExcerptSx,
  getNewsCardMetaSx,
  getNewsCardReadMoreSx,
  getNewsCardSx,
  getNewsCardTitleSx,
  getNewsCategoryChipSx,
  getNewsCategoryRowSx,
  getNewsEmptySx,
  getNewsListScrollSx,
  getNewsListStackSx,
  getNewsLoadingWrapSx,
  getNewsNewBadgeSx,
  getNewsPageHeaderGlowWrapSx,
  getNewsPageHeaderRowSx,
  getNewsPageRootSx,
  getNewsPageTitleSx,
  newsListRevealSx,
  newsPageEnterSx,
} from '../components/News/newsPageStyles';

const NewsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [revealList, setRevealList] = useState(false);
  const { isNewsUnread, markNewsAsRead, syncNewsIds } = useUnreadNews();

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, i18n.language]);

  useEffect(() => {
    const articleParam = searchParams.get('article');
    if (!articleParam || isLoading) {
      return;
    }

    let matchedNews: NewsItem | undefined;
    if (articleParam === HOME_SCREEN_NEWS_QUERY) {
      matchedNews = news.find((item) => isHomeScreenNewsItem(item.title));
    } else {
      matchedNews = news.find((item) => item._id === articleParam);
    }

    if (matchedNews) {
      setSelectedNews(matchedNews);
      markNewsAsRead(matchedNews._id);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('article');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, isLoading, news, markNewsAsRead, setSearchParams]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);

      const params: Record<string, string | number> = {
        page: 1,
        limit: 50,
        locale: i18n.language,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await axios.get(`${API_URL}/api/news`, { params });

      const loadedNews: NewsItem[] = response.data.news;
      setNews(loadedNews);
      if (!selectedCategory) {
        syncNewsIds(loadedNews.map((item) => item._id));
      }
      setIsLoading(false);
    } catch (error) {
      console.error(t('news.errors.loadFailed'), error);
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'update':
        return 'primary';
      case 'event':
        return 'secondary';
      case 'announcement':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleOpenNews = (item: NewsItem) => {
    setRevealList(false);
    setSelectedNews(item);
    markNewsAsRead(item._id);
  };

  const handleCloseNews = useCallback(() => {
    setSelectedNews(null);
    setRevealList(true);
  }, []);

  useEffect(() => {
    if (!revealList) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRevealList(false);
    }, 360);

    return () => window.clearTimeout(timer);
  }, [revealList]);

  const categoryFilters: Array<{ key: string | null; label: string; color?: 'primary' | 'secondary' | 'success' }> = [
    { key: null, label: t('news.filter.all') },
    { key: 'update', label: t('news.filter.updates'), color: 'primary' },
    { key: 'event', label: t('news.filter.events'), color: 'secondary' },
    { key: 'announcement', label: t('news.filter.announcements'), color: 'success' },
  ];

  const isDetailOpen = Boolean(selectedNews);

  return (
    <>
      <Box
        sx={{
          ...getNewsPageRootSx(theme),
          ...(isDetailOpen
            ? {
                visibility: 'hidden',
                pointerEvents: 'none',
              }
            : {}),
        }}
        aria-hidden={isDetailOpen}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            ...(revealList ? newsListRevealSx : newsPageEnterSx),
          }}
        >
          <Box sx={getNewsPageHeaderGlowWrapSx(theme)}>
            <Box sx={getNewsPageHeaderRowSx()}>
              <Typography key={i18n.language} component="h1" sx={getNewsPageTitleSx()}>
                {t('news.title')}
              </Typography>
              <UserProfileChip sx={{ maxWidth: '55%', flexShrink: 0 }} />
            </Box>
          </Box>

          <Box sx={getNewsCategoryRowSx()}>
            {categoryFilters.map(({ key, label, color }) => {
              const selected = selectedCategory === key;
              return (
                <Chip
                  key={key ?? 'all'}
                  label={label}
                  onClick={() => handleCategoryClick(key)}
                  color={selected ? color ?? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={getNewsCategoryChipSx(theme, selected)}
                />
              );
            })}
          </Box>

          {isLoading ? (
            <Box sx={getNewsLoadingWrapSx()}>
              <CircularProgress size={32} />
            </Box>
          ) : news.length === 0 ? (
            <Box sx={{ ...getNewsListScrollSx(), display: 'flex', alignItems: 'center' }}>
              <Box sx={getNewsEmptySx(theme)}>
                <Typography variant="body1" color="text.secondary">
                  {t('news.empty')}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={getNewsListScrollSx()}>
              <Box sx={getNewsListStackSx()}>
                {news.map((item, index) => {
                  const showNewBadge = isNewsUnread(item._id);

                  return (
                    <Box
                      key={item._id}
                      component="button"
                      type="button"
                      onClick={() => handleOpenNews(item)}
                      sx={{ ...getNewsCardSx(theme), ...getNewsCardEnterSx(index) }}
                    >
                      {showNewBadge && (
                        <Chip
                          label={t('news.newBadge')}
                          size="small"
                          color="error"
                          sx={getNewsNewBadgeSx()}
                        />
                      )}
                      <Box sx={getNewsCardContentSx(showNewBadge)}>
                        <Typography component="h2" sx={getNewsCardTitleSx()}>
                          {item.title}
                        </Typography>

                        <Box sx={getNewsCardMetaSx()}>
                          <Typography sx={getNewsCardDateSx()}>
                            {formatCalendarDate(new Date(item.publishDate), i18n.language)}
                          </Typography>
                          <Chip
                            label={getNewsCategoryLabel(t, item.category)}
                            size="small"
                            color={getCategoryColor(item.category) as 'primary' | 'secondary' | 'success'}
                          />
                        </Box>

                        <Typography sx={getNewsCardExcerptSx()}>{item.content}</Typography>

                        <Typography sx={getNewsCardReadMoreSx()}>{t('news.readMore')}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <NewsDetail
        open={isDetailOpen}
        onClose={handleCloseNews}
        news={selectedNews}
      />
    </>
  );
};

export default NewsPage;
