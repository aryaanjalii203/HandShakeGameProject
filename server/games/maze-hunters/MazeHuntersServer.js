export class MazeHuntersServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 30;
    this.interval = null;
    this.countInterval = null;

    const p1 = room.players[0] || { id: 'p1', username: 'Runner' };
    const p2 = room.players[1] || { id: 'p2', username: 'Hunter' };

    this.state = {
      gameType: 'maze-hunters',
      width: this.width,
      height: this.height,
      player: { id: p1.id, username: p1.username, x: 80, y: 80, radius: 12, speed: 4.5, color: '#38bdf8' },
      hunter: { id: p2.id, username: p2.username, x: 720, y: 420, radius: 14, speed: 3.8, color: '#ef4444' },
      batteries: [
        { x: 200, y: 150, collected: false },
        { x: 600, y: 120, collected: false },
        { x: 380, y: 250, collected: false },
        { x: 180, y: 380, collected: false },
        { x: 650, y: 380, collected: false }
      ],
      walls: [
        { x: 30, y: 30, w: 740, h: 10 },
        { x: 30, y: 460, w: 740, h: 10 },
        { x: 30, y: 30, w: 10, h: 440 },
        { x: 760, y: 30, w: 10, h: 440 },
        { x: 140, y: 30, w: 10, h: 180 },
        { x: 140, y: 280, w: 10, h: 190 },
        { x: 260, y: 120, w: 260, h: 10 },
        { x: 260, y: 340, w: 260, h: 10 },
        { x: 500, y: 120, w: 10, h: 230 },
        { x: 640, y: 30, w: 10, h: 200 },
        { x: 640, y: 300, w: 10, h: 170 }
      ],
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = {
      [p1.id]: { up: false, down: false, left: false, right: false },
      [p2.id]: { up: false, down: false, left: false, right: false }
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
    if (socketId === this.state.player.id) this.state.winner = this.state.hunter.username;
    else this.state.winner = this.state.player.username;
    this.stop();
    this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
  }

  checkCollision(x, y, radius) {
    for (const w of this.state.walls) {
      if (x + radius > w.x && x - radius < w.x + w.w &&
          y + radius > w.y && y - radius < w.y + w.h) {
        return true;
      }
    }
    return false;
  }

  update() {
    const s = this.state;
    const inp1 = this.playerInputs[s.player.id] || {};
    const inp2 = this.playerInputs[s.hunter.id] || {};

    // Move Runner
    let dx1 = 0; let dy1 = 0;
    if (inp1.up) dy1 -= s.player.speed;
    if (inp1.down) dy1 += s.player.speed;
    if (inp1.left) dx1 -= s.player.speed;
    if (inp1.right) dx1 += s.player.speed;

    if (!this.checkCollision(s.player.x + dx1, s.player.y, s.player.radius)) s.player.x += dx1;
    if (!this.checkCollision(s.player.x, s.player.y + dy1, s.player.radius)) s.player.y += dy1;

    // Move Hunter
    let dx2 = 0; let dy2 = 0;
    if (inp2.up) dy2 -= s.hunter.speed;
    if (inp2.down) dy2 += s.hunter.speed;
    if (inp2.left) dx2 -= s.hunter.speed;
    if (inp2.right) dx2 += s.hunter.speed;

    if (!this.checkCollision(s.hunter.x + dx2, s.hunter.y, s.hunter.radius)) s.hunter.x += dx2;
    if (!this.checkCollision(s.hunter.x, s.hunter.y + dy2, s.hunter.radius)) s.hunter.y += dy2;

    // Collect batteries
    for (const b of s.batteries) {
      if (!b.collected && Math.hypot(s.player.x - b.x, s.player.y - b.y) < 22) {
        b.collected = true;
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });
      }
    }

    // Check Runner Escape
    if (s.batteries.every(b => b.collected) && Math.hypot(s.player.x - 720, s.player.y - 420) < 30) {
      s.isOver = true;
      s.winner = s.player.username;
      this.io.to(this.room.id).emit('game:over', { winner: s.winner });
      this.stop();
      return;
    }

    // Check Hunter Catch
    if (Math.hypot(s.player.x - s.hunter.x, s.player.y - s.hunter.y) < s.player.radius + s.hunter.radius) {
      s.isOver = true;
      s.winner = s.hunter.username;
      this.io.to(this.room.id).emit('game:over', { winner: s.winner });
      this.stop();
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
