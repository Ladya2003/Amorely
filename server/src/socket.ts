import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import Message from './models/message';
import User from './models/user';
import mongoose from 'mongoose';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

export default function setupSocketIO(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
      
      // Обновляем статус сообщений как прочитанные
      updateMessagesAsRead(userId);
    });

    // Пользователь отправляет сообщение
    socket.on('send_message', async (data: { 
      receiverId: string, 
      text: string, 
      attachments?: Array<{ type: string, url: string, publicId: string }> 
    }) => {
      try {
        const { receiverId, text, attachments } = data;
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
          attachments,
          isRead: false,
          createdAt: new Date()
        });

        const savedMessage = await newMessage.save();

        // Находим получателя в списке подключенных пользователей
        const receiverSocketData = connectedUsers.find(user => user.userId === receiverId);

        // Отправляем сообщение отправителю для подтверждения
        socket.emit('message_sent', savedMessage);

        // Если получатель онлайн, отправляем ему сообщение
        if (receiverSocketData) {
          io.to(receiverSocketData.socketId).emit('new_message', savedMessage);
        }
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        socket.emit('error', { message: 'Ошибка при отправке сообщения' });
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

  // Вспомогательная функция для обновления статуса сообщений
  async function updateMessagesAsRead(userId: string) {
    try {
      await Message.updateMany(
        { receiverId: new mongoose.Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true } }
      );
    } catch (error) {
      console.error('Ошибка при обновлении статуса сообщений:', error);
    }
  }

  return io;
} 