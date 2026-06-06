import React from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
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
import { formatCalendarDate } from '../../localization/calendarHelpers';
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
  const { t, i18n } = useTranslation();

  const handleEventClick = (eventId: string) => {
    onSelectEvent(eventId);
    onClose();
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {date
              ? t('calendar.list.eventsOn', { date: formatCalendarDate(date, i18n.language) })
              : t('calendar.list.eventsOn', { date: '' })}
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
                    primary={event.title || t('calendar.event.noTitle')}
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
                            ? t('calendar.event.fileCount', { count: event.media!.length })
                            : t('calendar.event.textOnly')}
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
    </ResponsiveDialog>
  );
};

export default EventListDialog;
