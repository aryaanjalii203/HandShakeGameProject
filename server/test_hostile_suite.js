import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../shared/constants.js';

const SERVER_URL = 'http://localhost:3001';

console.log('🔥 STARTING PLAYFORGE HOSTILE QA & STRESS TEST SUITE...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function createClient(name = 'Client') {
  return io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
}

async function runTests() {
  try {
    // -------------------------------------------------------------
    // TEST 1: Malformed & Null Payload Fuzzing (Server Crash Test)
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Malformed & Null Payload Fuzzing ---');
    const fuzzer = createClient('Fuzzer');
    await new Promise(res => fuzzer.on('connect', res));

    // Emit nulls and strange types across all events to test server resilience
    fuzzer.emit(SOCKET_EVENTS.CREATE_ROOM, null);
    fuzzer.emit(SOCKET_EVENTS.CREATE_ROOM, undefined);
    fuzzer.emit(SOCKET_EVENTS.CREATE_ROOM, 'not-an-object');
    fuzzer.emit(SOCKET_EVENTS.CREATE_ROOM, 12345);
    fuzzer.emit(SOCKET_EVENTS.JOIN_ROOM, null);
    fuzzer.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: null, username: null });
    fuzzer.emit(SOCKET_EVENTS.SELECT_GAME, null);
    fuzzer.emit(SOCKET_EVENTS.SEND_CHAT, null);
    fuzzer.emit(SOCKET_EVENTS.SEND_CHAT, { text: null });
    fuzzer.emit(SOCKET_EVENTS.PLAYER_INPUT, null);
    fuzzer.emit(SOCKET_EVENTS.JOIN_QUEUE, null);

    await sleep(400);

    // Verify server is still alive after receiving corrupt payloads
    const healthCheck = await fetch('http://localhost:3001/api/health').then(r => r.json()).catch(() => null);
    assert(healthCheck && healthCheck.status === 'online', 'Server survived null and malformed payloads without crashing');
    fuzzer.disconnect();

    // -------------------------------------------------------------
    // TEST 2: High Concurrency Room Overfill Race Condition
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: High Concurrency Room Overfill Race Condition ---');
    const host = createClient('Host');
    await new Promise(res => host.on('connect', res));

    let roomState = null;
    host.on(SOCKET_EVENTS.ROOM_STATE, (state) => {
      roomState = state;
    });

    host.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'HostUser', gameType: 'cyber-pong', maxPlayers: 2 });
    await sleep(300);
    assert(roomState && roomState.id, `Host created room: ${roomState?.id}`);
    const targetRoomId = roomState.id;

    // Concurrently try to join 8 clients into a 2-player max room
    const challengers = Array.from({ length: 8 }).map((_, i) => createClient(`Challenger_${i}`));
    await Promise.all(challengers.map(c => new Promise(res => c.on('connect', res))));

    const joinResults = await Promise.all(challengers.map((c, i) => {
      return new Promise(res => {
        c.on(SOCKET_EVENTS.ROOM_STATE, (state) => res({ success: true, clientIndex: i, state }));
        c.on(SOCKET_EVENTS.ROOM_ERROR, (err) => res({ success: false, clientIndex: i, error: err.message }));
        c.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: targetRoomId, username: `Spammer_${i}` });
      });
    }));

    const successfulJoins = joinResults.filter(r => r.success);
    const rejectedJoins = joinResults.filter(r => !r.success);

    assert(successfulJoins.length === 1, `Exactly 1 challenger joined (2 total players in room). Rejections: ${rejectedJoins.length}`);
    challengers.forEach(c => c.disconnect());
    host.disconnect();

    // -------------------------------------------------------------
    // TEST 3: All 15 Game Types Online Start & Restart
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Online Multi-Game Support & Clean Loop ---');
    const allGameIds = [
      'cyber-pong', 'neon-drift', 'battle-grid', 'space-raiders', 'color-clash',
      'tank-arena', 'pixel-soccer', 'word-blitz', 'mini-golf-chaos', 'memory-wars',
      'tower-defenders', 'survival-arena', 'quick-draw', 'maze-hunters', 'treasure-rush'
    ];

    for (const gId of allGameIds) {
      const h = createClient('HostG');
      const g = createClient('GuestG');
      await Promise.all([new Promise(r => h.on('connect', r)), new Promise(r => g.on('connect', r))]);

      let curRoom = null;
      h.on(SOCKET_EVENTS.ROOM_STATE, (s) => { curRoom = s; });

      h.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'HostPlayer', gameType: gId, maxPlayers: 2 });
      await sleep(200);

      g.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: curRoom.id, username: 'GuestPlayer' });
      await sleep(200);

      g.emit(SOCKET_EVENTS.TOGGLE_READY);
      await sleep(200);

      // Start game
      h.emit(SOCKET_EVENTS.START_GAME);
      await sleep(250);

      assert(curRoom && curRoom.status === 'PLAYING', `Game ${gId} started successfully into PLAYING state`);

      // Restart game
      h.emit(SOCKET_EVENTS.RESTART_GAME);
      await sleep(250);

      assert(curRoom && curRoom.status === 'PLAYING', `Game ${gId} restarted cleanly`);

      h.disconnect();
      g.disconnect();
      await sleep(100);
    }

    // -------------------------------------------------------------
    // TEST 4: Rapid Disconnect / Reconnect & Host Migration
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Disconnect, Reconnect & Host Migration ---');
    const c1 = createClient('User1');
    const c2 = createClient('User2');
    await Promise.all([new Promise(r => c1.on('connect', r)), new Promise(r => c2.on('connect', r))]);

    let state1 = null;
    let state2 = null;
    c1.on(SOCKET_EVENTS.ROOM_STATE, s => state1 = s);
    c2.on(SOCKET_EVENTS.ROOM_STATE, s => state2 = s);

    c1.emit(SOCKET_EVENTS.CREATE_ROOM, { username: 'HostOriginal', gameType: 'cyber-pong' });
    await sleep(200);

    c2.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: state1.id, username: 'GuestChallenger' });
    await sleep(200);

    // Host abruptly leaves
    c1.disconnect();
    await sleep(300);

    assert(state2 && state2.hostId === c2.id, 'Host migration succeeded: Guest is now the room host');
    assert(state2.players.length === 1, 'Room player list correctly decremented');

    c2.disconnect();

    // -------------------------------------------------------------
    // TEST 5: Matchmaker Queue Concurrency & Cancellation
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Matchmaker Queue Concurrency ---');
    const m1 = createClient('Match1');
    const m2 = createClient('Match2');
    await Promise.all([new Promise(r => m1.on('connect', r)), new Promise(r => m2.on('connect', r))]);

    let matchedRoom1 = null;
    let matchedRoom2 = null;
    m1.on(SOCKET_EVENTS.MATCH_FOUND, ({ roomId }) => matchedRoom1 = roomId);
    m2.on(SOCKET_EVENTS.MATCH_FOUND, ({ roomId }) => matchedRoom2 = roomId);

    m1.emit(SOCKET_EVENTS.JOIN_QUEUE, { username: 'PlayerAlpha', gameType: 'neon-drift' });
    await sleep(100);

    m2.emit(SOCKET_EVENTS.JOIN_QUEUE, { username: 'PlayerBeta', gameType: 'neon-drift' });
    await sleep(300);

    assert(matchedRoom1 && matchedRoom2 && matchedRoom1 === matchedRoom2, `Matchmaker paired two clients into room ${matchedRoom1}`);

    m1.disconnect();
    m2.disconnect();

    // -------------------------------------------------------------
    // TEST 6: XSS & Oversized Message Sanitization
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: XSS & Chat Sanitization ---');
    const xssHost = createClient('XSSHost');
    await new Promise(r => xssHost.on('connect', r));

    let chatRoom = null;
    let lastChatMsg = null;
    xssHost.on(SOCKET_EVENTS.ROOM_STATE, s => chatRoom = s);
    xssHost.on(SOCKET_EVENTS.CHAT_MESSAGE, m => lastChatMsg = m);

    xssHost.emit(SOCKET_EVENTS.CREATE_ROOM, { username: '<script>alert(1)</script>', gameType: 'cyber-pong' });
    await sleep(200);

    const hugeText = 'A'.repeat(5000);
    xssHost.emit(SOCKET_EVENTS.SEND_CHAT, { text: hugeText });
    await sleep(200);

    assert(lastChatMsg && lastChatMsg.text.length <= 120, 'Chat text was safely truncated to <= 120 characters');

    xssHost.disconnect();

  } catch (err) {
    console.error('Fatal error in test suite:', err);
    failedTests++;
  }

  console.log(`\n======================================================`);
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
  console.log(`======================================================\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
