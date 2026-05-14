import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import Message from './models/message';
import User from './models/user';
import mongoose from 'mongoose';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

const formatSocketMessage = (message: any, clientTempId?: string) => ({
  id: message._id.toString(),
  senderId: message.senderId.toString(),
  text: message.text,
  timestamp: message.createdAt.toISOString(),
  editedAt: message.editedAt ? message.editedAt.toISOString() : undefined,
  isRead: message.isRead,
  replyTo: message.replyTo || undefined,
  forwardFrom: message.forwardFrom || undefined,
  clientTempId,
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

export default function setupSocketIO(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3005',
      methods: ['GET', 'POST']
    }
  });

  const connectedUsers: ConnectedUser[] = [];

  io.on('connection', (socket: Socket) => {
    console.log('Новое подключение к сокету:', socket.id);

    // Пользователь подключается и отправляет свой ID
    socket.on('user_connected', (userId: string) => {
      console.log(`Пользователь подключен: ${userId}`);
      
      // Добавляем пользователя в список подключенных
      const existingUserIndex = connectedUsers.findIndex(user => user.userId === userId);
      if (existingUserIndex !== -1) {
        connectedUsers[existingUserIndex].socketId = socket.id;
      } else {
        connectedUsers.push({ userId, socketId: socket.id });
      }
    });

    // Пользователь отправляет сообщение
    socket.on('send_message', async (data: { 
      receiverId: string, 
      text: string, 
      encryptedPayload?: {
        version: number;
        algorithm: string;
        ciphertext: string;
        iv: string;
        senderDeviceId: string;
      },
      attachments?: Array<{ type: string, url: string, publicId: string }>,
      replyTo?: { id: string, text: string, senderId: string } | null,
      forwardFrom?: { id: string, text: string, senderId: string, senderName?: string, senderAvatar?: string } | null,
      clientTempId?: string
    }) => {
      try {
        const { receiverId, text, encryptedPayload, attachments, replyTo, forwardFrom, clientTempId } = data;
        const senderSocketData = connectedUsers.find(user => user.socketId === socket.id);
        
        if (!senderSocketData) {
          socket.emit('error', { message: 'Пользователь не авторизован' });
          return;
        }

        const senderId = senderSocketData.userId;

        // Создаем новое сообщение в базе данных
        const newMessage = new Message({
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
          text,
          encryptedPayload: encryptedPayload || undefined,
          attachments,
          replyTo: replyTo || undefined,
          forwardFrom: forwardFrom || undefined,
          isRead: false,
          createdAt: new Date()
        });

        const savedMessage = await newMessage.save();

        // Форматируем сообщение для отправки клиенту
        const formattedMessage = formatSocketMessage(savedMessage, clientTempId);

        // Находим получателя в списке подключенных пользователей
        const receiverSocketData = connectedUsers.find(user => user.userId === receiverId);

        // Отправляем сообщение отправителю для подтверждения
        socket.emit('message_sent', formattedMessage);

        // Если получатель онлайн, отправляем ему сообщение
        if (receiverSocketData) {
          io.to(receiverSocketData.socketId).emit('new_message', formattedMessage);
        }
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        socket.emit('error', { message: 'Ошибка при отправке сообщения' });
      }
    });

    socket.on('edit_message', async (data: { messageId: string; text: string }) => {
      try {
        const { messageId } = data;
        const text = String(data.text || '').trim();
        const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);

        if (!senderSocketData) {
          socket.emit('error', { message: 'Пользователь не авторизован' });
          return;
        }

        const senderId = senderSocketData.userId;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Сообщение не найдено' });
          return;
        }

        if (!text) {
          socket.emit('error', { message: 'Текст сообщения обязателен' });
          return;
        }

        if (message.forwardFrom || message.encryptedPayload) {
          socket.emit('error', { message: 'Пересланное сообщение нельзя редактировать' });
          return;
        }

        // Безопасность: редактировать может только владелец сообщения.
        if (message.senderId.toString() !== senderId) {
          socket.emit('error', { message: 'Недостаточно прав для редактирования сообщения' });
          return;
        }

        message.text = text;
        message.editedAt = new Date();
        await message.save();

        const formattedMessage = formatSocketMessage(message);

        socket.emit('message_edited', formattedMessage);

        const receiverSocketData = connectedUsers.find(
          (user) => user.userId === message.receiverId.toString()
        );
        if (receiverSocketData) {
          io.to(receiverSocketData.socketId).emit('message_edited', formattedMessage);
        }
      } catch (error) {
        console.error('Ошибка при редактировании сообщения:', error);
        socket.emit('error', { message: 'Ошибка при редактировании сообщения' });
      }
    });

    socket.on('delete_message', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;
        const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);

        if (!senderSocketData) {
          socket.emit('error', { message: 'Пользователь не авторизован' });
          return;
        }

        const userId = senderSocketData.userId;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Сообщение не найдено' });
          return;
        }

        const senderId = message.senderId.toString();
        const receiverId = message.receiverId.toString();
        const isParticipant = senderId === userId || receiverId === userId;

        if (!isParticipant) {
          socket.emit('error', { message: 'Недостаточно прав для удаления сообщения' });
          return;
        }

        await Message.deleteOne({ _id: message._id });

        const payload = {
          messageId,
          senderId,
          receiverId
        };

        socket.emit('message_deleted', payload);

        const targetUserId = senderId === userId ? receiverId : senderId;
        const targetSocketData = connectedUsers.find((user) => user.userId === targetUserId);
        if (targetSocketData) {
          io.to(targetSocketData.socketId).emit('message_deleted', payload);
        }
      } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
        socket.emit('error', { message: 'Ошибка при удалении сообщения' });
      }
    });

    // Пользователь читает сообщение
    socket.on('read_message', async (messageId: string) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return;
        }

        message.isRead = true;
        await message.save();

        // Находим отправителя в списке подключенных пользователей
        const senderSocketData = connectedUsers.find(user => user.userId === message.senderId.toString());

        // Если отправитель онлайн, уведомляем его о прочтении сообщения
        if (senderSocketData) {
          io.to(senderSocketData.socketId).emit('message_read', messageId);
        }
      } catch (error) {
        console.error('Ошибка при отметке сообщения как прочитанного:', error);
      }
    });

    // Пользователь печатает сообщение
    socket.on('typing', (receiverId: string) => {
      const senderSocketData = connectedUsers.find(user => user.socketId === socket.id);
      if (!senderSocketData) return;

      const receiverSocketData = connectedUsers.find(user => user.userId === receiverId);
      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit('user_typing', senderSocketData.userId);
      }
    });

    // Пользователь перестал печатать
    socket.on('stop_typing', (receiverId: string) => {
      const senderSocketData = connectedUsers.find(user => user.socketId === socket.id);
      if (!senderSocketData) return;

      const receiverSocketData = connectedUsers.find(user => user.userId === receiverId);
      if (receiverSocketData) {
        io.to(receiverSocketData.socketId).emit('user_stop_typing', senderSocketData.userId);
      }
    });

    // Пользователь отключается
    socket.on('disconnect', () => {
      console.log('Пользователь отключен:', socket.id);
      const index = connectedUsers.findIndex(user => user.socketId === socket.id);
      if (index !== -1) {
        connectedUsers.splice(index, 1);
      }
    });
  });

  return io;
} 