import React, { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, useMediaQuery, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ChatList, { Contact } from '../components/Chat/ChatList';
import ChatDialog, { MessageType } from '../components/Chat/ChatDialog';
import Games from '../components/Chat/Games';
import axios from 'axios';
import { API_URL } from '../config';
import socketService from '../services/socketService';
import { Socket } from 'socket.io-client';

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

// Временный ID пользователя для демонстрации
const CURRENT_USER_ID = 'current-user';

const ChatPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Инициализация сокета
  useEffect(() => {
    const newSocket = socketService.initialize(CURRENT_USER_ID);
    setSocket(newSocket);

    // Обработчики событий сокета
    newSocket.on('new_message', (message: MessageType) => {
      // Если открыт диалог с отправителем, добавляем сообщение и отмечаем как прочитанное
      if (selectedContactId === message.senderId) {
        setMessages(prevMessages => [...prevMessages, message]);
        socketService.markMessageAsRead(message.id);
      }

      // Обновляем список контактов
      updateContactLastMessage(message.senderId, message.text, message.timestamp, false);
    });

    newSocket.on('message_sent', (message: MessageType) => {
      // Добавляем отправленное сообщение в список
      setMessages(prevMessages => [...prevMessages, message]);
    });

    newSocket.on('message_read', (messageId: string) => {
      // Обновляем статус сообщения как прочитанное
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      socketService.disconnect();
    };
  }, [selectedContactId]);

  // Загрузка контактов
  useEffect(() => {
    fetchContacts();
  }, []);

  // Загрузка сообщений при выборе контакта
  useEffect(() => {
    if (selectedContactId) {
      fetchMessages(selectedContactId);
    }
  }, [selectedContactId]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.get(`${API_URL}/api/contacts?userId=${CURRENT_USER_ID}`);
      // setContacts(response.data);
      
      // Используем моковые данные для демонстрации
      setTimeout(() => {
        setContacts(MOCK_CONTACTS);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Ошибка при загрузке контактов:', error);
      setIsLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      setIsLoading(true);
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.get(`${API_URL}/api/messages?userId=${CURRENT_USER_ID}&contactId=${contactId}`);
      // setMessages(response.data);
      
      // Используем моковые данные для демонстрации
      setTimeout(() => {
        setMessages(MOCK_MESSAGES[contactId] || []);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error);
      setIsLoading(false);
    }
  };

  const updateContactLastMessage = useCallback((contactId: string, text: string, timestamp: string, isRead: boolean) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, lastMessage: { text, timestamp, isRead } } 
          : contact
      )
    );
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setSelectedContactId(null);
    }
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleBackToList = () => {
    setSelectedContactId(null);
  };

  const handleSendMessage = (text: string, attachments?: File[]) => {
    if (!selectedContactId) return;

    // Загрузка вложений в Cloudinary (если есть)
    const uploadAttachments = async () => {
      if (!attachments || attachments.length === 0) {
        return [];
      }

      const formData = new FormData();
      attachments.forEach(file => {
        formData.append('media', file);
      });

      try {
        const response = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data.uploads.map((item: any) => ({
          type: item.resourceType,
          url: item.url,
          publicId: item.publicId
        }));
      } catch (error) {
        console.error('Ошибка при загрузке вложений:', error);
        return [];
      }
    };

    // В реальном приложении здесь будет отправка через сокет после загрузки вложений
    const sendMessageWithAttachments = async () => {
      const uploadedAttachments = await uploadAttachments();
      
      // Отправляем сообщение через сокет
      socketService.sendMessage(selectedContactId, text, uploadedAttachments);
      
      // Обновляем последнее сообщение в списке контактов
      updateContactLastMessage(selectedContactId, text, new Date().toISOString(), true);
    };

    // Для демонстрации добавляем сообщение локально
    const newMessage: MessageType = {
      id: `temp-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages([...messages, newMessage]);
    updateContactLastMessage(selectedContactId, text, new Date().toISOString(), true);
    
    // В реальном приложении раскомментировать:
    // sendMessageWithAttachments();
  };

  const selectedContact = contacts.find(contact => contact.id === selectedContactId);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="chat tabs"
          variant="fullWidth"
        >
          <Tab icon={<ChatIcon />} label="Чат" />
          <Tab icon={<SportsEsportsIcon />} label="Игры" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {tabValue === 0 ? (
          <Box sx={{ height: '100%', display: 'flex' }}>
            {/* На мобильных устройствах показываем либо список, либо диалог */}
            {(!isMobile || !selectedContactId) && (
              <Box sx={{ 
                width: isMobile || selectedContactId ? '100%' : '30%', 
                borderRight: selectedContactId && !isMobile ? 1 : 0, 
                borderColor: 'divider',
                display: isMobile && selectedContactId ? 'none' : 'block'
              }}>
                <ChatList 
                  contacts={contacts} 
                  onSelectContact={handleSelectContact}
                  selectedContactId={selectedContactId}
                />
              </Box>
            )}
            
            {/* Диалог с выбранным контактом */}
            {(!isMobile || selectedContactId) && (
              <Box sx={{ 
                width: isMobile || !selectedContactId ? '100%' : '70%',
                display: isMobile && !selectedContactId ? 'none' : 'block'
              }}>
                {selectedContactId ? (
                  <ChatDialog 
                    contact={selectedContact || null}
                    messages={messages}
                    currentUserId={CURRENT_USER_ID}
                    onBack={handleBackToList}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
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
    </Box>
  );
};

export default ChatPage; 