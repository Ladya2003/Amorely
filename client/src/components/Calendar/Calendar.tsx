import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton,
  Button,
  ButtonBase,
  Grid,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Badge,
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
import PlanFilterDialog from './PlanFilterDialog';
import MonthYearPickerDialog from './MonthYearPickerDialog';
import { eventMatchesFilter, getEventFilterActiveCount, isEventFilterActive, type EventFilter } from './eventFilterUtils';
import { getPlanFilterActiveCount, isPlanFilterActive, type PlanFilter } from './planFilterUtils';
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
import { getChatTabToggleGroupSx } from '../Chat/chatListStyles';
import { useTabSlideDirection } from '../../hooks/useTabSlideDirection';
import {
  calendarPageEnterSx,
  getCalendarControlsRowSx,
  getCalendarCreateButtonSx,
  getCalendarDeleteAllButtonSx,
  getCalendarFilterBadgeSx,
  getCalendarFilterButtonSx,
  getCalendarHeaderGlowWrapSx,
  getCalendarIconButtonSx,
  getCalendarMainTabsSx,
  getCalendarMonthNavRowSx,
  getCalendarMonthPanelEnterSx,
  getCalendarMonthPickerButtonSx,
  getCalendarMonthTitleEnterSx,
  getCalendarMonthTitleSx,
  getCalendarRootSx,
  getCalendarScrollSx,
  getCalendarTabPanelEnterSx,
  getCalendarToolbarRowSx,
  getCalendarViewToggleGroupSx,
  getCalendarWeekdayLabelSx,
} from './calendarPageStyles';

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
  eventsLoading?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  content,
  allEvents = [],
  onAddContent,
  onContentClick,
  onDeleteAll,
  plansRefreshKey,
  noteIdFromUrl = null,
  forcePlansTab = false,
  eventsLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const weekdays = getCalendarWeekdays(t);
  const skipNextSaveRef = useRef(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthDirection, setMonthDirection] = useState(0);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [view, setView] = useState<CalendarViewMode>(() =>
    user?._id ? readCalendarUiPreferences(user._id).calendarView : 'circles'
  );
  const [tabValue, setTabValue] = useState(() =>
    user?._id && readCalendarUiPreferences(user._id).mainTab === 'plans' ? 1 : 0
  );
  const calendarTabDirection = useTabSlideDirection(tabValue);
  const [eventFilter, setEventFilter] = useState<EventFilter>({
    dateFrom: null,
    dateTo: null,
    title: ''
  });
  const [planFilter, setPlanFilter] = useState<PlanFilter>({
    title: '',
    description: ''
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [planFilterDialogOpen, setPlanFilterDialogOpen] = useState(false);
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

  const handleMainTabChange = (_event: React.MouseEvent<HTMLElement>, newValue: number | null) => {
    if (newValue !== null) {
      setTabValue(newValue);
    }
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

  const goToMonth = useCallback((nextDate: Date, direction?: -1 | 0 | 1) => {
    const normalized = startOfMonth(nextDate);

    if (direction !== undefined) {
      setMonthDirection(direction);
    } else {
      const currentMonthStart = startOfMonth(currentDate).getTime();
      const diff = normalized.getTime() - currentMonthStart;
      setMonthDirection(diff > 0 ? 1 : diff < 0 ? -1 : 0);
    }

    setCurrentDate(normalized);
  }, [currentDate]);

  const handlePrevMonth = () => {
    goToMonth(subMonths(currentDate, 1), -1);
  };

  const handleNextMonth = () => {
    goToMonth(addMonths(currentDate, 1), 1);
  };

  const monthKey = format(currentDate, 'yyyy-MM');

  const isFilterActive = isEventFilterActive(eventFilter);
  const activeFilterCount = getEventFilterActiveCount(eventFilter);
  const isPlansFilterActive = isPlanFilterActive(planFilter);
  const activePlansFilterCount = getPlanFilterActiveCount(planFilter);

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
    <Box sx={getCalendarRootSx()}>
      <Box sx={(muiTheme) => getCalendarHeaderGlowWrapSx(muiTheme)}>
        <Box sx={{ position: 'relative', zIndex: 1, ...calendarPageEnterSx }}>
          <Box sx={getCalendarToolbarRowSx()}>
            <ToggleButtonGroup
              value={tabValue}
              exclusive
              onChange={handleMainTabChange}
              aria-label="calendar tabs"
              size="small"
              sx={{ ...getChatTabToggleGroupSx, ...getCalendarMainTabsSx }}
            >
              <ToggleButton value={0}>
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
                {t('calendar.tab')}
              </ToggleButton>
              <ToggleButton value={1}>
                <ListAltIcon sx={{ fontSize: 18 }} />
                {t('calendar.plansTab')}
              </ToggleButton>
            </ToggleButtonGroup>
            {onDeleteAll && (
              <IconButton
                onClick={handleOpenDeleteAllDialog}
                aria-label={t('calendar.deleteAll.ariaLabel')}
                size="small"
                sx={getCalendarDeleteAllButtonSx(theme)}
              >
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {tabValue === 0 && (
            <>
              {view === 'circles' && (
                <Box sx={getCalendarMonthNavRowSx()}>
                  <IconButton onClick={handlePrevMonth} size="small" sx={getCalendarIconButtonSx(theme)}>
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                  <ButtonBase
                    onClick={() => setMonthPickerOpen(true)}
                    aria-label={t('calendar.monthPicker.ariaLabel')}
                    sx={getCalendarMonthPickerButtonSx(theme, isMobile)}
                  >
                    <Typography
                      key={monthKey}
                      sx={{
                        ...getCalendarMonthTitleSx(),
                        ...getCalendarMonthTitleEnterSx(monthDirection),
                      }}
                    >
                      {formatCalendarMonthYear(currentDate, i18n.language)}
                    </Typography>
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{
                        color: 'primary.main',
                        flexShrink: 0,
                        mr: -0.5,
                      }}
                    />
                  </ButtonBase>
                  <IconButton onClick={handleNextMonth} size="small" sx={getCalendarIconButtonSx(theme)}>
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Box sx={getCalendarControlsRowSx({ gridView: view === 'grid' })}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="calendar view"
                    sx={getCalendarViewToggleGroupSx}
                  >
                    <ToggleButton value="circles" aria-label="circles view">
                      <CalendarMonthIcon sx={{ fontSize: '1.25rem' }} />
                    </ToggleButton>
                    <ToggleButton value="grid" aria-label="grid view">
                      <GridViewIcon sx={{ fontSize: '1.25rem' }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Badge
                    badgeContent={activeFilterCount}
                    color="primary"
                    invisible={activeFilterCount === 0}
                    overlap="rectangular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={getCalendarFilterBadgeSx(theme)}
                  >
                    <IconButton
                      onClick={() => setFilterDialogOpen(true)}
                      aria-label={t('calendar.filter.ariaLabel')}
                      sx={getCalendarFilterButtonSx(theme, isFilterActive)}
                    >
                      <FilterListIcon sx={{ fontSize: '1.25rem' }} />
                    </IconButton>
                  </Badge>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => onAddContent(currentDate)}
                  sx={getCalendarCreateButtonSx()}
                >
                  {t('calendar.createEvent')}
                </Button>
              </Box>
            </>
          )}

          {tabValue === 1 && (
            <Box sx={getCalendarControlsRowSx()}>
              <Badge
                badgeContent={activePlansFilterCount}
                color="primary"
                invisible={activePlansFilterCount === 0}
                overlap="rectangular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={getCalendarFilterBadgeSx(theme)}
              >
                <IconButton
                  onClick={() => setPlanFilterDialogOpen(true)}
                  aria-label={t('calendar.plans.filter.ariaLabel')}
                  sx={getCalendarFilterButtonSx(theme, isPlansFilterActive)}
                >
                  <FilterListIcon sx={{ fontSize: '1.25rem' }} />
                </IconButton>
              </Badge>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={getCalendarScrollSx()}>
        <Box
          key={tabValue}
          sx={getCalendarTabPanelEnterSx(calendarTabDirection)}
        >
        {tabValue === 0 ? (
          <Box>
            {eventsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : view === 'circles' ? (
              <Box key={monthKey} sx={getCalendarMonthPanelEnterSx(monthDirection)}>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {weekdays.map((day, index) => (
                    <Grid size={{ xs: 12/7 }} key={index}>
                      <Typography align="center" sx={getCalendarWeekdayLabelSx()}>
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
          <PlansNotes
            refreshKey={plansRefreshKey}
            noteIdFromUrl={noteIdFromUrl}
            planFilter={planFilter}
          />
        )}
        </Box>
      </Box>

      <EventFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filter={eventFilter}
        onApply={setEventFilter}
      />

      <PlanFilterDialog
        open={planFilterDialogOpen}
        onClose={() => setPlanFilterDialogOpen(false)}
        filter={planFilter}
        onApply={setPlanFilter}
      />

      <MonthYearPickerDialog
        open={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
        value={currentDate}
        onChange={goToMonth}
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