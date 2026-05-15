import io from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: ReturnType<typeof io> | null = null;

  initialize(userId: string): ReturnType<typeof io> {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL, {
      transports: ['websocket', 'polling']
    });
    
    // Сообщаем серверу, что пользователь подключился
    this.socket.emit('user_connected', userId);
    
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
      clientTempId
    });
  }

  markMessageAsRead(messageId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('read_message', messageId);
  }

  editMessage(messageId: string, text: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.emit('edit_message', { messageId, text });
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
    }
  }
}

export default new SocketService(); 