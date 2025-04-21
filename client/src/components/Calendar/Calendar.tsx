import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton,
  Grid,
  Paper
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GridViewIcon from '@mui/icons-material/GridView';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import CalendarDay from './CalendarDay';
import CalendarGrid from './CalendarGrid';
import PlansEditor from './PlansEditor';

interface CalendarProps {
  content: Array<{
    date: string;
    mediaUrl: string;
    type: 'image' | 'video';
  }>;
  onAddContent: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ content, onAddContent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'circles' | 'grid'>('circles');
  const [tabValue, setTabValue] = useState(0);

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: 'circles' | 'grid') => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Получаем контент для текущего месяца
  const monthContent = content.filter(item => {
    const itemDate = new Date(item.date);
    return isSameMonth(itemDate, currentDate);
  });

  // Получаем контент с группировкой по дням
  const contentByDay = days.map(day => {
    const dayContent = content.filter(item => {
      const itemDate = new Date(item.date);
      return format(itemDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    return {
      date: day,
      content: dayContent
    };
  });

  // Получаем только дни с контентом для режима сетки
  const daysWithContent = contentByDay.filter(day => day.content.length > 0);

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="calendar tabs">
          <Tab icon={<CalendarMonthIcon />} label="Календарь" />
          <Tab icon={<ListAltIcon />} label="Планы" />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <IconButton onClick={handlePrevMonth}>
              &lt;
            </IconButton>
            <Typography variant="h6">
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              &gt;
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 1 }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={handleViewChange}
              aria-label="calendar view"
              size="small"
            >
              <ToggleButton value="circles" aria-label="circles view">
                <CalendarMonthIcon />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton color="primary" onClick={() => onAddContent(currentDate)}>
              <AddCircleIcon />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
            {view === 'circles' ? (
              <Box>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((day, index) => (
                    <Grid item xs={12/7} key={index}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                <Grid container spacing={1}>
                  {contentByDay.map((day, index) => (
                    <Grid item xs={12/7} key={index}>
                      <CalendarDay 
                        date={day.date} 
                        content={day.content.length > 0 ? day.content[0] : null} 
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <CalendarGrid days={daysWithContent} />
            )}
          </Box>
        </>
      ) : (
        <PlansEditor />
      )}
    </Box>
  );
};

export default Calendar; 