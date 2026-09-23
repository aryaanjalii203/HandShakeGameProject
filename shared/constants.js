// PLAYFORGE Shared Constants

export const SOCKET_EVENTS = {
  // Connection & Ping
  PING: 'playforge:ping',
  PONG: 'playforge:pong',

  // Room Management
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_STATE: 'room:state',
  ROOM_ERROR: 'room:error',
  TOGGLE_READY: 'room:ready',
  KICK_PLAYER: 'room:kick',
  START_GAME: 'room:start',
  SELECT_GAME: 'room:select_game',
  SEND_CHAT: 'room:chat',
  CHAT_MESSAGE: 'room:message',

  // Matchmaking
  JOIN_QUEUE: 'queue:join',
  LEAVE_QUEUE: 'queue:leave',
  MATCH_FOUND: 'queue:match_found',

  // Game Real-time Loop
  PLAYER_INPUT: 'game:input',
  GAME_STATE_UPDATE: 'game:state',
  GAME_EVENT: 'game:event',
  GAME_OVER: 'game:over',
  RESTART_GAME: 'game:restart'
};

export const ROOM_STATUS = {
  WAITING: 'WAITING',
  READY: 'READY',
  STARTING: 'STARTING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
};

export const GAME_TYPES = {
  CYBER_PONG: 'cyber-pong',
  NEON_DRIFT: 'neon-drift',
  BATTLE_GRID: 'battle-grid',
  SPACE_RAIDERS: 'space-raiders',
  COLOR_CLASH: 'color-clash'
};

export const PLAYER_COLORS = [
  '#00f0ff', // Cyan / Cyber Blue
  '#ff007f', // Neon Pink
  '#39ff14', // Neon Green
  '#ffe600', // Cyber Yellow
  '#b026ff', // Purple Neon
  '#ff5e00'  // Flame Orange
];

export const POWERUPS = {
  MULTI_BALL: { id: 'multi_ball', name: 'Multi-Ball', color: '#ffe600', icon: 'zap' },
  SPEED_BOOST: { id: 'speed_boost', name: 'Hyper Speed', color: '#ff007f', icon: 'chevrons-up' },
  LONG_PADDLE: { id: 'long_paddle', name: 'Laser Beam Paddle', color: '#00f0ff', icon: 'maximize-2' },
  SHIELD: { id: 'shield', name: 'Forcefield', color: '#39ff14', icon: 'shield' },
  FREEZE: { id: 'freeze', name: 'Glitch Stun', color: '#b026ff', icon: 'snowflake' }
};
