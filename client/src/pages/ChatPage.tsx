import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Button,
  Link,
  Paper,
  Stack
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatList, { Contact } from '../components/Chat/ChatList';
import ChatDialog, {
  ForwardSourceContext,
  MessageForwardRef,
  MessageReplyRef,
  MessageType,
  SharedEventRef
} from '../components/Chat/ChatDialog';
import ShareRecipientDialog, { ShareRecipientContact } from '../components/Chat/ShareRecipientDialog';
import Games from '../components/Chat/Games';
import UserProfileChip from '../components/UI/UserProfileChip';
import axios from 'axios';
import { API_URL } from '../config';
import socketService from '../services/socketService';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import { useCrypto } from '../contexts/CryptoContext';
import {
  decryptChatPayload,
  encryptChatPayload,
  type ChatMediaEnvelope,
  type ChatPayloadV2,
  type EncryptedChatPayload
} from '../crypto/cryptoService';
import { encryptAndUploadChatFiles, type StoredChatAttachment } from '../crypto/chatMediaService';
import { readChatRulesConsent, writeChatRulesConsent } from '../legal/chatRulesConsent';
import { CHAT_RULES_SUMMARY } from '../legal/chatRulesContent';
import { getForwardPreviewText } from '../utils/getForwardPreviewText';
import { isVideoFile } from '../utils/videoMetadata';
import CustomSnackbar from '../components/UI/CustomSnackbar';
import { useVisualViewportLayout } from '../hooks/useVisualViewportLayout';

// Временные данные для демонстрации
const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Анна Смирнова',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    lastMessage: {
      text: 'Привет! Как дела? Что делаешь сегодня вечером?',
      timestamp: new Date().toISOString(),
      isRead: false
    }
  },
  {
    id: '2',
    name: 'Иван Петров',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    lastMessage: {
      text: 'Спасибо за фотографии! Они очень красивые.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    }
  },
  {
    id: '3',
    name: 'Екатерина Иванова',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    lastMessage: {
      text: 'Давай встретимся завтра в 18:00 у кафе.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    }
  }
];

const MOCK_MESSAGES: Record<string, MessageType[]> = {
  '1': [
    {
      id: '1',
      senderId: '1',
      text: 'Привет! Как твои дела?',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      senderId: 'current-user',
      text: 'Привет! Все хорошо, спасибо. Как ты?',
      timestamp: new Date(Date.now() - 3500000).toISOString()
    },
    {
      id: '3',
      senderId: '1',
      text: 'У меня тоже все отлично! Что делаешь сегодня вечером?',
      timestamp: new Date(Date.now() - 3400000).toISOString()
    },
    {
      id: '4',
      senderId: 'current-user',
      text: 'Пока нет планов. Может, сходим куда-нибудь?',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      attachments: [
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?cafe'
        }
      ]
    },
    {
      id: '5',
      senderId: '1',
      text: 'Отличная идея! Давай сходим в это кафе.',
      timestamp: new Date().toISOString()
    }
  ],
  '2': [
    {
      id: '1',
      senderId: '2',
      text: 'Привет! Посмотри фотографии с нашей последней поездки.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      attachments: [
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?travel'
        },
        {
          type: 'image',
          url: 'https://source.unsplash.com/random/400x300/?nature'
        }
      ]
    },
    {
      id: '2',
      senderId: 'current-user',
      text: 'Вау! Очень красиво! Спасибо за фотографии.',
      timestamp: new Date(Date.now() - 82800000).toISOString()
    }
  ],
  '3': [
    {
      id: '1',
      senderId: 'current-user',
      text: 'Привет! Когда мы встречаемся завтра?',
      timestamp: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '2',
      senderId: '3',
      text: 'Давай в 18:00 у кафе на Пушкинской.',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      senderId: 'current-user',
      text: 'Отлично! Буду ждать.',
      timestamp: new Date(Date.now() - 82800000).toISOString()
    }
  ]
};

interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  hasExistingChat: boolean;
}

const GLOBAL_SEARCH_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 30;

type ChatContact = Contact & {
  isPartner?: boolean;
};

const getMessagePreviewText = (
  message: Pick<MessageType, 'text' | 'attachments' | 'forwardFrom' | 'sharedEvent' | 'encryptedPayload' | 'mediaEnvelopes'>
) => {
  const hasMedia = Boolean(message.attachments && message.attachments.length > 0);
  const hasEncryptedMedia = Boolean(
    message.attachments?.some((attachment) => attachment.encrypted || attachment.type === 'encrypted')
  );
  const hasDecryptedMedia = Boolean(message.mediaEnvelopes && message.mediaEnvelopes.length > 0);

  if (message.text?.trim()) {
    return message.text;
  }

  if (hasDecryptedMedia || (hasMedia && !message.encryptedPayload)) {
    return 'Медиафайл';
  }

  if (!message.text && message.forwardFrom) return 'Пересланное сообщение';
  if (!message.text && message.sharedEvent) return `Событие: ${message.sharedEvent.title}`;

  if (message.encryptedPayload && hasEncryptedMedia) return 'Зашифрованное медиа';
  if (message.encryptedPayload) return 'Зашифрованное сообщение';

  if (hasMedia) return 'Медиафайл';
  return message.text || '';
};

const getChatTabIndex = (tab?: string | null) => (tab === 'games' ? 1 : 0);

const hasEncryptedMediaMessage = (message: MessageType) =>
  Boolean(
    message.encryptedPayload &&
    message.attachments?.some(
      (attachment) => attachment.encrypted || attachment.type === 'encrypted'
    )
  );

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = getChatTabIndex(searchParams.get('tab'));
  const openGamesTabOnMount = initialTab === 1;
  const skipChatRestoreRef = useRef(openGamesTabOnMount);

  const [tabValue, setTabValue] = useState(() => initialTab);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [chatReloadNonce, setChatReloadNonce] = useState(0);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMoreGlobalSearch, setIsLoadingMoreGlobalSearch] = useState(false);
  const [globalSearchPage, setGlobalSearchPage] = useState(1);
  const [hasMoreGlobalSearch, setHasMoreGlobalSearch] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardSourceMessage, setForwardSourceMessage] = useState<MessageType | null>(null);
  const forwardSourceRef = useRef<MessageType | null>(null);
  const [pendingForwardMessage, setPendingForwardMessage] = useState<MessageForwardRef | null>(null);
  const [pendingForwardSharedEvent, setPendingForwardSharedEvent] = useState<SharedEventRef | null>(null);
  const [pendingForwardSource, setPendingForwardSource] = useState<{
    message: MessageType;
    peerId: string;
  } | null>(null);
  const [pendingSharedEvent, setPendingSharedEvent] = useState<SharedEventRef | null>(null);
  const [deleteToast, setDeleteToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [chatRulesAccepted, setChatRulesAccepted] = useState(false);
  const [isChatRulesChecked, setIsChatRulesChecked] = useState(false);

  const { user } = useAuth();
  const { setShowBottomNav } = useNavigation();
  const { syncUnreadFromContacts, setActiveContactId } = useUnreadMessages();
  const { localDeviceKeys } = useCrypto();
  const CURRENT_USER_ID = user?._id;

  useEffect(() => {
    if (!CURRENT_USER_ID) {
      setChatRulesAccepted(false);
      setIsChatRulesChecked(false);
      return;
    }
    setChatRulesAccepted(Boolean(readChatRulesConsent(CURRENT_USER_ID)));
    setIsChatRulesChecked(true);
  }, [CURRENT_USER_ID]);

  const handleChatRulesAccept = () => {
    if (!CURRENT_USER_ID) return;
    writeChatRulesConsent(CURRENT_USER_ID);
    setChatRulesAccepted(true);
  };

  const handleChatRulesDecline = () => {
    navigate('/');
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const selectedContactIdRef = useRef<string | null>(null);
  const isChatAtBottomRef = useRef(true);

  const handleChatAtBottomChange = useCallback((atBottom: boolean) => {
    isChatAtBottomRef.current = atBottom;
  }, []);

  const resolvePeerIdForMessage = useCallback(
    (message: MessageType, dialogPeerId: string) =>
      message.senderId === CURRENT_USER_ID ? dialogPeerId : message.senderId,
    [CURRENT_USER_ID]
  );

  const decryptMessageForDialog = useCallback(
    async (message: MessageType, peerId: string): Promise<MessageType> => {
      if (!message.encryptedPayload || !localDeviceKeys) {
        return message;
      }

      try {
        const decryptPeerId = resolvePeerIdForMessage(message, peerId);
        const isOwnMessage = message.senderId === CURRENT_USER_ID;
        const payload = await decryptChatPayload(
          localDeviceKeys,
          decryptPeerId,
          message.encryptedPayload,
          { isOwnMessage }
        );
        if (payload.version === 2) {
          return {
            ...message,
            text: payload.text,
            mediaEnvelopes: payload.attachments
          };
        }
        return { ...message, text: payload.text };
      } catch (error) {
        return { ...message, text: 'Не удалось расшифровать сообщение' };
      }
    },
    [localDeviceKeys, resolvePeerIdForMessage, CURRENT_USER_ID]
  );

  const decryptContactsLastMessages = useCallback(
    async (contactsToDecrypt: ChatContact[]): Promise<ChatContact[]> => {
      if (!localDeviceKeys || !CURRENT_USER_ID) {
        return contactsToDecrypt;
      }

      return Promise.all(
        contactsToDecrypt.map(async (contact) => {
          const { lastMessage } = contact;
          if (!lastMessage.encryptedPayload) {
            return contact;
          }

          try {
            const messageLike: MessageType = {
              id: lastMessage.id || '',
              senderId: lastMessage.senderId || '',
              text: '',
              timestamp: lastMessage.timestamp,
              encryptedPayload: lastMessage.encryptedPayload,
              attachments: lastMessage.attachments
            };
            const decrypted = await decryptMessageForDialog(messageLike, contact.id);
            const hasMedia = Boolean(
              lastMessage.hasMedia ||
              decrypted.attachments?.length ||
              decrypted.mediaEnvelopes?.length
            );

            return {
              ...contact,
              lastMessage: {
                ...lastMessage,
                text: getMessagePreviewText(decrypted),
                hasMedia
              }
            };
          } catch {
            return contact;
          }
        })
      );
    },
    [CURRENT_USER_ID, decryptMessageForDialog, localDeviceKeys]
  );

  const sendEncryptedSocketMessage = useCallback(
    (
      receiverId: string,
      encryptedPayload: EncryptedChatPayload,
      storedAttachments: StoredChatAttachment[],
      replyTo: MessageReplyRef | null,
      forwardFrom: MessageForwardRef | null,
      clientTempId?: string,
      sharedEvent: SharedEventRef | null = null,
      pushPreview?: string
    ) => {
      socketService.sendMessage(
        receiverId,
        '',
        encryptedPayload,
        storedAttachments,
        replyTo,
        forwardFrom,
        sharedEvent,
        clientTempId,
        pushPreview
      );
    },
    []
  );

  const pendingDeleteRef = useRef<{
    message: MessageType;
    index: number;
    contactId: string;
  } | null>(null);
  const pendingSendsRef = useRef<Map<string, {
    message: MessageType;
    contactId: string;
    timeoutId: ReturnType<typeof setTimeout>;
  }>>(new Map());
  const PENDING_SEND_TIMEOUT_MS = 30000;
  const hasRestoredSelectedChatRef = useRef(false);
  const selectedChatStorageKey = useCallback(() => {
    if (!CURRENT_USER_ID) return null;
    return `chat:selected:${CURRENT_USER_ID}`;
  }, [CURRENT_USER_ID]);

  const saveSelectedChatId = useCallback((contactId: string | null) => {
    const key = selectedChatStorageKey();
    if (!key) return;

    if (contactId) {
      localStorage.setItem(key, contactId);
      return;
    }

    localStorage.removeItem(key);
  }, [selectedChatStorageKey]);

  const openContact = useCallback((contactId: string) => {
    saveSelectedChatId(contactId);
    isChatAtBottomRef.current = true;

    if (selectedContactIdRef.current === contactId) {
      setChatReloadNonce((nonce) => nonce + 1);
      if (isMobile) {
        setShowBottomNav(false);
      }
      return;
    }

    setMessages([]);
    setMessagesPage(1);
    setHasMoreMessages(false);
    setIsLoadingMessages(true);
    setSelectedContactId(contactId);
    if (isMobile) {
      setShowBottomNav(false);
    }
  }, [saveSelectedChatId, isMobile, setShowBottomNav]);

  useEffect(() => {
    hasRestoredSelectedChatRef.current = false;
  }, [CURRENT_USER_ID]);

  useEffect(() => {
    if (skipChatRestoreRef.current) {
      hasRestoredSelectedChatRef.current = true;
      return;
    }

    if (!CURRENT_USER_ID || selectedContactId || hasRestoredSelectedChatRef.current) {
      return;
    }

    hasRestoredSelectedChatRef.current = true;
    const key = selectedChatStorageKey();
    if (!key) return;

    const savedContactId = localStorage.getItem(key);
    if (!savedContactId) return;

    setTabValue(0);
    openContact(savedContactId);
  }, [CURRENT_USER_ID, selectedContactId, selectedChatStorageKey, openContact]);

  const sortContactsByLastMessageDesc = useCallback((contactsToSort: ChatContact[]) => {
    return [...contactsToSort].sort((a, b) => {
      if (a.isPartner && !b.isPartner) return -1;
      if (!a.isPartner && b.isPartner) return 1;

      const aTime = new Date(a.lastMessage.timestamp).getTime();
      const bTime = new Date(b.lastMessage.timestamp).getTime();
      return bTime - aTime;
    });
  }, []);

  // Функция обновления последнего сообщения в контакте
  const updateContactLastMessage = useCallback((
    contactId: string,
    text: string,
    timestamp: string,
    isRead: boolean,
    hasMedia?: boolean,
    senderId?: string,
    messageId?: string,
    isPending?: boolean
  ) => {
    setContacts(prevContacts => 
      sortContactsByLastMessageDesc(prevContacts.map(contact => 
        contact.id === contactId 
          ? {
              ...contact,
              lastMessage: {
                ...contact.lastMessage,
                id: messageId ?? contact.lastMessage.id,
                senderId: senderId ?? contact.lastMessage.senderId,
                text,
                timestamp,
                isRead,
                hasMedia,
                isPending: isPending ?? false
              }
            }
          : contact
      ))
    );
  }, [sortContactsByLastMessageDesc]);

  const updateContactLastMessageAfterDelete = useCallback((contactId: string, nextMessages: MessageType[]) => {
    setContacts((prevContacts) =>
      sortContactsByLastMessageDesc(prevContacts.map((contact) => {
        if (contact.id !== contactId) return contact;

        const nextLastMessage = nextMessages[nextMessages.length - 1];
        if (!nextLastMessage) {
          return {
            ...contact,
            lastMessage: {
              ...contact.lastMessage,
              id: '',
              senderId: '',
              text: 'Нет сообщений',
              timestamp: new Date().toISOString(),
              isRead: true,
              hasMedia: false,
              isPending: false
            },
            unreadCount: 0
          };
        }

        const hasMedia = Boolean(nextLastMessage.attachments && nextLastMessage.attachments.length > 0);
        return {
          ...contact,
          lastMessage: {
            ...contact.lastMessage,
            id: nextLastMessage.id,
            senderId: nextLastMessage.senderId,
            text: getMessagePreviewText(nextLastMessage),
            timestamp: nextLastMessage.timestamp,
            isRead: Boolean(nextLastMessage.isRead),
            hasMedia,
            isPending: nextLastMessage.id.startsWith('temp-')
          }
        };
      }))
    );
  }, [CURRENT_USER_ID, sortContactsByLastMessageDesc]);

  const resolvePendingSend = useCallback((clientTempId?: string) => {
    if (!clientTempId) {
      return;
    }

    const pending = pendingSendsRef.current.get(clientTempId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeoutId);
    pendingSendsRef.current.delete(clientTempId);
  }, []);

  const failPendingSend = useCallback((
    clientTempId: string,
    errorMessage: string
  ) => {
    const pending = pendingSendsRef.current.get(clientTempId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeoutId);
    pendingSendsRef.current.delete(clientTempId);

    const { message, contactId } = pending;
    setMessages((prevMessages) => {
      const nextMessages = prevMessages.filter((item) => item.id !== message.id);
      if (selectedContactIdRef.current === contactId) {
        updateContactLastMessageAfterDelete(contactId, nextMessages);
      }
      return nextMessages;
    });

    setDeleteToast({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  }, [updateContactLastMessageAfterDelete]);

  const trackPendingSend = useCallback((
    clientTempId: string,
    message: MessageType,
    contactId: string
  ) => {
    const timeoutId = setTimeout(() => {
      failPendingSend(
        clientTempId,
        'Не удалось отправить сообщение. Проверьте соединение и попробуйте снова.'
      );
    }, PENDING_SEND_TIMEOUT_MS);

    pendingSendsRef.current.set(clientTempId, {
      message,
      contactId,
      timeoutId
    });
  }, [failPendingSend]);

  const forwardEncryptedMessage = useCallback(
    async (
      targetContactId: string,
      sourcePeerId: string,
      sourceMessage: MessageType,
      forwardFrom: MessageForwardRef
    ) => {
      if (!localDeviceKeys || !CURRENT_USER_ID) {
        throw new Error('Для пересылки медиа нужны ключи шифрования на этом устройстве');
      }

      if (!sourceMessage.encryptedPayload) {
        throw new Error('Исходное сообщение не содержит зашифрованных данных');
      }

      const decryptPeerId = resolvePeerIdForMessage(sourceMessage, sourcePeerId);
      const isOwnMessage = sourceMessage.senderId === CURRENT_USER_ID;
      const payload = await decryptChatPayload(
        localDeviceKeys,
        decryptPeerId,
        sourceMessage.encryptedPayload,
        { isOwnMessage }
      );

      const mediaEnvelopes: ChatMediaEnvelope[] =
        payload.version === 2 && payload.attachments?.length
          ? payload.attachments
          : sourceMessage.mediaEnvelopes || [];

      if (!mediaEnvelopes.length) {
        throw new Error('Не удалось получить данные медиа для пересылки');
      }

      const storedAttachments: StoredChatAttachment[] = (sourceMessage.attachments || [])
        .filter((attachment) => attachment.encrypted || attachment.type === 'encrypted')
        .map((attachment) => ({
          type: 'encrypted' as const,
          url: attachment.url,
          publicId: attachment.publicId || '',
          encrypted: true as const
        }))
        .filter((attachment) => Boolean(attachment.url));

      if (!storedAttachments.length) {
        throw new Error('Нет вложений для пересылки');
      }

      const payloadText = payload.version === 2 ? payload.text : payload.version === 1 ? payload.text : '';

      const encryptedPayload = await encryptChatPayload(localDeviceKeys, targetContactId, {
        version: 2,
        text: payloadText || '',
        attachments: mediaEnvelopes
      } satisfies ChatPayloadV2);

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const clientTempId = `client-temp-${uniqueSuffix}`;

      const pushPreview = getMessagePreviewText({
        text: payloadText,
        attachments: storedAttachments,
        forwardFrom,
      });

      sendEncryptedSocketMessage(
        targetContactId,
        encryptedPayload,
        storedAttachments,
        null,
        forwardFrom,
        clientTempId,
        null,
        pushPreview
      );

      const optimisticMessage: MessageType = {
        id: `temp-${uniqueSuffix}`,
        clientTempId,
        senderId: CURRENT_USER_ID,
        text: payloadText || '',
        timestamp: new Date().toISOString(),
        forwardFrom,
        attachments: storedAttachments,
        mediaEnvelopes,
        encryptedPayload
      };

      if (selectedContactIdRef.current === targetContactId) {
        setMessages((prev) => [...prev, optimisticMessage]);
      }

      trackPendingSend(clientTempId, optimisticMessage, targetContactId);

      updateContactLastMessage(
        targetContactId,
        payloadText || 'Пересланное сообщение',
        optimisticMessage.timestamp,
        false,
        true,
        CURRENT_USER_ID,
        optimisticMessage.id,
        true
      );
    },
    [
      CURRENT_USER_ID,
      localDeviceKeys,
      resolvePeerIdForMessage,
      sendEncryptedSocketMessage,
      updateContactLastMessage,
      trackPendingSend
    ]
  );

  // Инициализация сокета
  useEffect(() => {
    if (!CURRENT_USER_ID) {
      return;
    }

    const newSocket = socketService.initialize(CURRENT_USER_ID);
    setSocket(newSocket);

    const onNewMessage = (message: MessageType) => {
      const isCurrentDialogOpen = selectedContactIdRef.current === message.senderId;
      const shouldMarkAsRead = isCurrentDialogOpen && isChatAtBottomRef.current;

      const processIncoming = async () => {
        const messageForDialog = await decryptMessageForDialog(message, message.senderId);
        const messageForState = shouldMarkAsRead
          ? { ...messageForDialog, isRead: true }
          : messageForDialog;

        if (isCurrentDialogOpen) {
          setMessages((prevMessages) => [...prevMessages, messageForState]);
          if (shouldMarkAsRead) {
            socketService.markMessageAsRead(message.id);
          }
        }

        const hasMedia = message.attachments && message.attachments.length > 0;
        const displayText = getMessagePreviewText(messageForDialog);
        setContacts((prevContacts) =>
          sortContactsByLastMessageDesc(prevContacts.map((contact) =>
            contact.id === message.senderId
              ? {
                  ...contact,
                  unreadCount: shouldMarkAsRead ? 0 : (contact.unreadCount || 0) + 1,
                  lastMessage: {
                    id: message.id,
                    senderId: message.senderId,
                    text: displayText,
                    timestamp: message.timestamp,
                    isRead: shouldMarkAsRead,
                    hasMedia,
                    isPending: false
                  }
                }
              : contact
          ))
        );
      };

      processIncoming();
    };

    const onMessageSent = (message: MessageType) => {
      resolvePendingSend(message.clientTempId);

      const processSent = async () => {
        const peerId = selectedContactIdRef.current || '';
        const messageForDialog = peerId ? await decryptMessageForDialog(message, peerId) : message;

        setMessages((prevMessages) => {
          const tempMessageIndex = prevMessages.findIndex((msg) =>
            msg.id.startsWith('temp-') &&
            (
              (Boolean(message.clientTempId) && msg.clientTempId === message.clientTempId) ||
              msg.text === message.text
            )
          );

          if (tempMessageIndex !== -1) {
            const newMessages = [...prevMessages];
            const tempMessage = newMessages[tempMessageIndex];
            newMessages[tempMessageIndex] = {
              ...messageForDialog,
              text: tempMessage.text || messageForDialog.text,
              replyTo: message.replyTo || tempMessage.replyTo,
              forwardFrom: message.forwardFrom || tempMessage.forwardFrom,
              sharedEvent: message.sharedEvent || tempMessage.sharedEvent
            };
            return newMessages;
          }
          return [...prevMessages, messageForDialog];
        });

        if (selectedContactIdRef.current) {
          const hasMedia = message.attachments && message.attachments.length > 0;
          const displayText = getMessagePreviewText(messageForDialog);
          updateContactLastMessage(
            selectedContactIdRef.current,
            displayText,
            message.timestamp,
            false,
            hasMedia,
            message.senderId,
            message.id,
            false
          );
        }
      };

      processSent();
    };

    const onMessageRead = (messageId: string) => {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );

      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.lastMessage.id === messageId
            ? {
                ...contact,
                lastMessage: {
                  ...contact.lastMessage,
                  isRead: true
                }
              }
            : contact
        )
      );
    };

    const onMessageEdited = (message: MessageType) => {
      const processEdited = async () => {
        const contactId =
          message.senderId === CURRENT_USER_ID
            ? (selectedContactIdRef.current || '')
            : message.senderId;

        const messageForDialog = contactId
          ? await decryptMessageForDialog(message, contactId)
          : message;

        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.id === message.id ? { ...msg, ...messageForDialog } : msg))
        );

        setContacts((prevContacts) =>
          sortContactsByLastMessageDesc(prevContacts.map((contact) => {
            if (contact.lastMessage.id !== message.id) {
              return contact;
            }

            const hasMedia = Boolean(message.attachments && message.attachments.length > 0);
            return {
              ...contact,
              lastMessage: {
                ...contact.lastMessage,
                text: getMessagePreviewText(messageForDialog),
                hasMedia
              }
            };
          }))
        );
      };

      void processEdited();
    };

    const onMessageDeleted = (payload: { messageId: string; senderId: string; receiverId: string }) => {
      const contactId = payload.senderId === CURRENT_USER_ID ? payload.receiverId : payload.senderId;
      setMessages((prevMessages) => {
        const nextMessages = prevMessages.filter((message) => message.id !== payload.messageId);
        if (selectedContactIdRef.current === contactId) {
          updateContactLastMessageAfterDelete(contactId, nextMessages);
        }
        return nextMessages;
      });

      if (pendingDeleteRef.current?.message.id === payload.messageId) {
        pendingDeleteRef.current = null;
        setDeleteToast({
          open: true,
          message: 'Сообщение удалено',
          severity: 'success'
        });
      }
    };

    const onError = (payload: { message?: string; clientTempId?: string }) => {
      if (pendingDeleteRef.current) {
        const rollback = pendingDeleteRef.current;
        pendingDeleteRef.current = null;

        setMessages((prevMessages) => {
          const alreadyExists = prevMessages.some((message) => message.id === rollback.message.id);
          if (alreadyExists) {
            return prevMessages;
          }

          const nextMessages = [...prevMessages];
          nextMessages.splice(rollback.index, 0, rollback.message);

          if (selectedContactIdRef.current === rollback.contactId) {
            updateContactLastMessageAfterDelete(rollback.contactId, nextMessages);
          }

          return nextMessages;
        });

        setDeleteToast({
          open: true,
          message: payload?.message || 'Не удалось удалить сообщение',
          severity: 'error'
        });
        return;
      }

      const errorMessage = payload?.message || 'Не удалось отправить сообщение';
      if (payload.clientTempId) {
        failPendingSend(payload.clientTempId, errorMessage);
        return;
      }

      Array.from(pendingSendsRef.current.keys()).forEach((clientTempId) => {
        failPendingSend(clientTempId, errorMessage);
      });
    };

    const onUserOnline = ({ userId }: { userId: string }) => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === userId ? { ...contact, isOnline: true } : contact
        )
      );
    };

    const onUserOffline = ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === userId ? { ...contact, isOnline: false, lastSeen } : contact
        )
      );
    };

    const onPresenceSnapshot = ({ onlineUserIds }: { onlineUserIds: string[] }) => {
      const onlineSet = new Set(onlineUserIds);
      setContacts((prevContacts) =>
        prevContacts.map((contact) => ({
          ...contact,
          isOnline: onlineSet.has(contact.id)
        }))
      );
    };

    newSocket.on('new_message', onNewMessage);
    newSocket.on('message_sent', onMessageSent);
    newSocket.on('message_read', onMessageRead);
    newSocket.on('message_edited', onMessageEdited);
    newSocket.on('message_deleted', onMessageDeleted);
    newSocket.on('error', onError);
    newSocket.on('user_online', onUserOnline);
    newSocket.on('user_offline', onUserOffline);
    newSocket.on('presence_snapshot', onPresenceSnapshot);

    return () => {
      newSocket.off('new_message', onNewMessage);
      newSocket.off('message_sent', onMessageSent);
      newSocket.off('message_read', onMessageRead);
      newSocket.off('message_edited', onMessageEdited);
      newSocket.off('message_deleted', onMessageDeleted);
      newSocket.off('error', onError);
      newSocket.off('user_online', onUserOnline);
      newSocket.off('user_offline', onUserOffline);
      newSocket.off('presence_snapshot', onPresenceSnapshot);
    };
  }, [
    CURRENT_USER_ID,
    updateContactLastMessage,
    updateContactLastMessageAfterDelete,
    decryptMessageForDialog,
    sortContactsByLastMessageDesc,
    resolvePendingSend,
    failPendingSend
  ]);

  useEffect(() => {
    setActiveContactId(selectedContactId);
  }, [selectedContactId, setActiveContactId]);

  useEffect(() => {
    syncUnreadFromContacts(contacts);
  }, [contacts, syncUnreadFromContacts]);

  // Загрузка сообщений при выборе контакта
  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;

    if (!selectedContactId) {
      setMessages([]);
      setMessagesPage(1);
      setHasMoreMessages(false);
      setIsLoadingMessages(false);
      return;
    }

    setMessages([]);
    setMessagesPage(1);
    setHasMoreMessages(false);
    setIsLoadingMessages(true);
    void fetchMessages(selectedContactId, 1, false);
  }, [selectedContactId, chatReloadNonce]);

  // Управление видимостью нижнего меню и блокировка скролла страницы в открытом чате
  useEffect(() => {
    if (isMobile) {
      if (selectedContactId) {
        setShowBottomNav(false);
        window.scrollTo(0, 0);
        document.body.style.overflow = 'hidden';
      } else {
        setShowBottomNav(true);
        document.body.style.overflow = '';
      }
    }
    
    return () => {
      if (isMobile) {
        setShowBottomNav(true);
        document.body.style.overflow = '';
      }
    };
  }, [isMobile, selectedContactId, setShowBottomNav]);

  // Дебаунс ввода поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchGlobalSearchPage = useCallback(async (query: string, page: number, append: boolean) => {
    if (!query) return;

    try {
      if (append) {
        setIsLoadingMoreGlobalSearch(true);
      } else {
        setIsSearching(true);
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts/search`, {
        params: { query, page, limit: GLOBAL_SEARCH_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: SearchUser[] = Array.isArray(responseData) ? responseData : (responseData.items || []);
      const hasMore = Array.isArray(responseData)
        ? items.length >= GLOBAL_SEARCH_PAGE_SIZE
        : Boolean(responseData.hasMore);

      setGlobalSearchResults(prev =>
        append
          ? [...prev, ...items.filter(item => !prev.some(existing => existing.id === item.id))]
          : items
      );
      setGlobalSearchPage(page);
      setHasMoreGlobalSearch(hasMore);
    } catch (error) {
      console.error('Ошибка глобального поиска пользователей:', error);
      if (!append) {
        setGlobalSearchResults([]);
      }
      setHasMoreGlobalSearch(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMoreGlobalSearch(false);
    }
  }, []);

  // Глобальный поиск пользователей по username/email
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setGlobalSearchResults([]);
      setGlobalSearchPage(1);
      setHasMoreGlobalSearch(false);
      setIsSearching(false);
      setIsLoadingMoreGlobalSearch(false);
      return;
    }

    fetchGlobalSearchPage(debouncedSearchQuery, 1, false);
  }, [debouncedSearchQuery, fetchGlobalSearchPage]);

  const fetchContacts = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setIsLoadingContacts(true);
      }
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const decryptedContacts = await decryptContactsLastMessages(response.data);
      setContacts(sortContactsByLastMessageDesc(decryptedContacts));
    } catch (error) {
      console.error('Ошибка при загрузке контактов:', error);
    } finally {
      if (!silent) {
        setIsLoadingContacts(false);
      }
    }
  }, [decryptContactsLastMessages, sortContactsByLastMessageDesc]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const ensureContactInList = (user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
  }) => {
    setContacts(prevContacts => {
      const existing = prevContacts.find(contact => contact.id === user.id);
      if (existing) {
        return prevContacts;
      }

      const newContact: ChatContact = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isPartner: false,
        unreadCount: 0,
        lastMessage: {
          id: '',
          senderId: '',
          text: 'Нет сообщений',
          timestamp: new Date().toISOString(),
          isRead: true,
          hasMedia: false,
          isPending: false
        }
      };

      return sortContactsByLastMessageDesc([newContact, ...prevContacts]);
    });
  };

  const fetchMessages = async (contactId: string, page = 1, appendOlder = false) => {
    try {
      if (appendOlder) {
        setIsLoadingOlderMessages(true);
      } else {
        setIsLoadingMessages(true);
      }
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (appendOlder) {
          setIsLoadingOlderMessages(false);
        } else {
          setIsLoadingMessages(false);
        }
        return;
      }
      
      // Реальный запрос к API (userId берется из токена через authMiddleware)
      const response = await axios.get(`${API_URL}/api/messages`, {
        params: { contactId, page, limit: MESSAGE_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = response.data;
      const items: MessageType[] = Array.isArray(responseData) ? responseData : (responseData.items || []);
      const hasMore = Array.isArray(responseData)
        ? false
        : Boolean(responseData.hasMore);

      const decryptedItems = await Promise.all(
        items.map((item) => decryptMessageForDialog(item, contactId))
      );

      setMessages((prevMessages) => {
        if (appendOlder) {
          return [...decryptedItems, ...prevMessages];
        }

        if (selectedContactIdRef.current !== contactId) {
          return prevMessages;
        }

        const pendingOutgoing = prevMessages.filter(
          (message) =>
            message.id.startsWith('temp-') &&
            message.senderId === CURRENT_USER_ID
        );

        return [...decryptedItems, ...pendingOutgoing];
      });
      setMessagesPage(page);
      setHasMoreMessages(hasMore);
    } catch (error: any) {
      console.error('Ошибка при загрузке сообщений:', error);
    } finally {
      if (appendOlder) {
        setIsLoadingOlderMessages(false);
      } else {
        setIsLoadingMessages(false);
      }
    }
  };

  const loadOlderMessages = useCallback(() => {
    if (!selectedContactId || isLoadingMessages || isLoadingOlderMessages || !hasMoreMessages) {
      return;
    }

    fetchMessages(selectedContactId, messagesPage + 1, true);
  }, [selectedContactId, isLoadingMessages, isLoadingOlderMessages, hasMoreMessages, messagesPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    const nextParams = new URLSearchParams(searchParams);
    if (newValue === 1) {
      nextParams.set('tab', 'games');
      saveSelectedChatId(null);
      setSelectedContactId(null);
      skipChatRestoreRef.current = true;
      // Показываем нижнее меню при переходе на вкладку игр
      if (isMobile) {
        setShowBottomNav(true);
      }
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectContact = (contactId: string) => {
    openContact(contactId);
  };

  const handleSelectGlobalUser = (user: SearchUser) => {
    ensureContactInList(user);
    openContact(user.id);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setGlobalSearchResults([]);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setGlobalSearchResults([]);
    setGlobalSearchPage(1);
    setHasMoreGlobalSearch(false);
    setIsSearching(false);
    setIsLoadingMoreGlobalSearch(false);
  };

  const clearPendingForwardDraft = useCallback(() => {
    setPendingForwardMessage(null);
    setPendingForwardSharedEvent(null);
    setPendingForwardSource(null);
  }, []);

  const handleStartForwardMessage = (message: MessageType) => {
    clearPendingForwardDraft();
    const latestMessage = messages.find((item) => item.id === message.id) || message;
    forwardSourceRef.current = latestMessage;
    setForwardSourceMessage(latestMessage);
    setForwardModalOpen(true);
  };

  const resolveForwardSenderMeta = (message: MessageType) => {
    if (!CURRENT_USER_ID) {
      return { senderName: undefined, senderAvatar: undefined };
    }

    if (message.senderId === CURRENT_USER_ID) {
      const selfName = user?.firstName || user?.username || 'Вы';
      const selfAvatar = user?.avatar || '';
      return { senderName: selfName, senderAvatar: selfAvatar };
    }

    if (selectedContactId && message.senderId === selectedContactId) {
      const senderContact = contacts.find((contact) => contact.id === selectedContactId);
      return {
        senderName: senderContact?.name || senderContact?.username || selectedContactId,
        senderAvatar: senderContact?.avatar || ''
      };
    }

    const knownContact = contacts.find((contact) => contact.id === message.senderId);
    return {
      senderName: knownContact?.name || knownContact?.username || message.senderId,
      senderAvatar: knownContact?.avatar || ''
    };
  };

  const handleSelectForwardTarget = (target: ShareRecipientContact) => {
    const sourcePeerId = selectedContactId;
    const sourceMessage = forwardSourceRef.current ?? forwardSourceMessage;

    ensureContactInList({
      id: target.id,
      name: target.name,
      username: (target as SearchUser).username || target.username || '',
      email: (target as SearchUser).email || target.email || '',
      avatar: target.avatar || ''
    });

    const openTargetChat = () => {
      openContact(target.id);
      setForwardModalOpen(false);
      forwardSourceRef.current = null;
      setForwardSourceMessage(null);
    };

    if (!sourceMessage || !sourcePeerId) {
      openTargetChat();
      return;
    }

    const applyForwardDraft = (messageForForward: MessageType) => {
      const forwardSenderMeta = resolveForwardSenderMeta(messageForForward);
      const forwardFrom: MessageForwardRef = {
        id: messageForForward.id,
        text: getForwardPreviewText(messageForForward),
        senderId: messageForForward.senderId,
        senderName: forwardSenderMeta.senderName,
        senderAvatar: forwardSenderMeta.senderAvatar
      };

      setPendingForwardSharedEvent(messageForForward.sharedEvent || null);
      setPendingForwardMessage(forwardFrom);
      setPendingForwardSource({ message: messageForForward, peerId: sourcePeerId });
      openTargetChat();
    };

    const latestMessage = messages.find((item) => item.id === sourceMessage.id) || sourceMessage;

    if (
      localDeviceKeys &&
      latestMessage.encryptedPayload &&
      !latestMessage.mediaEnvelopes?.length
    ) {
      void decryptMessageForDialog(latestMessage, sourcePeerId)
        .then(applyForwardDraft)
        .catch(() => applyForwardDraft(latestMessage));
      return;
    }

    applyForwardDraft(latestMessage);
  };

  const handleOpenChatWithUser = (userId: string, forwardHint?: MessageForwardRef | null) => {
    if (!userId || userId === CURRENT_USER_ID) return;

    if (selectedContactId === userId) {
      return;
    }

    ensureContactInList({
      id: userId,
      name: forwardHint?.senderName?.trim() || 'Пользователь',
      username: forwardHint?.senderName?.trim() || userId.slice(0, 8),
      email: '',
      avatar: forwardHint?.senderAvatar || ''
    });
    openContact(userId);
  };

  useEffect(() => {
    const tabFromUrl = getChatTabIndex(searchParams.get('tab'));
    setTabValue(tabFromUrl);
    if (tabFromUrl === 1) {
      skipChatRestoreRef.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    const state = location.state as {
      pendingSharedEvent?: SharedEventRef;
      targetUserId?: string;
      targetUserName?: string;
      targetUsername?: string;
      targetUserEmail?: string;
      targetUserAvatar?: string;
    } | null;

    if (!state?.pendingSharedEvent || !state?.targetUserId) {
      return;
    }

    ensureContactInList({
      id: state.targetUserId,
      name: state.targetUserName?.trim() || 'Пользователь',
      username: state.targetUsername?.trim() || state.targetUserId.slice(0, 8),
      email: state.targetUserEmail || '',
      avatar: state.targetUserAvatar || ''
    });
    setPendingSharedEvent(state.pendingSharedEvent);
    openContact(state.targetUserId);
    setTabValue(0);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, openContact]);

  const loadMoreGlobalSearch = useCallback(() => {
    if (!debouncedSearchQuery || isSearching || isLoadingMoreGlobalSearch || !hasMoreGlobalSearch) {
      return;
    }

    fetchGlobalSearchPage(debouncedSearchQuery, globalSearchPage + 1, true);
  }, [
    debouncedSearchQuery,
    fetchGlobalSearchPage,
    globalSearchPage,
    hasMoreGlobalSearch,
    isLoadingMoreGlobalSearch,
    isSearching
  ]);

  const handleSearchListScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!searchQuery.trim()) return;

    const element = event.currentTarget;
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceToBottom < 120) {
      loadMoreGlobalSearch();
    }
  }, [loadMoreGlobalSearch, searchQuery]);

  const handleReachMessagesEnd = useCallback(() => {
    if (!selectedContactId) {
      return;
    }

    const unreadIncomingMessageIds = messages
      .filter((message) => message.senderId === selectedContactId && message.isRead === false)
      .map((message) => message.id);

    if (unreadIncomingMessageIds.length === 0) {
      return;
    }

    unreadIncomingMessageIds.forEach((messageId) => {
      socketService.markMessageAsRead(messageId);
    });

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        unreadIncomingMessageIds.includes(message.id)
          ? { ...message, isRead: true }
          : message
      )
    );

    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (contact.id !== selectedContactId) {
          return contact;
        }

        const isOwnLastMessage = contact.lastMessage.senderId === CURRENT_USER_ID;
        return {
          ...contact,
          lastMessage: {
            ...contact.lastMessage,
            isRead: isOwnLastMessage ? contact.lastMessage.isRead : true
          },
          unreadCount: 0
        };
      })
    );
  }, [messages, selectedContactId, CURRENT_USER_ID]);

  const handleBackToList = () => {
    const contactId = selectedContactIdRef.current;
    if (contactId) {
      const unreadIncomingCount = messages.filter(
        (message) => message.senderId === contactId && message.isRead === false
      ).length;

      if (unreadIncomingCount > 0) {
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === contactId
              ? {
                  ...contact,
                  unreadCount: unreadIncomingCount,
                  lastMessage: contact.lastMessage.senderId === contactId
                    ? { ...contact.lastMessage, isRead: false }
                    : contact.lastMessage
                }
              : contact
          )
        );
      }
    }

    isChatAtBottomRef.current = true;
    saveSelectedChatId(null);
    setSelectedContactId(null);
    void fetchContacts({ silent: true });
    // Показываем нижнее меню на мобильных при возврате к списку
    if (isMobile) {
      setShowBottomNav(true);
    }
  };

  const handleSendMessage = (
    text: string,
    attachments?: File[],
    replyTo?: MessageReplyRef | null,
    forwardFrom?: MessageForwardRef | null,
    sharedEvent?: SharedEventRef | null,
    forwardSource?: ForwardSourceContext | null
  ) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (!selectedContactId || !CURRENT_USER_ID) return;
    const trimmedText = text.trim();
    const isForwardOnly = Boolean(forwardFrom);
    const isSharedEventOnly = Boolean(sharedEvent);
    const hasFiles = Boolean(attachments && attachments.length > 0);

    if (!isForwardOnly && !isSharedEventOnly && !trimmedText && !hasFiles) return;

    if (
      isForwardOnly &&
      forwardFrom &&
      forwardSource &&
      hasEncryptedMediaMessage(forwardSource.message)
    ) {
      const { message: sourceMessage, peerId: sourcePeerId } = forwardSource;
      clearPendingForwardDraft();

      void forwardEncryptedMessage(
        selectedContactId,
        sourcePeerId,
        sourceMessage,
        forwardFrom
      ).catch((error) => {
        console.error('Ошибка пересылки зашифрованного медиа:', error);
        setDeleteToast({
          open: true,
          message: 'Не удалось переслать зашифрованное медиа',
          severity: 'error'
        });
      });
      return;
    }

    if (hasFiles && !localDeviceKeys) {
      setDeleteToast({
        open: true,
        message: 'Для отправки медиа нужны ключи шифрования на этом устройстве',
        severity: 'error'
      });
      return;
    }

    const clientTempId = `client-temp-${uniqueSuffix}`;

    const newMessage: MessageType = {
      id: `temp-${uniqueSuffix}`,
      clientTempId,
      senderId: CURRENT_USER_ID,
      text: trimmedText,
      timestamp: new Date().toISOString(),
      replyTo: replyTo || undefined,
      forwardFrom: forwardFrom || undefined,
      sharedEvent: sharedEvent || undefined,
      attachments: attachments?.map((file) => ({
        type: isVideoFile(file) ? 'video' : 'image',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    trackPendingSend(clientTempId, newMessage, selectedContactId);
    updateContactLastMessage(
      selectedContactId,
      trimmedText || (sharedEvent ? `Событие: ${sharedEvent.title}` : (forwardFrom ? 'Пересланное сообщение' : (hasFiles ? 'Медиафайл' : ''))),
      newMessage.timestamp,
      false,
      hasFiles,
      CURRENT_USER_ID,
      newMessage.id,
      true
    );

    const sendMessageWithAttachments = async () => {
      try {
        let storedAttachments: StoredChatAttachment[] = [];
        let mediaEnvelopes: ChatPayloadV2['attachments'] = [];
        let encryptedPayload: EncryptedChatPayload | undefined;

        if (hasFiles && localDeviceKeys) {
          const uploaded = await encryptAndUploadChatFiles(attachments!);
          storedAttachments = uploaded.stored;
          mediaEnvelopes = uploaded.envelopes;
        }

        if (hasFiles && !localDeviceKeys) {
          throw new Error('Нет ключей для шифрования медиа');
        }

        if (localDeviceKeys && (trimmedText || mediaEnvelopes.length > 0)) {
          encryptedPayload = await encryptChatPayload(localDeviceKeys, selectedContactId, {
            version: 2,
            text: trimmedText,
            attachments: mediaEnvelopes
          });
        }

        if (hasFiles && !encryptedPayload) {
          throw new Error('Не удалось зашифровать вложения');
        }

        const pushPreview = getMessagePreviewText({
          text: trimmedText,
          attachments: storedAttachments.length > 0 ? storedAttachments : undefined,
          forwardFrom: forwardFrom || undefined,
          sharedEvent: sharedEvent || undefined,
        });

        if (encryptedPayload) {
          sendEncryptedSocketMessage(
            selectedContactId,
            encryptedPayload,
            storedAttachments,
            replyTo || null,
            forwardFrom || null,
            clientTempId,
            sharedEvent || null,
            pushPreview
          );
        } else {
          socketService.sendMessage(
            selectedContactId,
            trimmedText,
            undefined,
            [],
            replyTo || null,
            forwardFrom || null,
            sharedEvent || null,
            clientTempId,
            pushPreview
          );
        }
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        failPendingSend(
          clientTempId,
          error instanceof Error ? error.message : 'Не удалось отправить сообщение'
        );
      }
    };

    if (hasFiles || trimmedText || isForwardOnly || isSharedEventOnly) {
      void sendMessageWithAttachments();
    }
  };

  const handleSharedEventClick = (eventId: string) => {
    navigate(`/calendar?event=${encodeURIComponent(eventId)}`);
  };

  const handleEditMessage = (messageId: string, text: string) => {
    if (!selectedContactId || !CURRENT_USER_ID) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const originalMessage = messages.find((message) => message.id === messageId);
    if (!originalMessage) return;

    const applyOptimisticEdit = () => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === messageId
            ? { ...message, text: trimmedText, editedAt: new Date().toISOString() }
            : message
        )
      );

      setContacts((prevContacts) =>
        sortContactsByLastMessageDesc(prevContacts.map((contact) => {
          if (contact.id !== selectedContactId || contact.lastMessage.id !== messageId) {
            return contact;
          }

          return {
            ...contact,
            lastMessage: {
              ...contact.lastMessage,
              text: trimmedText,
              hasMedia: false
            }
          };
        }))
      );
    };

    const sendEdit = async () => {
      try {
        if (originalMessage.encryptedPayload) {
          if (!localDeviceKeys) {
            throw new Error('Нет ключей шифрования');
          }

          const encryptedPayload = await encryptChatPayload(localDeviceKeys, selectedContactId, {
            version: 2,
            text: trimmedText,
            attachments: originalMessage.mediaEnvelopes || []
          });

          applyOptimisticEdit();
          socketService.editMessage(messageId, '', encryptedPayload);
          return;
        }

        applyOptimisticEdit();
        socketService.editMessage(messageId, trimmedText);
      } catch (error) {
        console.error('Ошибка при редактировании сообщения:', error);
        setDeleteToast({
          open: true,
          message: 'Не удалось отредактировать сообщение',
          severity: 'error'
        });
      }
    };

    void sendEdit();
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedContactId || !CURRENT_USER_ID) return;

    setMessages((prevMessages) => {
      const index = prevMessages.findIndex((message) => message.id === messageId);
      const messageToDelete = prevMessages[index];
      if (!messageToDelete) {
        setDeleteToast({
          open: true,
          message: 'Не удалось удалить сообщение',
          severity: 'error'
        });
        return prevMessages;
      }

      pendingDeleteRef.current = {
        message: messageToDelete,
        index,
        contactId: selectedContactId
      };

      const nextMessages = prevMessages.filter((message) => message.id !== messageId);
      updateContactLastMessageAfterDelete(selectedContactId, nextMessages);
      return nextMessages;
    });

    socketService.deleteMessage(messageId);
  };

  const selectedContact = contacts.find(contact => contact.id === selectedContactId);
  const immediateQuery = searchQuery.trim().toLowerCase();
  const hasSearch = Boolean(immediateQuery);
  const filteredExistingContacts = hasSearch
    ? contacts.filter(contact =>
        contact.name.toLowerCase().includes(immediateQuery) ||
        (contact.username || '').toLowerCase().includes(immediateQuery) ||
        (contact.email || '').toLowerCase().includes(immediateQuery)
      )
    : contacts;
  const filteredGlobalResults = globalSearchResults.filter(
    user => !filteredExistingContacts.some(contact => contact.id === user.id)
  );

  const isMobileChatOpen = isMobile && Boolean(selectedContactId);
  const visualViewportLayout = useVisualViewportLayout(isMobileChatOpen);
  const pageHeight = isMobile && selectedContactId ? '100dvh' : '100%';
  const isChatListReady = isChatRulesChecked && !isLoadingContacts && Boolean(CURRENT_USER_ID);
  const showChatListLoadingOverlay = tabValue === 0 && !isChatListReady;

  return (
    <Box sx={{ 
      ...(!isMobileChatOpen ? { height: pageHeight } : {}),
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      ...(isMobileChatOpen ? {
        position: 'fixed',
        top: visualViewportLayout.offsetTop,
        left: 0,
        right: 0,
        width: '100%',
        height: visualViewportLayout.height,
        maxHeight: visualViewportLayout.height,
        zIndex: (theme) => theme.zIndex.appBar,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: visualViewportLayout.keyboardOpen
          ? 0
          : 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'border-box',
        overscrollBehavior: 'none',
      } : {})
    }}>
      {/* Скрываем табы когда открыт чат с контактом на мобильных */}
      {(!isMobile || !selectedContactId) && (
        <Box sx={{ 
          borderBottom: 0,
          flexShrink: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          bgcolor: 'background.paper',
          boxShadow: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pt: 1 }}>
            <Box
              sx={{
                width: '50%',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                minWidth: 0,
                pl: 2,
              }}
            >
              <UserProfileChip maxNameWidth={80} />
            </Box>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="chat tabs"
              variant="fullWidth"
              sx={{
                width: '50%',
                '& .MuiTabs-flexContainer': {
                  width: '100%',
                },
                '& .MuiTab-iconWrapper': {
                  fontSize: '1rem',
                },
                '& .MuiTab-root': {
                  minHeight: 'auto',
                  padding: 0,
                  paddingTop: 2,
                  fontSize: '12px',
                  flex: '1 1 50%',
                  maxWidth: '50%',
                  justifyContent: 'center',
                },
              }}
            >
              <Tab icon={<ChatIcon fontSize="small" />} iconPosition="start" label="Чат" />
              <Tab icon={<SportsEsportsIcon fontSize="small" />} iconPosition="start" label="Игры" />
            </Tabs>
          </Box>
          {tabValue === 0 && (!isMobile || !selectedContactId) && (
            <Box sx={{ px: 2, pb: 1, pt: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Глобальный поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isSearching ? (
                        <CircularProgress size={18} />
                      ) : (
                        searchQuery && (
                          <IconButton size="small" onClick={handleClearSearch} aria-label="Очистить поиск">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )
                      )}
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {showChatListLoadingOverlay && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              zIndex: (theme) => theme.zIndex.modal + 1
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}
        {tabValue === 0 && isChatRulesChecked && !chatRulesAccepted && CURRENT_USER_ID && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: { xs: 2, sm: 3 },
              borderRadius: 0,
              bgcolor: 'background.paper'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-rules-consent-title"
          >
            <Typography id="chat-rules-consent-title" variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Правила чата
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {CHAT_RULES_SUMMARY}
            </Typography>
            <Link component={RouterLink} to="/legal/chat-rules" variant="body2" sx={{ mb: 2 }}>
              Подробнее — полный текст правил
            </Link>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
              <Button variant="contained" color="primary" onClick={handleChatRulesAccept} fullWidth>
                Согласен
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleChatRulesDecline} fullWidth>
                Не согласен
              </Button>
            </Stack>
          </Paper>
        )}
        {tabValue === 0 ? (
          <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
            {/* На мобильных устройствах показываем либо список, либо диалог */}
            {(!isMobile || !selectedContactId) && (
              <Box sx={{ 
                width: isMobile || selectedContactId ? '100%' : '30%', 
                borderRight: selectedContactId && !isMobile ? 1 : 0, 
                borderColor: 'divider',
                display: isMobile && selectedContactId ? 'none' : 'block',
                overflow: 'auto'
              }}
              onScroll={handleSearchListScroll}
              >
                {hasSearch ? (
                  <Box>
                    {filteredExistingContacts.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                          Ваши чаты
                        </Typography>
                        <ChatList
                          contacts={filteredExistingContacts}
                          onSelectContact={handleSelectContact}
                          selectedContactId={selectedContactId}
                          currentUserId={CURRENT_USER_ID || ''}
                        />
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                      Глобальный поиск
                    </Typography>
                    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                      {filteredGlobalResults.map((user) => (
                        <ListItemButton key={user.id} onClick={() => handleSelectGlobalUser(user)}>
                          <ListItemAvatar>
                            <Avatar alt={user.name} src={user.avatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={user.name}
                            secondary={`${user.username} • ${user.email}`}
                          />
                        </ListItemButton>
                      ))}
                      {!isSearching && filteredGlobalResults.length === 0 && (
                        <Box sx={{ px: 2, py: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Ничего не найдено
                          </Typography>
                        </Box>
                      )}
                      {isLoadingMoreGlobalSearch && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                          <CircularProgress size={18} />
                        </Box>
                      )}
                    </List>
                  </Box>
                ) : (
                  <ChatList 
                    contacts={contacts} 
                    onSelectContact={handleSelectContact}
                    selectedContactId={selectedContactId}
                    currentUserId={CURRENT_USER_ID || ''}
                  />
                )}
              </Box>
            )}
            
            {/* Диалог с выбранным контактом */}
            {(!isMobile || selectedContactId) && (
              <Box sx={{ 
                width: isMobile || !selectedContactId ? '100%' : '70%',
                display: isMobile && !selectedContactId ? 'none' : 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                overflow: 'hidden',
                height: '100%'
              }}>
                {selectedContactId && CURRENT_USER_ID ? (
                  <ChatDialog 
                    contact={selectedContact || null}
                    messages={messages}
                    currentUserId={CURRENT_USER_ID}
                    onBack={handleBackToList}
                    onSendMessage={handleSendMessage}
                    onStartForwardMessage={handleStartForwardMessage}
                    onOpenChatWithUser={handleOpenChatWithUser}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onReachMessagesStart={loadOlderMessages}
                    onReachMessagesEnd={handleReachMessagesEnd}
                    onAtBottomChange={handleChatAtBottomChange}
                    pendingForwardMessage={pendingForwardMessage}
                    onPendingForwardApplied={() => {
                      setPendingForwardMessage(null);
                      setPendingForwardSharedEvent(null);
                      setPendingForwardSource(null);
                    }}
                    onCancelPendingForward={clearPendingForwardDraft}
                    pendingForwardSource={pendingForwardSource}
                    pendingForwardSharedEvent={pendingForwardSharedEvent}
                    pendingSharedEvent={pendingSharedEvent}
                    onPendingSharedEventApplied={() => setPendingSharedEvent(null)}
                    onSharedEventClick={handleSharedEventClick}
                    hasMoreMessages={hasMoreMessages}
                    isLoadingOlder={isLoadingOlderMessages}
                    isLoading={isLoadingMessages}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      bgcolor: 'background.default'
                    }}
                  >
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Box sx={{ typography: 'h6', color: 'text.secondary' }}>
                        Выберите контакт для начала общения
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Games />
        )}
      </Box>
      <ShareRecipientDialog
        open={forwardModalOpen}
        onClose={() => {
          setForwardModalOpen(false);
          forwardSourceRef.current = null;
          setForwardSourceMessage(null);
        }}
        onSelect={handleSelectForwardTarget}
        title="Переслать сообщение"
        contacts={contacts}
      />
      <CustomSnackbar
        open={deleteToast.open}
        message={deleteToast.message}
        severity={deleteToast.severity}
        onClose={() => setDeleteToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default ChatPage; 