import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ResponsiveDialog from '../../UI/ResponsiveDialog';
import type { DatingIdea } from '../../../services/datingIdeasService';
import { formatCalendarDate } from '../../../localization/calendarHelpers';

interface HistoryListDialogProps {
  open: boolean;
  onClose: () => void;
  ideas: DatingIdea[];
  onSelect?: (idea: DatingIdea) => void;
}

const HistoryListDialog: React.FC<HistoryListDialogProps> = ({
  open,
  onClose,
  ideas,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('datingIdeas.historyListTitle')}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label={t('common.back')}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {ideas.length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('datingIdeas.historyEmpty')}</Typography>
          </Box>
        ) : (
          <List>
            {ideas.map((idea) => {
              const dateValue = idea.completedAt || idea.skippedAt || idea.createdAt;
              return (
                <ListItem key={idea.id} disablePadding>
                  <ListItemButton
                    onClick={() => onSelect?.(idea)}
                    sx={{ gap: 1.5, py: 1.25, alignItems: 'flex-start' }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '1.5rem',
                        bgcolor: 'action.hover',
                        flexShrink: 0,
                      }}
                    >
                      {idea.emoji}
                    </Box>
                    <ListItemText
                      primary={idea.title}
                      secondary={
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {idea.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              icon={
                                idea.status === 'completed' ? (
                                  <CheckCircleOutlineIcon />
                                ) : (
                                  <SkipNextIcon />
                                )
                              }
                              label={
                                idea.status === 'completed'
                                  ? t('datingIdeas.statusCompleted')
                                  : t('datingIdeas.statusSkipped')
                              }
                              color={idea.status === 'completed' ? 'success' : 'default'}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              {formatCalendarDate(new Date(dateValue), i18n.language)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </ResponsiveDialog>
  );
};

export default HistoryListDialog;
