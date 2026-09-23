export class SurvivalArenaServer {
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

    // Spawn players evenly around the top/bottom quadrants away from the horizontal start beam
    const spawnOffsets = [
      { x: 400, y: 110 },
      { x: 400, y: 390 },
      { x: 300, y: 140 },
      { x: 500, y: 140 }
    ];

    room.players.forEach((p, i) => {
      const pos = spawnOffsets[i % spawnOffsets.length];
      players[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || '#00f0ff',
        x: pos.x,
        y: pos.y,
        radius: 13,
        speed: 5.5,
        alive: true,
        survivalTime: 0
      };
      inputs[p.id] = { up: false, down: false, left: false, right: false };
    });

    this.state = {
      gameType: 'survival-arena',
      width: this.width,
      height: this.height,
      players,
      beamAngle: 0,
      beamSpeed: 0.010,
      hazards: [],
      spawnTimer: 0,
      countdown: 3,
      invulnerableTicks: 60, // 2s at 30Hz
      isOver: false,
      winner: null
    };

    this.playerInputs = inputs;
    this.elapsedTicks = 0;
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
      this.state.players[socketId].alive = false;
      this.checkEnd();
    }
  }

  update() {
    this.elapsedTicks++;
    if (this.state.invulnerableTicks > 0) {
      this.state.invulnerableTicks--;
    }

    // 1. Move players
    for (const [id, p] of Object.entries(this.state.players)) {
      if (!p.alive) continue;
      const inp = this.playerInputs[id] || {};
      if (inp.up) p.y -= p.speed;
      if (inp.down) p.y += p.speed;
      if (inp.left) p.x -= p.speed;
      if (inp.right) p.x += p.speed;

      // Keep inside Arena circular boundary
      const distFromCenter = Math.hypot(p.x - 400, p.y - 250);
      const maxRadius = 210;
      if (distFromCenter > maxRadius - p.radius) {
        const angle = Math.atan2(p.y - 250, p.x - 400);
        p.x = 400 + Math.cos(angle) * (maxRadius - p.radius);
        p.y = 250 + Math.sin(angle) * (maxRadius - p.radius);
      }
    }

    // 2. Rotate Laser Sweeper Beam (gentle 0.010 rad / tick)
    this.state.beamSpeed = 0.010 + Math.min(0.020, this.elapsedTicks * 0.00003);
    this.state.beamAngle += this.state.beamSpeed;

    // 3. Spawn hazards (dodgeable speeds)
    this.state.spawnTimer++;
    const spawnInterval = Math.max(30, 60 - Math.floor(this.elapsedTicks / 150));
    if (this.state.spawnTimer > spawnInterval) {
      this.state.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 1.5;
      this.state.hazards.push({
        x: 400 + Math.cos(angle) * 320,
        y: 250 + Math.sin(angle) * 320,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        radius: 9
      });
    }

    // 4. Update Hazards & Check Hits
    for (let i = this.state.hazards.length - 1; i >= 0; i--) {
      const h = this.state.hazards[i];
      h.x += h.vx;
      h.y += h.vy;

      if (this.state.invulnerableTicks <= 0) {
        for (const p of Object.values(this.state.players)) {
          if (!p.alive) continue;
          if (Math.hypot(p.x - h.x, p.y - h.y) < p.radius + h.radius) {
            p.alive = false;
            this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'player_death' } });
            this.checkEnd();
          }
        }
      }

      if (h.x < -40 || h.x > this.width + 40 || h.y < -40 || h.y > this.height + 40) {
        this.state.hazards.splice(i, 1);
      }
    }

    // 5. Check Laser Beam Line Collision
    if (this.state.invulnerableTicks <= 0) {
      const beamLen = 330;
      const beamX1 = 400 + Math.cos(this.state.beamAngle) * beamLen;
      const beamY1 = 250 + Math.sin(this.state.beamAngle) * beamLen;
      const beamX2 = 400 - Math.cos(this.state.beamAngle) * beamLen;
      const beamY2 = 250 - Math.sin(this.state.beamAngle) * beamLen;

      const l2 = (beamLen * 2) * (beamLen * 2);
      for (const p of Object.values(this.state.players)) {
        if (!p.alive) continue;
        const t = Math.max(0, Math.min(1, ((p.x - beamX2) * (beamX1 - beamX2) + (p.y - beamY2) * (beamY1 - beamY2)) / l2));
        const projX = beamX2 + t * (beamX1 - beamX2);
        const projY = beamY2 + t * (beamY1 - beamY2);
        if (Math.hypot(p.x - projX, p.y - projY) < p.radius + 5) {
          p.alive = false;
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'player_death' } });
          this.checkEnd();
        }
      }
    }
  }

  checkEnd() {
    const alive = Object.values(this.state.players).filter(p => p.alive);
    if (alive.length <= 1) {
      this.state.isOver = true;
      this.state.winner = alive.length === 1 ? alive[0].username : 'Laser Overload';
      this.io.to(this.room.id).emit('game:over', { winner: this.state.winner });
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
