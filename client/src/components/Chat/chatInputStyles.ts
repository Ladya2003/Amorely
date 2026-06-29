/** Компактнее глобальных инпутов — поле ввода сообщения в диалоге */
export const chatComposerInputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
    paddingLeft: '16px',
    paddingRight: '10px',
  },
  '& .MuiInputBase-input': {
    fontSize: '16px',
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
  },
  '& .MuiInputAdornment-positionEnd': {
    marginLeft: 6,
    gap: 0.5,
    flexShrink: 0,
  },
} as const;

const chatComposerActionButtonBaseSx = {
  p: 0.875,
  flexShrink: 0,
  width: 36,
  height: 36,
  boxShadow: 'none',
} as const;

export const chatComposerAttachButtonSx = {
  ...chatComposerActionButtonBaseSx,
  color: 'text.primary',
  bgcolor: 'action.hover',
  '&:hover': {
    bgcolor: 'action.selected',
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    bgcolor: 'action.disabledBackground',
    color: 'action.disabled',
  },
} as const;

export const chatComposerSendButtonSx = {
  ...chatComposerActionButtonBaseSx,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  '&:hover': {
    bgcolor: 'primary.dark',
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    bgcolor: 'action.disabledBackground',
    color: 'action.disabled',
  },
} as const;

export const chatComposerAttachIconSx = {
  fontSize: 21,
} as const;

export const chatComposerSendIconSx = {
  fontSize: 20,
  ml: 0.125,
  mt: -0.125,
} as const;

export { getChatComposerInputSx } from './chatDialogStyles';

/** Поиск с иконкой слева — меньше отступ у края поля */
export const chatSearchInputSx = {
  '& .MuiOutlinedInput-root': {
    paddingLeft: '10px',
  },
  '& .MuiInputBase-inputSizeSmall': {
    paddingLeft: '0 !important',
  },
} as const;
