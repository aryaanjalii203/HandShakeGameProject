export class TreasureRushServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 30;
    this.interval = null;
    this.countInterval = null;

    const players = {};
    const inputs = {};
    room.players.forEach((p, i) => {
      players[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || (i === 0 ? '#00f0ff' : '#ff007f'),
        x: 100 + i * 200,
        y: 250,
        radius: 14,
        speed: 5.5,
        score: 0
      };
      inputs[p.id] = { up: false, down: false, left: false, right: false };
    });

    const gems = [];
    for (let i = 0; i < 24; i++) {
      gems.push({
        id: `gem-${i}`,
        x: 60 + Math.random() * 680,
        y: 60 + Math.random() * 380,
        type: Math.random() > 0.7 ? 'diamond' : 'coin',
        value: Math.random() > 0.7 ? 250 : 100,
        collected: false
      });
    }

    this.state = {
      gameType: 'treasure-rush',
      width: this.width,
      height: this.height,
      players,
      gems,
      enemies: [
        { x: 100, y: 100, vx: 3, vy: 2, radius: 16 },
        { x: 700, y: 400, vx: -2, vy: -3, radius: 16 }
      ],
      timeLeft: 40,
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = inputs;
    this.timerTick = 0;
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
        this.update();
      }
      this.broadcastState();
    }, 1000 / this.tickRate);
  }

  handleInput(socketId, inputData) {
    if (!inputData || typeof inputData !== 'object') return;
    if (this.playerInputs[socketId]) {
      Object.assign(this.playerInputs[socketId], inputData);
    }
  }

  handlePlayerDisconnect(socketId) {
    if (this.state.players[socketId]) {
      delete this.state.players[socketId];
      if (Object.keys(this.state.players).length <= 1) {
        this.finishGame();
      }
    }
  }

  update() {
    this.timerTick++;
    if (this.timerTick >= this.tickRate) {
      this.timerTick = 0;
      this.state.timeLeft--;
      if (this.state.timeLeft <= 0) {
        this.finishGame();
        return;
      }
    }

    // Move Players
    for (const [id, p] of Object.entries(this.state.players)) {
      const inp = this.playerInputs[id] || {};
      if (inp.up) p.y -= p.speed;
      if (inp.down) p.y += p.speed;
      if (inp.left) p.x -= p.speed;
      if (inp.right) p.x += p.speed;

      p.x = Math.max(30, Math.min(this.width - 30, p.x));
      p.y = Math.max(30, Math.min(this.height - 30, p.y));

      // Collect gems
      for (const gem of this.state.gems) {
        if (!gem.collected && Math.hypot(p.x - gem.x, p.y - gem.y) < p.radius + 15) {
          gem.collected = true;
          p.score += gem.value;
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });
        }
      }
    }

    // Move enemies
    for (const en of this.state.enemies) {
      en.x += en.vx;
      en.y += en.vy;
      if (en.x <= 40 || en.x >= this.width - 40) en.vx = -en.vx;
      if (en.y <= 40 || en.y >= this.height - 40) en.vy = -en.vy;

      // Enemy hit penalties
      for (const p of Object.values(this.state.players)) {
        if (Math.hypot(p.x - en.x, p.y - en.y) < p.radius + en.radius) {
          p.score = Math.max(0, p.score - 5);
        }
      }
    }

    // Respawn gems if all collected
    if (this.state.gems.every(g => g.collected)) {
      for (const g of this.state.gems) {
        g.collected = false;
        g.x = 60 + Math.random() * 680;
        g.y = 60 + Math.random() * 380;
      }
    }
  }

  finishGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.players).sort((a, b) => b.score - a.score);
    this.state.winner = sorted[0]?.username || 'Tie';
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
