import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import Message from './models/message';
import { awardChatDaily, awardChatNewContact } from './utils/currencyRewards';
import type { CurrencyAwardResult } from './services/currencyService';
import User from './models/user';
import mongoose from 'mongoose';
import { getAllowedOrigins } from './utils/corsOrigins';
import { notifyNewMessage } from './services/pushService';
import { isChatBlockedBetween } from './services/chatBlockService';
import { markUserOnline, markUserOffline, getOnlineUserIds } from './presence';
import { attachGameSocketHandlers } from './games/gameSocketHandlers';
import { idsEqual } from './utils/normalizeId';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

let ioRef: SocketIOServer | null = null;
let connectedUsersRef: ConnectedUser[] = [];

const emitCurrencyAwardToClient = (socket: Socket, award: CurrencyAwardResult | null | undefined) => {
  if (!award?.awarded || award.amount <= 0) {
    return;
  }

  socket.emit('currency_awarded', {
    awardedAmount: award.amount,
    balance: award.balance,
  });
};

export const notifySocketUser = (userId: string, event: string, payload: unknown) => {
  if (!ioRef) {
    return;
  }

  const target = connectedUsersRef.find((user) => idsEqual(user.userId, userId));
  if (target) {
    ioRef.to(target.socketId).emit(event, payload);
  }
};

const formatSocketMessage = (message: any, clientTempId?: string) => ({
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
    url: attachment.url,
    publicId: attachment.publicId,
    encrypted: Boolean(attachment.encrypted)
  }))
});

export default function setupSocketIO(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST']
    }
  });

  ioRef = io;
  connectedUsersRef = [];
  const connectedUsers = connectedUsersRef;

  io.on('connection', (socket: Socket) => {
    attachGameSocketHandlers(socket, io, connectedUsers);

    // Пользователь подключается и отправляет свой ID
    socket.on('user_connected', (userId: string) => {
      // Добавляем пользователя в список подключенных
      const existingUserIndex = connectedUsers.findIndex(user => user.userId === userId);
      if (existingUserIndex !== -1) {
        connectedUsers[existingUserIndex].socketId = socket.id;
      } else {
        connectedUsers.push({ userId, socketId: socket.id });
      }

      markUserOnline(userId);

      socket.emit('presence_snapshot', { onlineUserIds: getOnlineUserIds() });

      connectedUsers.forEach((user) => {
        if (user.userId !== userId) {
          io.to(user.socketId).emit('user_online', { userId });
        }
      });
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
      attachments?: Array<{ type: string, url: string, publicId: string, encrypted?: boolean }>,
      replyTo?: { id: string, text: string, senderId: string } | null,
      forwardFrom?: { id: string, text: string, senderId: string, senderName?: string, senderAvatar?: string } | null,
      sharedEvent?: {
        eventId: string;
        title: string;
        descriptionPreview?: string;
        previewUrl?: string;
        previewResourceType?: 'image' | 'video';
        previewEncrypted?: boolean;
        previewMediaEnvelope?: unknown;
        eventDate?: string;
      } | null,
      clientTempId?: string,
      pushPreview?: string,
      sharedNote?: {
        noteId: string;
        title: string;
        category?: string;
        contentPreview?: string;
        previewUrl?: string;
        previewResourceType?: 'image' | 'video';
        previewEncrypted?: boolean;
        previewMediaEnvelope?: unknown;
        updatedAt?: string;
      } | null
    }) => {
      try {
        const {
          receiverId,
          text,
          encryptedPayload,
          attachments,
          replyTo,
          forwardFrom,
          sharedEvent,
          sharedNote,
          clientTempId,
          pushPreview
        } = data;

        const senderSocketData = connectedUsers.find(user => user.socketId === socket.id);
        
        if (!senderSocketData) {
          socket.emit('error', { message: 'Пользователь не авторизован', clientTempId });
          return;
        }

        const senderId = senderSocketData.userId;

        if (await isChatBlockedBetween(senderId, receiverId)) {
          socket.emit('error', { message: 'Чат заблокирован', clientTempId });
          return;
        }

        const sanitizedForwardFrom = forwardFrom
          ? {
              ...forwardFrom,
              text: String(forwardFrom.text || '').trim() || 'Пересланное сообщение'
            }
          : undefined;

        const sanitizedReplyTo = replyTo
          ? {
              ...replyTo,
              text: String(replyTo.text || '').trim() || 'Сообщение'
            }
          : undefined;

        // Создаем новое сообщение в базе данных
        const newMessage = new Message({
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
          text,
          encryptedPayload: encryptedPayload || undefined,
          attachments,
          replyTo: sanitizedReplyTo,
          forwardFrom: sanitizedForwardFrom,
          sharedEvent: sharedEvent || undefined,
          sharedNote: sharedNote || undefined,
          isRead: false,
          createdAt: new Date()
        });

        const savedMessage = await newMessage.save();

        const dailyAward = await awardChatDaily(senderId);
        emitCurrencyAwardToClient(socket, dailyAward);

        const priorMessages = await Message.countDocuments({
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
        });
        if (priorMessages <= 1) {
          const contactAward = await awardChatNewContact(senderId, receiverId);
          emitCurrencyAwardToClient(socket, contactAward);
        }

        // Форматируем сообщение для отправки клиенту
        const formattedMessage = formatSocketMessage(savedMessage, clientTempId);

        // Находим получателя в списке подключенных пользователей
        const receiverSocketData = connectedUsers.find(user => user.userId === receiverId);

        // Отправляем сообщение отправителю для подтверждения
        socket.emit('message_sent', formattedMessage);

        // Если получатель онлайн, отправляем ему сообщение
        if (receiverSocketData) {
          io.to(receiverSocketData.socketId).emit('new_message', formattedMessage);
        } else {
          void notifyNewMessage({
            receiverId,
            senderId,
            text,
            pushPreview,
            encryptedPayload,
            attachments,
            sharedEvent: sharedEvent || undefined,
            sharedNote: sharedNote || undefined,
            forwardFrom: sanitizedForwardFrom
          });
        }
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        socket.emit('error', {
          message: 'Ошибка при отправке сообщения',
          clientTempId: data.clientTempId
        });
      }
    });

    socket.on('edit_message', async (data: {
      messageId: string;
      text: string;
      encryptedPayload?: {
        version: number;
        algorithm: string;
        ciphertext: string;
        iv: string;
        senderDeviceId: string;
      };
    }) => {
      try {
        const { messageId, encryptedPayload } = data;
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

        if (message.senderId.toString() !== senderId) {
          socket.emit('error', { message: 'Недостаточно прав для редактирования сообщения' });
          return;
        }

        if (message.forwardFrom || message.sharedEvent || message.sharedNote) {
          socket.emit('error', { message: 'Это сообщение нельзя редактировать' });
          return;
        }

        const hasMedia = Boolean(message.attachments?.length);
        if (hasMedia) {
          socket.emit('error', { message: 'Сообщения с медиа нельзя редактировать' });
          return;
        }

        if (message.encryptedPayload) {
          if (!encryptedPayload) {
            socket.emit('error', { message: 'Не удалось обновить зашифрованное сообщение' });
            return;
          }
          message.encryptedPayload = encryptedPayload;
          message.text = text;
        } else {
          if (!text) {
            socket.emit('error', { message: 'Текст сообщения обязателен' });
            return;
          }
          message.text = text;
        }

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
    socket.on('disconnect', async () => {
      const index = connectedUsers.findIndex(user => user.socketId === socket.id);
      if (index !== -1) {
        const { userId } = connectedUsers[index];
        connectedUsers.splice(index, 1);
        markUserOffline(userId);

        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, { lastSeen });
        } catch (error) {
          console.error('Ошибка при обновлении lastSeen:', error);
        }

        connectedUsers.forEach((user) => {
          io.to(user.socketId).emit('user_offline', {
            userId,
            lastSeen: lastSeen.toISOString()
          });
        });
      }
    });
  });

  return io;
} 