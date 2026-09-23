export class CyberPongServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 800;
    this.height = 500;
    this.tickRate = 60; // 60 updates per second
    this.interval = null;

    const p1 = room.players[0] || { id: 'p1', username: 'Player 1' };
    const p2 = room.players[1] || { id: 'p2', username: 'Player 2' };

    this.state = {
      gameType: 'cyber-pong',
      width: this.width,
      height: this.height,
      scoreLimit: 7,
      isPaused: false,
      isOver: false,
      winner: null,
      countdown: 3,
      paddles: {
        [p1.id]: {
          id: p1.id,
          username: p1.username,
          side: 'left',
          x: 25,
          y: 205,
          width: 14,
          height: 90,
          baseHeight: 90,
          speed: 8,
          score: 0,
          color: p1.color || '#00f0ff',
          powerup: null,
          powerupTimer: 0
        },
        [p2.id]: {
          id: p2.id,
          username: p2.username,
          side: 'right',
          x: 761,
          y: 205,
          width: 14,
          height: 90,
          baseHeight: 90,
          speed: 8,
          score: 0,
          color: p2.color || '#ff007f',
          powerup: null,
          powerupTimer: 0
        }
      },
      balls: [
        {
          id: 'b1',
          x: 400,
          y: 250,
          vx: 6 * (Math.random() > 0.5 ? 1 : -1),
          vy: (Math.random() * 4 - 2),
          radius: 9,
          baseSpeed: 6.5,
          speed: 6.5,
          color: '#00f0ff',
          trail: []
        }
      ],
      powerups: [],
      particles: []
    };

    this.playerInputs = {
      [p1.id]: { up: false, down: false, targetY: null },
      [p2.id]: { up: false, down: false, targetY: null }
    };

    this.powerupSpawnTimer = 0;
  }

  start() {
    this.resetBall();
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
      if (!this.state.isPaused && !this.state.isOver) {
        this.update();
      }
      this.broadcastState();
    }, 1000 / this.tickRate);
  }

  handleInput(socketId, inputData) {
    if (!this.playerInputs[socketId]) {
      this.playerInputs[socketId] = {};
    }
    // Touch direct position or keyboard up/down
    if (typeof inputData.targetY === 'number') {
      this.playerInputs[socketId].targetY = inputData.targetY;
    }
    if (typeof inputData.up === 'boolean') {
      this.playerInputs[socketId].up = inputData.up;
    }
    if (typeof inputData.down === 'boolean') {
      this.playerInputs[socketId].down = inputData.down;
    }
  }

  handlePlayerDisconnect(socketId) {
    this.state.isOver = true;
    const remaining = Object.values(this.state.paddles).find(p => p.id !== socketId);
    if (remaining) {
      this.state.winner = remaining.username;
    }
    this.stop();
    this.io.to(this.room.id).emit('game:over', {
      winner: this.state.winner,
      reason: 'Opponent disconnected'
    });
  }

  resetBall(servingTowards = (Math.random() > 0.5 ? 'left' : 'right')) {
    const dir = servingTowards === 'left' ? -1 : 1;
    const angle = (Math.random() * 0.8 - 0.4); // radian angle
    const speed = 6.5;

    this.state.balls = [
      {
        id: 'b1',
        x: this.width / 2,
        y: this.height / 2,
        vx: Math.cos(angle) * speed * dir,
        vy: Math.sin(angle) * speed,
        radius: 9,
        baseSpeed: speed,
        speed: speed,
        color: '#00f0ff'
      }
    ];
  }

  update() {
    // 1. Update Paddles
    for (const [playerId, paddle] of Object.entries(this.state.paddles)) {
      const input = this.playerInputs[playerId] || {};

      // Direct target Y (smooth touch follow)
      if (input.targetY !== null && input.targetY !== undefined) {
        const center = paddle.y + paddle.height / 2;
        const diff = input.targetY - center;
        paddle.y += Math.max(-paddle.speed * 1.5, Math.min(paddle.speed * 1.5, diff * 0.25));
      } else {
        // Keyboard inputs
        if (input.up) paddle.y -= paddle.speed;
        if (input.down) paddle.y += paddle.speed;
      }

      // Keep inside bounds
      paddle.y = Math.max(10, Math.min(this.height - paddle.height - 10, paddle.y));

      // Powerup timer countdown
      if (paddle.powerupTimer > 0) {
        paddle.powerupTimer--;
        if (paddle.powerupTimer <= 0) {
          paddle.powerup = null;
          paddle.height = paddle.baseHeight;
          paddle.speed = 8;
        }
      }
    }

    // 2. Powerup Spawning
    this.powerupSpawnTimer++;
    if (this.powerupSpawnTimer > 60 * 12 && this.state.powerups.length < 2) { // Every ~12s
      this.powerupSpawnTimer = 0;
      const types = ['multi_ball', 'speed_boost', 'long_paddle', 'shield'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.state.powerups.push({
        id: `pw-${Date.now()}`,
        type: chosen,
        x: 200 + Math.random() * 400,
        y: 80 + Math.random() * (this.height - 160),
        radius: 16
      });
    }

    // 3. Update Balls
    for (let i = this.state.balls.length - 1; i >= 0; i--) {
      const ball = this.state.balls[i];

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Top and Bottom Wall Bounce
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        this.emitEvent('sound', { type: 'wall_hit' });
      } else if (ball.y + ball.radius >= this.height) {
        ball.y = this.height - ball.radius;
        ball.vy = -Math.abs(ball.vy);
        this.emitEvent('sound', { type: 'wall_hit' });
      }

      // Check Paddle Collisions
      const paddleList = Object.values(this.state.paddles);
      for (const paddle of paddleList) {
        if (
          ball.x - ball.radius < paddle.x + paddle.width &&
          ball.x + ball.radius > paddle.x &&
          ball.y + ball.radius > paddle.y &&
          ball.y - ball.radius < paddle.y + paddle.height
        ) {
          // Calculate hit offset (-0.5 top, 0 center, +0.5 bottom)
          const hitOffset = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
          const maxBounceAngle = Math.PI / 3.2; // ~56 degrees
          const bounceAngle = hitOffset * maxBounceAngle;

          // Increase ball speed on each hit
          ball.speed = Math.min(15, ball.speed + 0.35);

          const direction = paddle.side === 'left' ? 1 : -1;
          ball.vx = Math.cos(bounceAngle) * ball.speed * direction;
          ball.vy = Math.sin(bounceAngle) * ball.speed;

          // Push ball out of paddle to avoid multi-collision
          if (paddle.side === 'left') {
            ball.x = paddle.x + paddle.width + ball.radius;
          } else {
            ball.x = paddle.x - ball.radius;
          }

          this.emitEvent('impact', { x: ball.x, y: ball.y, side: paddle.side });
          this.emitEvent('sound', { type: 'paddle_hit' });
        }
      }

      // Check Powerup Collection
      for (let pIdx = this.state.powerups.length - 1; pIdx >= 0; pIdx--) {
        const pw = this.state.powerups[pIdx];
        const dist = Math.hypot(ball.x - pw.x, ball.y - pw.y);
        if (dist < ball.radius + pw.radius) {
          const collector = ball.vx > 0 ? paddleList.find(p => p.side === 'left') : paddleList.find(p => p.side === 'right');
          if (collector) {
            this.applyPowerup(collector, pw.type);
          }
          this.state.powerups.splice(pIdx, 1);
          this.emitEvent('sound', { type: 'powerup' });
        }
      }

      // Goal scoring check
      if (ball.x < 0) {
        // Right player scores
        const rightPaddle = paddleList.find(p => p.side === 'right');
        if (rightPaddle) rightPaddle.score++;
        this.emitEvent('sound', { type: 'score' });
        this.checkScoreGoal('left');
        break;
      } else if (ball.x > this.width) {
        // Left player scores
        const leftPaddle = paddleList.find(p => p.side === 'left');
        if (leftPaddle) leftPaddle.score++;
        this.emitEvent('sound', { type: 'score' });
        this.checkScoreGoal('right');
        break;
      }
    }
  }

  applyPowerup(paddle, type) {
    paddle.powerup = type;
    paddle.powerupTimer = 60 * 8; // 8 seconds

    if (type === 'long_paddle') {
      paddle.height = paddle.baseHeight * 1.6;
    } else if (type === 'speed_boost') {
      paddle.speed = 13;
    } else if (type === 'multi_ball' && this.state.balls.length < 3) {
      this.state.balls.push({
        id: `b-${Date.now()}`,
        x: this.width / 2,
        y: this.height / 2,
        vx: (Math.random() > 0.5 ? 6 : -6),
        vy: (Math.random() * 6 - 3),
        radius: 8,
        baseSpeed: 6.5,
        speed: 6.5,
        color: '#ffe600'
      });
    }
  }

  checkScoreGoal(scoredOnSide) {
    const paddles = Object.values(this.state.paddles);
    const p1 = paddles[0];
    const p2 = paddles[1];

    if (p1.score >= this.state.scoreLimit || p2.score >= this.state.scoreLimit) {
      this.state.isOver = true;
      const winner = p1.score >= this.state.scoreLimit ? p1 : p2;
      this.state.winner = winner.username;
      this.stop();
      this.io.to(this.room.id).emit('game:over', {
        winner: winner.username,
        scores: { [p1.id]: p1.score, [p2.id]: p2.score }
      });
    } else {
      this.resetBall(scoredOnSide);
    }
  }

  emitEvent(eventName, payload) {
    this.io.to(this.room.id).emit('game:event', { event: eventName, data: payload });
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
