import React, { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import UserProfileChip from '../components/UI/UserProfileChip';
import NewsDetail from '../components/News/NewsDetail';
import { NewsItem } from '../components/News/NewsCard';
import { useUnreadNews } from '../contexts/UnreadNewsContext';

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { isNewsUnread, markNewsAsRead, syncNewsIds } = useUnreadNews();

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);

      const params: Record<string, string | number> = {
        page: 1,
        limit: 50,
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
      console.error('Ошибка при загрузке новостей:', error);
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

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'update':
        return 'Обновление';
      case 'event':
        return 'Событие';
      case 'announcement':
        return 'Анонс';
      default:
        return category;
    }
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
          <Typography variant="h4" component="h1" sx={{ fontSize: '1.7rem', fontWeight: 400 }}>
            Новости
          </Typography>
          <UserProfileChip sx={{ maxWidth: '60%' }} />
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Все"
            onClick={() => handleCategoryClick(null)}
            color={selectedCategory === null ? 'primary' : 'default'}
            variant={selectedCategory === null ? 'filled' : 'outlined'}
          />
          <Chip
            label="Обновления"
            onClick={() => handleCategoryClick('update')}
            color={selectedCategory === 'update' ? 'primary' : 'default'}
            variant={selectedCategory === 'update' ? 'filled' : 'outlined'}
          />
          <Chip
            label="События"
            onClick={() => handleCategoryClick('event')}
            color={selectedCategory === 'event' ? 'secondary' : 'default'}
            variant={selectedCategory === 'event' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Анонсы"
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
              Новости не найдены
            </Typography>
          </Box>
        ) : (
          <Box>
            {news.map((item) => (
              <Card
                key={item._id}
                sx={{ borderRadius: 2.5, overflow: 'hidden', mb: 2, position: 'relative' }}
              >
                {isNewsUnread(item._id) && (
                  <Chip
                    label="NEW"
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
                  <CardContent>
                    <Typography variant="h6" component="h2" fontWeight={400} sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(item.publishDate), 'd MMMM yyyy', { locale: ru })}
                      </Typography>
                      <Chip
                        label={getCategoryName(item.category)}
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
                      Читать полностью
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
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
