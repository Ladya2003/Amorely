import React, { useState } from 'react';
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ContentItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  uploadedAt: Date;
}

interface AddContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (files: File[], target: 'self' | 'partner', frequency: { count: number, hours: number }, applyNow: boolean) => void;
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
  const [activeTab, setActiveTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [contentCount, setContentCount] = useState<number>(3);
  const [hoursInterval, setHoursInterval] = useState<number>(24);
  const [applyNow, setApplyNow] = useState<boolean>(true);
  const [showFrequencyChange, setShowFrequencyChange] = useState<boolean>(false);

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

  const handleDeleteContent = (contentId: string) => {
    if (onDeleteContent) {
      onDeleteContent(contentId);
    }
  };

  const handleSave = () => {
    onSave(files, 'partner', { count: contentCount, hours: hoursInterval }, applyNow);
    handleClose();
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
    setActiveTab(0);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Рендер контента в виде сетки
  const renderGridView = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
      {existingContent.map((item) => (
        <Card key={item.id} sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          </Box>
          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            <Tooltip title={item.name}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {item.name}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" display="block">
              {formatFileSize(item.size)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {formatDate(item.uploadedAt)}
            </Typography>
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

  // Рендер контента в виде списка
  const renderListView = () => (
    <List sx={{ mt: 2 }}>
      {existingContent.map((item) => (
        <ListItem
          key={item.id}
          sx={{
            mb: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemAvatar>
            <Avatar
              variant="rounded"
              src={item.url}
              sx={{ width: 64, height: 64 }}
            >
              {item.type === 'image' ? <PhotoIcon /> : <VideocamIcon />}
            </Avatar>
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
                  Размер: {formatFileSize(item.size)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Загружено: {formatDate(item.uploadedAt)}
                </Typography>
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Управление контентом
      </DialogTitle>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
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
                Будет показываться по {contentCount} фото/видео каждые {hoursInterval} часов
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
              <Typography variant="subtitle1">
                Всего файлов: {existingContent.length}
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
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

            {existingContent.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary'
              }}>
                <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  Нет загруженного контента
                </Typography>
                <Typography variant="body2">
                  Перейдите на вкладку "Загрузить новое" чтобы добавить фото или видео
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
            disabled={files.length === 0}
          >
            Сохранить
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddContentDialog; 