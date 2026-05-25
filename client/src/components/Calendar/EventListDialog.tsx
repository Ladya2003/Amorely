import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DecryptedMedia from '../common/DecryptedMedia';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';

interface EventItem {
  _id?: string;
  eventId: string;
  title?: string;
  description?: string;
  media?: Array<{
    _id: string;
    url: string;
    resourceType: 'image' | 'video';
    encrypted?: boolean;
    mediaEnvelope?: ContentMediaEnvelope;
  }>;
}

interface EventListDialogProps {
  open: boolean;
  onClose: () => void;
  events: EventItem[];
  date: Date | null;
  onSelectEvent: (eventId: string) => void;
}

const EventListDialog: React.FC<EventListDialogProps> = ({
  open,
  onClose,
  events,
  date,
  onSelectEvent
}) => {
  const handleEventClick = (eventId: string) => {
    onSelectEvent(eventId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            События {date && format(date, 'd MMMM yyyy', { locale: ru })}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List>
          {events.map((event) => {
            const eventId = event.eventId || event._id || '';
            const hasMedia =
              event.media &&
              event.media.length > 0 &&
              event.media[0].url &&
              event.media[0].url.trim().length > 0;
            const firstMedia = hasMedia ? event.media![0] : null;

            return (
              <ListItem key={eventId} disablePadding>
                <ListItemButton onClick={() => handleEventClick(eventId)} sx={{ gap: 1.5, py: 1 }}>
                  {firstMedia ? (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                        bgcolor: 'grey.200',
                      }}
                    >
                      <DecryptedMedia
                        cacheKey={`event-list-${eventId}-${firstMedia._id}`}
                        url={firstMedia.url}
                        resourceType={firstMedia.resourceType}
                        encrypted={firstMedia.encrypted}
                        mediaEnvelope={firstMedia.mediaEnvelope}
                        videoPreview={firstMedia.resourceType === 'video'}
                        imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loadingMinHeight={56}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        flexShrink: 0,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DescriptionIcon sx={{ color: 'white' }} />
                    </Box>
                  )}
                  <ListItemText
                    primary={event.title || 'Без названия'}
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        {event.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            component="span"
                            sx={{ display: 'block' }}
                          >
                            {event.description}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          sx={{ display: 'block' }}
                        >
                          {hasMedia
                            ? `${event.media!.length} ${event.media!.length === 1 ? 'файл' : 'файла'}`
                            : 'Текстовое событие'}
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default EventListDialog;
