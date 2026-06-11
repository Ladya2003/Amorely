import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ButtonBase,
  Grid,
  Paper,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GridViewIcon from '@mui/icons-material/GridView';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import EventFilterDialog from './EventFilterDialog';
import MonthYearPickerDialog from './MonthYearPickerDialog';
import { eventMatchesFilter, isEventFilterActive, type EventFilter } from './eventFilterUtils';
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
  onDeleteAll?: (type: 'events' | 'plans') => Promise<void>;
  plansRefreshKey?: number;
  noteIdFromUrl?: string | null;
  forcePlansTab?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  content,
  allEvents = [],
  onAddContent,
  onContentClick,
  onDeleteAll,
  plansRefreshKey,
  noteIdFromUrl = null,
  forcePlansTab = false
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const outlinedControlSx = {
    borderRadius: 2,
    border: isMobile ? 1 : 0,
    borderColor: 'divider'
  };
  const filterButtonSx = {
    ...outlinedControlSx,
    alignSelf: 'stretch',
    width: 'auto',
    minWidth: 'unset',
    minHeight: 'unset',
    px: 0.75,
    py: 0,
    boxSizing: 'border-box'
  };
  const monthNavButtonSx = {
    ...outlinedControlSx,
    bgcolor: 'transparent',
    boxSizing: 'border-box',
    '&:hover': {
      bgcolor: 'transparent'
    }
  };
  const weekdays = getCalendarWeekdays(t);
  const skipNextSaveRef = useRef(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [view, setView] = useState<CalendarViewMode>(() =>
    user?._id ? readCalendarUiPreferences(user._id).calendarView : 'circles'
  );
  const [tabValue, setTabValue] = useState(() =>
    user?._id && readCalendarUiPreferences(user._id).mainTab === 'plans' ? 1 : 0
  );
  const [eventFilter, setEventFilter] = useState<EventFilter>({
    dateFrom: null,
    dateTo: null,
    title: ''
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    skipNextSaveRef.current = true;
    const prefs = readCalendarUiPreferences(user._id);
    setTabValue(forcePlansTab || prefs.mainTab === 'plans' ? 1 : 0);
    setView(prefs.calendarView);
  }, [user?._id, forcePlansTab]);

  useEffect(() => {
    if (forcePlansTab) {
      setTabValue(1);
    }
  }, [forcePlansTab, noteIdFromUrl]);

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

  const isPlansTab = tabValue === 1;

  const handleOpenDeleteAllDialog = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleCloseDeleteAllDialog = () => {
    if (!isDeletingAll) {
      setDeleteAllDialogOpen(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAll) return;

    try {
      setIsDeletingAll(true);
      await onDeleteAll(isPlansTab ? 'plans' : 'events');
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при массовом удалении:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const isFilterActive = isEventFilterActive(eventFilter);

  const filteredAllEvents = useMemo(
    () => allEvents.filter((event) => eventMatchesFilter(event, eventFilter)),
    [allEvents, eventFilter]
  );

  const filteredContent = useMemo(
    () => content.filter((item) => eventMatchesFilter(item, eventFilter)),
    [content, eventFilter]
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  // Для grid view группируем отфильтрованные события по месяцам и дням
  const allEventsGroupedByMonth = filteredAllEvents.reduce((acc, event) => {
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
      ? filteredContent.filter(item => {
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
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="calendar tabs"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            <Tab icon={<CalendarMonthIcon />} label={t('calendar.tab')} />
            <Tab icon={<ListAltIcon />} label={t('calendar.plansTab')} />
          </Tabs>
          {onDeleteAll && (
            <IconButton
              onClick={handleOpenDeleteAllDialog}
              aria-label={t('calendar.deleteAll.ariaLabel')}
              color="error"
              size="small"
              sx={{ flexShrink: 0, mr: 0.5 }}
            >
              <DeleteSweepIcon />
            </IconButton>
          )}
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
                <IconButton onClick={handlePrevMonth} size="small" sx={monthNavButtonSx}>
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ButtonBase
                    onClick={() => setMonthPickerOpen(true)}
                    aria-label={t('calendar.monthPicker.ariaLabel')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      px: isMobile ? 1.25 : 0.5,
                      py: isMobile ? 0.5 : 0.25,
                      ...outlinedControlSx
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 400, textTransform: 'capitalize' }}>
                      {formatCalendarMonthYear(currentDate, i18n.language)}
                    </Typography>
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{
                        color: isMobile ? 'primary.main' : 'text.secondary',
                        flexShrink: 0,
                        mr: -0.65
                      }}
                    />
                  </ButtonBase>
                </Box>
                <IconButton onClick={handleNextMonth} size="small" sx={monthNavButtonSx}>
                  <ArrowForwardIosIcon fontSize="small" />
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
              <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5 }}>
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
                <IconButton
                  onClick={() => setFilterDialogOpen(true)}
                  aria-label={t('calendar.filter.ariaLabel')}
                  size="small"
                  color={isFilterActive ? 'primary' : 'default'}
                  sx={filterButtonSx}
                >
                  <FilterListIcon />
                </IconButton>
              </Box>
              <Button
                variant="outlined"
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
          <PlansNotes refreshKey={plansRefreshKey} noteIdFromUrl={noteIdFromUrl} />
        )}
      </Box>

      <EventFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filter={eventFilter}
        onApply={setEventFilter}
      />

      <MonthYearPickerDialog
        open={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
        value={currentDate}
        onChange={setCurrentDate}
      />

      <ResponsiveDialog
        open={deleteAllDialogOpen}
        onClose={handleCloseDeleteAllDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isPlansTab ? t('calendar.deleteAll.notesTitle') : t('calendar.deleteAll.eventsTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isPlansTab ? t('calendar.deleteAll.notesConfirm') : t('calendar.deleteAll.eventsConfirm')}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            {isPlansTab ? t('calendar.deleteAll.notesWarning') : t('calendar.deleteAll.eventsWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteAllDialog} disabled={isDeletingAll}>
            {t('calendar.common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDeleteAll}
            color="error"
            variant="contained"
            disabled={isDeletingAll}
            startIcon={isDeletingAll ? <CircularProgress size={20} /> : null}
          >
            {isDeletingAll ? t('calendar.deleteAll.deleting') : t('calendar.common.delete')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>
  );
};

export default Calendar; 