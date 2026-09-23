import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { SOCKET_EVENTS, ROOM_STATUS } from '../shared/constants.js';
import { RoomManager } from './rooms/RoomManager.js';
import { Matchmaker } from './matchmaking/Matchmaker.js';
import { getLocalIPAddress } from './utils/network.js';

// 15 Server Game Engines
import { CyberPongServer } from './games/cyber-pong/CyberPongServer.js';
import { NeonDriftServer } from './games/neon-drift/NeonDriftServer.js';
import { BattleGridServer } from './games/battle-grid/BattleGridServer.js';
import { SpaceRaidersServer } from './games/space-raiders/SpaceRaidersServer.js';
import { ColorClashServer } from './games/color-clash/ColorClashServer.js';
import { TankArenaServer } from './games/tank-arena/TankArenaServer.js';
import { PixelSoccerServer } from './games/pixel-soccer/PixelSoccerServer.js';
import { SurvivalArenaServer } from './games/survival-arena/SurvivalArenaServer.js';
import { MazeHuntersServer } from './games/maze-hunters/MazeHuntersServer.js';
import { TreasureRushServer } from './games/treasure-rush/TreasureRushServer.js';
import { WordBlitzServer } from './games/word-blitz/WordBlitzServer.js';
import { MiniGolfServer } from './games/mini-golf/MiniGolfServer.js';
import { MemoryWarsServer } from './games/memory-wars/MemoryWarsServer.js';
import { TowerDefendersServer } from './games/tower-defenders/TowerDefendersServer.js';
import { QuickDrawServer } from './games/quick-draw/QuickDrawServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// CORS setup for multi-device support
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50kb' }));

// Serve static frontend in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6
});

const roomManager = new RoomManager();
const matchmaker = new Matchmaker(roomManager, io);
const localIP = getLocalIPAddress();

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    activeRooms: roomManager.rooms.size,
    localIP,
    port: PORT,
    timestamp: Date.now()
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(roomManager.getAllRoomsDTO());
});

// Helper factory to instantiate authoritative game engines
function createGameEngine(room, ioInstance) {
  switch (room.gameType) {
    case 'cyber-pong':
      return new CyberPongServer(room, ioInstance);
    case 'neon-drift':
      return new NeonDriftServer(room, ioInstance);
    case 'battle-grid':
      return new BattleGridServer(room, ioInstance);
    case 'space-raiders':
      return new SpaceRaidersServer(room, ioInstance);
    case 'color-clash':
      return new ColorClashServer(room, ioInstance);
    case 'tank-arena':
      return new TankArenaServer(room, ioInstance);
    case 'pixel-soccer':
      return new PixelSoccerServer(room, ioInstance);
    case 'survival-arena':
      return new SurvivalArenaServer(room, ioInstance);
    case 'maze-hunters':
      return new MazeHuntersServer(room, ioInstance);
    case 'treasure-rush':
      return new TreasureRushServer(room, ioInstance);
    case 'word-blitz':
      return new WordBlitzServer(room, ioInstance);
    case 'mini-golf-chaos':
      return new MiniGolfServer(room, ioInstance);
    case 'memory-wars':
      return new MemoryWarsServer(room, ioInstance);
    case 'tower-defenders':
      return new TowerDefendersServer(room, ioInstance);
    case 'quick-draw':
      return new QuickDrawServer(room, ioInstance);
    default:
      return new CyberPongServer(room, ioInstance);
  }
}

// Socket connection & lifecycle with crash-proof validation
io.on('connection', (socket) => {
  // Latency Diagnostic Ping
  socket.on(SOCKET_EVENTS.PING, (timestamp) => {
    try {
      socket.emit(SOCKET_EVENTS.PONG, timestamp || Date.now());
    } catch (e) {
      console.error('Error on ping:', e);
    }
  });

  // 1. Create Room (Safe parsing)
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload) => {
    try {
      const data = payload && typeof payload === 'object' ? payload : {};
      const username = String(data.username || 'HostPilot').slice(0, 16);
      const gameType = String(data.gameType || 'cyber-pong').slice(0, 30);
      const maxPlayers = Math.max(2, Math.min(4, parseInt(data.maxPlayers, 10) || 2));

      const room = roomManager.createRoom(socket.id, username, gameType, maxPlayers);
      socket.join(room.id);
      socket.emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Failed to create room.' });
    }
  });

  // 2. Join Room (Safe parsing)
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload) => {
    try {
      const data = payload && typeof payload === 'object' ? payload : {};
      const roomId = String(data.roomId || '').trim().toUpperCase().slice(0, 8);
      const username = String(data.username || 'Challenger').slice(0, 16);

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Invalid room code provided.' });
        return;
      }

      const result = roomManager.joinRoom(roomId, socket.id, username);
      if (!result.success) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: result.error });
        return;
      }
      const room = result.room;
      socket.join(room.id);
      io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
    } catch (err) {
      console.error('Error joining room:', err);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Failed to join room.' });
    }
  });

  // 3. Toggle Ready
  socket.on(SOCKET_EVENTS.TOGGLE_READY, () => {
    try {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room) {
        room.toggleReady(socket.id);
        io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
      }
    } catch (err) {
      console.error('Error in toggle ready:', err);
    }
  });

  // 4. Change Game Type (Host only)
  socket.on(SOCKET_EVENTS.SELECT_GAME, (payload) => {
    try {
      const data = payload && typeof payload === 'object' ? payload : {};
      const gameType = String(data.gameType || 'cyber-pong').slice(0, 30);
      const maxPlayers = Math.max(2, Math.min(4, parseInt(data.maxPlayers, 10) || 2));

      const room = roomManager.getRoomByPlayer(socket.id);
      if (room && room.hostId === socket.id && room.status !== ROOM_STATUS.PLAYING) {
        room.setGameType(gameType, maxPlayers);
        io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
      }
    } catch (err) {
      console.error('Error in select game:', err);
    }
  });

  // 5. In-Room Chat (Sanitized and truncated)
  socket.on(SOCKET_EVENTS.SEND_CHAT, (payload) => {
    try {
      const data = payload && typeof payload === 'object' ? payload : {};
      const text = String(data.text || '').trim();
      if (!text) return;

      const room = roomManager.getRoomByPlayer(socket.id);
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        const sender = player ? player.username : 'Unknown';
        const msg = room.addMessage(sender, text);
        io.to(room.id).emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
      }
    } catch (err) {
      console.error('Error in send chat:', err);
    }
  });

  // 6. Start Game (Host only)
  socket.on(SOCKET_EVENTS.START_GAME, () => {
    try {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (!room || room.hostId !== socket.id) return;

      if (room.players.length < 2) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Need at least 2 players in room to start.' });
        return;
      }

      room.status = ROOM_STATUS.PLAYING;
      if (room.gameInstance) {
        room.gameInstance.stop();
      }

      room.gameInstance = createGameEngine(room, io);
      io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
      room.gameInstance.start();
    } catch (err) {
      console.error('Error starting game:', err);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Could not launch game engine.' });
    }
  });

  // 7. Real-Time Player Input
  socket.on(SOCKET_EVENTS.PLAYER_INPUT, (inputData) => {
    try {
      if (!inputData || typeof inputData !== 'object') return;
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room && room.gameInstance) {
        room.gameInstance.handleInput(socket.id, inputData);
      }
    } catch (err) {
      console.error('Error handling player input:', err);
    }
  });

  // 8. Restart Game (Host only)
  socket.on(SOCKET_EVENTS.RESTART_GAME, () => {
    try {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room && room.hostId === socket.id) {
        if (room.gameInstance) {
          room.gameInstance.stop();
        }
        room.status = ROOM_STATUS.PLAYING;
        room.gameInstance = createGameEngine(room, io);
        io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
        room.gameInstance.start();
      }
    } catch (err) {
      console.error('Error restarting game:', err);
    }
  });

  // 9. Leave Room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
    try {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.roomId);
        if (!result.destroyed && result.room) {
          io.to(result.roomId).emit(SOCKET_EVENTS.ROOM_STATE, result.room.toDTO());
        }
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  });

  // 10. Quick Matchmaking Queue
  socket.on(SOCKET_EVENTS.JOIN_QUEUE, (payload) => {
    try {
      const data = payload && typeof payload === 'object' ? payload : {};
      const username = String(data.username || 'Player').slice(0, 16);
      const gameType = String(data.gameType || 'cyber-pong').slice(0, 30);
      matchmaker.addToQueue(socket.id, username, gameType);
    } catch (err) {
      console.error('Error joining queue:', err);
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
    try {
      matchmaker.removeFromQueue(socket.id);
    } catch (err) {
      console.error('Error leaving queue:', err);
    }
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    try {
      matchmaker.removeFromQueue(socket.id);
      const result = roomManager.leaveRoom(socket.id);
      if (result && !result.destroyed && result.room) {
        io.to(result.roomId).emit(SOCKET_EVENTS.ROOM_STATE, result.room.toDTO());
      }
    } catch (err) {
      console.error('Error on disconnect:', err);
    }
  });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('PLAYFORGE Server Online. Launching client...');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎮 PLAYFORGE Multiplayer Server Online`);
  console.log(`📡 Local Access:       http://localhost:${PORT}`);
  console.log(`🌐 Network / Phone:    http://${localIP}:${PORT}`);
  console.log(`⚡ WebSocket Engine:   Authoritative 60Hz Ready (15 Arenas)`);
  console.log(`======================================================\n`);
});
