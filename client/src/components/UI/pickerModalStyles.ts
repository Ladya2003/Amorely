import type { SxProps, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../theme/appTheme';

const pickerPaperSx: SxProps<Theme> = {
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  overflow: 'hidden',
};

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

export const appPickerModalSlotProps = {
  mobilePaper: { sx: pickerPaperSx },
  desktopPaper: { sx: pickerPaperSx },
  layout: { sx: pickerLayoutSx },
};

type PaperSlotProps = { sx?: SxProps<Theme>; [key: string]: unknown };

const mergePaperSlot = (base: PaperSlotProps, override?: PaperSlotProps): PaperSlotProps => ({
  ...base,
  ...override,
  sx: override?.sx ? ([base.sx, override.sx] as SxProps<Theme>) : base.sx,
});

export const mergeAppPickerSlotProps = <T,>(slotProps?: T): T => {
  if (!slotProps) {
    return appPickerModalSlotProps as T;
  }

  const props = slotProps as {
    mobilePaper?: PaperSlotProps;
    desktopPaper?: PaperSlotProps;
    layout?: PaperSlotProps;
  };

  return {
    ...props,
    mobilePaper: mergePaperSlot(appPickerModalSlotProps.mobilePaper, props.mobilePaper),
    desktopPaper: mergePaperSlot(appPickerModalSlotProps.desktopPaper, props.desktopPaper),
    layout: mergePaperSlot(appPickerModalSlotProps.layout, props.layout),
  } as T;
};
