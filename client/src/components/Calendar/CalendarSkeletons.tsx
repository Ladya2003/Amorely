import React from 'react';
import { Box, Grid, Skeleton, useTheme } from '@mui/material';
import {
  getCalendarDayEmptySx,
  getCalendarGridTileSx,
  getCalendarPlanNoteCardSx,
  getCalendarWeekdayLabelSx,
} from './calendarPageStyles';
import { CALENDAR_DRAWER_INNER_RADIUS } from './calendarDrawerStyles';

const WEEKDAY_PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6];
const MONTH_DAY_COUNT = 42; // 6 недель

/** Скелетон кругового вида календаря */
export const CalendarMonthSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {WEEKDAY_PLACEHOLDERS.map((index) => (
          <Grid size={{ xs: 12 / 7 }} key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'center', ...getCalendarWeekdayLabelSx() }}>
              <Skeleton variant="text" animation="wave" width={18} height={18} />
            </Box>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={1}>
        {Array.from({ length: MONTH_DAY_COUNT }, (_, index) => (
          <Grid size={{ xs: 12 / 7 }} key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Skeleton
                variant="circular"
                animation="wave"
                width={40}
                height={40}
                sx={{
                  ...getCalendarDayEmptySx(theme),
                  transform: 'none',
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/** Скелетон плиточного (grid) вида */
export const CalendarGridSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Skeleton variant="text" animation="wave" width={160} height={28} sx={{ mb: 1.5, mt: 1.5 }} />
      <Grid container spacing={1}>
        {Array.from({ length: 12 }, (_, index) => (
          <Grid size={{ xs: 6, sm: 4 }} key={index}>
            <Box sx={{ ...getCalendarGridTileSx(theme), cursor: 'default' }}>
              <Skeleton
                variant="rectangular"
                animation="wave"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  transform: 'none',
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/** Скелетон списка планов/заметок */
export const PlansNotesSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {[0, 1, 2, 3].map((key) => (
        <Box
          key={key}
          sx={{
            ...getCalendarPlanNoteCardSx(theme),
            cursor: 'default',
            pointerEvents: 'none',
            '&:hover': { transform: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" animation="wave" width="62%" height={24} />
              <Skeleton variant="text" animation="wave" width="88%" height={18} sx={{ mt: 0.5 }} />
              <Skeleton variant="text" animation="wave" width="40%" height={16} sx={{ mt: 1 }} />
            </Box>
            <Skeleton
              variant="rounded"
              animation="wave"
              width={64}
              height={24}
              sx={{ borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`, flexShrink: 0 }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
