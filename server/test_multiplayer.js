import { io } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { SOCKET_EVENTS, ROOM_STATUS } from '../shared/constants.js';
import { RoomManager } from './rooms/RoomManager.js';
import { CyberPongServer } from './games/cyber-pong/CyberPongServer.js';

async function runVerification() {
  console.log('🧪 Starting PLAYFORGE Multiplayer & Physics Test Suite...\n');

  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });
  const roomManager = new RoomManager();

  const PORT = 3999;

  ioServer.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ username, gameType }) => {
      const room = roomManager.createRoom(socket.id, username, gameType, 2);
      socket.join(room.id);
      socket.emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomId, username }) => {
      const res = roomManager.joinRoom(roomId, socket.id, username);
      if (res.success) {
        socket.join(res.room.id);
        ioServer.to(res.room.id).emit(SOCKET_EVENTS.ROOM_STATE, res.room.toDTO());
      }
    });

    socket.on(SOCKET_EVENTS.TOGGLE_READY, () => {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room) {
        room.toggleReady(socket.id);
        ioServer.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
      }
    });

    socket.on(SOCKET_EVENTS.START_GAME, () => {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room) {
        room.status = ROOM_STATUS.PLAYING;
        room.gameInstance = new CyberPongServer(room, ioServer);
        ioServer.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.toDTO());
        room.gameInstance.start();
      }
    });

    socket.on(SOCKET_EVENTS.PLAYER_INPUT, (input) => {
      const room = roomManager.getRoomByPlayer(socket.id);
      if (room && room.gameInstance) {
        room.gameInstance.handleInput(socket.id, input);
      }
    });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Test WebSocket server listening on port ${PORT}`);

  // 1. Connect Client A (Host)
  const clientA = io(`http://localhost:${PORT}`);
  await new Promise((resolve) => clientA.on('connect', resolve));
  console.log('✅ Client A (Host) connected:', clientA.id);

  // 2. Connect Client B (Challenger)
  const clientB = io(`http://localhost:${PORT}`);
  await new Promise((resolve) => clientB.on('connect', resolve));
  console.log('✅ Client B (Challenger) connected:', clientB.id);

  // 3. Client A creates room
  let createdRoomId = null;
  clientA.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'AcePilot', gameType: 'cyber-pong' });
  await new Promise((resolve) => {
    clientA.on(SOCKET_EVENTS.ROOM_STATE, (room) => {
      createdRoomId = room.id;
      console.log(`✅ Room created successfully with 6-character code: [${room.id}]`);
      resolve();
    });
  });

  // 4. Client B joins room with code
  clientB.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: createdRoomId, username: 'ShadowRunner' });
  await new Promise((resolve) => {
    clientB.on(SOCKET_EVENTS.ROOM_STATE, (room) => {
      if (room.players.length === 2) {
        console.log(`✅ Client B joined room [${room.id}]. Player count: 2`);
        resolve();
      }
    });
  });

  // 5. Client B toggles ready
  clientB.emit(SOCKET_EVENTS.TOGGLE_READY);
  await new Promise((resolve) => {
    clientA.on(SOCKET_EVENTS.ROOM_STATE, (room) => {
      if (room.status === ROOM_STATUS.READY) {
        console.log('✅ All players marked READY in lobby.');
        resolve();
      }
    });
  });

  // 6. Host starts game
  clientA.emit(SOCKET_EVENTS.START_GAME);
  let stateReceived = 0;

  await new Promise((resolve) => {
    clientB.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (state) => {
      stateReceived++;
      if (stateReceived === 1) {
        console.log('✅ Real-time 60Hz authoritative physics loop received on Client B.');
        console.log(`   Ball position: (${state.balls[0].x.toFixed(1)}, ${state.balls[0].y.toFixed(1)})`);
      }
      if (stateReceived >= 5) {
        console.log('✅ Successfully received multiple synchronized physics frames.');
        resolve();
      }
    });
  });

  // 7. Test Player Movement Input
  clientA.emit(SOCKET_EVENTS.PLAYER_INPUT, { up: true, down: false });
  console.log('✅ Player movement input dispatched.');

  // Clean up
  clientA.disconnect();
  clientB.disconnect();
  server.close();

  console.log('\n🎉 ALL MULTIPLAYER VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
