import io from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private connectedUserId: string | null = null;
  private onConnectHandler: (() => void) | null = null;
  private onVisibilityHandler: (() => void) | null = null;
  private onOnlineHandler: (() => void) | null = null;

  private registerUserOnServer() {
    if (this.socket?.connected && this.connectedUserId) {
      this.socket.emit('user_connected', this.connectedUserId);
    }
  }

  private setupSocketLifecycle() {
    if (!this.socket) {
      return;
    }

    if (this.onConnectHandler) {
      this.socket.off('connect', this.onConnectHandler);
    }

    this.onConnectHandler = () => {
      this.registerUserOnServer();
    };
    this.socket.on('connect', this.onConnectHandler);

    if (typeof document !== 'undefined' && !this.onVisibilityHandler) {
      this.onVisibilityHandler = () => {
        if (document.visibilityState !== 'visible') {
          return;
        }

        if (this.socket?.connected) {
          this.registerUserOnServer();
        } else {
          this.socket?.connect();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityHandler);
    }

    if (typeof window !== 'undefined' && !this.onOnlineHandler) {
      this.onOnlineHandler = () => {
        if (this.socket?.connected) {
          this.registerUserOnServer();
        } else {
          this.socket?.connect();
        }
      };
      window.addEventListener('online', this.onOnlineHandler);
    }
  }

  private teardownGlobalListeners() {
    if (this.onVisibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityHandler);
      this.onVisibilityHandler = null;
    }

    if (this.onOnlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnlineHandler);
      this.onOnlineHandler = null;
    }
  }

  initialize(userId: string): ReturnType<typeof io> {
    if (this.socket?.connected && this.connectedUserId === userId) {
      this.registerUserOnServer();
      return this.socket;
    }

    if (this.socket) {
      if (this.onConnectHandler) {
        this.socket.off('connect', this.onConnectHandler);
        this.onConnectHandler = null;
      }
      this.socket.disconnect();
    }

    this.connectedUserId = userId;
    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupSocketLifecycle();

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

    if (!this.socket.connected) {
      this.socket.connect();
    }

    this.registerUserOnServer();

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
      if (this.onConnectHandler) {
        this.socket.off('connect', this.onConnectHandler);
        this.onConnectHandler = null;
      }
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectedUserId = null;
    this.teardownGlobalListeners();
  }
}

export default new SocketService();
