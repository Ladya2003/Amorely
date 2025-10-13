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

interface MediaFile {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
}

interface EventItem {
  _id: string;
  eventId: string;
  title?: string;
  description?: string;
  eventDate?: string;
  createdAt: string;
  media: MediaFile[];
}

interface CalendarProps {
  content: Array<{
    date: string;
    mediaUrl: string;
    type: 'image' | 'video';
    title?: string;
    description?: string;
    _id?: string;
  }>;
  allEvents?: EventItem[]; // Полные данные событий для grid view
  onAddContent: (date: Date) => void;
  onContentClick?: (eventId: string, directOpen?: boolean) => void;
}

const Calendar: React.FC<CalendarProps> = ({ content, allEvents = [], onAddContent, onContentClick }) => {
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

  // Для grid view группируем все события по месяцам и дням (без фильтрации)
  const allEventsGroupedByMonth = allEvents.reduce((acc, event) => {
    const eventDate = new Date(event.eventDate || event.createdAt);
    const monthKey = format(eventDate, 'yyyy-MM');
    const dayKey = format(eventDate, 'yyyy-MM-dd');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthDate: new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
        days: {}
      };
    }
    
    if (!acc[monthKey].days[dayKey]) {
      acc[monthKey].days[dayKey] = {
        date: eventDate,
        events: []
      };
    }
    
    acc[monthKey].days[dayKey].events.push(event);
    return acc;
  }, {} as Record<string, { monthDate: Date; days: Record<string, { date: Date; events: EventItem[] }> }>);

  // Преобразуем в массив и сортируем по убыванию (новые месяцы сверху)
  const monthsWithContent = Object.entries(allEventsGroupedByMonth)
    .map(([monthKey, monthData]) => ({
      monthKey,
      monthDate: monthData.monthDate,
      days: Object.values(monthData.days).sort((a, b) => b.date.getTime() - a.date.getTime())
    }))
    .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime());

  // Для calendar view используем старую логику
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

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Верхний контейнер с навигацией - фиксированный */}
      <Box sx={{ flexShrink: 0, bgcolor: 'background.paper' }}>
        {/* Табы */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 1
        }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="calendar tabs">
            <Tab icon={<CalendarMonthIcon />} label="Календарь" />
            <Tab icon={<ListAltIcon />} label="Планы" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <>
            {/* Переключатель месяцев - только для календаря */}
            {view === 'circles' && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                p: 2
              }}>
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
            )}

            {/* Переключатель вида */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              px: 2, 
              pb: 1,
              pt: view === 'grid' ? 2 : 0 // Отступ сверху для плитки
            }}>
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
          </>
        )}
      </Box>

      {/* Нижний контейнер с контентом - скроллящийся */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {tabValue === 0 ? (
          <Box sx={{ p: 1 }}>
            {view === 'circles' ? (
              <Box>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((day, index) => (
                    <Grid size={{ xs: 12/7 }} key={index}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                <Grid container spacing={1}>
                  {contentByDay.map((day, index) => (
                    <Grid size={{ xs: 12/7 }} key={index}>
                      <CalendarDay 
                        date={day.date} 
                        content={day.content.length > 0 ? day.content[0] : null}
                        onContentClick={onContentClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <CalendarGrid 
                months={monthsWithContent}
                currentMonth={currentDate}
                onMonthChange={setCurrentDate}
                onContentClick={(eventId) => onContentClick?.(eventId, true)} 
              />
            )}
          </Box>
        ) : (
          <PlansEditor />
        )}
      </Box>
    </Box>
  );
};

export default Calendar; 