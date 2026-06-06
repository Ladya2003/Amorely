import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton,
  Button,
  Grid,
  Paper
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GridViewIcon from '@mui/icons-material/GridView';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { formatCalendarMonthYear, getCalendarWeekdays } from '../../localization/calendarHelpers';
import CalendarDay from './CalendarDay';
import CalendarGrid from './CalendarGrid';
import PlansNotes from './PlansNotes';
import { useAuth } from '../../contexts/AuthContext';
import {
  readCalendarUiPreferences,
  updateCalendarUiPreferences,
  type CalendarViewMode
} from '../../utils/calendarUiPreferences';

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
  isBirthdayEvent?: boolean;
}

interface CalendarProps {
  content: Array<{
    date: string;
    mediaUrl: string;
    type: 'image' | 'video';
    title?: string;
    description?: string;
    _id?: string;
    isBirthdayEvent?: boolean;
  }>;
  allEvents?: EventItem[]; // Полные данные событий для grid view
  onAddContent: (date: Date) => void;
  onContentClick?: (eventId: string, directOpen?: boolean) => void;
}

const Calendar: React.FC<CalendarProps> = ({ content, allEvents = [], onAddContent, onContentClick }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const weekdays = getCalendarWeekdays(t);
  const skipNextSaveRef = useRef(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewMode>(() =>
    user?._id ? readCalendarUiPreferences(user._id).calendarView : 'circles'
  );
  const [tabValue, setTabValue] = useState(() =>
    user?._id && readCalendarUiPreferences(user._id).mainTab === 'plans' ? 1 : 0
  );

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    skipNextSaveRef.current = true;
    const prefs = readCalendarUiPreferences(user._id);
    setTabValue(prefs.mainTab === 'plans' ? 1 : 0);
    setView(prefs.calendarView);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    updateCalendarUiPreferences(user._id, {
      mainTab: tabValue === 1 ? 'plans' : 'calendar',
      calendarView: view
    });
  }, [user?._id, tabValue, view]);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newView: CalendarViewMode | null) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
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
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

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
    const inCurrentMonth = isSameMonth(day, currentDate);
    const dayContent = inCurrentMonth
      ? content.filter(item => {
          const itemDate = new Date(item.date);
          return format(itemDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
      : [];
    return {
      date: day,
      content: dayContent,
      isOutsideMonth: !inCurrentMonth,
    };
  });

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Верхний контейнер с навигацией - фиксированный */}
      <Box sx={{ flexShrink: 0, bgcolor: 'background.paper' }}>
        {/* Табы */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          p: 1
        }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="calendar tabs">
            <Tab icon={<CalendarMonthIcon />} label={t('calendar.tab')} />
            <Tab icon={<ListAltIcon />} label={t('calendar.plansTab')} />
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
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  {formatCalendarMonthYear(currentDate, i18n.language)}
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
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => onAddContent(currentDate)}
                sx={{
                  '& .MuiButton-startIcon': {
                    marginRight: 0.5
                  }
                }}
              >
                {t('calendar.createEvent')}
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Нижний контейнер с контентом - скроллящийся */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        {tabValue === 0 ? (
          <Box sx={{ p: 1 }}>
            {view === 'circles' ? (
              <Box>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {weekdays.map((day, index) => (
                    <Grid size={{ xs: 12/7 }} key={index}>
                      <Typography align="center" variant="body2" color="text.secondary">
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
                <Grid container spacing={1}>
                  {contentByDay.map((day) => (
                    <Grid size={{ xs: 12/7 }} key={format(day.date, 'yyyy-MM-dd')}>
                      <CalendarDay 
                        date={day.date} 
                        content={day.content.length > 0 ? day.content[0] : null}
                        isOutsideMonth={day.isOutsideMonth}
                        onContentClick={onContentClick}
                        onAddContent={onAddContent}
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
          <PlansNotes />
        )}
      </Box>
    </Box>
  );
};

export default Calendar; 