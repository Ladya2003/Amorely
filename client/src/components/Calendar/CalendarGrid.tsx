import React, { useEffect, useRef } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DescriptionIcon from '@mui/icons-material/Description';

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

interface CalendarGridProps {
  months: Array<{
    monthKey: string;
    monthDate: Date;
    days: Array<{
      date: Date;
      events: EventItem[];
    }>;
  }>;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onContentClick?: (eventId: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ months, currentMonth, onMonthChange, onContentClick }) => {
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  const handleContentClick = (eventId?: string) => {
    if (eventId && onContentClick) {
      onContentClick(eventId);
    }
  };

  // Intersection Observer для определения видимого месяца
  useEffect(() => {
    // Ищем родительский скролл-контейнер (Box с overflow: 'auto')
    let scrollParent: HTMLElement | null = scrollContainerRef.current?.parentElement || null;
    while (scrollParent && scrollParent !== document.body) {
      const overflowY = window.getComputedStyle(scrollParent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const monthKey = entry.target.getAttribute('data-month-key');
            if (monthKey) {
              const month = months.find(m => m.monthKey === monthKey);
              if (month && format(month.monthDate, 'yyyy-MM') !== format(currentMonth, 'yyyy-MM')) {
                onMonthChange(month.monthDate);
              }
            }
          }
        });
      },
      {
        root: scrollParent === document.body ? null : scrollParent,
        threshold: [0.3],
        rootMargin: '-100px 0px -50% 0px' // Отслеживаем верхнюю часть
      }
    );

    Object.values(monthRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [months, currentMonth, onMonthChange]);

  // Прокрутка к месяцу при изменении currentMonth кнопками
  useEffect(() => {
    const currentMonthKey = format(currentMonth, 'yyyy-MM');
    const targetRef = monthRefs.current[currentMonthKey];
    
    if (targetRef) {
      isScrollingProgrammatically.current = true;
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Сбрасываем флаг через некоторое время
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    }
  }, [currentMonth]);

  return (
    <Box ref={scrollContainerRef}>
      <Grid container spacing={2}>
        {months.map((month) => (
          <Grid size={{ xs: 12 }} key={month.monthKey}>
            <Box
              ref={(el) => { monthRefs.current[month.monthKey] = el as HTMLDivElement | null; }}
              data-month-key={month.monthKey}
            >
              {/* Заголовок месяца */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  mt: 2,
                  fontWeight: 600,
                  py: 1,
                  textTransform: 'capitalize'
                }}
              >
                {format(month.monthDate, 'LLLL yyyy', { locale: ru })}
              </Typography>

              {/* Дни месяца */}
              {month.days.map((day, dayIndex) => (
                <Box key={dayIndex} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {format(day.date, 'd MMMM yyyy', { locale: ru })}
                  </Typography>
                  <Grid container spacing={1}>
                    {/* Для каждого события показываем все его медиафайлы */}
                    {day.events.map((event) => {
                      const eventId = event.eventId || event._id;
                      const hasMedia = event.media && event.media.length > 0 && event.media[0].url && event.media[0].url.trim().length > 0;
                      
                      if (!hasMedia) {
                        // Текстовое событие - показываем одну карточку
                        return (
                          <Grid size={{ xs: 4, sm: 3, md: 2 }} key={eventId}>
                    <Box 
                      sx={{ 
                        position: 'relative',
                        paddingTop: '100%',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        bgcolor: 'primary.light'
                      }}
                      onClick={() => handleContentClick(eventId)}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: 48, color: 'white' }} />
                      </Box>
                      {/* Заголовок для текстового события */}
                      {event.title && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            p: 0.5,
                            fontSize: '0.75rem'
                          }}
                        >
                          <Typography variant="caption" noWrap>
                            {event.title}
                          </Typography>
                        </Box>
                      )}
                            </Box>
                          </Grid>
                        );
                      }
                      
                      // Событие с медиа - показываем все файлы
                      return event.media.map((media, mediaIndex) => (
                        <Grid size={{ xs: 4, sm: 3, md: 2 }} key={`${eventId}-${media._id}`}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      paddingTop: '100%',
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleContentClick(eventId)}
                  >
                    <Box
                      component="img"
                      src={media.url}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {media.resourceType === 'video' && (
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
                    {/* Показываем заголовок только на первом медиа */}
                    {mediaIndex === 0 && event.title && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          p: 0.5,
                          fontSize: '0.75rem'
                        }}
                      >
                        <Typography variant="caption" noWrap>
                          {event.title}
                          {event.media.length > 1 && ` (${event.media.length})`}
                        </Typography>
                      </Box>
                    )}
                          </Box>
                        </Grid>
                      ));
                    })}
                  </Grid>
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CalendarGrid; 