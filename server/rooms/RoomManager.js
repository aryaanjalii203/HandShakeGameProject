import { Room } from './Room.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.playerRoomMap = new Map(); // socketId -> roomId
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostSocketId, hostUsername, gameType = 'cyber-pong', maxPlayers = 2) {
    this.leaveRoom(hostSocketId);

    const roomId = this.generateRoomCode();
    const room = new Room(roomId, hostSocketId, hostUsername, gameType, maxPlayers);
    this.rooms.set(roomId, room);
    this.playerRoomMap.set(hostSocketId, roomId);

    return room;
  }

  joinRoom(roomId, socketId, username) {
    this.leaveRoom(socketId);

    const code = (roomId || '').trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found. Check the 6-character code.' };
    }

    const result = room.addPlayer(socketId, username);
    if (result.success) {
      this.playerRoomMap.set(socketId, code);
      return { success: true, room };
    }
    return result;
  }

  leaveRoom(socketId) {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    this.playerRoomMap.delete(socketId);

    if (!room) return null;

    room.removePlayer(socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room: null, roomId, destroyed: true };
    }

    return { room, roomId, destroyed: false };
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase());
  }

  getRoomByPlayer(socketId) {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId);
  }

  getAllRoomsDTO() {
    return Array.from(this.rooms.values()).map(r => r.toDTO());
  }
}
