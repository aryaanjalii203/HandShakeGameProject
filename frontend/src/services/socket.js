import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.ping = 0;
    this.listeners = new Map();
    this.pingInterval = null;
  }

  connect() {
    if (this.socket) return this.socket;

    // Determine target URL (remote server, local dev, or current origin)
    const isDev = window.location.port === '5173';
    const serverUrl = import.meta.env.VITE_SERVER_URL || 
                      (isDev ? `http://${window.location.hostname}:3001` : window.location.origin);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to PLAYFORGE Server:', this.socket.id);
      this.startPingCheck();
    });

    this.socket.on(SOCKET_EVENTS.PONG, (startTime) => {
      this.ping = Date.now() - startTime;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from PLAYFORGE Server');
      if (this.pingInterval) clearInterval(this.pingInterval);
    });

    return this.socket;
  }

  startPingCheck() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(SOCKET_EVENTS.PING, Date.now());
      }
    }, 2000);
  }

  getPing() {
    return this.ping;
  }

  getSocket() {
    if (!this.socket) return this.connect();
    return this.socket;
  }
}

export const socketService = new SocketService();
