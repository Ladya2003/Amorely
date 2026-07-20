import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DailyQuestionChoice, DailyQuestionImageOption, DailyQuestionType } from './types';
import {
  getChoiceButtonSx,
  getImageChoiceLabelSx,
  getImageChoiceSx,
} from './dailyQuestionsStyles';

interface AnswerInputProps {
  type: DailyQuestionType;
  textValue: string;
  selectedValue: string | null;
  options?: DailyQuestionChoice[];
  images?: DailyQuestionImageOption[];
  onTextChange: (value: string) => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  type,
  textValue,
  selectedValue,
  options,
  images,
  onTextChange,
  onSelect,
  disabled = false,
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (type === 'text') {
    return (
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t('dailyQuestions.textPlaceholder')}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    );
  }

  if (type === 'choice' && options) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {options.map((opt) => (
          <Button
            key={opt.id}
            variant={selectedValue === opt.id ? 'contained' : 'outlined'}
            onClick={() => onSelect(opt.id)}
            disabled={disabled}
            sx={getChoiceButtonSx(theme, selectedValue === opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </Box>
    );
  }

  if (type === 'image' && images) {
    return (
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {images.map((img) => (
          <Box
            key={img.id}
            sx={{
              ...getImageChoiceSx(theme, selectedValue === img.id),
              opacity: disabled ? 0.6 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
            }}
            onClick={() => onSelect(img.id)}
            role="button"
            tabIndex={0}
          >
            <img src={img.url} alt={img.label} loading="lazy" />
            <Typography
              variant="caption"
              display="block"
              p={0.75}
              fontWeight={600}
              sx={getImageChoiceLabelSx(theme)}
            >
              {img.label}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return null;
};

export default AnswerInput;
