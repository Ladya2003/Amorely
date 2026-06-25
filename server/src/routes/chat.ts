import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message';
import ChatBlock from '../models/chatBlock';
import Relationship from '../models/relationship';
import User from '../models/user';
import { authMiddleware } from '../middleware/auth';
import { isUserOnline } from '../presence';
import { notifySocketUser } from '../socket';
import {
  getChatBlockStatus,
  getChatBlockStatusesForContacts,
  isChatBlockedBetween,
} from '../services/chatBlockService';

const router = express.Router();

const getDisplayName = (user: {
  firstName?: string;
  lastName?: string;
  username: string;
}) => {
  const firstName = (user.firstName || '').trim();
  const lastName = (user.lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user.username;
};

const sortContactsByLastMessageDesc = <T extends { isPartner?: boolean; lastMessage: { timestamp: Date | string } }>(contacts: T[]) => {
  return contacts.sort((a, b) => {
    if (a.isPartner && !b.isPartner) return -1;
    if (!a.isPartner && b.isPartner) return 1;

    const aTime = new Date(a.lastMessage.timestamp).getTime();
    const bTime = new Date(b.lastMessage.timestamp).getTime();
    return bTime - aTime;
  });
};

const formatMessageForClient = (message: any) => ({
  id: message._id.toString(),
  senderId: message.senderId.toString(),
  text: message.text,
  timestamp: message.createdAt.toISOString(),
  editedAt: message.editedAt ? message.editedAt.toISOString() : undefined,
  isRead: message.isRead,
  replyTo: message.replyTo || undefined,
  forwardFrom: message.forwardFrom || undefined,
  sharedEvent: message.sharedEvent || undefined,
  sharedNote: message.sharedNote || undefined,
  encryptedPayload: message.encryptedPayload
    ? {
        version: message.encryptedPayload.version,
        algorithm: message.encryptedPayload.algorithm,
        ciphertext: message.encryptedPayload.ciphertext,
        iv: message.encryptedPayload.iv,
        senderDeviceId: message.encryptedPayload.senderDeviceId
      }
    : undefined,
  attachments: message.attachments?.map((attachment: any) => ({
    type: attachment.type,
    url: attachment.url,
    publicId: attachment.publicId,
    encrypted: Boolean(attachment.encrypted)
  }))
});

// Получение списка контактов
router.get('/contacts', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    // По умолчанию показываем партнера (если есть) и пользователей, с которыми уже есть переписка
    const currentUser = await User.findById(userId).select('partnerId');

    const dialogUserIds = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          otherUserId: {
            $cond: [
              { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      { $group: { _id: '$otherUserId' } }
    ]);

    const contactIdSet = new Set<string>(dialogUserIds.map((item) => item._id.toString()));
    if (currentUser?.partnerId) {
      contactIdSet.add(currentUser.partnerId.toString());
    }

    if (contactIdSet.size === 0) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $in: Array.from(contactIdSet).map((id) => new mongoose.Types.ObjectId(id)) }
    });

    const contactIds = users.map((user) => user._id.toString());
    const blockStatuses = await getChatBlockStatusesForContacts(userId, contactIds);
    
    // Для каждого пользователя находим последнее сообщение
    const contacts = await Promise.all(users.map(async (user) => {
      const contactId = user._id.toString();
      const blockStatus = blockStatuses.get(contactId) || {
        isBlocked: false,
        blockedByMe: false,
        blockedByPeer: false,
      };
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        isRead: false
      });

      const hasMedia = lastMessage?.attachments && lastMessage.attachments.length > 0;
      const displayText = lastMessage
        ? (lastMessage.encryptedPayload
            ? ''
            : (hasMedia && !lastMessage.text ? 'Медиафайл' : lastMessage.text || 'Медиафайл'))
        : 'Нет сообщений';

      return {
        id: user._id,
        isPartner: Boolean(currentUser?.partnerId && user._id.toString() === currentUser.partnerId.toString()),
        isBlocked: blockStatus.isBlocked,
        blockedByMe: blockStatus.blockedByMe,
        blockedByPeer: blockStatus.blockedByPeer,
        role: user.role || 'user',
        name: getDisplayName(user),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        birthday: user.birthday ? user.birthday.toISOString() : null,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
        unreadCount,
        isOnline: isUserOnline(user._id.toString()),
        lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
        lastMessage: lastMessage ? {
          id: lastMessage._id.toString(),
          senderId: lastMessage.senderId.toString(),
          text: displayText,
          timestamp: lastMessage.createdAt,
          isRead: lastMessage.isRead,
          hasMedia: hasMedia,
          encryptedPayload: lastMessage.encryptedPayload
            ? {
                version: lastMessage.encryptedPayload.version,
                algorithm: lastMessage.encryptedPayload.algorithm,
                ciphertext: lastMessage.encryptedPayload.ciphertext,
                iv: lastMessage.encryptedPayload.iv,
                senderDeviceId: lastMessage.encryptedPayload.senderDeviceId
              }
            : undefined,
          attachments: lastMessage.attachments?.map((attachment: any) => ({
            type: attachment.type,
            url: attachment.url,
            publicId: attachment.publicId,
            encrypted: Boolean(attachment.encrypted)
          }))
        } : {
          id: '',
          senderId: '',
          text: 'Нет сообщений',
          timestamp: new Date(),
          isRead: true,
          hasMedia: false
        }
      };
    }));

    res.json(sortContactsByLastMessageDesc(contacts));
  } catch (error) {
    console.error('Ошибка при получении контактов:', error);
    res.status(500).json({ error: 'Ошибка при получении контактов' });
  }
});

// Глобальный поиск пользователей для чата (по логину, почте, имени или фамилии)
router.get('/contacts/search', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const query = String(req.query.query || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    if (!query) {
      return res.json({ items: [], hasMore: false, page, limit, total: 0 });
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const searchFilter = {
      _id: { $ne: userId },
      role: { $ne: 'system' },
      $or: [
        { username: searchRegex },
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ]
    };

    const total = await User.countDocuments(searchFilter);

    // Ищем пользователей по частичному совпадению username/email/имени, кроме текущего пользователя
    const matchedUsers = await User.find(searchFilter)
      .select('_id username email firstName lastName avatar')
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit);

    // Находим собеседников, с которыми уже есть чат
    const existingDialogIds = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $project: {
          otherUserId: {
            $cond: [
              { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$otherUserId'
        }
      }
    ]);

    const existingDialogIdSet = new Set(existingDialogIds.map((item) => item._id.toString()));

    const results = matchedUsers.map((user) => ({
      id: user._id,
      name: getDisplayName(user),
      username: user.username,
      email: user.email,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
      hasExistingChat: existingDialogIdSet.has(user._id.toString())
    }));

    res.json({
      items: results,
      hasMore: skip + results.length < total,
      page,
      limit,
      total
    });
  } catch (error) {
    console.error('Ошибка глобального поиска пользователей:', error);
    res.status(500).json({ error: 'Ошибка глобального поиска пользователей' });
  }
});

// Профиль собеседника для просмотра в чате
router.get('/contacts/:contactId/profile', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const contactId = String(req.params.contactId || '');

    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    const currentUser = await User.findById(userId).select('partnerId');
    const isPartner = Boolean(currentUser?.partnerId && currentUser.partnerId.toString() === contactId);

    const hasDialog = await Message.exists({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    });

    if (!isPartner && !hasDialog) {
      return res.status(403).json({ error: 'Нет доступа к профилю пользователя' });
    }

    const user = await User.findById(contactId).select(
      'username email firstName lastName avatar bio birthday displayBadgeGameId'
    );

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const relationship = await Relationship.findOne({
      $or: [{ userId: contactId }, { partnerId: contactId }],
      status: 'active',
    });

    res.json({
      id: user._id.toString(),
      isPartner,
      name: getDisplayName(user),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username,
      email: user.email,
      bio: user.bio || '',
      birthday: user.birthday ? user.birthday.toISOString() : null,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
      displayBadgeGameId: user.displayBadgeGameId || null,
      badges: relationship?.badges || [],
    });
  } catch (error) {
    console.error('Ошибка при получении профиля контакта:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля контакта' });
  }
});

// Получение сообщений для конкретного контакта
router.get('/messages', authMiddleware, async (req: any, res: Response) => {
  try {
    const { contactId } = req.query;
    const userId = req.userId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const skip = (page - 1) * limit;
    
    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    const dialogFilter = {
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    };

    // Загружаем сообщения порциями: сначала более новые, потом разворачиваем в хронологический порядок
    const total = await Message.countDocuments(dialogFilter);
    const messages = await Message.find(dialogFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Преобразуем сообщения в формат, ожидаемый клиентом
    const formattedMessages = messages.reverse().map(formatMessageForClient);
    const blockStatus = await getChatBlockStatus(userId, String(contactId));

    res.json({
      items: formattedMessages,
      hasMore: skip + messages.length < total,
      page,
      limit,
      total,
      blockStatus,
    });
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
});

// Отправка нового сообщения
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, text, attachments, replyTo, forwardFrom, sharedEvent, sharedNote, encryptedPayload } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    if (await isChatBlockedBetween(String(senderId), String(receiverId))) {
      return res.status(403).json({ error: 'Чат заблокирован' });
    }

    // Создаем новое сообщение
    const newMessage = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text,
      attachments,
      encryptedPayload: encryptedPayload || undefined,
      replyTo,
      forwardFrom,
      sharedEvent,
      sharedNote,
      isRead: false,
      createdAt: new Date()
    });

    const savedMessage = await newMessage.save();

    // Форматируем сообщение для ответа
    const formattedMessage = formatMessageForClient(savedMessage);

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
});

// Редактирование сообщения
router.put('/messages/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;
    const text = String(req.body?.text || '').trim();

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    // Безопасность: только владелец сообщения может его редактировать.
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования' });
    }

    if (message.forwardFrom || message.sharedEvent || message.sharedNote) {
      return res.status(403).json({ error: 'Это сообщение нельзя редактировать' });
    }

    const hasMedia = Boolean(message.attachments?.length);
    if (hasMedia) {
      return res.status(403).json({ error: 'Сообщения с медиа нельзя редактировать' });
    }

    const encryptedPayload = req.body?.encryptedPayload;

    if (message.encryptedPayload) {
      if (!encryptedPayload) {
        return res.status(400).json({ error: 'Не удалось обновить зашифрованное сообщение' });
      }
      message.encryptedPayload = encryptedPayload;
      message.text = text;
    } else {
      if (!text) {
        return res.status(400).json({ error: 'Текст сообщения обязателен' });
      }
      message.text = text;
    }

    message.editedAt = new Date();
    await message.save();

    return res.json(formatMessageForClient(message));
  } catch (error) {
    console.error('Ошибка при редактировании сообщения:', error);
    return res.status(500).json({ error: 'Ошибка при редактировании сообщения' });
  }
});

// Отметка сообщения как прочитанного
router.put('/messages/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findById(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    message.isRead = true;
    await message.save();
    
    res.json({ message: 'Сообщение отмечено как прочитанное' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса сообщения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса сообщения' });
  }
});

// Блокировка пользователя в чате
router.post('/conversations/:contactId/block', authMiddleware, async (req: any, res: Response) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId as string;

    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Некорректный ID контакта' });
    }

    if (contactId === userId) {
      return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
    }

    const contactExists = await User.exists({ _id: contactId });
    if (!contactExists) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    const existingBlock = await ChatBlock.findOne({
      $or: [
        { blockerId: userId, blockedUserId: contactId },
        { blockerId: contactId, blockedUserId: userId },
      ],
    });

    if (existingBlock) {
      const blockedByMe = existingBlock.blockerId.toString() === userId;
      return res.json({
        blockStatus: {
          isBlocked: true,
          blockedByMe,
          blockedByPeer: !blockedByMe,
        },
      });
    }

    await ChatBlock.create({
      blockerId: userId,
      blockedUserId: contactId,
    });

    const payloadForBlocker = {
      contactId,
      blockedBy: userId,
      blockStatus: {
        isBlocked: true,
        blockedByMe: true,
        blockedByPeer: false,
      },
    };

    const payloadForBlocked = {
      contactId: userId,
      blockedBy: userId,
      blockStatus: {
        isBlocked: true,
        blockedByMe: false,
        blockedByPeer: true,
      },
    };

    notifySocketUser(contactId, 'chat_blocked', payloadForBlocked);
    notifySocketUser(userId, 'chat_blocked', payloadForBlocker);

    return res.json({
      blockStatus: {
        isBlocked: true,
        blockedByMe: true,
        blockedByPeer: false,
      },
    });
  } catch (error) {
    console.error('Ошибка при блокировке пользователя:', error);
    return res.status(500).json({ error: 'Ошибка при блокировке пользователя' });
  }
});

// Разблокировка пользователя в чате
router.delete('/conversations/:contactId/block', authMiddleware, async (req: any, res: Response) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId as string;

    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Некорректный ID контакта' });
    }

    const existingBlock = await ChatBlock.findOne({
      blockerId: userId,
      blockedUserId: contactId,
    });

    if (!existingBlock) {
      return res.status(404).json({ error: 'Блокировка не найдена' });
    }

    await ChatBlock.deleteOne({ _id: existingBlock._id });

    const payloadForBlocker = {
      contactId,
      unblockedBy: userId,
      blockStatus: {
        isBlocked: false,
        blockedByMe: false,
        blockedByPeer: false,
      },
    };

    const payloadForBlocked = {
      contactId: userId,
      unblockedBy: userId,
      blockStatus: {
        isBlocked: false,
        blockedByMe: false,
        blockedByPeer: false,
      },
    };

    notifySocketUser(contactId, 'chat_unblocked', payloadForBlocked);
    notifySocketUser(userId, 'chat_unblocked', payloadForBlocker);

    return res.json({
      blockStatus: {
        isBlocked: false,
        blockedByMe: false,
        blockedByPeer: false,
      },
    });
  } catch (error) {
    console.error('Ошибка при разблокировке пользователя:', error);
    return res.status(500).json({ error: 'Ошибка при разблокировке пользователя' });
  }
});

// Очистка переписки для обоих участников диалога
router.delete('/conversations/:contactId', authMiddleware, async (req: any, res: Response) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId as string;

    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: 'Некорректный ID контакта' });
    }

    const contactExists = await User.exists({ _id: contactId });
    if (!contactExists) {
      return res.status(404).json({ error: 'Контакт не найден' });
    }

    const dialogFilter = {
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    };

    await Message.deleteMany(dialogFilter);

    const payload = { clearedBy: userId, contactId };
    notifySocketUser(contactId, 'chat_cleared', payload);
    notifySocketUser(userId, 'chat_cleared', payload);

    return res.json({ message: 'Переписка очищена' });
  } catch (error) {
    console.error('Ошибка при очистке переписки:', error);
    return res.status(500).json({ error: 'Ошибка при очистке переписки' });
  }
});

// Удаление сообщения для обоих участников диалога
router.delete('/messages/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    const senderId = message.senderId.toString();
    const receiverId = message.receiverId.toString();
    const isParticipant = senderId === userId || receiverId === userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления сообщения' });
    }

    await Message.deleteOne({ _id: message._id });
    return res.json({ message: 'Сообщение удалено' });
  } catch (error) {
    console.error('Ошибка при удалении сообщения:', error);
    return res.status(500).json({ error: 'Ошибка при удалении сообщения' });
  }
});

export default router; 