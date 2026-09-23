export class QuickDrawServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.drawTimeout = null;

    const players = {};
    room.players.forEach(p => {
      players[p.id] = { id: p.id, username: p.username, reactionTime: null, fouled: false };
    });

    this.state = {
      gameType: 'quick-draw',
      status: 'waiting', // 'waiting' | 'draw' | 'result'
      drawTimestamp: 0,
      players,
      winner: null
    };
  }

  start() {
    this.state.status = 'waiting';
    this.broadcastState();

    const delay = 2500 + Math.random() * 3000;
    this.drawTimeout = setTimeout(() => {
      this.state.status = 'draw';
      this.state.drawTimestamp = Date.now();
      this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });
      this.broadcastState();
    }, delay);
  }

  handleInput(socketId, inputData) {
    if (!inputData || typeof inputData !== 'object') return;
    const player = this.state.players[socketId];
    if (!player || this.state.winner) return;

    if (this.state.status === 'waiting') {
      // Early shot penalty (foul)
      player.fouled = true;
      this.state.status = 'result';
      const other = Object.values(this.state.players).find(p => p.id !== socketId);
      this.state.winner = other ? other.username : 'Foul Penalty';
      this.io.to(this.room.id).emit('game:over', { winner: this.state.winner, reason: 'Opponent shot too early' });
      this.stop();
      return;
    }

    if (this.state.status === 'draw' && !player.reactionTime) {
      player.reactionTime = Date.now() - this.state.drawTimestamp;
      this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'laser' } });

      // First to shoot with valid time wins
      this.state.status = 'result';
      this.state.winner = player.username;
      this.io.to(this.room.id).emit('game:over', {
        winner: player.username,
        time: `${player.reactionTime}ms`
      });
      this.stop();
    }
  }

  handlePlayerDisconnect(socketId) {
    if (this.state.players[socketId]) {
      delete this.state.players[socketId];
      this.state.winner = Object.values(this.state.players)[0]?.username || 'Disconnected';
      this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
      this.stop();
    }
  }

  broadcastState() {
    this.io.to(this.room.id).emit('game:state', this.state);
  }

  stop() {
    if (this.drawTimeout) {
      clearTimeout(this.drawTimeout);
      this.drawTimeout = null;
    }
  }
}
