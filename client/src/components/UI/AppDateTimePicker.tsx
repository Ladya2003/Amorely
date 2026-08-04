import React from 'react';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { useTheme } from '@mui/material/styles';
import { usePickerFieldOpen } from '../../hooks/usePickerFieldOpen';
import { visibleFieldLabel } from '../../theme/fieldLabel';
import { mergeAppPickerSlotProps } from './pickerModalStyles';
import { withPickerLabelPlaceholder } from './pickerLabelPlaceholder';

const AppDateTimePicker: React.FC<DateTimePickerProps> = (props) => {
  const theme = useTheme();
  const { label, slotProps, disabled, onOpen, onClose, ...rest } = props;
  const pickerOpen = usePickerFieldOpen({
    disabled: Boolean(disabled),
    onOpen,
    onClose,
  });

  const mergedOpenSlots = pickerOpen.mergeSlotProps(slotProps);
  const slotPropsWithPlaceholder = {
    ...mergedOpenSlots,
    textField: withPickerLabelPlaceholder(label, mergedOpenSlots?.textField),
  };

  return (
    <DateTimePicker
      {...rest}
      label={visibleFieldLabel(label)}
      disabled={disabled}
      open={pickerOpen.open}
      onOpen={pickerOpen.onOpen}
      onClose={pickerOpen.onClose}
      slotProps={mergeAppPickerSlotProps(theme, slotPropsWithPlaceholder)}
    />
  );
};

export default AppDateTimePicker;
