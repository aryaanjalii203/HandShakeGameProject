export class BattleGridServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.cols = 13;
    this.rows = 9;
    this.tileSize = 50;
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    this.tickRate = 30;
    this.interval = null;

    // Build grid: 0 = empty, 1 = indestructible wall, 2 = destructible cyber crate
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
          row.push(1); // Border wall
        } else if (r % 2 === 0 && c % 2 === 0) {
          row.push(1); // Pillar wall
        } else if (Math.random() < 0.65) {
          row.push(2); // Destructible block
        } else {
          row.push(0); // Empty floor
        }
      }
      this.grid.push(row);
    }

    // Clear corners for spawns
    const spawns = [
      { r: 1, c: 1 },
      { r: this.rows - 2, c: this.cols - 2 },
      { r: 1, c: this.cols - 2 },
      { r: this.rows - 2, c: 1 }
    ];

    spawns.forEach(s => {
      this.grid[s.r][s.c] = 0;
      if (s.r + 1 < this.rows - 1) this.grid[s.r + 1][s.c] = 0;
      if (s.r - 1 > 0) this.grid[s.r - 1][s.c] = 0;
      if (s.c + 1 < this.cols - 1) this.grid[s.r][s.c + 1] = 0;
      if (s.c - 1 > 0) this.grid[s.r][s.c - 1] = 0;
    });

    const players = {};
    const inputs = {};
    room.players.forEach((p, idx) => {
      const sp = spawns[idx % spawns.length];
      players[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || '#00f0ff',
        x: sp.c * this.tileSize + this.tileSize / 2,
        y: sp.r * this.tileSize + this.tileSize / 2,
        radius: 16,
        alive: true,
        bombCount: 1,
        maxBombs: 1,
        blastRange: 2,
        speed: 4,
        score: 0
      };
      inputs[p.id] = { up: false, down: false, left: false, right: false, placeBomb: false };
    });

    this.state = {
      gameType: 'battle-grid',
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      grid: this.grid,
      players,
      bombs: [],
      explosions: [],
      powerups: [],
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
  }

  handlePlayerDisconnect(socketId) {
    if (this.state.players[socketId]) {
      this.state.players[socketId].alive = false;
      this.checkVictory();
    }
  }

  update() {
    // 1. Move players
    for (const [id, player] of Object.entries(this.state.players)) {
      if (!player.alive) continue;

      const input = this.playerInputs[id] || {};
      let dx = 0;
      let dy = 0;

      if (input.up) dy -= player.speed;
      if (input.down) dy += player.speed;
      if (input.left) dx -= player.speed;
      if (input.right) dx += player.speed;

      // Handle placing bomb
      if (input.placeBomb && player.bombCount > 0) {
        input.placeBomb = false;
        const c = Math.floor(player.x / this.tileSize);
        const r = Math.floor(player.y / this.tileSize);

        if (!this.state.bombs.some(b => b.r === r && b.c === c)) {
          player.bombCount--;
          this.state.bombs.push({
            id: `bomb-${Date.now()}-${Math.random()}`,
            r,
            c,
            ownerId: id,
            blastRange: player.blastRange,
            timer: 75 // ~2.5 seconds
          });
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'bomb_drop' } });
        }
      }

      // X Movement & Wall Collision
      const newX = player.x + dx;
      if (!this.checkWallCollision(newX, player.y, player.radius)) {
        player.x = newX;
      }
      // Y Movement & Wall Collision
      const newY = player.y + dy;
      if (!this.checkWallCollision(player.x, newY, player.radius)) {
        player.y = newY;
      }

      // Collect Powerups
      for (let i = this.state.powerups.length - 1; i >= 0; i--) {
        const pw = this.state.powerups[i];
        const pwX = pw.c * this.tileSize + this.tileSize / 2;
        const pwY = pw.r * this.tileSize + this.tileSize / 2;
        if (Math.hypot(player.x - pwX, player.y - pwY) < player.radius + 15) {
          if (pw.type === 'blast') player.blastRange++;
          if (pw.type === 'bomb') { player.maxBombs++; player.bombCount++; }
          if (pw.type === 'speed') player.speed = Math.min(7, player.speed + 0.8);
          this.state.powerups.splice(i, 1);
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });
        }
      }
    }

    // 2. Update Bombs & Explosions
    for (let i = this.state.bombs.length - 1; i >= 0; i--) {
      const bomb = this.state.bombs[i];
      bomb.timer--;

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb);
        const owner = this.state.players[bomb.ownerId];
        if (owner) owner.bombCount = Math.min(owner.maxBombs, owner.bombCount + 1);
        this.state.bombs.splice(i, 1);
      }
    }

    // 3. Update active explosions
    for (let i = this.state.explosions.length - 1; i >= 0; i--) {
      const exp = this.state.explosions[i];
      exp.timer--;

      // Check player hits
      for (const player of Object.values(this.state.players)) {
        if (!player.alive) continue;
        const pC = Math.floor(player.x / this.tileSize);
        const pR = Math.floor(player.y / this.tileSize);
        if (exp.tiles.some(t => t.r === pR && t.c === pC)) {
          player.alive = false;
          this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'player_death' } });
          this.checkVictory();
        }
      }

      if (exp.timer <= 0) {
        this.state.explosions.splice(i, 1);
      }
    }
  }

  explodeBomb(bomb) {
    const tiles = [{ r: bomb.r, c: bomb.c }];
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    for (const dir of directions) {
      for (let step = 1; step <= bomb.blastRange; step++) {
        const nr = bomb.r + dir.dr * step;
        const nc = bomb.c + dir.dc * step;

        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) break;
        if (this.state.grid[nr][nc] === 1) break; // Hits metal wall

        tiles.push({ r: nr, c: nc });

        if (this.state.grid[nr][nc] === 2) {
          // Destroy crate
          this.state.grid[nr][nc] = 0;
          if (Math.random() < 0.4) {
            const types = ['blast', 'bomb', 'speed'];
            this.state.powerups.push({
              r: nr,
              c: nc,
              type: types[Math.floor(Math.random() * types.length)]
            });
          }
          break;
        }
      }
    }

    this.state.explosions.push({
      id: `exp-${Date.now()}`,
      tiles,
      timer: 15 // ~0.5 second duration
    });
    this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'explosion' } });
  }

  checkWallCollision(x, y, radius) {
    const minC = Math.floor((x - radius) / this.tileSize);
    const maxC = Math.floor((x + radius) / this.tileSize);
    const minR = Math.floor((y - radius) / this.tileSize);
    const maxR = Math.floor((y + radius) / this.tileSize);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
        if (this.state.grid[r][c] !== 0) return true;
      }
    }
    return false;
  }

  checkVictory() {
    const alive = Object.values(this.state.players).filter(p => p.alive);
    if (alive.length <= 1) {
      this.state.isOver = true;
      const winner = alive.length === 1 ? alive[0].username : 'Draw!';
      this.state.winner = winner;
      this.io.to(this.room.id).emit('game:over', { winner });
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
