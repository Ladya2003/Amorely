import React from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { getChatTabToggleGroupSx } from '../Chat/chatListStyles';
import { getNewsCategoryRowSx } from './newsPageStyles';
import { AllInclusiveIcon, AnnouncementIcon, EventIcon, UpdateIcon } from '../UI/icons';

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
    if (newCategory === null) {
      return;
    }
    onCategoryChange(newCategory === '' ? null : newCategory);
  };

  return (
    <Box sx={{ ...getNewsCategoryRowSx(), mb: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', px: 0 }}>
        {t('news.filter.byCategory')}
      </Typography>
      <ToggleButtonGroup
        value={category ?? ''}
        exclusive
        onChange={handleChange}
        aria-label={t('news.aria.categoryFilter')}
        sx={{ ...getChatTabToggleGroupSx, flexWrap: 'wrap' }}
      >
        <ToggleButton value="" aria-label={t('news.aria.allCategories')}>
          <AllInclusiveIcon sx={{ fontSize: '1.125rem' }} />
          {t('news.filter.all')}
        </ToggleButton>
        <ToggleButton value="announcement" aria-label={t('news.aria.announcements')}>
          <AnnouncementIcon sx={{ fontSize: '1.125rem' }} />
          {t('news.filter.announcements')}
        </ToggleButton>
        <ToggleButton value="event" aria-label={t('news.aria.events')}>
          <EventIcon sx={{ fontSize: '1.125rem' }} />
          {t('news.filter.events')}
        </ToggleButton>
        <ToggleButton value="update" aria-label={t('news.aria.updates')}>
          <UpdateIcon sx={{ fontSize: '1.125rem' }} />
          {t('news.filter.updates')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default NewsFilter;
