import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  useMediaQuery,
  useTheme,
  Paper,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Alert
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Contact } from './ChatList';
import Message from './Message';
import SharedEventCard from './SharedEventCard';
import ContactProfileDialog from './ContactProfileDialog';
import GameBadges from '../Games/GameBadges';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import type { ChatMediaEnvelope } from '../../crypto/cryptoService';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { validateAndFilterMediaFiles } from '../../utils/validateMediaFile';
import { isVideoFile } from '../../utils/videoMetadata';
import { captureVideoPosterFromFile } from '../../utils/videoPoster';
import MediaViewerDialog from '../common/MediaViewerDialog';
import { formatContactPresence } from '../../utils/formatContactPresence';
import { getOnlinePresenceColor } from '../UI/CustomSnackbar';
import { isIOSDevice } from '../../utils/isIOSDevice';
import socketService from '../../services/socketService';
import { useTypingAnimation } from '../../hooks/useTypingAnimation';
import ChatMessageInput from './ChatMessageInput';

const CHAT_FONT_FAMILY = '"Roboto", "Arial", sans-serif';

export interface MessageReplyRef {
  id: string;
  text: string;
  senderId: string;
}

export type ForwardSourceContext = {
  message: MessageType;
  peerId: string;
};

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
  contactIsTyping?: boolean;
  messages: MessageType[];
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (
    text: string,
    attachments?: File[],
    replyTo?: MessageReplyRef | null,
    forwardFrom?: MessageForwardRef | null,
    sharedEvent?: SharedEventRef | null,
    forwardSource?: ForwardSourceContext | null
  ) => void;
  onStartForwardMessage: (message: MessageType) => void;
  onOpenChatWithUser: (userId: string, forwardHint?: MessageForwardRef | null) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReachMessagesStart?: () => void;
  onReachMessagesEnd?: () => void;
  onAtBottomChange?: (atBottom: boolean) => void;
  pendingForwardMessage?: MessageForwardRef | null;
  onPendingForwardApplied?: () => void;
  onCancelPendingForward?: () => void;
  pendingForwardSource?: ForwardSourceContext | null;
  pendingForwardSharedEvent?: SharedEventRef | null;
  pendingSharedEvent?: SharedEventRef | null;
  onPendingSharedEventApplied?: () => void;
  onSharedEventClick?: (eventId: string) => void;
  hasMoreMessages?: boolean;
  isLoadingOlder?: boolean;
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
  contactIsTyping = false,
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
  onAtBottomChange,
  pendingForwardMessage = null,
  onPendingForwardApplied,
  onCancelPendingForward,
  pendingForwardSource = null,
  pendingForwardSharedEvent = null,
  pendingSharedEvent = null,
  onPendingSharedEventApplied,
  onSharedEventClick,
  hasMoreMessages = false,
  isLoadingOlder = false,
  isLoading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const useIOSAccessoryFix = isMobile && isIOSDevice();
  const { otherUnreadCount } = useUnreadMessages();
  const { badges, partnerDisplayBadgeGameId } = useRelationshipBadges();
  const [messageText, setMessageText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const showTypingStatus = Boolean(contactIsTyping && contact?.isOnline);
  const typingStatusText = useTypingAnimation(showTypingStatus);
  const presenceText = showTypingStatus
    ? typingStatusText
    : formatContactPresence(contact?.isOnline, contact?.lastSeen);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentValidationError, setAttachmentValidationError] = useState<string | null>(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<string[]>([]);
  const [attachmentVideoPosters, setAttachmentVideoPosters] = useState<Record<number, string>>({});
  const [isPickingAttachments, setIsPickingAttachments] = useState(false);
  const [attachmentLightbox, setAttachmentLightbox] = useState<{
    url: string;
    mediaType: 'image' | 'video';
  } | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessagesBelowCount, setNewMessagesBelowCount] = useState(0);
  const [enteringMessageIds, setEnteringMessageIds] = useState<Set<string>>(() => new Set());
  const [isMessagesViewportReady, setIsMessagesViewportReady] = useState(false);
  const isAtBottomRef = useRef(true);
  const isAutoFollowingRef = useRef(false);
  const [hiddenDayBadgeKeys, setHiddenDayBadgeKeys] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<MessageReplyRef | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageForwardRef | null>(null);
  const [forwardingSharedEvent, setForwardingSharedEvent] = useState<SharedEventRef | null>(null);
  const [forwardingSource, setForwardingSource] = useState<ForwardSourceContext | null>(null);
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
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousFirstMessageIdRef = useRef<string | null>(null);
  const pendingTopLoadAdjustmentRef = useRef<{
    prevScrollTop: number;
    prevScrollHeight: number;
  } | null>(null);
  const dayBadgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimeoutRef = useRef<number | null>(null);
  const initialScrollPinActiveRef = useRef(false);
  const userScrolledDuringPinRef = useRef(false);

  const stopTypingForContact = useCallback((receiverId?: string | null) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!receiverId || !isTypingActiveRef.current) {
      return;
    }

    try {
      socketService.stopTyping(receiverId);
    } catch {
      // Socket may be unavailable during teardown.
    }

    isTypingActiveRef.current = false;
  }, []);

  const notifyTypingActivity = useCallback((text: string, receiverId?: string | null) => {
    if (!receiverId) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!text.trim()) {
      stopTypingForContact(receiverId);
      return;
    }

    const now = Date.now();
    if (!isTypingActiveRef.current || now - lastTypingEmitRef.current > 2000) {
      try {
        socketService.startTyping(receiverId);
      } catch {
        return;
      }

      isTypingActiveRef.current = true;
      lastTypingEmitRef.current = now;
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingForContact(receiverId);
    }, 3000);
  }, [stopTypingForContact]);

  useEffect(() => {
    return () => {
      stopTypingForContact(contact?.id);
    };
  }, [contact?.id, stopTypingForContact]);

  const getScrollMetrics = () => {
    const container = messagesContainerRef.current;
    if (!container) return null;

    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    return {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      maxTop,
      distanceToBottom,
      atBottom: distanceToBottom <= 40
    };
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    const endEl = messagesEndRef.current;
    if (!container) return;

    if (endEl) {
      endEl.scrollIntoView({ block: 'end', inline: 'nearest', behavior });
      return;
    }

    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);

    if (behavior === 'auto') {
      container.scrollTop = maxTop;
    } else {
      container.scrollTo({ top: maxTop, behavior });
    }
  };

  const isScrolledToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const thresholdPx = 40;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= thresholdPx;
  };

  const pinScrollForKeyboard = () => {
    scrollToBottom('auto');
    isAtBottomRef.current = isScrolledToBottom();
    if (isAtBottomRef.current) {
      setShowScrollToBottom(false);
      setNewMessagesBelowCount(0);
    }
  };

  const schedulePinScrollForKeyboard = () => {
    pinScrollForKeyboard();
    requestAnimationFrame(() => {
      requestAnimationFrame(pinScrollForKeyboard);
    });
    window.setTimeout(pinScrollForKeyboard, 100);
    window.setTimeout(pinScrollForKeyboard, 300);
  };

  const handleMessageInputFocus = () => {
    if (!isMobile) {
      return;
    }
    schedulePinScrollForKeyboard();
  };

  // Сброс при смене контакта — useLayoutEffect, чтобы выполняться до эффекта готовности viewport
  useLayoutEffect(() => {
    isInitialLoadRef.current = true;
    initialScrollPinActiveRef.current = false;
    userScrolledDuringPinRef.current = false;
    previousMessagesLengthRef.current = 0;
    previousFirstMessageIdRef.current = null;
    pendingTopLoadAdjustmentRef.current = null;
    isAtBottomRef.current = true;
    isAutoFollowingRef.current = false;
    setNewMessagesBelowCount(0);
    setEnteringMessageIds(new Set());
    setAttachmentLightbox(null);
    setAttachmentVideoPosters({});
    setIsMessagesViewportReady(false);
    setShowScrollToBottom(false);
    dayBadgeRefs.current = {};
    messageRefs.current = {};
    setHiddenDayBadgeKeys({});
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSource(null);
    setSharingEvent(null);
    setEditingMessage(null);
    setContextMenu(null);
    setHighlightedMessageId(null);
    setDeleteModalOpen(false);
    setMessageToDelete(null);
    setProfileDialogOpen(false);
  }, [contact?.id]);

  useLayoutEffect(() => {
    if (isLoading) {
      setIsMessagesViewportReady(false);
      initialScrollPinActiveRef.current = false;
      return;
    }

    if (!isInitialLoadRef.current) {
      return;
    }

    if (messages.length === 0) {
      return;
    }

    scrollToBottom('auto');
    isAtBottomRef.current = isScrolledToBottom();
    setNewMessagesBelowCount(0);
    previousMessagesLengthRef.current = messages.length;
    isInitialLoadRef.current = false;
    previousFirstMessageIdRef.current = messages[0]?.id || null;
    setIsMessagesViewportReady(true);
    initialScrollPinActiveRef.current = true;

    onAtBottomChange?.(isScrolledToBottom());

    if (isScrolledToBottom()) {
      onReachMessagesEnd?.();
    }
  }, [messages, isLoading, onReachMessagesEnd, onAtBottomChange]);

  useEffect(() => {
    if (!isMessagesViewportReady) {
      return;
    }

    const content = messagesContentRef.current;
    const container = messagesContainerRef.current;
    if (!content || !container) {
      return;
    }

    userScrolledDuringPinRef.current = false;

    const markUserScroll = () => {
      userScrolledDuringPinRef.current = true;
    };

    container.addEventListener('wheel', markUserScroll, { passive: true });
    container.addEventListener('touchmove', markUserScroll, { passive: true });
    container.addEventListener('pointerdown', markUserScroll);

    const pinScrollToBottom = () => {
      if (!initialScrollPinActiveRef.current || userScrolledDuringPinRef.current) {
        return;
      }

      const metrics = getScrollMetrics();
      if (metrics && metrics.distanceToBottom > 2) {
        scrollToBottom('auto');
        isAtBottomRef.current = isScrolledToBottom();
      }
    };

    const observer = new ResizeObserver(() => {
      pinScrollToBottom();
    });
    observer.observe(content);

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        pinScrollToBottom();
      });
    });

    const timeoutId = window.setTimeout(() => {
      initialScrollPinActiveRef.current = false;
    }, 5000);

    return () => {
      observer.disconnect();
      container.removeEventListener('wheel', markUserScroll);
      container.removeEventListener('touchmove', markUserScroll);
      container.removeEventListener('pointerdown', markUserScroll);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isMessagesViewportReady, messages.length]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      if (!document.activeElement?.closest('[data-chat-composer]')) {
        return;
      }
      schedulePinScrollForKeyboard();
    };

    viewport.addEventListener('resize', handleViewportChange);
    return () => viewport.removeEventListener('resize', handleViewportChange);
  }, [isMobile]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    // При добавлении новых сообщений в конец
    if (messages.length > previousMessagesLengthRef.current) {
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
        const newMessages = messages.slice(previousMessagesLengthRef.current);
        const incomingFromOtherCount = newMessages.filter(
          (message) => message.senderId !== currentUserId
        ).length;

        const isBulkInitialAppend =
          previousMessagesLengthRef.current === 0 && newMessages.length > 1;

        if (newMessages.length > 0 && !isBulkInitialAppend) {
          const enteringIds = newMessages.map((message) => message.id);
          setEnteringMessageIds((prev) => {
            const next = new Set(prev);
            enteringIds.forEach((id) => next.add(id));
            return next;
          });
          window.setTimeout(() => {
            setEnteringMessageIds((prev) => {
              const next = new Set(prev);
              enteringIds.forEach((id) => next.delete(id));
              return next;
            });
          }, 280);
        }

        if (isAtBottomRef.current) {
          isAutoFollowingRef.current = true;
          setShowScrollToBottom(false);
          setNewMessagesBelowCount(0);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToBottom('auto');
              isAtBottomRef.current = true;
              isAutoFollowingRef.current = false;
              if (isScrolledToBottom()) {
                onReachMessagesEnd?.();
              }
            });
          });
        } else if (incomingFromOtherCount > 0) {
          setNewMessagesBelowCount((prev) => prev + incomingFromOtherCount);
          setShowScrollToBottom(true);
        } else {
          scrollToBottom('smooth');
          setTimeout(() => {
            if (isScrolledToBottom()) {
              isAtBottomRef.current = true;
              setShowScrollToBottom(false);
              onReachMessagesEnd?.();
            }
          }, 200);
        }
      }

      previousMessagesLengthRef.current = messages.length;
    }

    previousFirstMessageIdRef.current = messages[0]?.id || null;
    if (!isAutoFollowingRef.current) {
      setShowScrollToBottom(!isAtBottomRef.current);
    }
  }, [messages, isLoading, onReachMessagesEnd, currentUserId]);

  useEffect(() => {
    const nextUrls = attachments
      .filter((file) => file.type.startsWith('image/') || isVideoFile(file))
      .map((file) => URL.createObjectURL(file));

    setAttachmentPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  useEffect(() => {
    let cancelled = false;

    const loadVideoPosters = async () => {
      const posterEntries = await Promise.all(
        attachments.map(async (file, index) => {
          if (!isVideoFile(file)) {
            return null;
          }

          const poster = await captureVideoPosterFromFile(file);
          return poster ? ([index, poster] as const) : null;
        })
      );

      if (cancelled) {
        return;
      }

      const nextPosters: Record<number, string> = {};
      posterEntries.forEach((entry) => {
        if (entry) {
          nextPosters[entry[0]] = entry[1];
        }
      });
      setAttachmentVideoPosters(nextPosters);
    };

    void loadVideoPosters();

    return () => {
      cancelled = true;
    };
  }, [attachments]);

  const cancelForwardDraft = () => {
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setForwardingSource(null);
    onCancelPendingForward?.();
  };

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
    setForwardingSource(pendingForwardSource || null);
    onPendingForwardApplied?.();
  }, [pendingForwardMessage, pendingForwardSharedEvent, pendingForwardSource, onPendingForwardApplied]);

  useEffect(() => {
    if (!pendingSharedEvent) return;
    setEditingMessage(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setForwardingSharedEvent(null);
    setSharingEvent(pendingSharedEvent);
    onPendingSharedEventApplied?.();
  }, [pendingSharedEvent, onPendingSharedEventApplied]);

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
    stopTypingForContact(contact?.id);

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
        forwardingSharedEvent,
        forwardingSource
      );
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      cancelForwardDraft();
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

  const processSelectedFiles = useCallback(async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsPickingAttachments(true);

    try {
      const { accepted, errors } = await validateAndFilterMediaFiles(selectedFiles);

      if (errors.length > 0) {
        setAttachmentValidationError(errors.join(' '));
      } else {
        setAttachmentValidationError(null);
      }

      if (accepted.length === 0) {
        return;
      }

      setAttachments((prev) => [...prev, ...accepted]);
    } finally {
      setIsPickingAttachments(false);
    }
  }, []);

  const handleAttachmentClick = () => {
    if (isPickingAttachments) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.mov,video/quicktime';
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', () => {
      const selectedFiles = input.files ? Array.from(input.files) : [];
      cleanup();
      void processSelectedFiles(selectedFiles);
    });

    input.addEventListener('cancel', cleanup);

    document.body.appendChild(input);
    input.click();
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
    let atBottom = isScrolledToBottom();

    if (!atBottom && initialScrollPinActiveRef.current) {
      if (userScrolledDuringPinRef.current) {
        initialScrollPinActiveRef.current = false;
      } else {
        scrollToBottom('auto');
        atBottom = isScrolledToBottom();
      }
    }

    isAtBottomRef.current = atBottom;
    onAtBottomChange?.(atBottom);
    if (!isAutoFollowingRef.current) {
      setShowScrollToBottom(!atBottom);
    }
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

    if (atBottom) {
      setNewMessagesBelowCount(0);
      onReachMessagesEnd?.();
    }
  };

  const handleBackClick = () => {
    onBack();
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom('smooth');
    isAtBottomRef.current = true;
    setNewMessagesBelowCount(0);
    setTimeout(() => {
      setShowScrollToBottom(false);
      if (isScrolledToBottom()) {
        onReachMessagesEnd?.();
      }
    }, 250);
  };

  const scrollDownBadgeLabel =
    newMessagesBelowCount > 99 ? '99+' : String(newMessagesBelowCount);

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
    cancelForwardDraft();
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

  const highlightMessage = (messageId: string) => {
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

  const handleReplyReferenceClick = (messageId: string) => {
    highlightMessage(messageId);
  };

  const handleForwardSourceClick = (userId: string, forwardFrom: MessageForwardRef) => {
    if (userId === contact?.id && forwardFrom.id) {
      highlightMessage(forwardFrom.id);
      return;
    }
    onOpenChatWithUser(userId, forwardFrom);
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
            bgcolor: highlightedMessageId === message.id ? 'rgba(255, 235, 59, 0.35)' : 'transparent',
            ...(enteringMessageIds.has(message.id)
              ? {
                  '@keyframes chatMessageEnter': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  },
                  animation: 'chatMessageEnter 0.22s ease-out'
                }
              : {})
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
            onForwardSourceClick={handleForwardSourceClick}
            onSharedEventClick={onSharedEventClick}
            onContactAvatarClick={() => setProfileDialogOpen(true)}
          />
        </Box>
      );
    });

    return nodes;
  }, [messages, currentUserId, contactName, contactAvatar, hiddenDayBadgeKeys, highlightedMessageId, enteringMessageIds, handleForwardSourceClick, onSharedEventClick]);

  const attachmentPreviewByIndex = useMemo(() => {
    const result: Record<number, { url: string; mediaType: 'image' | 'video' }> = {};
    let mediaCursor = 0;

    attachments.forEach((file, index) => {
      if (file.type.startsWith('image/') || isVideoFile(file)) {
        result[index] = {
          url: attachmentPreviewUrls[mediaCursor] || '',
          mediaType: file.type.startsWith('image/') ? 'image' : 'video'
        };
        mediaCursor += 1;
      }
    });

    return result;
  }, [attachments, attachmentPreviewUrls]);

  const handleRemoveAttachment = (index: number) => {
    const removedPreview = attachmentPreviewByIndex[index];

    setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (removedPreview?.url) {
      setAttachmentLightbox((current) =>
        current?.url === removedPreview.url ? null : current
      );
    }
  };

  const handleAttachmentPreviewOpen = (index: number) => {
    const preview = attachmentPreviewByIndex[index];
    if (!preview?.url) return;

    setAttachmentLightbox(preview);
  };

  if (!contact) return null;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: CHAT_FONT_FAMILY,
      '& .MuiTypography-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiInputBase-root': { fontFamily: CHAT_FONT_FAMILY },
      '& .MuiMenuItem-root': { fontFamily: CHAT_FONT_FAMILY },
    }}>
      {/* Заголовок чата - фиксированный */}
      <Box sx={{ px: 1, pt: 1, flexShrink: 0, zIndex: 100 }}>
      <Paper 
        elevation={2}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          borderRadius: '16px',
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
        <Box
          sx={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => setProfileDialogOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setProfileDialogOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Профиль ${contact.name}`}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 600,
                lineHeight: 1.25,
                fontSize: '0.95rem',
                minWidth: 0,
                flexShrink: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {contact.name}
            </Typography>
            {contact.isPartner && (
              <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <GameBadges badges={badges} displayGameId={partnerDisplayBadgeGameId} size={22} />
              </Box>
            )}
          </Box>
          <Typography
            variant="caption"
            noWrap
            sx={(theme) => ({
              display: 'block',
              color: showTypingStatus || contact.isOnline
                ? getOnlinePresenceColor(theme)
                : theme.palette.text.secondary,
              lineHeight: 1.2,
              fontWeight: showTypingStatus || contact.isOnline ? 600 : 400,
            })}
          >
            {presenceText}
          </Typography>
        </Box>
      </Paper>
      </Box>

      {/* Область сообщений */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
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
          <Box
            ref={messagesContentRef}
            sx={{
              visibility: isMessagesViewportReady ? 'visible' : 'hidden'
            }}
          >
            {isLoadingOlder && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={18} color="primary" />
              </Box>
            )}
            {renderedMessages}
            <div ref={messagesEndRef} />
          </Box>
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
          <Badge
            badgeContent={scrollDownBadgeLabel}
            color="primary"
            overlap="circular"
            invisible={newMessagesBelowCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: 18,
                height: 18,
                fontWeight: 700
              }
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
              aria-label={
                newMessagesBelowCount > 0
                  ? `Прокрутить вниз, новых сообщений: ${newMessagesBelowCount}`
                  : 'Прокрутить вниз'
              }
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Badge>
        </Box>
      )}

      {/* Область ввода сообщения - фиксированная */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: 'background.default',
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
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                sx={{ 
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0
                }}
              >
                {attachmentPreviewByIndex[index] ? (
                  <Box
                    component="button"
                    type="button"
                    aria-label={
                      attachmentPreviewByIndex[index]?.mediaType === 'video'
                        ? 'Открыть видео на весь экран'
                        : 'Открыть превью на весь экран'
                    }
                    onClick={() => handleAttachmentPreviewOpen(index)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      border: 0,
                      p: 0,
                      cursor: 'pointer',
                      bgcolor: 'transparent',
                      position: 'relative'
                    }}
                  >
                    {attachmentPreviewByIndex[index]?.mediaType === 'video' ? (
                      <>
                        {attachmentVideoPosters[index] ? (
                          <img
                            src={attachmentVideoPosters[index]}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              pointerEvents: 'none'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              bgcolor: 'grey.800',
                              pointerEvents: 'none'
                            }}
                          />
                        )}
                        <PlayCircleOutlineIcon
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontSize: 28,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                            pointerEvents: 'none'
                          }}
                        />
                      </>
                    ) : (
                      <img
                        src={attachmentPreviewByIndex[index]?.url || ''}
                        alt={`Вложение ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </Box>
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
                <IconButton
                  size="small"
                  aria-label="Удалить вложение"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveAttachment(index);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    zIndex: 2,
                    width: 20,
                    height: 20,
                    p: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.55)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.75)'
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
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
              onClick={cancelForwardDraft}
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

        <ChatMessageInput
          value={messageText}
          onChange={(nextText) => {
            setMessageText(nextText);
            notifyTypingActivity(nextText, contact?.id);
          }}
          onSend={handleSendMessage}
          onFocus={handleMessageInputFocus}
          useIOSAccessoryFix={useIOSAccessoryFix}
          onAttachmentClick={handleAttachmentClick}
          attachmentDisabled={isPickingAttachments}
          sendDisabled={
            editingMessage
              ? !messageText.trim()
              : !forwardingMessage && !sharingEvent && !messageText.trim() && attachments.length === 0
          }
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
      <ResponsiveDialog
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
      </ResponsiveDialog>

      <MediaViewerDialog
        open={Boolean(attachmentLightbox)}
        onClose={() => setAttachmentLightbox(null)}
        content={
          attachmentLightbox
            ? {
                url: attachmentLightbox.url,
                resourceType: attachmentLightbox.mediaType
              }
            : null
        }
      />

      <ContactProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        contact={contact}
      />
    </Box>
  );
};

export default ChatDialog; 