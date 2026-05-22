import { SxProps, Theme } from '@mui/material';

export const settingsActionButtonSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  '& .MuiButton-startIcon': {
    margin: 0,
    marginRight: 1,
    display: 'inline-flex',
    alignItems: 'center',
  },
};
