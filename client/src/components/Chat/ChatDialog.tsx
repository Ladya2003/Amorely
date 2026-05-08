import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Avatar, 
  Paper,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Contact } from './ChatList';
import Message from './Message';

export interface MessageReplyRef {
  id: string;
  text: string;
  senderId: string;
}

export interface MessageForwardRef {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface MessageType {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  editedAt?: string;
  isRead?: boolean;
  replyTo?: MessageReplyRef;
  forwardFrom?: MessageForwardRef;
  clientTempId?: string;
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
  onSendMessage: (
    text: string,
    attachments?: File[],
    replyTo?: MessageReplyRef | null,
    forwardFrom?: MessageForwardRef | null
  ) => void;
  onStartForwardMessage: (message: MessageType) => void;
  onOpenChatWithUser: (userId: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReachMessagesStart?: () => void;
  onReachMessagesEnd?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  pendingForwardMessage?: MessageForwardRef | null;
  onPendingForwardApplied?: () => void;
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
  onStartForwardMessage,
  onOpenChatWithUser,
  onEditMessage,
  onDeleteMessage,
  onReachMessagesStart,
  onReachMessagesEnd,
  onScrollPositionChange,
  pendingForwardMessage = null,
  onPendingForwardApplied,
  hasMoreMessages = false,
  isLoadingOlder = false,
  initialScrollTop = null,
  isLoading = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hiddenDayBadgeKeys, setHiddenDayBadgeKeys] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<MessageReplyRef | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageForwardRef | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    message: MessageType;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
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
  const dayBadgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<number | null>(null);

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
    dayBadgeRefs.current = {};
    messageRefs.current = {};
    setHiddenDayBadgeKeys({});
    setReplyingTo(null);
    setForwardingMessage(null);
    setEditingMessage(null);
    setContextMenu(null);
    setHighlightedMessageId(null);
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  }, [contact?.id]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!contact?.id) return;
    window.setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  }, [contact?.id]);

  useEffect(() => {
    if (!pendingForwardMessage) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setForwardingMessage(pendingForwardMessage);
    onPendingForwardApplied?.();
  }, [pendingForwardMessage, onPendingForwardApplied]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSendMessage = () => {
    const trimmedText = messageText.trim();
    if (editingMessage) {
      if (!trimmedText) return;
      onEditMessage(editingMessage.id, trimmedText);
      setMessageText('');
      setEditingMessage(null);
      setAttachments([]);
      return;
    }

    if (forwardingMessage) {
      if (trimmedText) {
        onSendMessage(trimmedText, [], null, null);
      }
      onSendMessage(forwardingMessage.text || 'Медиафайл', [], null, forwardingMessage);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      setForwardingMessage(null);
      return;
    }

    // Для обычной отправки и reply текст обязателен.
    if (trimmedText) {
      onSendMessage(trimmedText, attachments, replyingTo, null);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
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

  const updateHiddenDayBadges = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const stickyTop = 8;
    const containerRect = container.getBoundingClientRect();
    const stickyLineY = containerRect.top + stickyTop;
    const badgeEntries = Object.entries(dayBadgeRefs.current)
      .filter(([, element]) => Boolean(element))
      .sort((a, b) => (a[1]?.offsetTop || 0) - (b[1]?.offsetTop || 0));

    if (badgeEntries.length <= 1) {
      setHiddenDayBadgeKeys((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const nextHidden: Record<string, boolean> = {};
    for (let index = 0; index < badgeEntries.length - 1; index += 1) {
      const [currentKey, currentEl] = badgeEntries[index];
      const [, nextEl] = badgeEntries[index + 1];

      if (!currentEl || !nextEl) continue;

      const currentRect = currentEl.getBoundingClientRect();
      const nextRect = nextEl.getBoundingClientRect();
      const nextDistanceToStickyTop = nextRect.top - stickyLineY;
      const isTouchingNext = nextDistanceToStickyTop <= currentRect.height;

      if (isTouchingNext) {
        nextHidden[currentKey] = true;
      }
    }

    setHiddenDayBadgeKeys((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextHidden);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === nextHidden[key])
      ) {
        return prev;
      }
      return nextHidden;
    });
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      updateHiddenDayBadges();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [messages, updateHiddenDayBadges]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      onScrollPositionChange?.(container.scrollTop);
    }

    setShowScrollToBottom(!isScrolledToBottom());
    updateHiddenDayBadges();

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

  const handleMessageContextMenu = (event: React.MouseEvent, message: MessageType) => {
    if (event.type === 'contextmenu') {
      event.preventDefault();
    }
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      message
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleReplyFromContextMenu = () => {
    if (!contextMenu) return;
    setEditingMessage(null);
    setForwardingMessage(null);
    setReplyingTo({
      id: contextMenu.message.id,
      text: contextMenu.message.text || (contextMenu.message.attachments?.length ? 'Медиафайл' : ''),
      senderId: contextMenu.message.senderId
    });
    setContextMenu(null);
  };

  const handleForwardFromContextMenu = () => {
    if (!contextMenu) return;
    onStartForwardMessage(contextMenu.message);
    setContextMenu(null);
  };

  const handleEditFromContextMenu = () => {
    if (!contextMenu) return;
    if (contextMenu.message.senderId !== currentUserId || Boolean(contextMenu.message.forwardFrom)) {
      setContextMenu(null);
      return;
    }

    setReplyingTo(null);
    setAttachments([]);
    setEditingMessage(contextMenu.message);
    setMessageText(contextMenu.message.text || '');
    setContextMenu(null);
  };

  const handleDeleteFromContextMenu = () => {
    if (!contextMenu) return;
    setMessageToDelete(contextMenu.message);
    setDeleteModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!messageToDelete) return;
    onDeleteMessage(messageToDelete.id);
    handleDeleteModalClose();
  };

  const handleReplyReferenceClick = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
      highlightTimeoutRef.current = null;
    }, 3000);
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
        const dayBadgeKey = `date-badge-${message.id}`;
        nodes.push(
          <Box
            key={dayBadgeKey}
            ref={(el: HTMLDivElement | null) => {
              dayBadgeRefs.current[dayBadgeKey] = el;
            }}
            sx={{
              position: 'sticky',
              top: 8,
              zIndex: 3,
              display: 'flex',
              justifyContent: 'center',
              my: 1,
              pointerEvents: 'none',
              opacity: hiddenDayBadgeKeys[dayBadgeKey] ? 0 : 1,
              transition: 'opacity 120ms linear'
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
        <Box
          key={message.id}
          ref={(el: HTMLDivElement | null) => {
            messageRefs.current[message.id] = el;
          }}
          onContextMenu={(event) => handleMessageContextMenu(event, message)}
          sx={{
            borderRadius: 2,
            transition: 'background-color 200ms ease',
            bgcolor: highlightedMessageId === message.id ? 'rgba(255, 235, 59, 0.35)' : 'transparent'
          }}
        >
          <Message
            message={message}
            isOwn={message.senderId === currentUserId}
            contactName={contactName}
            contactAvatar={contactAvatar}
            mb={messageSpacing}
            onOpenActions={handleMessageContextMenu}
            onReplyReferenceClick={handleReplyReferenceClick}
            onForwardSourceClick={onOpenChatWithUser}
          />
        </Box>
      );
    });

    return nodes;
  }, [messages, currentUserId, contactName, contactAvatar, hiddenDayBadgeKeys, highlightedMessageId]);

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

        {replyingTo && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              mb: 1
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                Ответ на сообщение
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {replyingTo.text || 'Медиафайл'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyingTo(null)} aria-label="Отменить ответ">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {forwardingMessage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              borderLeft: '3px solid',
              borderColor: 'info.main',
              bgcolor: 'action.hover',
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              mb: 1
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                Пересылаемое сообщение
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {forwardingMessage.text || 'Медиафайл'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setForwardingMessage(null)} aria-label="Отменить пересылку">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {editingMessage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              borderLeft: '3px solid',
              borderColor: 'warning.main',
              bgcolor: 'action.hover',
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              mb: 1
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                Редактирование сообщения
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {editingMessage.text || 'Без текста'}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setEditingMessage(null);
                setMessageText('');
              }}
              aria-label="Отменить редактирование"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          maxRows={4}
          inputRef={messageInputRef}
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
                  disabled={editingMessage ? !messageText.trim() : (!forwardingMessage && !messageText.trim())}
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
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={handleReplyFromContextMenu}
          sx={{
            fontSize: '12px',
            minHeight: '28px',
            py: 0.5,
            px: 1.25
          }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
            <ReplyOutlinedIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          Ответить
        </MenuItem>
        {contextMenu?.message.senderId === currentUserId && !contextMenu?.message.forwardFrom && (
          <MenuItem
            onClick={handleEditFromContextMenu}
            sx={{
              fontSize: '12px',
              minHeight: '28px',
              py: 0.5,
              px: 1.25
            }}
          >
            <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Редактировать
          </MenuItem>
        )}
        <MenuItem
          onClick={handleForwardFromContextMenu}
          sx={{
            fontSize: '12px',
            minHeight: '28px',
            py: 0.5,
            px: 1.25
          }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
            <ForwardOutlinedIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          Переслать
        </MenuItem>
        <MenuItem
          onClick={handleDeleteFromContextMenu}
          sx={{
            fontSize: '12px',
            minHeight: '28px',
            py: 0.5,
            px: 1.25,
            color: 'error.main'
          }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          Удалить
        </MenuItem>
      </Menu>
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteModalClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>Удалить сообщение?</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Вы точно хотите удалить сообщение для вас и вашего собеседника?
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {messageToDelete?.text || (messageToDelete?.attachments?.length ? 'Медиафайл' : 'Сообщение без текста')}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteModalClose} variant="text">
            Отмена
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatDialog; 