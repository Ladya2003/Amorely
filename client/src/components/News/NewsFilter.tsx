import React from 'react';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  Typography 
} from '@mui/material';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EventIcon from '@mui/icons-material/Event';
import UpdateIcon from '@mui/icons-material/Update';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

interface NewsFilterProps {
  category: string | null;
  onCategoryChange: (category: string | null) => void;
}

const NewsFilter: React.FC<NewsFilterProps> = ({ category, onCategoryChange }) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newCategory: string | null,
  ) => {
    onCategoryChange(newCategory === "" ? null : newCategory);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Фильтр по категориям:
      </Typography>
      <ToggleButtonGroup
        value={category}
        exclusive
        onChange={handleChange}
        aria-label="news category filter"
        size="small"
        sx={{ flexWrap: 'wrap' }}
      >
        <ToggleButton value="" aria-label="all categories">
          <AllInclusiveIcon sx={{ mr: 1 }} />
          Все
        </ToggleButton>
        <ToggleButton value="announcement" aria-label="announcements">
          <AnnouncementIcon sx={{ mr: 1 }} />
          Анонсы
        </ToggleButton>
        <ToggleButton value="event" aria-label="events">
          <EventIcon sx={{ mr: 1 }} />
          События
        </ToggleButton>
        <ToggleButton value="update" aria-label="updates">
          <UpdateIcon sx={{ mr: 1 }} />
          Обновления
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default NewsFilter; 