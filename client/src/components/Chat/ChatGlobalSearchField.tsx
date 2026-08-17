import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  useTheme,
} from '@mui/material';
import { getChatListSearchFieldSx } from './chatListStyles';
import { CloseIcon, SearchIcon } from '../UI/icons';

type ChatGlobalSearchFieldProps = {
  isSearching: boolean;
  /** Инкремент снаружи сбрасывает локальный ввод (clear / выбор результата). */
  resetToken: number;
  onValueChange: (value: string) => void;
};

/**
 * Локальный state инпута: набор символов не блокируется тяжёлым ре-рендером ChatPage/ChatDialog.
 */
const ChatGlobalSearchField: React.FC<ChatGlobalSearchFieldProps> = ({
  isSearching,
  resetToken,
  onValueChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [resetToken]);

  const handleChange = (next: string) => {
    setValue(next);
    onValueChange(next);
  };

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={t('chat.globalSearch')}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      sx={getChatListSearchFieldSx(theme)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {isSearching ? (
              <CircularProgress size={18} />
            ) : (
              value && (
                <IconButton
                  size="small"
                  onClick={() => handleChange('')}
                  aria-label={t('chat.clearSearch')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};

export default React.memo(ChatGlobalSearchField);
