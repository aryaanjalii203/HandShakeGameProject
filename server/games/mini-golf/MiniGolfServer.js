export class MiniGolfServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 45;
    this.interval = null;
    this.countInterval = null;

    const balls = {};
    room.players.forEach((p, i) => {
      balls[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || (i === 0 ? '#ffffff' : '#00f0ff'),
        x: 120,
        y: 250 + (i === 0 ? -25 : 25),
        vx: 0,
        vy: 0,
        radius: 8,
        strokes: 0,
        totalStrokes: 0,
        inHole: false
      };
    });

    this.state = {
      gameType: 'mini-golf-chaos',
      width: this.width,
      height: this.height,
      hole: 1,
      balls,
      holePos: { x: 680, y: 250, radius: 14 },
      obstacles: [
        { x: 350, y: 100, w: 30, h: 280 },
        { x: 500, y: 0, w: 30, h: 220 }
      ],
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
        this.update();
      }
      this.broadcastState();
    }, 1000 / this.tickRate);
  }

  handleInput(socketId, inputData) {
    if (!inputData || typeof inputData !== 'object') return;
    const b = this.state.balls[socketId];
    if (!b || b.inHole || this.state.isOver) return;

    if (typeof inputData.vx === 'number' && typeof inputData.vy === 'number') {
      if (Math.hypot(b.vx, b.vy) < 0.1) {
        b.vx = Math.max(-18, Math.min(18, inputData.vx));
        b.vy = Math.max(-18, Math.min(18, inputData.vy));
        b.strokes++;
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'paddle_hit' } });
      }
    }
  }

  handlePlayerDisconnect(socketId) {
    delete this.state.balls[socketId];
    if (Object.keys(this.state.balls).length <= 1) {
      this.finishGame();
    }
  }

  update() {
    for (const b of Object.values(this.state.balls)) {
      if (b.inHole) continue;

      if (Math.hypot(b.vx, b.vy) > 0.05) {
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.975;
        b.vy *= 0.975;

        // Wall collisions
        if (b.x - b.radius <= 20) { b.x = 20 + b.radius; b.vx = -b.vx * 0.8; }
        if (b.x + b.radius >= 780) { b.x = 780 - b.radius; b.vx = -b.vx * 0.8; }
        if (b.y - b.radius <= 20) { b.y = 20 + b.radius; b.vy = -b.vy * 0.8; }
        if (b.y + b.radius >= 480) { b.y = 480 - b.radius; b.vy = -b.vy * 0.8; }

        // Obstacles
        for (const ob of this.state.obstacles) {
          if (b.x + b.radius > ob.x && b.x - b.radius < ob.x + ob.w &&
              b.y + b.radius > ob.y && b.y - b.radius < ob.y + ob.h) {
            b.vx = -b.vx * 0.8;
            b.vy = -b.vy * 0.8;
          }
        }

        // Sink in hole
        if (Math.hypot(b.x - this.state.holePos.x, b.y - this.state.holePos.y) < this.state.holePos.radius) {
          b.inHole = true;
          b.vx = 0; b.vy = 0;
          b.x = this.state.holePos.x; b.y = this.state.holePos.y;
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });

          // Check if all players completed hole
          if (Object.values(this.state.balls).every(ball => ball.inHole)) {
            setTimeout(() => this.nextHole(), 1200);
          }
        }
      } else {
        b.vx = 0; b.vy = 0;
      }
    }
  }

  nextHole() {
    if (this.state.hole >= 3) {
      this.finishGame();
      return;
    }
    this.state.hole++;
    for (const b of Object.values(this.state.balls)) {
      b.totalStrokes += b.strokes;
      b.strokes = 0;
      b.inHole = false;
      b.x = 120;
      b.y = 250;
    }
    this.state.holePos.x = 650;
    this.state.holePos.y = 250 + (Math.random() * 200 - 100);
  }

  finishGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.balls).sort((a, b) => (a.totalStrokes + a.strokes) - (b.totalStrokes + b.strokes));
    this.state.winner = sorted[0]?.username || 'Nobody';
    this.io.to(this.room.id).emit('game:over', {
      winner: this.state.winner,
      scores: sorted.map(b => ({ username: b.username, strokes: b.totalStrokes + b.strokes }))
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
