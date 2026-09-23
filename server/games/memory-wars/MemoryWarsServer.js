export class MemoryWarsServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.tickRate = 10;
    this.interval = null;
    this.countInterval = null;

    const glyphs = ['⚡', '🔥', '💎', '👾', '🚀', '👑', '💣', '🛡️'];
    const deck = [...glyphs, ...glyphs]
      .sort(() => Math.random() - 0.5)
      .map((glyph, id) => ({ id, glyph, matchedBy: null }));

    const players = {};
    room.players.forEach(p => {
      players[p.id] = { id: p.id, username: p.username, score: 0, pairs: 0 };
    });

    this.state = {
      gameType: 'memory-wars',
      cards: deck,
      players,
      flipped: [],
      countdown: 3,
      isOver: false,
      winner: null
    };
  }

  start() {
    let count = 3;
    this.state.countdown = count;

    this.countInterval = setInterval(() => {
      count--;
      this.state.countdown = count;
      if (count <= 0) {
        clearInterval(this.countInterval);
        this.countInterval = null;
        this.state.countdown = null;
        this.runLoop();
      }
      this.broadcastState();
    }, 1000);
  }

  runLoop() {
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      if (!this.state.isOver) {
        this.broadcastState();
      }
    }, 1000 / this.tickRate);
  }

  handleInput(socketId, inputData) {
    if (!inputData || typeof inputData !== 'object') return;
    const player = this.state.players[socketId];
    if (!player || this.state.isOver) return;

    if (typeof inputData.cardId === 'number') {
      const card = this.state.cards[inputData.cardId];
      if (!card || card.matchedBy || this.state.flipped.includes(card.id)) return;
      if (this.state.flipped.length >= 2) return;

      this.state.flipped.push(card.id);

      if (this.state.flipped.length === 2) {
        const c1 = this.state.cards[this.state.flipped[0]];
        const c2 = this.state.cards[this.state.flipped[1]];

        if (c1.glyph === c2.glyph) {
          c1.matchedBy = socketId;
          c2.matchedBy = socketId;
          player.score += 250;
          player.pairs++;
          this.state.flipped = [];
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });

          // Check if board complete
          if (this.state.cards.every(c => c.matchedBy)) {
            this.finishGame();
          }
        } else {
          setTimeout(() => {
            this.state.flipped = [];
            this.broadcastState();
          }, 800);
        }
      }
    }
  }

  handlePlayerDisconnect(socketId) {
    delete this.state.players[socketId];
    if (Object.keys(this.state.players).length <= 1) {
      this.finishGame();
    }
  }

  finishGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.players).sort((a, b) => b.score - a.score);
    this.state.winner = sorted[0]?.username || 'Nobody';
    this.io.to(this.room.id).emit('game:over', {
      winner: this.state.winner,
      scores: sorted.map(p => ({ username: p.username, score: p.score }))
    });
    this.stop();
  }

  broadcastState() {
    this.io.to(this.room.id).emit('game:state', this.state);
  }

  stop() {
    if (this.countInterval) {
      clearInterval(this.countInterval);
      this.countInterval = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
