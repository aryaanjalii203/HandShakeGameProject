import { ROOM_STATUS, PLAYER_COLORS } from '../../shared/constants.js';

export class Room {
  constructor(id, hostSocketId, hostUsername = 'CyberPilot', gameType = 'cyber-pong', maxPlayers = 2) {
    this.id = String(id || '').toUpperCase();
    this.gameType = String(gameType || 'cyber-pong');
    this.maxPlayers = Math.max(2, Math.min(4, parseInt(maxPlayers, 10) || 2));
    this.status = ROOM_STATUS.WAITING;
    this.createdAt = Date.now();
    this.hostId = hostSocketId;
    this.players = [
      {
        id: hostSocketId,
        username: String(hostUsername || 'CyberPilot').slice(0, 16),
        color: PLAYER_COLORS[0],
        avatar: '🤖',
        isReady: true,
        isHost: true,
        score: 0,
        ping: 0
      }
    ];
    this.messages = [
      {
        id: 'sys-1',
        sender: 'SYSTEM',
        text: `Room ${this.id} created. Share the code or QR with your friends to play!`,
        timestamp: Date.now()
      }
    ];
    this.gameInstance = null;
  }

  addPlayer(socketId, username = 'Runner') {
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: 'Room is full (maximum ' + this.maxPlayers + ' players)' };
    }
    if (this.status === ROOM_STATUS.PLAYING) {
      return { success: false, error: 'Game is currently in progress.' };
    }

    const safeUsername = String(username || `Player_${this.players.length + 1}`).slice(0, 16);
    const colorIndex = this.players.length % PLAYER_COLORS.length;
    const avatars = ['⚡', '👾', '🚀', '🔥', '🔮', '🎮'];
    const newPlayer = {
      id: socketId,
      username: safeUsername,
      color: PLAYER_COLORS[colorIndex],
      avatar: avatars[colorIndex % avatars.length],
      isReady: false,
      isHost: false,
      score: 0,
      ping: 0
    };

    this.players.push(newPlayer);
    this.addMessage('SYSTEM', `${newPlayer.username} joined the lobby!`);
    this.updateStatus();
    return { success: true, player: newPlayer };
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.id === socketId);
    if (index === -1) return null;

    const [removed] = this.players.splice(index, 1);
    this.addMessage('SYSTEM', `${removed.username} left the room.`);

    if (this.players.length > 0 && removed.isHost) {
      this.players[0].isHost = true;
      this.players[0].isReady = true;
      this.hostId = this.players[0].id;
      this.addMessage('SYSTEM', `${this.players[0].username} is now the room host.`);
    }

    if (this.status === ROOM_STATUS.PLAYING && this.gameInstance) {
      this.gameInstance.handlePlayerDisconnect(socketId);
    }

    this.updateStatus();
    return removed;
  }

  toggleReady(socketId) {
    const player = this.players.find(p => p.id === socketId);
    if (!player) return false;

    player.isReady = !player.isReady;
    this.updateStatus();
    return true;
  }

  updatePlayerProfile(socketId, profile) {
    const player = this.players.find(p => p.id === socketId);
    if (!player || !profile || typeof profile !== 'object') return false;
    if (profile.username) player.username = String(profile.username).slice(0, 16);
    if (profile.avatar) player.avatar = String(profile.avatar).slice(0, 4);
    if (profile.color) player.color = String(profile.color).slice(0, 10);
    return true;
  }

  setGameType(gameType, maxPlayers = 2) {
    this.gameType = String(gameType || 'cyber-pong');
    this.maxPlayers = Math.max(2, Math.min(4, parseInt(maxPlayers, 10) || 2));
    this.addMessage('SYSTEM', `Game changed to ${this.gameType.toUpperCase().replace('-', ' ')}`);
  }

  updateStatus() {
    if (this.status === ROOM_STATUS.PLAYING) return;

    if (this.players.length >= 2 && this.players.every(p => p.isReady)) {
      this.status = ROOM_STATUS.READY;
    } else {
      this.status = ROOM_STATUS.WAITING;
    }
  }

  addMessage(sender, text) {
    const safeSender = String(sender || 'Unknown').slice(0, 20);
    const safeText = String(text || '').slice(0, 120);
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: safeSender,
      text: safeText,
      timestamp: Date.now()
    };
    this.messages.push(message);
    if (this.messages.length > 50) this.messages.shift();
    return message;
  }

  toDTO() {
    return {
      id: this.id,
      gameType: this.gameType,
      maxPlayers: this.maxPlayers,
      status: this.status,
      hostId: this.hostId,
      players: this.players,
      messages: this.messages,
      createdAt: this.createdAt
    };
  }
}
