import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import { AppPaperClipIcon, AppSendMessageIcon } from '../UI/AppIcons';
import {
  chatComposerAttachButtonSx,
  chatComposerAttachIconSx,
  chatComposerSendButtonSx,
  chatComposerSendIconSx,
  getChatComposerInputSx,
} from './chatInputStyles';

type ChatMessageInputProps = {
  /** Значение, которое подставляется при смене `externalValueKey` (edit / clear). */
  externalValue?: string;
  externalValueKey?: number;
  onSend: (text: string) => void;
  /** Только для typing-индикатора — не должен вызывать setState в родителе. */
  onTypingActivity?: (text: string) => void;
  placeholder?: string;
  /** Режим редактирования: отправка только с непустым текстом. */
  requireText?: boolean;
  /** Forward/share: можно отправить без текста. */
  allowEmptySend?: boolean;
  hasAttachments?: boolean;
  onAttachmentClick: () => void;
  attachmentDisabled?: boolean;
  /** iOS Safari: unlock textarea on touch before focus to suppress the form accessory bar. */
  useIOSAccessoryFix?: boolean;
  onFocus?: () => void;
};

const inputAdornment = (
  onAttachmentClick: () => void,
  onSend: () => void,
  attachmentDisabled: boolean,
  sendDisabled: boolean
) => (
  <InputAdornment position="end" sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <IconButton
      size="small"
      onClick={onAttachmentClick}
      disabled={attachmentDisabled}
      onTouchStart={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={chatComposerAttachButtonSx}
    >
      <AppPaperClipIcon sx={chatComposerAttachIconSx} />
    </IconButton>
    <IconButton
      size="small"
      onClick={onSend}
      disabled={sendDisabled}
      onTouchStart={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={chatComposerSendButtonSx}
    >
      <AppSendMessageIcon sx={chatComposerSendIconSx} />
    </IconButton>
  </InputAdornment>
);

/**
 * Локальный draft text: набор символов не перерисовывает ChatDialog / список сообщений.
 */
const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  externalValue = '',
  externalValueKey = 0,
  onSend,
  onTypingActivity,
  placeholder = '',
  requireText = false,
  allowEmptySend = false,
  hasAttachments = false,
  onAttachmentClick,
  attachmentDisabled = false,
  useIOSAccessoryFix = false,
  onFocus,
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(externalValue);
  const [iosInputLocked, setIosInputLocked] = useState(useIOSAccessoryFix);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValueKey, externalValue]);

  const trimmed = value.trim();
  const sendDisabled = requireText
    ? !trimmed
    : !allowEmptySend && !trimmed && !hasAttachments;

  const unlockIOSInput = useCallback(() => {
    if (!useIOSAccessoryFix) {
      return;
    }

    setIosInputLocked(false);
    const input = inputRef.current;
    if (input) {
      input.readOnly = false;
      input.focus();
    }
  }, [useIOSAccessoryFix]);

  const lockIOSInput = useCallback(() => {
    if (!useIOSAccessoryFix) {
      return;
    }

    setIosInputLocked(true);
    const input = inputRef.current;
    if (input) {
      input.readOnly = true;
    }
  }, [useIOSAccessoryFix]);

  const handleComposerPointerDown = useCallback(
    (event: React.SyntheticEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, [role="button"]')) {
        return;
      }
      unlockIOSInput();
    },
    [unlockIOSInput]
  );

  const handleChange = (next: string) => {
    setValue(next);
    onTypingActivity?.(next);
  };

  const handleSend = () => {
    if (sendDisabled) return;
    onSend(value);
  };

  return (
    <Box
      data-chat-composer=""
      onTouchStartCapture={handleComposerPointerDown}
      onMouseDownCapture={handleComposerPointerDown}
      sx={{ mt: 1 }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={8}
        placeholder={placeholder}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        onBlur={lockIOSInput}
        onFocus={onFocus}
        inputRef={inputRef}
        InputProps={{
          endAdornment: inputAdornment(
            onAttachmentClick,
            handleSend,
            attachmentDisabled,
            sendDisabled
          ),
        }}
        inputProps={{
          readOnly: useIOSAccessoryFix ? iosInputLocked : false,
          enterKeyHint: 'send',
          autoComplete: 'off',
          autoCorrect: 'on',
          autoCapitalize: 'sentences',
          spellCheck: 'true',
        }}
        sx={getChatComposerInputSx(theme)}
      />
    </Box>
  );
};

export default React.memo(ChatMessageInput);
