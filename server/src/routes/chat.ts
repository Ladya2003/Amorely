import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message';
import User from '../models/user';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Получение списка контактов
router.get('/contacts', authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    // Получаем всех пользователей, кроме текущего
    const users = await User.find({ _id: { $ne: userId } });
    
    // Для каждого пользователя находим последнее сообщение
    const contacts = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: user._id },
          { senderId: user._id, receiverId: userId }
        ]
      }).sort({ createdAt: -1 });

      return {
        id: user._id,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`,
        lastMessage: lastMessage ? {
          text: lastMessage.text || 'Медиа-вложение',
          timestamp: lastMessage.createdAt,
          isRead: lastMessage.isRead || lastMessage.senderId.toString() === userId
        } : {
          text: 'Нет сообщений',
          timestamp: new Date(),
          isRead: true
        }
      };
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Ошибка при получении контактов:', error);
    res.status(500).json({ error: 'Ошибка при получении контактов' });
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

    // Отмечаем сообщения как прочитанные
    await Message.updateMany(
      { senderId: contactId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

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