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
  Button,
  Badge,
  Alert
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
import SharedEventCard from './SharedEventCard';
import ContactProfileDialog from './ContactProfileDialog';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import { formatContactPresence } from '../../utils/formatContactPresence';

const CHAT_FONT_FAMILY = '"Roboto", "Arial", sans-serif';

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

export interface SharedEventMediaRef {
  id?: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

export interface SharedEventRef {
  eventId: string;
  title: string;
  /** @deprecated используйте media; первое медиа для обратной совместимости */
  previewUrl?: string;
  previewResourceType?: 'image' | 'video';
  previewEncrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  previewEncryptedMediaEnvelope?: { ciphertext: string; iv: string };
  previewMetadataSenderId?: string;
  previewMetadataRecipientId?: string;
  eventDate?: string;
  media?: SharedEventMediaRef[];
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
  sharedEvent?: SharedEventRef;
  clientTempId?: string;
  encryptedPayload?: {
    version: number;
    algorithm: string;
    ciphertext: string;
    iv: string;
    senderDeviceId: string;
  };
  attachments?: Array<{
    type: 'image' | 'video' | 'encrypted';
    url: string;
    publicId?: string;
    encrypted?: boolean;
  }>;
  mediaEnvelopes?: ChatMediaEnvelope[];
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
    forwardFrom?: MessageForwardRef | null,
    sharedEvent?: SharedEventRef | null
  ) => void;
  onStartForwardMessage: (message: MessageType) => void;
  onOpenChatWithUser: (userId: string, forwardHint?: MessageForwardRef | null) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReachMessagesStart?: () => void;
  onReachMessagesEnd?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  pendingForwardMessage?: MessageForwardRef | null;
  onPendingForwardApplied?: () => void;
  pendingForwardSharedEvent?: SharedEventRef | null;
  pendingSharedEvent?: SharedEventRef | null;
  onPendingSharedEventApplied?: () => void;
  onSharedEventClick?: (eventId: string) => void;
  hasMoreMessages?: boolean;
  isLoadingOlder?: boolean;
  initialScrollTop?: number | null;
  isLoading?: boolean;
}

const isMessageEditable = (message: MessageType, currentUserId: string) => {
  if (message.id.startsWith('temp-')) return false;
  if (message.senderId !== currentUserId) return false;
  if (message.forwardFrom) return false;
  if (message.sharedEvent && !message.text?.trim() && !message.encryptedPayload) return false;

  const hasMediaAttachments = Boolean(
    message.attachments?.some(
      (attachment) =>
        attachment.type === 'image' ||
        attachment.type === 'video' ||
        attachment.type === 'encrypted' ||
        attachment.encrypted
    )
  );

  if (hasMediaAttachments) return false;

  return Boolean(message.text?.trim() || message.encryptedPayload);
};

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
  pendingForwardSharedEvent = null,
  pendingSharedEvent = null,
  onPendingSharedEventApplied,
  onSharedEventClick,
  hasMoreMessages = false,
  isLoadingOlder = false,
  initialScrollTop = null,
  isLoading = false
}) => {
  const { otherUnreadCount } = useUnreadMessages();
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentValidationError, setAttachmentValidationError] = useState<string | null>(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hiddenDayBadgeKeys, setHiddenDayBadgeKeys] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<MessageReplyRef | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageForwardRef | null>(null);
  const [forwardingSharedEvent, setForwardingSharedEvent] = useState<SharedEventRef | null>(null);
  const [sharingEvent, setSharingEvent] = useState<SharedEventRef | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    message: MessageType;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
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
    setForwardingSharedEvent(null);
    setSharingEvent(null);
    setEditingMessage(null);
    setContextMenu(null);
    setHighlightedMessageId(null);
    setDeleteModalOpen(false);
    setMessageToDelete(null);
    setProfileDialogOpen(false);
  }, [contact?.id]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingForwardMessage) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setSharingEvent(null);
    setForwardingMessage(pendingForwardMessage);
    setForwardingSharedEvent(pendingForwardSharedEvent || null);
    onPendingForwardApplied?.();
  }, [pendingForwardMessage, pendingForwardSharedEvent, onPendingForwardApplied]);

  useEffect(() => {
    if (!pendingSharedEvent) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setSharingEvent(pendingSharedEvent);
    onPendingSharedEventApplied?.();
  }, [pendingSharedEvent, onPendingSharedEventApplied]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const top = container.scrollHeight - container.clientHeight;
    if (behavior === 'auto') {
      container.scrollTop = top;
      return;
    }

    container.scrollTo({ top, behavior });
  };

  const scrollMessageIntoView = (messageId: string, behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    const target = messageRefs.current[messageId];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - containerRect.top + container.scrollTop;
    const centeredTop = targetTop - container.clientHeight / 2 + targetRect.height / 2;
    const maxTop = container.scrollHeight - container.clientHeight;
    const nextTop = Math.max(0, Math.min(centeredTop, maxTop));

    if (behavior === 'auto') {
      container.scrollTop = nextTop;
      return;
    }

    container.scrollTo({ top: nextTop, behavior });
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
        onSendMessage(trimmedText, [], null, null, null);
      }
      onSendMessage(
        forwardingSharedEvent ? '' : (forwardingMessage.text || 'Пересланное сообщение'),
        [],
        null,
        forwardingMessage,
        forwardingSharedEvent
      );
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      setForwardingMessage(null);
      setForwardingSharedEvent(null);
      return;
    }

    if (sharingEvent) {
      if (trimmedText) {
        onSendMessage(trimmedText, [], null, null, null);
      }
      onSendMessage('', [], null, null, sharingEvent);
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      setSharingEvent(null);
      return;
    }

    if (trimmedText || attachments.length > 0) {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const { accepted, errors } = await validateAndFilterMediaFiles(Array.from(e.target.files));
    e.target.value = '';

    if (errors.length > 0) {
      setAttachmentValidationError(errors.join(' '));
    } else {
      setAttachmentValidationError(null);
    }

    if (accepted.length === 0) return;

    setAttachments((prev) => [...prev, ...accepted]);
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
    setForwardingSharedEvent(null);
    setSharingEvent(null);
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
    if (!isMessageEditable(contextMenu.message, currentUserId)) {
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
    scrollMessageIntoView(messageId, 'smooth');
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
            onForwardSourceClick={(userId, forwardFrom) => onOpenChatWithUser(userId, forwardFrom)}
            onSharedEventClick={onSharedEventClick}
          />
        </Box>
      );
    });

    return nodes;
  }, [messages, currentUserId, contactName, contactAvatar, hiddenDayBadgeKeys, highlightedMessageId, onOpenChatWithUser, onSharedEventClick]);

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
      overflow: 'hidden',
      fontFamily: CHAT_FONT_FAMILY,
      '& .MuiTypography-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiInputBase-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiMenuItem-root': { fontFamily: CHAT_FONT_FAMILY },
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
          flexShrink: 0,
          zIndex: 100,
          borderRadius: 0
        }}
      >
        <IconButton edge="start" onClick={handleBackClick} sx={{ mr: 1 }}>
          <Badge
            badgeContent={otherUnreadCount}
            color="error"
            max={99}
            invisible={otherUnreadCount === 0}
          >
            <ArrowBackIcon />
          </Badge>
        </IconButton>
        <Avatar 
          alt={contact.name} 
          src={contact.avatar}
          onClick={() => setProfileDialogOpen(true)}
          sx={{
            width: 40,
            height: 40,
            mr: 1.5,
            cursor: 'pointer',
            flexShrink: 0
          }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ fontWeight: 600, lineHeight: 1.25, fontSize: '0.95rem' }}
          >
            {contact.name}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: 'block',
              color: contact.isOnline ? 'success.main' : 'text.secondary',
              lineHeight: 1.2
            }}
          >
            {formatContactPresence(contact.isOnline, contact.lastSeen)}
          </Typography>
        </Box>
      </Paper>

      {/* Область сообщений */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        bgcolor: 'background.default'
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
          flexShrink: 0,
          zIndex: 100,
          borderRadius: 0
        }}
      >
        {attachmentValidationError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {attachmentValidationError}
          </Alert>
        )}
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
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                Пересылаемое сообщение
              </Typography>
              {forwardingSharedEvent ? (
                <SharedEventCard sharedEvent={forwardingSharedEvent} compact />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {forwardingMessage.text || 'Пересланное сообщение'}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setForwardingMessage(null);
                setForwardingSharedEvent(null);
              }}
              aria-label="Отменить пересылку"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {sharingEvent && (
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
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Поделиться событием
              </Typography>
              <SharedEventCard sharedEvent={sharingEvent} compact />
            </Box>
            <IconButton size="small" onClick={() => setSharingEvent(null)} aria-label="Отменить отправку события">
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
                  disabled={
                    editingMessage
                      ? !messageText.trim()
                      : !forwardingMessage && !sharingEvent && !messageText.trim() && attachments.length === 0
                  }
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
            <ForwardOutlinedIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          Ответить
        </MenuItem>
        {contextMenu && isMessageEditable(contextMenu.message, currentUserId) && (
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
            <ReplyOutlinedIcon sx={{ fontSize: 16 }} />
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

      <ContactProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        contact={contact}
      />
    </Box>
  );
};

export default ChatDialog; 