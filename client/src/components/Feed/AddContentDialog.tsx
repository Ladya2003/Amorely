import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import PhotoIcon from '@mui/icons-material/Photo';
import VideocamIcon from '@mui/icons-material/Videocam';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConfirmDeleteDialog from '../UI/ConfirmDeleteDialog';
import FrequencyChangeDialog from '../UI/FrequencyChangeDialog';

interface ContentItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: any; // Информация о том, кто загрузил
  publicId?: string; // ID в Cloudinary
  frequency?: { count: number; hours: number }; // Добавляем информацию о частоте
}

interface AddContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (files: File[], target: 'self' | 'partner', frequency: { count: number, hours: number }, applyNow: boolean, resetRotation?: boolean) => void;
  hasPartner: boolean;
  existingContent?: ContentItem[]; // Существующий загруженный контент
  onDeleteContent?: (contentId: string) => void; // Callback для удаления
}

const AddContentDialog: React.FC<AddContentDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  hasPartner,
  existingContent = [],
  onDeleteContent
}) => {
  const [activeTab, setActiveTab] = useState<number>(() => {
    // Загружаем сохраненную вкладку из localStorage
    const saved = localStorage.getItem('contentActiveTab');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Загружаем сохраненный способ отображения из localStorage
    const saved = localStorage.getItem('contentViewMode');
    return (saved as 'grid' | 'list') || 'grid';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [isDragReady, setIsDragReady] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [contentCount, setContentCount] = useState<number>(3);
  const [hoursInterval, setHoursInterval] = useState<number>(24);
  const [applyNow, setApplyNow] = useState<boolean>(true);
  const [showFrequencyChange, setShowFrequencyChange] = useState<boolean>(false);
  
  // Состояние для отслеживания изменений настроек
  const [initialContentCount, setInitialContentCount] = useState<number>(3);
  const [initialHoursInterval, setInitialHoursInterval] = useState<number>(24);
  
  // Состояние для диалога подтверждения удаления
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Состояние для диалога выбора при изменении частоты
  const [frequencyChangeOpen, setFrequencyChangeOpen] = useState<boolean>(false);
  const [pendingFrequency, setPendingFrequency] = useState<{ count: number; hours: number } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Проверяем, изменились ли настройки частоты
  const hasFrequencyChanges = contentCount !== initialContentCount || hoursInterval !== initialHoursInterval;
  
  // Проверяем, можно ли сохранить (есть файлы или изменились настройки)
  const canSave = files.length > 0 || hasFrequencyChanges;

  // Загружаем текущие настройки частоты при открытии диалога
  useEffect(() => {
    if (open && existingContent.length > 0) {
      // Берем настройки частоты из первого элемента контента
      const firstContent = existingContent[0];
      if (firstContent.frequency) {
        const { count, hours } = firstContent.frequency;
        setContentCount(count);
        setHoursInterval(hours);
        // Устанавливаем начальные значения для сравнения
        setInitialContentCount(count);
        setInitialHoursInterval(hours);
      }
    } else if (open && existingContent.length === 0) {
      // Если контента нет, используем значения по умолчанию
      setContentCount(3);
      setHoursInterval(24);
      setInitialContentCount(3);
      setInitialHoursInterval(24);
    }
  }, [open, existingContent]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);
      
      // Создаем URL превью для каждого файла
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Освобождаем URL
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'list' | null) => {
    if (newMode) {
      setViewMode(newMode);
      // Сохраняем выбранный способ отображения в localStorage
      localStorage.setItem('contentViewMode', newMode);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Сохраняем выбранную вкладку в localStorage
    localStorage.setItem('contentActiveTab', newValue.toString());
  };

  const handleDeleteContent = (contentId: string) => {
    const content = existingContent.find(item => item.id === contentId);
    if (content) {
      setContentToDelete(content);
      setConfirmDeleteOpen(true);
    }
  };

  // Обработчики drag & drop с улучшенной логикой
  const handleMouseDown = (itemId: string) => {
    setDragStartTime(Date.now());
    setIsDragReady(false);
    
    // Устанавливаем таймер для активации drag через 300ms
    setTimeout(() => {
      if (dragStartTime > 0) {
        setIsDragReady(true);
      }
    }, 300);
  };

  const handleMouseUp = () => {
    setDragStartTime(0);
    setIsDragReady(false);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    // Разрешаем drag только если прошло достаточно времени
    if (!isDragReady) {
      e.preventDefault();
      return;
    }
    
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    
    // Добавляем визуальный эффект
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Проверяем, что мы действительно покинули элемент
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Здесь можно добавить логику для изменения порядка на сервере
    setDraggedItem(null);
    setDragOverItem(null);
    
    // TODO: Реализовать API для изменения порядка контента
    console.log(`Перемещение ${draggedItem} на позицию ${targetId}`);
    
    // Показываем уведомление пользователю
    // Можно добавить snackbar или другое уведомление
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    setDragStartTime(0);
    setIsDragReady(false);
  };

  const handleConfirmDelete = async () => {
    if (!contentToDelete || !onDeleteContent) return;

    setIsDeleting(true);
    try {
      await onDeleteContent(contentToDelete.id);
      setConfirmDeleteOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении контента:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setContentToDelete(null);
    setIsDeleting(false);
  };

  const handleSave = () => {
    const newFrequency = { count: contentCount, hours: hoursInterval };
    
    // Если есть файлы для загрузки, сохраняем без диалога выбора
    if (files.length > 0) {
      onSave(files, 'partner', newFrequency, applyNow);
      handleClose();
      return;
    }
    
    // Если изменились только настройки частоты, показываем диалог выбора
    if (hasFrequencyChanges && existingContent.length > 0) {
      setPendingFrequency(newFrequency);
      setFrequencyChangeOpen(true);
    } else {
      // Если контента нет, сохраняем без диалога
      onSave(files, 'partner', newFrequency, applyNow);
      handleClose();
    }
  };

  const handleFrequencyChangeConfirm = async (resetRotation: boolean) => {
    if (!pendingFrequency) return;
    
    setIsSaving(true);
    try {
      await onSave(files, 'partner', pendingFrequency, applyNow, resetRotation);
      setFrequencyChangeOpen(false);
      setPendingFrequency(null);
      handleClose();
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFrequencyChangeCancel = () => {
    setFrequencyChangeOpen(false);
    setPendingFrequency(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    // Очищаем состояние при закрытии
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setContentCount(3);
    setHoursInterval(24);
    setApplyNow(true);
    setShowFrequencyChange(false);
    // НЕ сбрасываем activeTab - пусть остается сохраненной
    
    // Очищаем поиск и фильтры
    setSearchQuery('');
    setSizeFilter('all');
    setDateFilter('all');
    
    // Очищаем состояние drag & drop
    setDraggedItem(null);
    setDragOverItem(null);
    setDragStartTime(0);
    setIsDragReady(false);
    
    // Сбрасываем начальные значения
    setInitialContentCount(3);
    setInitialHoursInterval(24);
    
    // Очищаем состояние диалога подтверждения
    setConfirmDeleteOpen(false);
    setContentToDelete(null);
    setIsDeleting(false);
    
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  // Функция фильтрации контента
  const getFilteredContent = (): ContentItem[] => {
    let filtered = existingContent;

    // Поиск по названию
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по размеру
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(item => {
        const sizeMB = item.size / (1024 * 1024);
        switch (sizeFilter) {
          case 'small':
            return sizeMB < 5;
          case 'medium':
            return sizeMB >= 5 && sizeMB < 20;
          case 'large':
            return sizeMB >= 20;
          default:
            return true;
        }
      });
    }

    // Фильтр по дате
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const uploadDate = new Date(item.uploadedAt);
        const daysDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (dateFilter) {
          case 'today':
            return daysDiff < 1;
          case 'week':
            return daysDiff < 7;
          case 'month':
            return daysDiff < 30;
          case 'older':
            return daysDiff >= 30;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Рендер контента в виде сетки
  const renderGridView = () => {
    const filteredContent = getFilteredContent();
    
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
        {filteredContent.map((item) => (
        <Card 
          key={item.id} 
          draggable
          onMouseDown={() => handleMouseDown(item.id)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          sx={{ 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: isDragReady ? 'grabbing' : 'grab',
            opacity: draggedItem === item.id ? 0.5 : 1,
            transform: dragOverItem === item.id ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s ease',
            border: dragOverItem === item.id ? '2px dashed' : '1px solid',
            borderColor: dragOverItem === item.id ? 'primary.main' : 'divider',
            userSelect: 'none',
            '&:hover': {
              transform: draggedItem === item.id ? 'scale(1)' : 'scale(1.01)'
            }
          }}
        >
          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
            {item.type === 'image' ? (
              <CardMedia
                component="img"
                image={item.url}
                alt={item.name}
                sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <CardMedia
                component="video"
                src={item.url}
                sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <Chip
              icon={item.type === 'image' ? <PhotoIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
              label={item.type === 'image' ? 'Фото' : 'Видео'}
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />
            <DragIndicatorIcon 
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                color: 'white', 
                backgroundColor: 'rgba(0,0,0,0.6)', 
                borderRadius: '50%', 
                p: 0.5,
                fontSize: '1.2rem'
              }} 
            />
          </Box>
          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            <Tooltip title={item.name}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {item.name}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" display="block">
              {item.size > 0 ? formatFileSize(item.size) : 'Размер неизвестен'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {formatDate(item.uploadedAt)}
            </Typography>
            {item.uploadedBy && (
              <Typography variant="caption" color="primary" display="block" sx={{ fontWeight: 500 }}>
                Загрузил: {item.uploadedBy.name || item.uploadedBy.email || 'Пользователь'}
              </Typography>
            )}
          </CardContent>
          <CardActions sx={{ pt: 0 }}>
            <Button 
              size="small" 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteContent(item.id)}
              fullWidth
            >
              Удалить
            </Button>
          </CardActions>
        </Card>
        ))}
      </Box>
    );
  };

  // Рендер контента в виде списка
  const renderListView = () => {
    const filteredContent = getFilteredContent();
    
    return (
      <List sx={{ mt: 2 }}>
        {filteredContent.map((item) => (
        <ListItem
          key={item.id}
          draggable
          onMouseDown={() => handleMouseDown(item.id)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          sx={{
            mb: 1,
            border: dragOverItem === item.id ? '2px dashed' : '1px solid',
            borderColor: dragOverItem === item.id ? 'primary.main' : 'divider',
            borderRadius: 1,
            cursor: isDragReady ? 'grabbing' : 'grab',
            opacity: draggedItem === item.id ? 0.5 : 1,
            transform: dragOverItem === item.id ? 'scale(1.01)' : 'scale(1)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            '&:hover': {
              bgcolor: 'action.hover',
              transform: draggedItem === item.id ? 'scale(1)' : 'scale(1.005)'
            }
          }}
        >
          <ListItemAvatar>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                variant="rounded"
                src={item.url}
                sx={{ width: 64, height: 64 }}
              >
                {item.type === 'image' ? <PhotoIcon /> : <VideocamIcon />}
              </Avatar>
              <DragIndicatorIcon 
                sx={{ 
                  position: 'absolute', 
                  top: -4, 
                  right: -4, 
                  color: 'white', 
                  backgroundColor: 'primary.main', 
                  borderRadius: '50%', 
                  p: 0.2,
                  fontSize: '0.9rem'
                }} 
              />
            </Box>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.name}
                </Typography>
                <Chip
                  icon={item.type === 'image' ? <PhotoIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
                  label={item.type === 'image' ? 'Фото' : 'Видео'}
                  size="small"
                />
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Размер: {item.size > 0 ? formatFileSize(item.size) : 'Неизвестен'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Загружено: {formatDate(item.uploadedAt)}
                </Typography>
                {item.uploadedBy && (
                  <Typography variant="caption" color="primary" display="block" sx={{ fontWeight: 500 }}>
                    Автор: {item.uploadedBy.name || item.uploadedBy.email || 'Пользователь'}
                  </Typography>
                )}
              </Box>
            }
            sx={{ ml: 2 }}
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              color="error"
              onClick={() => handleDeleteContent(item.id)}
              sx={{
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Управление контентом
      </DialogTitle>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
      >
        <Tab label="Загрузить новое" />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Мой контент
              <Chip label={existingContent.length} size="small" />
            </Box>
          } 
        />
      </Tabs>
      
      <DialogContent>
        {/* Вкладка загрузки нового контента */}
        {activeTab === 0 && (
          <>
            <Box sx={{ mb: 3, mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Загрузить фото или видео
              </Typography>
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="upload-media"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="upload-media">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Выбрать файлы
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                Поддерживаются изображения (JPG, PNG, GIF) и видео (MP4, MOV)
              </Typography>
            </Box>

            {previews.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Выбранные файлы ({previews.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {previews.map((preview, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: 'relative',
                        width: 100,
                        height: 100
                      }}
                    >
                      {files[index].type.startsWith('image/') ? (
                        <img 
                          src={preview} 
                          alt={`Preview ${index}`} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }} 
                        />
                      ) : (
                        <video 
                          src={preview}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: -8, 
                          right: -8,
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'white'
                          }
                        }}
                        onClick={() => handleRemoveFile(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Настройки отображения
              </Typography>
              
              {/* {files.length === 0 && hasFrequencyChanges && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Вы можете изменить настройки частоты отображения для всего существующего контента без загрузки новых файлов.
                </Alert>
              )} */}
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Количество контента</InputLabel>
                  <Select
                    value={contentCount}
                    onChange={(e) => {
                      setContentCount(Number(e.target.value));
                      if (files.length > 0) {
                        setShowFrequencyChange(true);
                      }
                    }}
                    label="Количество контента"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <MenuItem key={num} value={num}>{num}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Интервал (часы)</InputLabel>
                  <Select
                    value={hoursInterval}
                    onChange={(e) => {
                      setHoursInterval(Number(e.target.value));
                      if (files.length > 0) {
                        setShowFrequencyChange(true);
                      }
                    }}
                    label="Интервал (часы)"
                  >
                    {[4, 8, 12, 24, 48, 72].map((hours) => (
                      <MenuItem key={hours} value={hours}>{hours}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 1 }}>
                {files.length > 0 
                  ? `Будет показываться по ${contentCount} фото/видео каждые ${hoursInterval} часов`
                  : `Настройки будут применены ко всему существующему контенту: по ${contentCount} фото/видео каждые ${hoursInterval} часов`
                }
              </Alert>
            </Box>

            {showFrequencyChange && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Вы изменили частоту отображения контента. Когда применить изменения?
                </Alert>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={applyNow ? 'now' : 'later'}
                    onChange={(e) => setApplyNow(e.target.value === 'now')}
                  >
                    <FormControlLabel 
                      value="now" 
                      control={<Radio />} 
                      label="Применить сразу после сохранения" 
                    />
                    <FormControlLabel 
                      value="later" 
                      control={<Radio />} 
                      label="Применить после истечения предыдущего интервала" 
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
          </>
        )}

        {/* Вкладка управления существующим контентом */}
        {activeTab === 1 && (
          <>
            {/* Поиск и фильтры */}
            <Box sx={{ mb: 3, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Размер</InputLabel>
                  <Select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    label="Размер"
                  >
                    <MenuItem value="all">Все размеры</MenuItem>
                    <MenuItem value="small">Маленькие (&lt; 5 МБ)</MenuItem>
                    <MenuItem value="medium">Средние (5-20 МБ)</MenuItem>
                    <MenuItem value="large">Большие (&gt; 20 МБ)</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Дата</InputLabel>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    label="Дата"
                  >
                    <MenuItem value="all">Все даты</MenuItem>
                    <MenuItem value="today">Сегодня</MenuItem>
                    <MenuItem value="week">За неделю</MenuItem>
                    <MenuItem value="month">За месяц</MenuItem>
                    <MenuItem value="older">Старше месяца</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Всего файлов: {getFilteredContent().length} {existingContent.length !== getFilteredContent().length && `из ${existingContent.length}`}
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {getFilteredContent().length > 1 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 Удерживайте карточку 300мс, затем перетаскивайте для изменения порядка
              </Alert>
            )}

            {getFilteredContent().length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary'
              }}>
                <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  {existingContent.length === 0 ? 'Нет загруженного контента' : 'Контент не найден'}
                </Typography>
                <Typography variant="body2">
                  {existingContent.length === 0 
                    ? 'Перейдите на вкладку "Загрузить новое" чтобы добавить фото или видео'
                    : 'Попробуйте изменить параметры поиска или фильтров'
                  }
                </Typography>
              </Box>
            ) : (
              <>
                {viewMode === 'grid' ? renderGridView() : renderListView()}
              </>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {activeTab === 0 ? 'Отмена' : 'Закрыть'}
        </Button>
        {activeTab === 0 && (
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={!canSave}
          >
            Сохранить
          </Button>
        )}
      </DialogActions>
      
      {/* Диалог подтверждения удаления */}
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Удалить контент"
        itemName={contentToDelete?.name}
        message={
          contentToDelete 
            ? `Вы уверены, что хотите удалить "${contentToDelete.name}"? Контент будет удален для вас и вашего партнера.`
            : undefined
        }
        isLoading={isDeleting}
      />

      {/* Диалог выбора при изменении частоты */}
      <FrequencyChangeDialog
        open={frequencyChangeOpen}
        onClose={handleFrequencyChangeCancel}
        onConfirm={handleFrequencyChangeConfirm}
        oldFrequency={{ count: initialContentCount, hours: initialHoursInterval }}
        newFrequency={pendingFrequency || { count: contentCount, hours: hoursInterval }}
        isLoading={isSaving}
      />
    </Dialog>
  );
};

export default AddContentDialog; 