import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message';
import User from '../models/user';
import { authMiddleware } from '../middleware/auth';

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
    url: attachment.url
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
    
    // Для каждого пользователя находим последнее сообщение
    const contacts = await Promise.all(users.map(async (user) => {
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
            ? 'Зашифрованное сообщение'
            : (hasMedia && !lastMessage.text ? 'Медиафайл' : lastMessage.text || 'Медиафайл'))
        : 'Нет сообщений';

      return {
        id: user._id,
        isPartner: Boolean(currentUser?.partnerId && user._id.toString() === currentUser.partnerId.toString()),
        name: getDisplayName(user),
        username: user.username,
        email: user.email,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
        unreadCount,
        lastMessage: lastMessage ? {
          id: lastMessage._id.toString(),
          senderId: lastMessage.senderId.toString(),
          text: displayText,
          timestamp: lastMessage.createdAt,
          isRead: lastMessage.isRead || lastMessage.senderId.toString() === userId,
          hasMedia: hasMedia
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

// Глобальный поиск пользователей для чата (по логину или почте)
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

    const searchFilter = {
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    const total = await User.countDocuments(searchFilter);

    // Ищем пользователей по частичному совпадению username/email, кроме текущего пользователя
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

    res.json({
      items: formattedMessages,
      hasMore: skip + messages.length < total,
      page,
      limit,
      total
    });
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
});

// Отправка нового сообщения
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, text, attachments, replyTo, forwardFrom, encryptedPayload } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
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

    if (!text) {
      return res.status(400).json({ error: 'Текст сообщения обязателен' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    // Безопасность: только владелец сообщения может его редактировать.
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования' });
    }

    if (message.forwardFrom || message.encryptedPayload) {
      return res.status(403).json({ error: 'Пересланное сообщение нельзя редактировать' });
    }

    message.text = text;
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