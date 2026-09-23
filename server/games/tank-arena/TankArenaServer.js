export class TankArenaServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 45;
    this.interval = null;
    this.countInterval = null;

    const p1 = room.players[0] || { id: 'p1', username: 'Player 1' };
    const p2 = room.players[1] || { id: 'p2', username: 'Player 2' };

    const players = {
      [p1.id]: {
        id: p1.id,
        username: p1.username,
        x: 100,
        y: 250,
        angle: 0,
        speed: 0,
        maxSpeed: 4,
        hp: 100,
        color: p1.color || '#00f0ff',
        score: 0
      },
      [p2.id]: {
        id: p2.id,
        username: p2.username,
        x: 700,
        y: 250,
        angle: Math.PI,
        speed: 0,
        maxSpeed: 4,
        hp: 100,
        color: p2.color || '#ef4444',
        score: 0
      }
    };

    const inputs = {
      [p1.id]: { forward: false, reverse: false, left: false, right: false },
      [p2.id]: { forward: false, reverse: false, left: false, right: false }
    };

    this.state = {
      gameType: 'tank-arena',
      width: this.width,
      height: this.height,
      players,
      bullets: [],
      obstacles: [
        { x: 250, y: 100, w: 30, h: 300 },
        { x: 520, y: 100, w: 30, h: 300 },
        { x: 340, y: 220, w: 120, h: 60 }
      ],
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = inputs;
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
    if (inputData.shoot) {
      this.shootBullet(socketId);
    }
  }

  shootBullet(socketId) {
    const tank = this.state.players[socketId];
    if (!tank || this.state.isOver) return;

    this.state.bullets.push({
      id: `blt-${Date.now()}-${Math.random()}`,
      x: tank.x + Math.cos(tank.angle) * 24,
      y: tank.y + Math.sin(tank.angle) * 24,
      vx: Math.cos(tank.angle) * 8.5,
      vy: Math.sin(tank.angle) * 8.5,
      bounces: 0,
      ownerId: socketId,
      color: tank.color
    });

    this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'laser' } });
  }

  handlePlayerDisconnect(socketId) {
    this.state.isOver = true;
    const remaining = Object.values(this.state.players).find(p => p.id !== socketId);
    if (remaining) {
      this.state.winner = remaining.username;
    }
    this.stop();
    this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
  }

  update() {
    // 1. Update Tank Movements
    for (const [id, p] of Object.entries(this.state.players)) {
      const inp = this.playerInputs[id] || {};
      if (inp.left) p.angle -= 0.055;
      if (inp.right) p.angle += 0.055;
      if (inp.forward) p.speed = Math.min(p.maxSpeed, p.speed + 0.25);
      else if (inp.reverse) p.speed = Math.max(-2, p.speed - 0.25);
      else p.speed *= 0.92;

      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      p.x = Math.max(30, Math.min(this.width - 30, p.x));
      p.y = Math.max(30, Math.min(this.height - 30, p.y));
    }

    // 2. Update Bullets & Ricochets
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const b = this.state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // Wall bounce
      if (b.x <= 15 || b.x >= this.width - 15) {
        b.vx = -b.vx;
        b.bounces++;
      }
      if (b.y <= 15 || b.y >= this.height - 15) {
        b.vy = -b.vy;
        b.bounces++;
      }

      // Obstacle bounce
      for (const ob of this.state.obstacles) {
        if (b.x > ob.x && b.x < ob.x + ob.w && b.y > ob.y && b.y < ob.y + ob.h) {
          b.vx = -b.vx;
          b.vy = -b.vy;
          b.bounces++;
        }
      }

      // Check hit against tanks
      for (const [id, tank] of Object.entries(this.state.players)) {
        if (id !== b.ownerId || b.bounces > 0) {
          if (Math.hypot(b.x - tank.x, b.y - tank.y) < 22) {
            tank.hp -= 25;
            this.state.bullets.splice(i, 1);
            this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'explosion' } });

            if (tank.hp <= 0) {
              this.state.isOver = true;
              const winner = Object.values(this.state.players).find(p => p.id !== id);
              this.state.winner = winner ? winner.username : 'Tie';
              this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
              this.stop();
              return;
            }
            break;
          }
        }
      }

      // Remove after 3 bounces
      if (b.bounces > 3 && this.state.bullets[i]) {
        this.state.bullets.splice(i, 1);
      }
    }
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
