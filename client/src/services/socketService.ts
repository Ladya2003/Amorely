import io from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connectedUserId: string | null = null;

  initialize(userId: string): ReturnType<typeof io> {
    if (this.socket?.connected && this.connectedUserId === userId) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL, {
      transports: ['websocket', 'polling']
    });
    this.connectedUserId = userId;

    // Сообщаем серверу, что пользователь подключился
    this.socket.emit('user_connected', userId);

    return this.socket;
  }

  getSocket(): ReturnType<typeof io> | null {
    return this.socket;
  }

  sendMessage(
    receiverId: string,
    text: string,
    encryptedPayload?: {
      version: number;
      algorithm: string;
      ciphertext: string;
      iv: string;
      senderDeviceId: string;
    },
    attachments?: any[],
    replyTo?: { id: string; text: string; senderId: string } | null,
    forwardFrom?: { id: string; text: string; senderId: string; senderName?: string; senderAvatar?: string } | null,
    sharedEvent?: {
      eventId: string;
      title: string;
      previewUrl?: string;
      previewResourceType?: 'image' | 'video';
      previewEncrypted?: boolean;
      previewMediaEnvelope?: unknown;
      eventDate?: string;
    } | null,
    clientTempId?: string
  ) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('send_message', {
      receiverId,
      text,
      encryptedPayload,
      attachments,
      replyTo,
      forwardFrom,
      sharedEvent,
      clientTempId
    });
  }

  markMessageAsRead(messageId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('read_message', messageId);
  }

  editMessage(
    messageId: string,
    text: string,
    encryptedPayload?: {
      version: number;
      algorithm: string;
      ciphertext: string;
      iv: string;
      senderDeviceId: string;
    }
  ) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('edit_message', { messageId, text, encryptedPayload });
  }

  deleteMessage(messageId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('delete_message', { messageId });
  }

  startTyping(receiverId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('typing', receiverId);
  }

  stopTyping(receiverId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('stop_typing', receiverId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedUserId = null;
    }
  }
}

export default new SocketService(); 