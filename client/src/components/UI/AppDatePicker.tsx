import React from 'react';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { usePickerFieldOpen } from '../../hooks/usePickerFieldOpen';
import { mergeAppPickerSlotProps } from './pickerModalStyles';

const AppDatePicker: React.FC<DatePickerProps> = (props) => {
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
      slotProps={mergeAppPickerSlotProps(pickerOpen.mergeSlotProps(slotProps))}
    />
  );
};

export default AppDatePicker;
