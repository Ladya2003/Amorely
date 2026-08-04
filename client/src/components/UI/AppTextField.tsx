import React from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';
import { placeholderFromLabel, visibleFieldLabel } from '../../theme/fieldLabel';

/**
 * TextField с авто-placeholder из label, когда HIDE_INPUT_LABELS=true.
 */
const AppTextField = React.forwardRef<HTMLDivElement, TextFieldProps>(function AppTextField(
  { label, placeholder, inputProps, ...rest },
  ref
) {
  const resolvedPlaceholder = placeholderFromLabel(label, placeholder);
  const ariaLabel =
    typeof inputProps?.['aria-label'] === 'string'
      ? inputProps['aria-label']
      : typeof label === 'string'
        ? label
        : undefined;

  return (
    <MuiTextField
      {...rest}
      ref={ref}
      label={visibleFieldLabel(label)}
      placeholder={resolvedPlaceholder}
      inputProps={{
        ...inputProps,
        ...(ariaLabel ? { 'aria-label': ariaLabel } : null),
      }}
    />
  );
});

export default AppTextField;
