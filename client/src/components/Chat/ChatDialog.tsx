import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Avatar, 
  Paper,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Contact } from './ChatList';
import Message from './Message';

export interface MessageType {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
  attachments?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
}

interface ChatDialogProps {
  contact: Contact | null;
  messages: MessageType[];
  currentUserId: string;
  onBack: (scrollTop?: number) => void;
  onSendMessage: (text: string, attachments?: File[]) => void;
  onReachMessagesStart?: () => void;
  onReachMessagesEnd?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  hasMoreMessages?: boolean;
  isLoadingOlder?: boolean;
  initialScrollTop?: number | null;
  isLoading?: boolean;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ 
  contact, 
  messages, 
  currentUserId, 
  onBack, 
  onSendMessage,
  onReachMessagesStart,
  onReachMessagesEnd,
  onScrollPositionChange,
  hasMoreMessages = false,
  isLoadingOlder = false,
  initialScrollTop = null,
  isLoading = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousFirstMessageIdRef = useRef<string | null>(null);
  const pendingTopLoadAdjustmentRef = useRef<{
    prevScrollTop: number;
    prevScrollHeight: number;
  } | null>(null);
  const hasAppliedInitialScrollRef = useRef<boolean>(false);

  const isScrolledToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const thresholdPx = 40;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= thresholdPx;
  };

  useEffect(() => {
    // При первой загрузке скроллим вниз мгновенно
    if (isInitialLoadRef.current && messages.length > 0 && !isLoading) {
      const container = messagesContainerRef.current;
      if (container && initialScrollTop !== null && !hasAppliedInitialScrollRef.current) {
        container.scrollTop = initialScrollTop;
        hasAppliedInitialScrollRef.current = true;
      } else {
        scrollToBottom('auto');
        // Небольшая задержка, чтобы дождаться применения скролла в DOM
        setTimeout(() => {
          if (isScrolledToBottom()) {
            onReachMessagesEnd?.();
          }
        }, 0);
      }
      isInitialLoadRef.current = false;
      previousMessagesLengthRef.current = messages.length;
    } 
    // При добавлении новых сообщений скроллим плавно
    else if (messages.length > previousMessagesLengthRef.current) {
      const currentFirstMessageId = messages[0]?.id || null;
      const hasPrependedMessages =
        previousFirstMessageIdRef.current !== null &&
        currentFirstMessageId !== previousFirstMessageIdRef.current;

      if (hasPrependedMessages) {
        const container = messagesContainerRef.current;
        if (container && pendingTopLoadAdjustmentRef.current) {
          const { prevScrollTop, prevScrollHeight } = pendingTopLoadAdjustmentRef.current;
          const scrollDelta = container.scrollHeight - prevScrollHeight;
          container.scrollTop = prevScrollTop + scrollDelta;
        }
        pendingTopLoadAdjustmentRef.current = null;
      } else {
        scrollToBottom('smooth');
        setTimeout(() => {
          if (isScrolledToBottom()) {
            onReachMessagesEnd?.();
          }
        }, 200);
      }

      previousMessagesLengthRef.current = messages.length;
    }

    previousFirstMessageIdRef.current = messages[0]?.id || null;
    setShowScrollToBottom(!isScrolledToBottom());
  }, [messages, isLoading, onReachMessagesEnd, initialScrollTop]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (
      container &&
      initialScrollTop !== null &&
      !hasAppliedInitialScrollRef.current &&
      messages.length > 0 &&
      !isLoading
    ) {
      container.scrollTop = initialScrollTop;
      hasAppliedInitialScrollRef.current = true;
    }
  }, [initialScrollTop, messages.length, isLoading]);

  useEffect(() => {
    const nextUrls = attachments
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => URL.createObjectURL(file));

    setAttachmentPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  // Сброс при смене контакта
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessagesLengthRef.current = 0;
    previousFirstMessageIdRef.current = null;
    pendingTopLoadAdjustmentRef.current = null;
    hasAppliedInitialScrollRef.current = false;
    setShowScrollToBottom(false);
  }, [contact?.id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSendMessage = () => {
    if (messageText.trim() || attachments.length > 0) {
      onSendMessage(messageText, attachments);
      setMessageText('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      onScrollPositionChange?.(container.scrollTop);
    }

    setShowScrollToBottom(!isScrolledToBottom());

    if (
      container &&
      onReachMessagesStart &&
      hasMoreMessages &&
      !isLoadingOlder &&
      container.scrollTop <= 120
    ) {
      pendingTopLoadAdjustmentRef.current = {
        prevScrollTop: container.scrollTop,
        prevScrollHeight: container.scrollHeight
      };
      onReachMessagesStart();
    }

    if (isScrolledToBottom()) {
      onReachMessagesEnd?.();
    }
  };

  const handleBackClick = () => {
    const container = messagesContainerRef.current;
    const currentScrollTop = container?.scrollTop ?? 0;
    onScrollPositionChange?.(currentScrollTop);
    onBack(currentScrollTop);
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom('smooth');
    setTimeout(() => {
      setShowScrollToBottom(false);
    }, 250);
  };

  const contactName = contact?.name || '';
  const contactAvatar = contact?.avatar || '';

  const renderedMessages = useMemo(() => {
    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const nodes: React.ReactNode[] = [];

    messages.forEach((message, index) => {
      const nextMessage = messages[index + 1];
      const previousMessage = messages[index - 1];
      let messageSpacing = 0.75;

      if (nextMessage) {
        const currentTs = new Date(message.timestamp).getTime();
        const nextTs = new Date(nextMessage.timestamp).getTime();
        const minutesDiff = (nextTs - currentTs) / (1000 * 60);

        if (minutesDiff >= 30) {
          messageSpacing = 2.5;
        }
      }

      const currentDate = new Date(message.timestamp);
      const previousDate = previousMessage ? new Date(previousMessage.timestamp) : null;
      const shouldShowDateBadge =
        !Number.isNaN(currentDate.getTime()) &&
        (!previousDate || Number.isNaN(previousDate.getTime()) || !isSameDay(previousDate, currentDate));

      if (shouldShowDateBadge) {
        nodes.push(
          <Box
            key={`date-badge-${message.id}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 1
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                bgcolor: 'rgba(0, 0, 0, 0.35)',
                color: '#fff',
                fontSize: '12px',
                lineHeight: 1.2,
                backdropFilter: 'blur(2px)'
              }}
            >
              {currentDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long'
              })}
            </Box>
          </Box>
        );
      }

      nodes.push(
        <Message
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          contactName={contactName}
          contactAvatar={contactAvatar}
          mb={messageSpacing}
        />
      );
    });

    return nodes;
  }, [messages, currentUserId, contactName, contactAvatar]);

  const attachmentPreviewByIndex = useMemo(() => {
    const result: Record<number, string> = {};
    let imageCursor = 0;

    attachments.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        result[index] = attachmentPreviewUrls[imageCursor] || '';
        imageCursor += 1;
      }
    });

    return result;
  }, [attachments, attachmentPreviewUrls]);

  if (!contact) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: 'background.paper',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Заголовок чата - фиксированный */}
      <Paper 
        elevation={2}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRadius: 0
        }}
      >
        <IconButton edge="start" onClick={handleBackClick} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar 
          alt={contact.name} 
          src={contact.avatar} 
          sx={{ width: 40, height: 40, mr: 2 }}
        />
        <Typography variant="h6" noWrap>
          {contact.name}
        </Typography>
      </Paper>

      {/* Область сообщений */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        bgcolor: '#f5f5f5'
      }}
      ref={messagesContainerRef}
      onScroll={handleMessagesScroll}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {isLoadingOlder && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={18} color="primary" />
              </Box>
            )}
            {renderedMessages}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {showScrollToBottom && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 120,
            zIndex: 120
          }}
        >
          <IconButton
            color="primary"
            onClick={handleScrollToBottomClick}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper'
              }
            }}
            aria-label="Прокрутить вниз"
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
      )}

      {/* Область ввода сообщения - фиксированная */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          borderRadius: 0
        }}
      >
        {attachments.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 2,
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {attachments.map((file, index) => (
              <Box 
                key={index}
                sx={{ 
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {file.type.startsWith('image/') ? (
                  <img 
                    src={attachmentPreviewByIndex[index] || ''}
                    alt={`Attachment ${index}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'action.hover'
                    }}
                  >
                    <Typography variant="caption">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleAttachmentClick}>
                  <AttachFileIcon />
                </IconButton>
                {/* <IconButton>
                  <EmojiEmotionsIcon />
                </IconButton> */}
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && attachments.length === 0}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mt: 1 }}
        />
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </Paper>
    </Box>
  );
};

export default ChatDialog; 