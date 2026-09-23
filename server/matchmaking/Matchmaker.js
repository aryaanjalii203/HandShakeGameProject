export class Matchmaker {
  constructor(roomManager, io) {
    this.roomManager = roomManager;
    this.io = io;
    this.queues = new Map(); // gameType -> Array of { socketId, username }
  }

  addToQueue(socketId, username, gameType = 'cyber-pong') {
    this.removeFromQueue(socketId);

    const safeGameType = String(gameType || 'cyber-pong');
    const safeUsername = String(username || 'Challenger').slice(0, 16);

    if (!this.queues.has(safeGameType)) {
      this.queues.set(safeGameType, []);
    }

    const queue = this.queues.get(safeGameType);

    // Prune any disconnected sockets currently in queue
    for (let i = queue.length - 1; i >= 0; i--) {
      const entry = queue[i];
      const socket = this.io.sockets.sockets.get(entry.socketId);
      if (!socket || !socket.connected) {
        queue.splice(i, 1);
      }
    }

    queue.push({ socketId, username: safeUsername, timestamp: Date.now() });

    // Check if we have at least 2 connected players ready to match
    if (queue.length >= 2) {
      const p1 = queue.shift();
      const p2 = queue.shift();

      const s1 = this.io.sockets.sockets.get(p1.socketId);
      const s2 = this.io.sockets.sockets.get(p2.socketId);

      if (!s1 || !s1.connected) {
        if (s2 && s2.connected) queue.unshift(p2);
        return { matched: false };
      }
      if (!s2 || !s2.connected) {
        queue.unshift(p1);
        return { matched: false };
      }

      // Create new room
      const room = this.roomManager.createRoom(p1.socketId, p1.username, safeGameType, 2);
      this.roomManager.joinRoom(room.id, p2.socketId, p2.username);

      s1.join(room.id);
      s2.join(room.id);

      // Notify both players
      this.io.to(p1.socketId).emit('queue:match_found', { roomId: room.id, role: 'host' });
      this.io.to(p2.socketId).emit('queue:match_found', { roomId: room.id, role: 'guest' });

      // Emit room state to newly formed room
      this.io.to(room.id).emit('room:state', room.toDTO());

      return { matched: true, roomId: room.id };
    }

    return { matched: false, queuePosition: queue.length };
  }

  removeFromQueue(socketId) {
    for (const [gameType, queue] of this.queues.entries()) {
      const idx = queue.findIndex(p => p.socketId === socketId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        return true;
      }
    }
    return false;
  }
}
