import React, { useEffect, useRef } from 'react';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';

type ChatMessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  sendDisabled?: boolean;
  onAttachmentClick: () => void;
  attachmentDisabled?: boolean;
  useContentEditable?: boolean;
};

const inputAdornment = (
  onAttachmentClick: () => void,
  onSend: () => void,
  attachmentDisabled: boolean,
  sendDisabled: boolean
) => (
  <InputAdornment position="end">
    <IconButton onClick={onAttachmentClick} disabled={attachmentDisabled}>
      <AttachFileIcon />
    </IconButton>
    <IconButton color="primary" onClick={onSend} disabled={sendDisabled}>
      <SendIcon />
    </IconButton>
  </InputAdornment>
);

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Введите сообщение...',
  sendDisabled = false,
  onAttachmentClick,
  attachmentDisabled = false,
  useContentEditable = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!useContentEditable) {
      return;
    }

    const editor = editorRef.current;
    if (!editor || editor.innerText === value) {
      return;
    }

    editor.innerText = value;
  }, [useContentEditable, value]);

  const handleContentEditableInput = () => {
    const editor = editorRef.current;
    if (!editor || isComposingRef.current) {
      return;
    }

    onChange(editor.innerText);
  };

  const handleContentEditableKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  if (useContentEditable) {
    return (
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          alignItems: 'flex-end',
          border: 1,
          borderColor: 'divider',
          borderRadius: '16px',
          bgcolor: 'background.paper',
          px: 1.5,
          py: 1,
          '&:focus-within': {
            borderColor: 'primary.main',
            borderWidth: 2,
            px: 'calc(12px - 1px)',
            py: 'calc(8px - 1px)',
          },
        }}
      >
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          data-placeholder={placeholder}
          onInput={handleContentEditableInput}
          onKeyDown={handleContentEditableKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            handleContentEditableInput();
          }}
          sx={{
            flex: 1,
            minHeight: 24,
            maxHeight: 192,
            overflowY: 'auto',
            outline: 'none',
            fontSize: '16px',
            lineHeight: 1.5,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            '&:empty::before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              pointerEvents: 'none',
            },
          }}
        />
        {inputAdornment(onAttachmentClick, onSend, attachmentDisabled, sendDisabled)}
      </Box>
    );
  }

  return (
    <TextField
      fullWidth
      multiline
      maxRows={8}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyPress={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSend();
        }
      }}
      InputProps={{
        endAdornment: inputAdornment(
          onAttachmentClick,
          onSend,
          attachmentDisabled,
          sendDisabled
        ),
      }}
      sx={{
        mt: 1,
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.paper',
          borderRadius: '16px',
        },
        '& .MuiInputBase-input': {
          fontSize: '16px',
        },
      }}
    />
  );
};

export default ChatMessageInput;
