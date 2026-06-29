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
  },
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
