import { useCallback, useState } from 'react';

type TextFieldSlotProps =
  | Record<string, unknown>
  | ((ownerState: unknown) => Record<string, unknown>);

type SlotPropsWithTextField = {
  textField?: TextFieldSlotProps;
  [key: string]: unknown;
};

interface UsePickerFieldOpenOptions {
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const attachFieldClickOpen = (
  existing: Record<string, unknown> | undefined,
  openPicker: () => void
): Record<string, unknown> => ({
  ...existing,
  onClick: (event: React.MouseEvent<HTMLElement>) => {
    (existing?.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined)?.(event);
    openPicker();
  },
});

export const usePickerFieldOpen = ({
  disabled = false,
  onOpen,
  onClose,
}: UsePickerFieldOpenOptions = {}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (disabled) {
      return;
    }
    setOpen(true);
    onOpen?.();
  }, [disabled, onOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const mergeSlotProps = useCallback(
    <T,>(slotProps?: T): T => {
      const props = slotProps as SlotPropsWithTextField | undefined;
      const textField = props?.textField;

      if (typeof textField === 'function') {
        return {
          ...(props ?? {}),
          textField: (ownerState: unknown) =>
            attachFieldClickOpen(textField(ownerState) as Record<string, unknown>, handleOpen),
        } as T;
      }

      return {
        ...(props ?? {}),
        textField: attachFieldClickOpen(textField as Record<string, unknown> | undefined, handleOpen),
      } as T;
    },
    [handleOpen]
  );

  return {
    open,
    onOpen: handleOpen,
    onClose: handleClose,
    mergeSlotProps,
  };
};
