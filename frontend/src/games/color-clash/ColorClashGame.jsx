import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { soundEngine } from '../../services/soundEngine.js';
import { Palette, Trophy, RotateCcw, LogOut, ArrowUp, ArrowLeft, ArrowRight, ArrowDown, Zap } from 'lucide-react';

export function ColorClashGame({ isSolo = false, onExit }) {
  const { gameState, sendInput, activeRoom, restartGame, leaveRoom } = useGame();
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [soloState, setSoloState] = useState(null);
  const soloLoopRef = useRef(null);
  const keysRef = useRef({ up: false, down: false, left: false, right: false });

  const isOnline = !isSolo && activeRoom;
  const currentState = isOnline ? gameState : soloState;

  // Solo mode initialization
  useEffect(() => {
    if (isSolo) {
      const cols = 24;
      const rows = 16;
      const tileSize = 30;

      const grid = Array(rows).fill(null).map(() => Array(cols).fill(-1));
      grid[3][3] = 0;
      grid[rows - 4][cols - 4] = 1;

      const initial = {
        cols, rows, tileSize,
        width: cols * tileSize,
        height: rows * tileSize,
        grid,
        timeLeft: 45,
        countdown: 3,
        isOver: false,
        winner: null,
        players: {
          'local-player': {
            id: 'local-player',
            playerIndex: 0,
            username: username || 'Player',
            color: '#00f0ff',
            x: 3 * tileSize + tileSize / 2,
            y: 3 * tileSize + tileSize / 2,
            radius: 12,
            speed: 5.5,
            dashCooldown: 0,
            dashTimer: 0,
            tileCount: 1
          },
          'ai-bot': {
            id: 'ai-bot',
            playerIndex: 1,
            username: 'COLOR-BOT',
            color: '#ff007f',
            x: (cols - 4) * tileSize + tileSize / 2,
            y: (rows - 4) * tileSize + tileSize / 2,
            radius: 12,
            speed: 5,
            dashCooldown: 0,
            dashTimer: 0,
            tileCount: 1
          }
        }
      };

      setSoloState(initial);

      let count = 3;
      const timer = setInterval(() => {
        count--;
        setSoloState(prev => prev ? { ...prev, countdown: count > 0 ? count : null } : null);
        if (count <= 0) {
          clearInterval(timer);
          startSoloColorLoop();
        }
      }, 1000);

      return () => {
        clearInterval(timer);
        if (soloLoopRef.current) clearInterval(soloLoopRef.current);
      };
    }
  }, [isSolo]);

  const startSoloColorLoop = () => {
    let secondCounter = 0;

    soloLoopRef.current = setInterval(() => {
      setSoloState(prev => {
        if (!prev || prev.isOver || prev.countdown) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // Time countdown
        secondCounter++;
        if (secondCounter >= 30) {
          secondCounter = 0;
          next.timeLeft--;
          if (next.timeLeft <= 0) {
            next.isOver = true;
            const p1Score = next.players['local-player']?.tileCount || 0;
            const aiScore = next.players['ai-bot']?.tileCount || 0;
            next.winner = p1Score >= aiScore ? (username || 'Player') : 'COLOR-BOT';
            if (p1Score >= aiScore) {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              recordMatchResult('color-clash', true, p1Score);
            } else {
              recordMatchResult('color-clash', false, p1Score);
            }
          }
        }

        // AI movement
        const ai = next.players['ai-bot'];
        if (ai) {
          ai.x += (Math.random() * 8 - 4);
          ai.y += (Math.random() * 8 - 4);
          ai.x = Math.max(ai.radius, Math.min(next.width - ai.radius, ai.x));
          ai.y = Math.max(ai.radius, Math.min(next.height - ai.radius, ai.y));
          const ac = Math.floor(ai.x / next.tileSize);
          const ar = Math.floor(ai.y / next.tileSize);
          if (ar >= 0 && ar < next.rows && ac >= 0 && ac < next.cols) {
            next.grid[ar][ac] = 1;
          }
        }

        // Calculate tile counts
        let c0 = 0; let c1 = 0;
        for (let r = 0; r < next.rows; r++) {
          for (let c = 0; c < next.cols; c++) {
            if (next.grid[r][c] === 0) c0++;
            if (next.grid[r][c] === 1) c1++;
          }
        }
        if (next.players['local-player']) next.players['local-player'].tileCount = c0;
        if (next.players['ai-bot']) next.players['ai-bot'].tileCount = c1;

        // Continuous Player Movement & Tile Painting at 60 FPS
        const p = next.players['local-player'];
        if (p) {
          const k = keysRef.current;
          let speed = p.speed;
          if (p.isDashing) speed *= 1.8;

          if (k.up) p.y -= speed;
          if (k.down) p.y += speed;
          if (k.left) p.x -= speed;
          if (k.right) p.x += speed;

          p.x = Math.max(p.radius, Math.min(next.width - p.radius, p.x));
          p.y = Math.max(p.radius, Math.min(next.height - p.radius, p.y));

          const c = Math.floor(p.x / next.tileSize);
          const r = Math.floor(p.y / next.tileSize);
          if (r >= 0 && r < next.rows && c >= 0 && c < next.cols) {
            next.grid[r][c] = 0;
          }
        }

        return next;
      });
    }, 1000 / 60);
  };

  // Keyboard with preventDefault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;

      if (e.code === 'Space' || e.key === ' ') {
        if (isOnline) sendInput({ dash: true });
        else triggerSoloDash();
      } else if (isOnline) {
        sendInput(keysRef.current);
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;

      if (isOnline) sendInput(keysRef.current);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOnline, sendInput]);

  const triggerSoloDash = () => {
    setSoloState(prev => {
      if (!prev || prev.isOver) return prev;
      const next = { ...prev };
      const p = next.players['local-player'];
      if (!p || p.dashCooldown > 0) return prev;

      p.isDashing = true;
      p.dashCooldown = 60;
      soundEngine.play('dash');
      setTimeout(() => {
        setSoloState(st => st ? { ...st, players: { ...st.players, 'local-player': { ...st.players['local-player'], isDashing: false } } } : st);
      }, 400);
      return next;
    });
  };

  // Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentState) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ts = currentState.tileSize || 30;

    // Grid tiles
    if (currentState.grid) {
      for (let r = 0; r < currentState.rows; r++) {
        for (let c = 0; c < currentState.cols; c++) {
          const owner = currentState.grid[r][c];
          if (owner === 0) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
          } else if (owner === 1) {
            ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
          } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
          }
          ctx.fillRect(c * ts + 1, r * ts + 1, ts - 2, ts - 2);
        }
      }
    }

    // Players
    if (currentState.players) {
      for (const p of Object.values(currentState.players)) {
        ctx.fillStyle = p.color || '#00f0ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [currentState]);

  const p1 = currentState?.players ? Object.values(currentState.players)[0] : null;
  const p2 = currentState?.players ? Object.values(currentState.players)[1] : null;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 px-4 py-3 rounded-2xl bg-slate-900/90 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <span className="font-heading font-black text-white text-lg">COLOR CLASH</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-heading font-bold">
          <span className="text-cyan-400">{p1?.username || 'P1'}: {p1?.tileCount || 0} Tiles</span>
          <span className="text-yellow-400">⏱️ {currentState?.timeLeft || 45}s</span>
          <span className="text-pink-400">{p2?.username || 'P2'}: {p2?.tileCount || 0} Tiles</span>
        </div>
      </div>

      <div className="relative w-full aspect-[24/16] max-w-[720px] rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-[#07090e]">
        <canvas ref={canvasRef} width={720} height={480} className="w-full h-full block" />

        {currentState?.countdown && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-8xl font-heading font-black text-purple-400 animate-ping">{currentState.countdown}</span>
          </div>
        )}

        {currentState?.isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">TIME UP!</h2>
            <p className="text-xl font-heading font-bold text-purple-400 mb-6">{currentState.winner} Dominated the Map!</p>
            <div className="flex gap-4">
              <button onClick={() => { if (isOnline) restartGame(); else onExit(); }} className="btn-cyber-primary text-sm">
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
              <button onClick={() => { if (isOnline) leaveRoom(); onExit(); }} className="btn-cyber-outline text-sm">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full max-w-[720px] mt-4 flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button onPointerDown={() => handleSoloPlayerMove({ up: true })} className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center"><ArrowUp /></button>
          <div />
          <button onPointerDown={() => handleSoloPlayerMove({ left: true })} className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center"><ArrowLeft /></button>
          <button onPointerDown={() => handleSoloPlayerMove({ down: true })} className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center"><ArrowDown /></button>
          <button onPointerDown={() => handleSoloPlayerMove({ right: true })} className="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center"><ArrowRight /></button>
        </div>

        <button
          onPointerDown={() => handleSoloPlayerMove({ dash: true })}
          className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-heading font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/30 active:scale-95"
        >
          <Zap className="w-7 h-7" />
          <span>DASH</span>
        </button>
      </div>
    </div>
  );
}
