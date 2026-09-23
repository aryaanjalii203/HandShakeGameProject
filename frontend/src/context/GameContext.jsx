import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket.js';
import { soundEngine } from '../services/soundEngine.js';
import { SOCKET_EVENTS, ROOM_STATUS } from '../../../shared/constants.js';
import { usePlayer } from './PlayerContext.jsx';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { username, avatar, color } = usePlayer();
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomError, setRoomError] = useState(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [ping, setPing] = useState(0);

  useEffect(() => {
    const s = socketService.getSocket();
    setSocket(s);

    // Track Ping
    const pingTimer = setInterval(() => {
      setPing(socketService.getPing());
    }, 1500);

    // Socket Event Subscriptions
    s.on(SOCKET_EVENTS.ROOM_STATE, (roomData) => {
      setActiveRoom(roomData);
      setRoomError(null);
      setIsSearchingMatch(false);
    });

    s.on(SOCKET_EVENTS.ROOM_ERROR, ({ message }) => {
      setRoomError(message);
      soundEngine.play('wall_hit');
    });

    s.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
      soundEngine.play('click');
      setActiveRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg]
        };
      });
    });

    s.on(SOCKET_EVENTS.MATCH_FOUND, ({ roomId }) => {
      soundEngine.play('powerup');
      setIsSearchingMatch(false);
    });

    s.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (state) => {
      setGameState(state);
    });

    s.on(SOCKET_EVENTS.GAME_EVENT, ({ event, data }) => {
      if (event === 'sound' && data?.type) {
        soundEngine.play(data.type);
      }
    });

    return () => {
      clearInterval(pingTimer);
      s.off(SOCKET_EVENTS.ROOM_STATE);
      s.off(SOCKET_EVENTS.ROOM_ERROR);
      s.off(SOCKET_EVENTS.CHAT_MESSAGE);
      s.off(SOCKET_EVENTS.MATCH_FOUND);
      s.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
      s.off(SOCKET_EVENTS.GAME_EVENT);
    };
  }, []);

  // Room Actions
  const createRoom = useCallback((gameType = 'cyber-pong', maxPlayers = 2) => {
    soundEngine.play('click');
    setRoomError(null);
    if (socket) {
      socket.emit(SOCKET_EVENTS.CREATE_ROOM, { username, gameType, maxPlayers });
    }
  }, [socket, username]);

  const joinRoom = useCallback((roomId) => {
    soundEngine.play('click');
    setRoomError(null);
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username });
    }
  }, [socket, username]);

  const leaveRoom = useCallback(() => {
    soundEngine.play('click');
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM);
    }
    setActiveRoom(null);
    setGameState(null);
  }, [socket]);

  const toggleReady = useCallback(() => {
    soundEngine.play('click');
    if (socket) {
      socket.emit(SOCKET_EVENTS.TOGGLE_READY);
    }
  }, [socket]);

  const selectGame = useCallback((gameType, maxPlayers) => {
    soundEngine.play('click');
    if (socket) {
      socket.emit(SOCKET_EVENTS.SELECT_GAME, { gameType, maxPlayers });
    }
  }, [socket]);

  const startGame = useCallback(() => {
    soundEngine.play('game_start');
    if (socket) {
      socket.emit(SOCKET_EVENTS.START_GAME);
    }
  }, [socket]);

  const restartGame = useCallback(() => {
    soundEngine.play('game_start');
    if (socket) {
      socket.emit(SOCKET_EVENTS.RESTART_GAME);
    }
  }, [socket]);

  const sendInput = useCallback((inputData) => {
    if (socket && activeRoom && activeRoom.status === ROOM_STATUS.PLAYING) {
      socket.emit(SOCKET_EVENTS.PLAYER_INPUT, inputData);
    }
  }, [socket, activeRoom]);

  const sendChat = useCallback((text) => {
    if (socket && text.trim()) {
      socket.emit(SOCKET_EVENTS.SEND_CHAT, { text });
    }
  }, [socket]);

  const joinQuickMatch = useCallback((gameType = 'cyber-pong') => {
    soundEngine.play('click');
    setIsSearchingMatch(true);
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { username, gameType });
    }
  }, [socket, username]);

  const cancelQuickMatch = useCallback(() => {
    soundEngine.play('click');
    setIsSearchingMatch(false);
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
    }
  }, [socket]);

  return (
    <GameContext.Provider
      value={{
        socket,
        activeRoom,
        roomError,
        isSearchingMatch,
        gameState,
        ping,
        createRoom,
        joinRoom,
        leaveRoom,
        toggleReady,
        selectGame,
        startGame,
        restartGame,
        sendInput,
        sendChat,
        joinQuickMatch,
        cancelQuickMatch
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
