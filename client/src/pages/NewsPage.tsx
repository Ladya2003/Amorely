import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import UserProfileChip from '../components/UI/UserProfileChip';
import { formatCalendarDate } from '../localization/calendarHelpers';
import { getNewsCategoryLabel } from '../localization/newsHelpers';
import NewsDetail from '../components/News/NewsDetail';
import { NewsItem } from '../components/News/NewsCard';
import { useUnreadNews } from '../contexts/UnreadNewsContext';

const NewsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { isNewsUnread, markNewsAsRead, syncNewsIds } = useUnreadNews();

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, i18n.language]);

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
    setSelectedNews(item);
    markNewsAsRead(item._id);
  };

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}>
          <Typography
            key={i18n.language}
            variant="h4"
            component="h1"
            sx={{ fontSize: '1.7rem', fontWeight: 400 }}
          >
            {t('news.title')}
          </Typography>
          <UserProfileChip sx={{ maxWidth: '60%' }} />
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={t('news.filter.all')}
            onClick={() => handleCategoryClick(null)}
            color={selectedCategory === null ? 'primary' : 'default'}
            variant={selectedCategory === null ? 'filled' : 'outlined'}
          />
          <Chip
            label={t('news.filter.updates')}
            onClick={() => handleCategoryClick('update')}
            color={selectedCategory === 'update' ? 'primary' : 'default'}
            variant={selectedCategory === 'update' ? 'filled' : 'outlined'}
          />
          <Chip
            label={t('news.filter.events')}
            onClick={() => handleCategoryClick('event')}
            color={selectedCategory === 'event' ? 'secondary' : 'default'}
            variant={selectedCategory === 'event' ? 'filled' : 'outlined'}
          />
          <Chip
            label={t('news.filter.announcements')}
            onClick={() => handleCategoryClick('announcement')}
            color={selectedCategory === 'announcement' ? 'success' : 'default'}
            variant={selectedCategory === 'announcement' ? 'filled' : 'outlined'}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : news.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {t('news.empty')}
            </Typography>
          </Box>
        ) : (
          <Box>
            {news.map((item) => {
              const showNewBadge = isNewsUnread(item._id);

              return (
              <Card
                key={item._id}
                sx={{ borderRadius: 2.5, overflow: 'hidden', mb: 2, position: 'relative' }}
              >
                {showNewBadge && (
                  <Chip
                    label={t('news.newBadge')}
                    size="small"
                    color="error"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <CardActionArea onClick={() => handleOpenNews(item)}>
                  <CardContent sx={showNewBadge ? { pt: 3 } : undefined}>
                    <Typography
                      variant="h6"
                      component="h2"
                      fontWeight={400}
                      sx={{ mb: 1, ...(showNewBadge && { pr: 7 }) }}
                    >
                      {item.title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatCalendarDate(new Date(item.publishDate), i18n.language)}
                      </Typography>
                      <Chip
                        label={getNewsCategoryLabel(t, item.category)}
                        size="small"
                        color={getCategoryColor(item.category) as 'primary' | 'secondary' | 'success'}
                      />
                    </Box>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: 'pre-line',
                        mb: 1,
                      }}
                    >
                      {item.content}
                    </Typography>

                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                      {t('news.readMore')}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              );
            })}
          </Box>
        )}
      </Container>

      <NewsDetail
        open={Boolean(selectedNews)}
        onClose={() => setSelectedNews(null)}
        news={selectedNews}
      />
    </>
  );
};

export default NewsPage;
