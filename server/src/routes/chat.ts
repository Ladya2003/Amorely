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
        ? (hasMedia && !lastMessage.text ? 'Медиафайл' : lastMessage.text || 'Медиафайл')
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

    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    if (!query) {
      return res.json([]);
    }

    // Ищем пользователей по частичному совпадению username/email, кроме текущего пользователя
    const matchedUsers = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id username email firstName lastName avatar')
      .limit(20);

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

    res.json(results);
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
    
    if (!userId || !contactId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    // Получаем сообщения между пользователями
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Преобразуем сообщения в формат, ожидаемый клиентом
    const formattedMessages = messages.map(message => ({
      id: message._id.toString(),
      senderId: message.senderId.toString(),
      text: message.text,
      timestamp: message.createdAt.toISOString(),
      isRead: message.isRead,
      attachments: message.attachments?.map(attachment => ({
        type: attachment.type,
        url: attachment.url
      }))
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
});

// Отправка нового сообщения
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, text, attachments } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Не указаны необходимые параметры' });
    }

    // Создаем новое сообщение
    const newMessage = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text,
      attachments,
      isRead: false,
      createdAt: new Date()
    });

    const savedMessage = await newMessage.save();

    // Форматируем сообщение для ответа
    const formattedMessage = {
      id: savedMessage._id.toString(),
      senderId: savedMessage.senderId.toString(),
      text: savedMessage.text,
      timestamp: savedMessage.createdAt.toISOString(),
      isRead: savedMessage.isRead,
      attachments: savedMessage.attachments?.map(attachment => ({
        type: attachment.type,
        url: attachment.url
      }))
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
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

export default router; 