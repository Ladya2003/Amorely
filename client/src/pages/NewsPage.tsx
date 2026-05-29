import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, CardMedia, Chip, Divider, CircularProgress, Pagination } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import UserProfileChip from '../components/UI/UserProfileChip';

// Интерфейс для новости
interface NewsItem {
  _id: string;
  title: string;
  content: string;
  image?: {
    url: string;
  };
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  category: 'update' | 'event' | 'announcement';
  publishDate: string;
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Загрузка новостей при монтировании компонента
  useEffect(() => {
    fetchNews();
  }, [page, selectedCategory]);
  
  // Функция для загрузки новостей
  const fetchNews = async () => {
    try {
      setIsLoading(true);
      
      // Формируем параметры запроса
      const params: Record<string, string | number> = {
        page,
        limit: 5
      };
      
      // Добавляем фильтр по категории, если выбрана
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      // Запрос к API
      const response = await axios.get(`${API_URL}/api/news`, { params });
      
      setNews(response.data.news);
      setTotalPages(response.data.pagination.pages);
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке новостей:', error);
      setIsLoading(false);
    }
  };
  
  // Обработчик изменения страницы
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Обработчик выбора категории
  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setPage(1); // Сбрасываем на первую страницу при смене категории
  };
  
  // Функция для получения цвета чипа категории
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
  
  // Функция для получения названия категории
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
        <UserProfileChip sx={{ maxWidth: '60%', flex: '1 1 auto', minWidth: 0 }} maxNameWidth="100%" />
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
          {news.map((item, index) => (
            <React.Fragment key={item._id}>
              <Card sx={{
                mb: 3,
                display: 'flex',
                flexDirection: item.images?.length ? 'column' : { xs: 'column', md: 'row' },
              }}>
                {item.image && !item.images?.length && (
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: { xs: '100%', md: 200 },
                      height: { xs: 200, md: 'auto' }
                    }}
                    image={item.image.url}
                    alt={item.title}
                  />
                )}
                <CardContent sx={{ flex: '1 0 auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" fontWeight={400}>
                      {item.title}
                    </Typography>
                    <Chip 
                      label={getCategoryName(item.category)} 
                      size="small" 
                      color={getCategoryColor(item.category) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {format(new Date(item.publishDate), 'd MMMM yyyy', { locale: ru })}
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {item.content}
                  </Typography>
                  {item.images?.map((image, imageIndex) => (
                    <Box key={imageIndex} sx={{ mb: 2 }}>
                      {image.caption && (
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          {image.caption}
                        </Typography>
                      )}
                      <Box
                        component="img"
                        src={image.url}
                        alt={image.caption || item.title}
                        sx={{
                          width: '100%',
                          maxHeight: 480,
                          objectFit: 'contain',
                          borderRadius: 1,
                          display: 'block',
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
              {index < news.length - 1 && <Divider sx={{ mb: 3 }} />}
            </React.Fragment>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default NewsPage; 