export class ColorClashServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.cols = 24;
    this.rows = 16;
    this.tileSize = 30;
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;
    this.tickRate = 30;
    this.interval = null;

    // Grid representing tile owner (-1 = unpainted, 0,1,2,3 = player index)
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(-1));

    const players = {};
    const inputs = {};
    const spawns = [
      { x: 3, y: 3 },
      { x: this.cols - 4, y: this.rows - 4 },
      { x: this.cols - 4, y: 3 },
      { x: 3, y: this.rows - 4 }
    ];

    room.players.forEach((p, idx) => {
      const sp = spawns[idx % spawns.length];
      players[p.id] = {
        id: p.id,
        playerIndex: idx,
        username: p.username,
        color: p.color || '#00f0ff',
        x: sp.x * this.tileSize + this.tileSize / 2,
        y: sp.y * this.tileSize + this.tileSize / 2,
        radius: 12,
        speed: 5.5,
        dashCooldown: 0,
        dashTimer: 0,
        tileCount: 0
      };
      inputs[p.id] = { up: false, down: false, left: false, right: false, dash: false };

      // Paint initial tile
      this.grid[sp.y][sp.x] = idx;
    });

    this.state = {
      gameType: 'color-clash',
      width: this.width,
      height: this.height,
      cols: this.cols,
      rows: this.rows,
      tileSize: this.tileSize,
      grid: this.grid,
      players,
      timeLeft: 60,
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.playerInputs = inputs;
    this.secondTimer = 0;
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
    delete this.state.players[socketId];
  }

  update() {
    // 1. Update Match Timer
    this.secondTimer++;
    if (this.secondTimer >= this.tickRate) {
      this.secondTimer = 0;
      this.state.timeLeft--;
      if (this.state.timeLeft <= 0) {
        this.finishGame();
        return;
      }
    }

    // 2. Move Players & Paint Ground
    const tileCounts = {};
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const owner = this.grid[r][c];
        if (owner !== -1) {
          tileCounts[owner] = (tileCounts[owner] || 0) + 1;
        }
      }
    }

    for (const [id, player] of Object.entries(this.state.players)) {
      const input = this.playerInputs[id] || {};
      let moveSpeed = player.speed;

      if (player.dashCooldown > 0) player.dashCooldown--;
      if (player.dashTimer > 0) {
        player.dashTimer--;
        moveSpeed *= 2.0;
      }

      if (input.dash && player.dashCooldown === 0) {
        player.dashTimer = 10;
        player.dashCooldown = 60; // 2 sec cooldown
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'dash' } });
      }

      let dx = 0;
      let dy = 0;
      if (input.up) dy -= moveSpeed;
      if (input.down) dy += moveSpeed;
      if (input.left) dx -= moveSpeed;
      if (input.right) dx += moveSpeed;

      // Diagonal normalization
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.x = Math.max(player.radius, Math.min(this.width - player.radius, player.x + dx));
      player.y = Math.max(player.radius, Math.min(this.height - player.radius, player.y + dy));

      // Paint current cell
      const c = Math.floor(player.x / this.tileSize);
      const r = Math.floor(player.y / this.tileSize);

      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.grid[r][c] = player.playerIndex;
        // If dashing, paint adjacent tiles too
        if (player.dashTimer > 0) {
          if (r > 0) this.grid[r - 1][c] = player.playerIndex;
          if (r < this.rows - 1) this.grid[r + 1][c] = player.playerIndex;
          if (c > 0) this.grid[r][c - 1] = player.playerIndex;
          if (c < this.cols - 1) this.grid[r][c + 1] = player.playerIndex;
        }
      }

      player.tileCount = tileCounts[player.playerIndex] || 0;
    }
  }

  finishGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.players).sort((a, b) => b.tileCount - a.tileCount);
    const winner = sorted[0]?.username || 'Tie';
    this.state.winner = winner;
    this.io.to(this.room.id).emit('game:over', {
      winner,
      results: sorted.map(p => ({ username: p.username, tiles: p.tileCount }))
    });
    this.stop();
  }

  broadcastState() {
    this.io.to(this.room.id).emit('game:state', this.state);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
