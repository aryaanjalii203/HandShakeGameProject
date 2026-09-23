export class PixelSoccerServer {
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

    this.state = {
      gameType: 'pixel-soccer',
      width: this.width,
      height: this.height,
      p1Score: 0,
      p2Score: 0,
      p1: { id: p1.id, username: p1.username, x: 150, y: 380, vx: 0, vy: 0, isGrounded: true, color: p1.color || '#00f0ff' },
      p2: { id: p2.id, username: p2.username, x: 650, y: 380, vx: 0, vy: 0, isGrounded: true, color: p2.color || '#ef4444' },
      ball: { x: 400, y: 250, vx: 0, vy: 0, radius: 14 },
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = {
      [p1.id]: { left: false, right: false, jump: false, kick: false },
      [p2.id]: { left: false, right: false, jump: false, kick: false }
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
    if (this.playerInputs[socketId]) {
      Object.assign(this.playerInputs[socketId], inputData);
    }
  }

  handlePlayerDisconnect(socketId) {
    this.state.isOver = true;
    if (socketId === this.state.p1.id) this.state.winner = this.state.p2.username;
    else this.state.winner = this.state.p1.username;
    this.stop();
    this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
  }

  resetBall() {
    this.state.ball.x = 400;
    this.state.ball.y = 200;
    this.state.ball.vx = (Math.random() > 0.5 ? 4 : -4);
    this.state.ball.vy = -3;
  }

  update() {
    const s = this.state;
    const inp1 = this.playerInputs[s.p1.id] || {};
    const inp2 = this.playerInputs[s.p2.id] || {};

    // P1 physics
    if (inp1.left) s.p1.vx = -6;
    else if (inp1.right) s.p1.vx = 6;
    else s.p1.vx *= 0.8;

    if (inp1.jump && s.p1.isGrounded) {
      s.p1.vy = -14;
      s.p1.isGrounded = false;
    }
    s.p1.vy += 0.8;
    s.p1.x += s.p1.vx;
    s.p1.y += s.p1.vy;
    if (s.p1.y >= 380) { s.p1.y = 380; s.p1.vy = 0; s.p1.isGrounded = true; }
    s.p1.x = Math.max(50, Math.min(380, s.p1.x));

    // P2 physics
    if (inp2.left) s.p2.vx = -6;
    else if (inp2.right) s.p2.vx = 6;
    else s.p2.vx *= 0.8;

    if (inp2.jump && s.p2.isGrounded) {
      s.p2.vy = -14;
      s.p2.isGrounded = false;
    }
    s.p2.vy += 0.8;
    s.p2.x += s.p2.vx;
    s.p2.y += s.p2.vy;
    if (s.p2.y >= 380) { s.p2.y = 380; s.p2.vy = 0; s.p2.isGrounded = true; }
    s.p2.x = Math.max(420, Math.min(750, s.p2.x));

    // Ball physics
    s.ball.vy += 0.5; // Gravity
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;
    s.ball.vx *= 0.985;

    // Floor bounce
    if (s.ball.y >= 380) {
      s.ball.y = 380;
      s.ball.vy = -s.ball.vy * 0.75;
    }
    // Ceiling & wall bounce
    if (s.ball.y <= 20) { s.ball.y = 20; s.ball.vy = -s.ball.vy * 0.75; }
    if (s.ball.x <= 20) { s.ball.x = 20; s.ball.vx = -s.ball.vx * 0.75; }
    if (s.ball.x >= 780) { s.ball.x = 780; s.ball.vx = -s.ball.vx * 0.75; }

    // Ball-player collisions
    const checkPlayerHit = (player, isKick) => {
      const dist = Math.hypot(s.ball.x - player.x, s.ball.y - player.y);
      if (dist < s.ball.radius + 24) {
        const angle = Math.atan2(s.ball.y - player.y, s.ball.x - player.x);
        const power = isKick ? 15 : 9;
        s.ball.vx = Math.cos(angle) * power;
        s.ball.vy = Math.sin(angle) * power - 3;
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'paddle_hit' } });
      }
    };
    checkPlayerHit(s.p1, inp1.kick);
    checkPlayerHit(s.p2, inp2.kick);

    // Goal detection (Left goal: x < 50, y > 280; Right goal: x > 750, y > 280)
    if (s.ball.x <= 45 && s.ball.y >= 280) {
      s.p2Score++;
      this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'score' } });
      if (s.p2Score >= 5) {
        s.isOver = true;
        s.winner = s.p2.username;
        this.io.to(this.room.id).emit('game:over', { winner: s.winner });
        this.stop();
        return;
      }
      this.resetBall();
    } else if (s.ball.x >= 755 && s.ball.y >= 280) {
      s.p1Score++;
      this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'score' } });
      if (s.p1Score >= 5) {
        s.isOver = true;
        s.winner = s.p1.username;
        this.io.to(this.room.id).emit('game:over', { winner: s.winner });
        this.stop();
        return;
      }
      this.resetBall();
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
