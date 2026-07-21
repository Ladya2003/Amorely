import React from 'react';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import { usePickerFieldOpen } from '../../hooks/usePickerFieldOpen';
import { mergeAppPickerSlotProps } from './pickerModalStyles';

const AppDatePicker: React.FC<DatePickerProps> = (props) => {
  const theme = useTheme();
  const { slotProps, disabled, onOpen, onClose, ...rest } = props;
  const pickerOpen = usePickerFieldOpen({
    disabled: Boolean(disabled),
    onOpen,
    onClose,
  });

  return (
    <DatePicker
      {...rest}
      disabled={disabled}
      open={pickerOpen.open}
      onOpen={pickerOpen.onOpen}
      onClose={pickerOpen.onClose}
      slotProps={mergeAppPickerSlotProps(theme, pickerOpen.mergeSlotProps(slotProps))}
    />
  );
};

export default AppDatePicker;
