export class SpaceRaidersServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 600;
    this.tickRate = 45;
    this.interval = null;

    const players = {};
    const inputs = {};
    room.players.forEach((p, idx) => {
      players[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || '#00f0ff',
        x: 250 + idx * 300,
        y: 530,
        width: 32,
        height: 28,
        speed: 6,
        score: 0,
        lives: 3,
        shootCooldown: 0,
        powerupTimer: 0
      };
      inputs[p.id] = { left: false, right: false, up: false, down: false, shoot: false };
    });

    this.state = {
      gameType: 'space-raiders',
      width: this.width,
      height: this.height,
      players,
      lasers: [],
      alienLasers: [],
      aliens: [],
      wave: 1,
      alienDirection: 1,
      alienStepTimer: 0,
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = inputs;
    this.spawnWave(1);
  }

  spawnWave(waveNum) {
    this.state.aliens = [];
    const rows = 4;
    const cols = 8;
    const startX = 100;
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.state.aliens.push({
          id: `alien-${r}-${c}`,
          x: startX + c * 70,
          y: startY + r * 50,
          width: 32,
          height: 24,
          type: r === 0 ? 'elite' : r === 1 ? 'medium' : 'scout',
          hp: r === 0 ? 2 : 1,
          points: (rows - r) * 100
        });
      }
    }
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
      this.state.players[socketId].lives = 0;
    }
  }

  update() {
    // 1. Update Players
    for (const [id, player] of Object.entries(this.state.players)) {
      if (player.lives <= 0) continue;

      const input = this.playerInputs[id] || {};
      if (input.left) player.x = Math.max(30, player.x - player.speed);
      if (input.right) player.x = Math.min(this.width - 30, player.x + player.speed);
      if (input.up) player.y = Math.max(350, player.y - player.speed);
      if (input.down) player.y = Math.min(this.height - 30, player.y + player.speed);

      if (player.shootCooldown > 0) player.shootCooldown--;

      // Shoot
      if (input.shoot && player.shootCooldown === 0) {
        player.shootCooldown = 12; // rate of fire
        this.state.lasers.push({
          id: `lz-${Date.now()}-${Math.random()}`,
          playerId: id,
          x: player.x,
          y: player.y - 15,
          vy: -11,
          color: player.color
        });
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'laser' } });
      }
    }

    // 2. Update Player Lasers
    for (let lIdx = this.state.lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = this.state.lasers[lIdx];
      laser.y += laser.vy;

      // Check hit with aliens
      let hit = false;
      for (let aIdx = this.state.aliens.length - 1; aIdx >= 0; aIdx--) {
        const alien = this.state.aliens[aIdx];
        if (
          laser.x > alien.x - alien.width / 2 &&
          laser.x < alien.x + alien.width / 2 &&
          laser.y > alien.y - alien.height / 2 &&
          laser.y < alien.y + alien.height / 2
        ) {
          alien.hp--;
          hit = true;
          if (alien.hp <= 0) {
            const player = this.state.players[laser.playerId];
            if (player) player.score += alien.points;
            this.state.aliens.splice(aIdx, 1);
            this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'alien_kill' } });
          }
          break;
        }
      }

      if (hit || laser.y < 0) {
        this.state.lasers.splice(lIdx, 1);
      }
    }

    // 3. Move Aliens
    this.state.alienStepTimer++;
    if (this.state.alienStepTimer > Math.max(10, 30 - this.state.wave * 3)) {
      this.state.alienStepTimer = 0;

      let edgeReached = false;
      for (const alien of this.state.aliens) {
        alien.x += this.state.alienDirection * 15;
        if (alien.x < 40 || alien.x > this.width - 40) {
          edgeReached = true;
        }
      }

      if (edgeReached) {
        this.state.alienDirection *= -1;
        for (const alien of this.state.aliens) {
          alien.y += 18;
          if (alien.y >= 500) {
            // Aliens reached base
            this.endGame();
            return;
          }
        }
      }

      // Random alien shooting
      if (this.state.aliens.length > 0 && Math.random() < 0.45) {
        const shooter = this.state.aliens[Math.floor(Math.random() * this.state.aliens.length)];
        this.state.alienLasers.push({
          x: shooter.x,
          y: shooter.y + 15,
          vy: 5.5
        });
      }
    }

    // 4. Update Alien Lasers & Check Player Collisions
    for (let alIdx = this.state.alienLasers.length - 1; alIdx >= 0; alIdx--) {
      const aLaser = this.state.alienLasers[alIdx];
      aLaser.y += aLaser.vy;

      let hit = false;
      for (const player of Object.values(this.state.players)) {
        if (player.lives <= 0) continue;
        if (
          aLaser.x > player.x - player.width / 2 &&
          aLaser.x < player.x + player.width / 2 &&
          aLaser.y > player.y - player.height / 2 &&
          aLaser.y < player.y + player.height / 2
        ) {
          player.lives--;
          hit = true;
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'player_hit' } });
          if (Object.values(this.state.players).every(p => p.lives <= 0)) {
            this.endGame();
            return;
          }
          break;
        }
      }

      if (hit || aLaser.y > this.height) {
        this.state.alienLasers.splice(alIdx, 1);
      }
    }

    // 5. Check Wave Clear
    if (this.state.aliens.length === 0) {
      this.state.wave++;
      this.spawnWave(this.state.wave);
      this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'wave_clear' } });
    }
  }

  endGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.players).sort((a, b) => b.score - a.score);
    this.state.winner = sorted[0]?.username || 'Aliens';
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
