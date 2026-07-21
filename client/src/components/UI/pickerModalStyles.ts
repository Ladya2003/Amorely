import type { SxProps, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../theme/appTheme';

const pickerLayoutSx: SxProps<Theme> = {
  '& .MuiPickersLayout-toolbar': {
    pt: 2,
    px: 2,
  },
  '& .MuiPickersLayout-contentWrapper': {
    pt: 1.5,
    pb: 1.5,
  },
  '& .MuiPickersLayout-actionBar': {
    px: 2,
    pt: 0.5,
    pb: 2.5,
  },
};

/** Popup календаря — белый фон и тёмный текст в light-теме (не glass) */
const getPickerPaperSx = (theme: Theme): SxProps<Theme> => ({
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  overflow: 'hidden',
  ...(theme.palette.mode === 'light'
    ? {
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        '& .MuiPickersCalendarHeader-label': {
          color: `${theme.palette.text.primary} !important`,
        },
        '& .MuiPickersCalendarHeader-switchViewButton': {
          color: `${theme.palette.text.primary} !important`,
        },
        '& .MuiPickersArrowSwitcher-root .MuiIconButton-root': {
          color: `${theme.palette.text.primary} !important`,
        },
        '& .MuiDayCalendar-weekDayLabel': {
          color: `${theme.palette.text.secondary} !important`,
        },
        '& .MuiPickersLayout-toolbar .MuiTypography-root': {
          color: `${theme.palette.text.primary} !important`,
        },
        '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton': {
          color: theme.palette.text.primary,
        },
      }
    : {}),
});

export const getAppPickerModalSlotProps = (theme: Theme) => ({
  mobilePaper: { sx: getPickerPaperSx(theme) },
  desktopPaper: { sx: getPickerPaperSx(theme) },
  layout: { sx: pickerLayoutSx },
});

type PaperSlotProps = { sx?: SxProps<Theme>; [key: string]: unknown };

const mergePaperSlot = (base: PaperSlotProps, override?: PaperSlotProps): PaperSlotProps => ({
  ...base,
  ...override,
  sx: override?.sx ? ([base.sx, override.sx] as SxProps<Theme>) : base.sx,
});

export const mergeAppPickerSlotProps = <T,>(theme: Theme, slotProps?: T): T => {
  const defaults = getAppPickerModalSlotProps(theme);

  if (!slotProps) {
    return defaults as T;
  }

  const props = slotProps as {
    mobilePaper?: PaperSlotProps;
    desktopPaper?: PaperSlotProps;
    layout?: PaperSlotProps;
  };

  return {
    ...props,
    mobilePaper: mergePaperSlot(defaults.mobilePaper, props.mobilePaper),
    desktopPaper: mergePaperSlot(defaults.desktopPaper, props.desktopPaper),
    layout: mergePaperSlot(defaults.layout, props.layout),
  } as T;
};
