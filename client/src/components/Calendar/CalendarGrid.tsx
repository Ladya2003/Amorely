import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

interface CalendarGridProps {
  days: Array<{
    date: Date;
    content: Array<{
      mediaUrl: string;
      type: 'image' | 'video';
    }>;
  }>;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ days }) => {
  const handleContentClick = (content: { mediaUrl: string; type: 'image' | 'video' }) => {
    // Открыть просмотр контента на весь экран
    console.log('Open content:', content);
  };

  return (
    <Grid container spacing={2}>
      {days.map((day, dayIndex) => (
        <Grid size={{ xs: 12 }} key={dayIndex}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {format(day.date, 'd MMMM yyyy', { locale: ru })}
          </Typography>
          <Grid container spacing={1}>
            {day.content.map((item, itemIndex) => (
              <Grid size={{ xs: 4, sm: 3, md: 2 }} key={itemIndex}>
                <Box 
                  sx={{ 
                    position: 'relative',
                    paddingTop: '100%', // Соотношение сторон 1:1
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleContentClick(item)}
                >
                  <Box
                    component="img"
                    src={item.mediaUrl}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {item.type === 'video' && (
                    <PlayCircleIcon 
                      sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: 32
                      }} 
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};

export default CalendarGrid; 