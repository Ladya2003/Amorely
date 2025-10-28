import React, { useState } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Chip,
  Divider,
  Dialog,
  DialogContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MediaFile {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
}

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface EventDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  event: {
    _id: string;
    eventId?: string;
    title?: string;
    description?: string;
    eventDate?: string;
    createdAt: string;
    media?: MediaFile[];
    isBirthdayEvent?: boolean;
    isAnniversaryEvent?: boolean;
    createdBy?: User;
    lastEditedBy?: User;
    lastEditedAt?: string;
  } | null;
  onEdit?: (event: any) => void;
  onDelete?: (eventId: string) => void;
}

const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  open,
  onClose,
  event,
  onEdit,
  onDelete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Сброс индекса слайдера при открытии/смене события
  React.useEffect(() => {
    if (open) {
      setCurrentMediaIndex(0);
    }
  }, [open, event?._id]);

  if (!event) return null;

  const eventDate = new Date(event.eventDate || event.createdAt);
  const eventTitle = event.title || 'Без названия';
  // Фильтруем только медиа с реальными URL
  const mediaFiles = (event.media || []).filter(m => m.url && m.url.trim().length > 0);
  const currentMedia = mediaFiles[currentMediaIndex];
  
  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaFiles.length - 1));
  };
  
  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) => (prev < mediaFiles.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        transitionDuration={{ enter: 300, exit: 250 }}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : '500px',
            maxWidth: '100vw'
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Верхняя панель */}
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
                {eventTitle}
              </Typography>
              {onEdit && (
                <IconButton
                  color="inherit"
                  onClick={() => onEdit(event)}
                  aria-label="edit"
                  title="Редактировать"
                >
                  <EditIcon />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  color="inherit"
                  onClick={() => onDelete(event.eventId || event._id)}
                  aria-label="delete"
                  title="Удалить"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Toolbar>
          </AppBar>

          {/* Основной контент */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {/* Медиа слайдер */}
            {mediaFiles.length > 0 && (
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  bgcolor: 'grey.100',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Контейнер слайдера */}
                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    transform: `translateX(-${currentMediaIndex * 100}%)`,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {mediaFiles.map((media, index) => (
                    <Box
                      key={media._id}
                      sx={{
                        minWidth: '100%',
                        height: '100%',
                        cursor: 'pointer'
                      }}
                      onClick={() => setMediaViewerOpen(true)}
                    >
                      {media.resourceType === 'image' ? (
                        <img
                          src={media.url}
                          alt={`${eventTitle} - ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none'
                          }}
                        />
                      ) : (
                        <video
                          src={media.url}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          controls
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Кнопки навигации слайдера */}
                {mediaFiles.length > 1 && (
                  <>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                      size="small"
                      onClick={handlePrevMedia}
                    >
                      <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                      size="small"
                      onClick={handleNextMedia}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </>
                )}

                {/* Индикатор слайдера */}
                {mediaFiles.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 0.5,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      borderRadius: 2,
                      px: 1,
                      py: 0.5
                    }}
                  >
                    {mediaFiles.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: index === currentMediaIndex ? 'white' : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setCurrentMediaIndex(index)}
                      />
                    ))}
                  </Box>
                )}

                {/* Счетчик медиафайлов */}
                <Chip
                  label={`${currentMediaIndex + 1}/${mediaFiles.length}`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white'
                  }}
                />
              </Box>
            )}

            {/* Информация о событии */}
            <Box sx={{ p: 3 }}>
              {/* Дата */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarTodayIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Дата события
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {format(eventDate, 'd MMMM yyyy', { locale: ru })}
                  </Typography>
                </Box>
                {event.isBirthdayEvent && (
                  <Chip
                    icon={<CakeIcon />}
                    label="День рождения"
                    color="secondary"
                    size="small"
                  />
                )}
                {event.isAnniversaryEvent && (
                  <Chip
                    icon={<FavoriteIcon />}
                    label="Годовщина"
                    color="error"
                    size="small"
                    // sx={{ ml: 1 }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Заголовок */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Заголовок
                </Typography>
                <Typography variant="h6">
                  {eventTitle}
                </Typography>
              </Box>

              {/* Описание */}
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Описание
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {event.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Метаданные */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Создано
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {format(new Date(event.createdAt), 'd MMMM yyyy в HH:mm', { locale: ru })}
                </Typography>
                {event.createdBy && (
                  <Typography variant="caption" color="text.secondary">
                    Автор: {event.createdBy.username}
                  </Typography>
                )}
              </Box>

              {/* Информация о редактировании */}
              {event.lastEditedBy && event.lastEditedAt && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Последнее изменение
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {format(new Date(event.lastEditedAt), 'd MMMM yyyy в HH:mm', { locale: ru })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Редактор: {event.lastEditedBy.username}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Полноэкранный просмотр медиа */}
      <Dialog
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <IconButton onClick={() => setMediaViewerOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Кнопки навигации в полноэкранном режиме */}
        {mediaFiles.length > 1 && (
          <>
            <IconButton
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                zIndex: 1,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)'
                }
              }}
              onClick={handlePrevMedia}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                zIndex: 1,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)'
                }
              }}
              onClick={handleNextMedia}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}
        
        <DialogContent sx={{ p: 0, overflow: 'hidden', bgcolor: 'black', position: 'relative', minHeight: '90vh' }}>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '90vh',
              transform: `translateX(-${currentMediaIndex * 100}%)`,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {mediaFiles.map((media, index) => (
              <Box
                key={media._id}
                sx={{
                  minWidth: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {media.resourceType === 'image' ? (
                  <img
                    src={media.url}
                    alt={`${eventTitle} - ${index + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    autoPlay={index === currentMediaIndex}
                    style={{ maxWidth: '100%', maxHeight: '90vh' }}
                  />
                )}
              </Box>
            ))}
          </Box>
          
          {/* Индикатор в полноэкранном режиме */}
          {mediaFiles.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                bgcolor: 'rgba(0,0,0,0.6)',
                borderRadius: 3,
                px: 2,
                py: 1,
                zIndex: 1
              }}
            >
              {mediaFiles.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: index === currentMediaIndex ? 'white' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setCurrentMediaIndex(index)}
                />
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetailDrawer;

