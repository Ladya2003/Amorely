import { Socket } from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  // Инициализация сокета
  initialize(userId: string) {
    this.userId = userId;
    this.socket = io(API_URL);

    this.socket.on('connect', () => {
      console.log('Соединение с сокетом установлено');
      this.socket?.emit('user_connected', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Соединение с сокетом разорвано');
    });

    this.socket.on('error', (error) => {
      console.error('Ошибка сокета:', error);
    });

    return this.socket;
  }

  // Отправка сообщения
  sendMessage(receiverId: string, text: string, attachments?: Array<{ type: string, url: string, publicId: string }>) {
    if (!this.socket) {
      console.error('Сокет не инициализирован');
      return;
    }

    this.socket.emit('send_message', {
      receiverId,
      text,
      attachments
    });
  }

  // Отметка сообщения как прочитанного
  markMessageAsRead(messageId: string) {
    if (!this.socket) {
      console.error('Сокет не инициализирован');
      return;
    }

    this.socket.emit('read_message', messageId);
  }

  // Уведомление о печати
  sendTyping(receiverId: string) {
    if (!this.socket) {
      console.error('Сокет не инициализирован');
      return;
    }

    this.socket.emit('typing', receiverId);
  }

  // Уведомление о прекращении печати
  sendStopTyping(receiverId: string) {
    if (!this.socket) {
      console.error('Сокет не инициализирован');
      return;
    }

    this.socket.emit('stop_typing', receiverId);
  }

  // Отключение сокета
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }
}

export default new SocketService(); 