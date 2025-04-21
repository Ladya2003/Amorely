import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress, 
  Pagination, 
  Alert 
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';
import NewsCard, { NewsItem } from '../components/News/NewsCard';
import NewsDetail from '../components/News/NewsDetail';
import NewsFilter from '../components/News/NewsFilter';

// Временные данные для демонстрации
const MOCK_NEWS: NewsItem[] = [
  {
    _id: '1',
    title: 'Новые функции в приложении',
    content: 'Мы рады сообщить о выпуске новой версии приложения Amorely! Теперь вы можете делиться фотографиями и видео с вашим партнером, создавать совместные планы и многое другое. Обновите приложение прямо сейчас, чтобы получить доступ к новым функциям.',
    category: 'update',
    publishDate: new Date().toISOString(),
    image: {
      url: 'https://source.unsplash.com/random/800x600/?app'
    }
  },
  {
    _id: '2',
    title: 'День всех влюбленных',
    content: 'Приближается День всех влюбленных! Не забудьте подготовить особенный сюрприз для вашего партнера. В нашем приложении вы можете создать виртуальную открытку или запланировать особенное свидание.',
    category: 'event',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    image: {
      url: 'https://source.unsplash.com/random/800x600/?valentine'
    }
  },
  {
    _id: '3',
    title: 'Скоро запуск видеозвонков',
    content: 'Мы работаем над новой функцией видеозвонков, которая позволит вам общаться с партнером лицом к лицу, даже если вы находитесь далеко друг от друга. Следите за обновлениями!',
    category: 'announcement',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    image: {
      url: 'https://source.unsplash.com/random/800x600/?videocall'
    }
  }
];

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNews();
  }, [category, page]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.get(`${API_URL}/api/news`, {
      //   params: {
      //     category,
      //     page,
      //     limit: 6
      //   }
      // });
      // setNews(response.data.news);
      // setTotalPages(response.data.pagination.pages);
      
      // Используем моковые данные для демонстрации
      setTimeout(() => {
        let filteredNews = [...MOCK_NEWS];
        
        if (category) {
          filteredNews = filteredNews.filter(item => item.category === category);
        }
        
        setNews(filteredNews);
        setTotalPages(Math.ceil(filteredNews.length / 6));
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Ошибка при загрузке новостей:', error);
      setError('Не удалось загрузить новости. Пожалуйста, попробуйте позже.');
      setIsLoading(false);
    }
  };

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory);
    setPage(1); // Сбрасываем страницу при изменении категории
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Новости и события
      </Typography>
      
      <NewsFilter category={category} onCategoryChange={handleCategoryChange} />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : news.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Новости не найдены. Попробуйте изменить фильтр.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {news.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                <NewsCard news={item} onClick={handleNewsClick} />
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
      
      <NewsDetail 
        open={detailOpen} 
        onClose={handleDetailClose} 
        news={selectedNews} 
      />
    </Container>
  );
};

export default NewsPage; 