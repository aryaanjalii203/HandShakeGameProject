export class NeonDriftServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.width = 900;
    this.height = 600;
    this.tickRate = 45;
    this.interval = null;

    // Track definition with checkpoints
    this.checkpoints = [
      { id: 0, x: 150, y: 120, radius: 80 },
      { id: 1, x: 750, y: 120, radius: 80 },
      { id: 2, x: 750, y: 480, radius: 80 },
      { id: 3, x: 150, y: 480, radius: 80 }
    ];

    this.boostPads = [
      { x: 450, y: 100, width: 60, height: 40 },
      { x: 450, y: 500, width: 60, height: 40 }
    ];

    const cars = {};
    const inputs = {};
    room.players.forEach((p, idx) => {
      cars[p.id] = {
        id: p.id,
        username: p.username,
        color: p.color || '#00f0ff',
        x: 180,
        y: 480 + idx * 35,
        angle: 0, // facing right
        speed: 0,
        maxSpeed: 7.5,
        drift: 0,
        lap: 1,
        totalLaps: 3,
        currentCheckpoint: 0,
        boostTimer: 0,
        finished: false,
        finishTime: null
      };
      inputs[p.id] = { forward: false, reverse: false, left: false, right: false, drift: false };
    });

    this.state = {
      gameType: 'neon-drift',
      width: this.width,
      height: this.height,
      countdown: 3,
      isOver: false,
      winner: null,
      cars,
      boostPads: this.boostPads,
      startTime: null
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
        this.state.startTime = Date.now();
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
    if (this.state.cars[socketId]) {
      delete this.state.cars[socketId];
    }
  }

  update() {
    for (const [id, car] of Object.entries(this.state.cars)) {
      if (car.finished) continue;

      const input = this.playerInputs[id] || {};
      const accel = 0.25;
      const turnSpeed = car.boostTimer > 0 ? 0.05 : 0.065;
      const friction = 0.96;

      // Steering
      if (input.left) car.angle -= turnSpeed;
      if (input.right) car.angle += turnSpeed;

      // Acceleration
      if (input.forward) {
        const top = car.boostTimer > 0 ? car.maxSpeed * 1.5 : car.maxSpeed;
        car.speed = Math.min(top, car.speed + accel);
      } else if (input.reverse) {
        car.speed = Math.max(-2.5, car.speed - accel * 0.7);
      } else {
        car.speed *= friction;
      }

      // Boost pad check
      if (car.boostTimer > 0) {
        car.boostTimer--;
      } else {
        for (const pad of this.boostPads) {
          if (
            car.x > pad.x && car.x < pad.x + pad.width &&
            car.y > pad.y && car.y < pad.y + pad.height
          ) {
            car.boostTimer = 60;
            car.speed = car.maxSpeed * 1.5;
            this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'boost' } });
          }
        }
      }

      // Movement
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // Keep within outer canvas bounds
      car.x = Math.max(30, Math.min(this.width - 30, car.x));
      car.y = Math.max(30, Math.min(this.height - 30, car.y));

      // Checkpoint tracking
      const targetCp = this.checkpoints[car.currentCheckpoint];
      const dist = Math.hypot(car.x - targetCp.x, car.y - targetCp.y);
      if (dist < targetCp.radius) {
        car.currentCheckpoint = (car.currentCheckpoint + 1) % this.checkpoints.length;
        if (car.currentCheckpoint === 0) {
          car.lap++;
          if (car.lap > car.totalLaps) {
            car.finished = true;
            car.finishTime = ((Date.now() - this.state.startTime) / 1000).toFixed(2);
            if (!this.state.winner) {
              this.state.winner = car.username;
              this.state.isOver = true;
              this.io.to(this.room.id).emit('game:over', {
                winner: car.username,
                time: car.finishTime
              });
              this.stop();
            }
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
