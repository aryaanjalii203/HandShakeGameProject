export class TowerDefendersServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 30;
    this.interval = null;
    this.countInterval = null;

    this.path = [
      { x: 0, y: 240 },
      { x: 260, y: 240 },
      { x: 260, y: 100 },
      { x: 540, y: 100 },
      { x: 540, y: 380 },
      { x: 800, y: 380 }
    ];

    this.state = {
      gameType: 'tower-defenders',
      credits: 300,
      wave: 1,
      baseHp: 100,
      turrets: [
        { id: 't-1', x: 180, y: 150, range: 140, damage: 15, cooldown: 0 },
        { id: 't-2', x: 420, y: 350, range: 140, damage: 15, cooldown: 0 }
      ],
      enemies: [],
      lasers: [],
      spawnTimer: 0,
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
    if (inputData.buildTurret) {
      const { x, y } = inputData.buildTurret;
      if (this.state.credits >= 100) {
        this.state.credits -= 100;
        this.state.turrets.push({
          id: `t-${Date.now()}`,
          x,
          y,
          range: 140,
          damage: 18,
          cooldown: 0
        });
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });
      }
    }
  }

  handlePlayerDisconnect() {
    // Co-op mode continues if at least 1 player remains
  }

  update() {
    const s = this.state;

    // Spawn enemies
    s.spawnTimer++;
    if (s.spawnTimer > Math.max(25, 60 - s.wave * 4)) {
      s.spawnTimer = 0;
      s.enemies.push({
        id: `en-${Date.now()}-${Math.random()}`,
        x: this.path[0].x,
        y: this.path[0].y,
        pathIdx: 0,
        hp: 40 + s.wave * 15,
        maxHp: 40 + s.wave * 15,
        speed: 1.8 + s.wave * 0.2
      });
    }

    // Move enemies along waypoints
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const en = s.enemies[i];
      const target = this.path[en.pathIdx + 1];
      if (!target) {
        s.enemies.splice(i, 1);
        s.baseHp = Math.max(0, s.baseHp - 15);
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'explosion' } });
        if (s.baseHp <= 0) {
          s.isOver = true;
          s.winner = 'Drones Overran Base';
          this.io.to(this.room.id).emit('game:over', { winner: s.winner, survivedWaves: s.wave });
          this.stop();
          return;
        }
        continue;
      }

      const angle = Math.atan2(target.y - en.y, target.x - en.x);
      en.x += Math.cos(angle) * en.speed;
      en.y += Math.sin(angle) * en.speed;

      if (Math.hypot(en.x - target.x, en.y - target.y) < 6) {
        en.pathIdx++;
      }
    }

    // Turrets shoot
    s.lasers = [];
    for (const t of s.turrets) {
      if (t.cooldown > 0) t.cooldown--;
      if (t.cooldown === 0) {
        const target = s.enemies.find(en => Math.hypot(en.x - t.x, en.y - t.y) < t.range);
        if (target) {
          t.cooldown = 18;
          target.hp -= t.damage;
          s.lasers.push({ x1: t.x, y1: t.y, x2: target.x, y2: target.y });
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'laser' } });

          if (target.hp <= 0) {
            const idx = s.enemies.indexOf(target);
            if (idx !== -1) s.enemies.splice(idx, 1);
            s.credits += 35;
          }
        }
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
