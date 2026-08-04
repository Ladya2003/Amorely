import { ReactNode } from 'react';
import { placeholderFromLabel } from '../../theme/fieldLabel';

type TextFieldSlotProps = Record<string, unknown> & {
  placeholder?: string;
};

/** Добавляет placeholder из label в slotProps.textField date picker'а. */
export const withPickerLabelPlaceholder = <T,>(
  label: ReactNode,
  textField?: T
): T => {
  if (typeof textField === 'function') {
    return ((ownerState: unknown) => {
      const resolved = (textField as (state: unknown) => TextFieldSlotProps)(ownerState);
      return {
        ...resolved,
        placeholder: placeholderFromLabel(label, resolved.placeholder),
      };
    }) as T;
  }

  const props = (textField ?? {}) as TextFieldSlotProps;
  return {
    ...props,
    placeholder: placeholderFromLabel(label, props.placeholder),
  } as T;
};
