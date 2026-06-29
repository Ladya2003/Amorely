import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Chip,
  Divider
} from '@mui/material';
import MediaViewerDialog from '../common/MediaViewerDialog';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {
  formatCalendarDate,
  formatCalendarDateTime
} from '../../localization/calendarHelpers';
import DecryptedMedia from '../common/DecryptedMedia';
import EncryptedIndicator from '../common/EncryptedIndicator';
import { useHorizontalSwipe } from '../../hooks/useHorizontalSwipe';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import ExpandableClampedTitle from '../UI/ExpandableClampedTitle';
import {
  getCalendarDrawerContentSx,
  getCalendarDrawerHeaderIconButtonSx,
  getCalendarDrawerHeaderSx,
  getCalendarDrawerHeaderTitleSx,
  getCalendarDrawerHeaderWrapSx,
  getCalendarDrawerPaperSx,
} from './calendarDrawerStyles';

interface MediaFile {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  fileSize?: number;
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
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
  onShare?: (event: NonNullable<EventDetailDrawerProps['event']>) => void;
  readOnly?: boolean;
}

const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  open,
  onClose,
  event,
  onEdit,
  onDelete,
  onShare,
  readOnly = false
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [drawerMediaReady, setDrawerMediaReady] = useState(false);
  const mediaFiles = (event?.media || []).filter((media) => media.url && media.url.trim().length > 0);

  useEffect(() => {
    if (open) {
      setCurrentMediaIndex(0);
    }
  }, [open, event?._id]);

  useEffect(() => {
    if (!open) {
      setDrawerMediaReady(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setDrawerMediaReady(true);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [open, event?._id]);

  const handlePrevMedia = useCallback(() => {
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaFiles.length - 1));
  }, [mediaFiles.length]);

  const handleNextMedia = useCallback(() => {
    setCurrentMediaIndex((prev) => (prev < mediaFiles.length - 1 ? prev + 1 : 0));
  }, [mediaFiles.length]);

  const { swipeHandlers, swipeContainerSx, consumeSwipeClick } = useHorizontalSwipe({
    enabled: mediaFiles.length > 1,
    onPrev: handlePrevMedia,
    onNext: handleNextMedia
  });

  if (!event) return null;

  const eventDate = new Date(event.eventDate || event.createdAt);
  const eventTitle = event.title || t('calendar.event.noTitle');
  const currentMedia = mediaFiles[currentMediaIndex];

  const handleOpenMediaViewer = () => {
    if (consumeSwipeClick()) {
      return;
    }

    setMediaViewerOpen(true);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        transitionDuration={{ enter: 300, exit: 250 }}
        PaperProps={{
          sx: getCalendarDrawerPaperSx(theme, isMobile),
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={getCalendarDrawerHeaderWrapSx()}>
            <Box sx={getCalendarDrawerHeaderSx(theme)}>
              <IconButton
                edge="start"
                onClick={onClose}
                aria-label="close"
                size="small"
                sx={getCalendarDrawerHeaderIconButtonSx(theme)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <Box sx={{ ...getCalendarDrawerHeaderTitleSx(), flex: 1, minWidth: 0, fontWeight: 400 }}>
                <ExpandableClampedTitle
                  text={eventTitle}
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: '1rem' }}
                  dialogTitle={t('calendar.detail.title')}
                  expandAriaLabel={t('calendar.detail.expandTitleAria')}
                  closeLabel={t('calendar.detail.fullTitleClose')}
                />
              </Box>
              {readOnly && (
                <Chip
                  label={t('calendar.detail.readOnly')}
                  size="small"
                  sx={{ mr: 0.5 }}
                />
              )}
              {!readOnly && onShare && (
                <IconButton
                  onClick={() => onShare(event)}
                  aria-label="share"
                  title={t('calendar.detail.share')}
                  size="small"
                  sx={getCalendarDrawerHeaderIconButtonSx(theme)}
                >
                  <ReplyOutlinedIcon fontSize="small" />
                </IconButton>
              )}
              {!readOnly && onEdit && (
                <IconButton
                  onClick={() => onEdit(event)}
                  aria-label="edit"
                  title={t('calendar.detail.edit')}
                  size="small"
                  sx={getCalendarDrawerHeaderIconButtonSx(theme)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {!readOnly && onDelete && (
                <IconButton
                  onClick={() => onDelete(event.eventId || event._id)}
                  aria-label="delete"
                  title={t('calendar.detail.delete')}
                  size="small"
                  sx={getCalendarDrawerHeaderIconButtonSx(theme)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={getCalendarDrawerContentSx()}>
            {/* Медиа слайдер */}
            {mediaFiles.length > 0 && (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  position: 'relative',
                  bgcolor: 'grey.100',
                  overflow: 'hidden',
                  ...swipeContainerSx
                }}
                {...swipeHandlers}
              >
                {!drawerMediaReady ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                ) : (
                <>
                {/* Контейнер слайдера */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    transform: `translateX(-${currentMediaIndex * 100}%)`,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {mediaFiles.map((media) => (
                    <Box
                      key={media._id}
                      sx={{
                        minWidth: '100%',
                        height: '100%',
                        cursor: media.resourceType === 'video' ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={media.resourceType === 'video' ? undefined : handleOpenMediaViewer}
                    >
                      <DecryptedMedia
                        cacheKey={`calendar-${event.eventId || event._id}-${media._id}`}
                        url={media.url}
                        resourceType={media.resourceType}
                        encrypted={media.encrypted}
                        mediaEnvelope={media.mediaEnvelope}
                        imageStyle={{
                          width: '100%',
                          height: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover',
                          pointerEvents: 'none'
                        }}
                        videoStyle={{
                          width: '100%',
                          height: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                        loadingMinHeight={0}
                      />
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
                </>
                )}
              </Box>
            )}

            {/* Информация о событии */}
            <Box sx={{ p: 3 }}>
              {/* Дата */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarTodayIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('calendar.detail.date')}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCalendarDate(eventDate, i18n.language)}
                  </Typography>
                </Box>
                {event.isBirthdayEvent && (
                  <Chip
                    icon={<CakeIcon />}
                    label={t('calendar.detail.birthday')}
                    color="secondary"
                    size="small"
                  />
                )}
                {event.isAnniversaryEvent && (
                  <Chip
                    icon={<FavoriteIcon />}
                    label={t('calendar.detail.anniversary')}
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
                  {t('calendar.detail.title')}
                </Typography>
                <ExpandableClampedTitle
                  text={eventTitle}
                  variant="h6"
                  sx={{ fontWeight: 400 }}
                  dialogTitle={t('calendar.detail.title')}
                  expandAriaLabel={t('calendar.detail.expandTitleAria')}
                  closeLabel={t('calendar.detail.fullTitleClose')}
                />
              </Box>

              {/* Описание */}
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('calendar.detail.description')}
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
                  {t('calendar.detail.created')}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatCalendarDateTime(new Date(event.createdAt), i18n.language)}
                </Typography>
                {event.createdBy && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('calendar.detail.author', { name: event.createdBy.username })}
                  </Typography>
                )}
                <EncryptedIndicator sx={{ mt: 1 }} />
              </Box>

              {/* Информация о редактировании */}
              {event.lastEditedBy && event.lastEditedAt && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('calendar.detail.lastEdit')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatCalendarDateTime(new Date(event.lastEditedAt), i18n.language)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('calendar.detail.editor', { name: event.lastEditedBy.username })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      <MediaViewerDialog
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        content={null}
        gallery={mediaFiles.map((media) => ({
          url: media.url,
          resourceType: media.resourceType,
          cacheKey: `calendar-full-${event.eventId || event._id}-${media._id}`,
          encrypted: media.encrypted,
          mediaEnvelope: media.mediaEnvelope
        }))}
        initialIndex={currentMediaIndex}
      />
    </>
  );
};

export default EventDetailDrawer;

