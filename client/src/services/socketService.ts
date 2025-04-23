import io from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: ReturnType<typeof io> | null = null;

  initialize(userId: string): ReturnType<typeof io> {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(API_URL);
    
    // Сообщаем серверу, что пользователь подключился
    this.socket.emit('user_connected', userId);
    
    return this.socket;
  }

  sendMessage(receiverId: string, text: string, attachments?: any[]) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('send_message', {
      receiverId,
      text,
      attachments
    });
  }

  markMessageAsRead(messageId: string) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    this.socket.emit('read_message', messageId);
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