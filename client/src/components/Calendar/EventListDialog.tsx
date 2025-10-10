import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EventItem {
  eventId: string;
  title?: string;
  description?: string;
  media?: Array<{
    url: string;
    resourceType: 'image' | 'video';
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
          <Typography variant="h6">
            События {date && format(date, 'd MMMM yyyy', { locale: ru })}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <List>
          {events.map((event) => {
            const hasMedia = event.media && event.media.length > 0 && event.media[0].url;
            const firstMedia = hasMedia ? event.media![0] : null;

            return (
              <ListItem key={event.eventId} disablePadding>
                <ListItemButton onClick={() => handleEventClick(event.eventId)} sx={{ gap: 1 }}>
                  <ListItemAvatar>
                    {firstMedia ? (
                      <Avatar
                        src={firstMedia.resourceType === 'image' ? firstMedia.url : undefined}
                        sx={{ 
                          width: 56, 
                          height: 56,
                          borderRadius: 2
                        }}
                      >
                        {firstMedia.resourceType === 'video' && <VideoLibraryIcon />}
                      </Avatar>
                    ) : (
                      <Avatar
                        sx={{ 
                          width: 56, 
                          height: 56,
                          borderRadius: 2,
                          bgcolor: 'primary.light'
                        }}
                      >
                        <DescriptionIcon />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={event.title || 'Без названия'}
                    secondary={
                      <Box>
                        {event.description && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {event.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {hasMedia 
                            ? `${event.media!.length} ${event.media!.length === 1 ? 'файл' : 'файла'}`
                            : 'Текстовое событие'
                          }
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{
                      fontWeight: 500
                    }}
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

