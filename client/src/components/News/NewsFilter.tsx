import React from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

interface NewsFilterProps {
  category: string | null;
  onCategoryChange: (category: string | null) => void;
}

const NewsFilter: React.FC<NewsFilterProps> = ({ category, onCategoryChange }) => {
  const { t } = useTranslation();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newCategory: string | null,
  ) => {
    onCategoryChange(newCategory === '' ? null : newCategory);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {t('news.filter.byCategory')}
      </Typography>
      <ToggleButtonGroup
        value={category}
        exclusive
        onChange={handleChange}
        aria-label={t('news.aria.categoryFilter')}
        size="small"
        sx={{ flexWrap: 'wrap' }}
      >
        <ToggleButton value="" aria-label={t('news.aria.allCategories')}>
          <AllInclusiveIcon sx={{ mr: 1 }} />
          {t('news.filter.all')}
        </ToggleButton>
        <ToggleButton value="announcement" aria-label={t('news.aria.announcements')}>
          <AnnouncementIcon sx={{ mr: 1 }} />
          {t('news.filter.announcements')}
        </ToggleButton>
        <ToggleButton value="event" aria-label={t('news.aria.events')}>
          <EventIcon sx={{ mr: 1 }} />
          {t('news.filter.events')}
        </ToggleButton>
        <ToggleButton value="update" aria-label={t('news.aria.updates')}>
          <UpdateIcon sx={{ mr: 1 }} />
          {t('news.filter.updates')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default NewsFilter;
