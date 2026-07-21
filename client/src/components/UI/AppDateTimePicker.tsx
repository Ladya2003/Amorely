import React from 'react';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { useTheme } from '@mui/material/styles';
import { usePickerFieldOpen } from '../../hooks/usePickerFieldOpen';
import { mergeAppPickerSlotProps } from './pickerModalStyles';

const AppDateTimePicker: React.FC<DateTimePickerProps> = (props) => {
  const theme = useTheme();
  const { slotProps, disabled, onOpen, onClose, ...rest } = props;
  const pickerOpen = usePickerFieldOpen({
    disabled: Boolean(disabled),
    onOpen,
    onClose,
  });

  return (
    <DateTimePicker
      {...rest}
      disabled={disabled}
      open={pickerOpen.open}
      onOpen={pickerOpen.onOpen}
      onClose={pickerOpen.onClose}
      slotProps={mergeAppPickerSlotProps(theme, pickerOpen.mergeSlotProps(slotProps))}
    />
  );
};

export default AppDateTimePicker;
