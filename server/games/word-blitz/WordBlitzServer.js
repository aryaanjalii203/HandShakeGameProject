export class WordBlitzServer {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.tickRate = 10;
    this.interval = null;
    this.countInterval = null;

    const players = {};
    room.players.forEach(p => {
      players[p.id] = {
        id: p.id,
        username: p.username,
        score: 0,
        streak: 0,
        solvedWords: []
      };
    });

    this.wordSets = [
      { target: 'CYBER', letters: ['C', 'Y', 'B', 'E', 'R', 'S', 'P'] },
      { target: 'PULSE', letters: ['P', 'U', 'L', 'S', 'E', 'O', 'N'] },
      { target: 'LASER', letters: ['L', 'A', 'S', 'E', 'R', 'T', 'Z'] },
      { target: 'NEONS', letters: ['N', 'E', 'O', 'N', 'S', 'X', 'I'] }
    ];

    this.state = {
      gameType: 'word-blitz',
      players,
      currentSetIdx: 0,
      currentSet: this.wordSets[0],
      timeLeft: 60,
      countdown: 3,
      isOver: false,
      winner: null
    };

    this.secondTick = 0;
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
    const player = this.state.players[socketId];
    if (!player || this.state.isOver) return;

    if (inputData.submitWord && typeof inputData.submitWord === 'string') {
      const word = inputData.submitWord.toUpperCase().trim();
      if (word.length >= 3 && !player.solvedWords.includes(word)) {
        player.solvedWords.push(word);
        player.streak++;
        const pts = word.length * 100 + player.streak * 50;
        player.score += pts;
        this.io.to(this.room.id).emit('game:event', { event: 'sound', data: { type: 'powerup' } });

        if (word === this.state.currentSet.target) {
          this.state.currentSetIdx = (this.state.currentSetIdx + 1) % this.wordSets.length;
          this.state.currentSet = this.wordSets[this.state.currentSetIdx];
        }
      }
    }
  }

  handlePlayerDisconnect(socketId) {
    if (this.state.players[socketId]) {
      delete this.state.players[socketId];
      if (Object.keys(this.state.players).length <= 1) {
        this.finishGame();
      }
    }
  }

  update() {
    this.secondTick++;
    if (this.secondTick >= this.tickRate) {
      this.secondTick = 0;
      this.state.timeLeft--;
      if (this.state.timeLeft <= 0) {
        this.finishGame();
      }
    }
  }

  finishGame() {
    this.state.isOver = true;
    const sorted = Object.values(this.state.players).sort((a, b) => b.score - a.score);
    this.state.winner = sorted[0]?.username || 'Draw';
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
