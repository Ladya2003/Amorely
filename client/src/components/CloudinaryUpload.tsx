import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Card, 
  CardMedia, 
  CardContent, 
  Grid, 
  Paper, 
  Container,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface ContentItem {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  createdAt: string;
}

const CloudinaryUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка всего контента при монтировании компонента
  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/content`);
      setContent(response.data);
    } catch (err) {
      console.error('Ошибка при получении контента:', err);
      setError('Не удалось загрузить контент. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // Создаем FormData для отправки файлов
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
      }

      // Отправляем файлы на сервер
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Обновляем список контента
      await fetchAllContent();
      
      // Очищаем input после успешной загрузки
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Ошибка при загрузке файлов:', err);
      setError('Произошла ошибка при загрузке файлов. Проверьте консоль для деталей.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderMedia = (item: ContentItem) => {
    if (item.resourceType === 'image') {
      return (
        <CardMedia
          component="img"
          height="200"
          image={item.url}
          alt="Загруженное изображение"
          sx={{ objectFit: 'contain' }}
        />
      );
    } else if (item.resourceType === 'video') {
      return (
        <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <video 
            controls 
            style={{ maxWidth: '100%', maxHeight: '200px' }}
          >
            <source src={item.url} />
            Ваш браузер не поддерживает видео.
          </video>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" color="primary">
          Загрузка медиа в Cloudinary
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            multiple
            disabled={isUploading}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button 
              variant="contained" 
              component="span"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              sx={{ bgcolor: '#ff4b8d', '&:hover': { bgcolor: '#e0457d' } }}
            >
              {isUploading ? 'Загрузка...' : 'Выбрать фото или видео'}
            </Button>
          </label>
        </Box>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV)
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3 }}>
          Загруженный контент
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : content.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Пока нет загруженного контента
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {content.map((item) => (
              <Grid key={item._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {renderMedia(item)}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ID: {item.publicId}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Загружено: {new Date(item.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default CloudinaryUpload; 