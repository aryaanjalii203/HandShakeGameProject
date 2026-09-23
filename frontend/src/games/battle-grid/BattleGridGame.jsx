import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { soundEngine } from '../../services/soundEngine.js';
import { Bomb, Trophy, RotateCcw, LogOut, ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

export function BattleGridGame({ isSolo = false, onExit }) {
  const { gameState, sendInput, activeRoom, restartGame, leaveRoom } = useGame();
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [soloState, setSoloState] = useState(null);
  const soloLoopRef = useRef(null);

  const isOnline = !isSolo && activeRoom;
  const currentState = isOnline ? gameState : soloState;

  // Solo mode initialization
  useEffect(() => {
    if (isSolo) {
      const cols = 13;
      const rows = 9;
      const tileSize = 50;

      const grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) row.push(1);
          else if (r % 2 === 0 && c % 2 === 0) row.push(1);
          else if (Math.random() < 0.6) row.push(2);
          else row.push(0);
        }
        grid.push(row);
      }
      grid[1][1] = 0; grid[1][2] = 0; grid[2][1] = 0;
      grid[rows - 2][cols - 2] = 0; grid[rows - 2][cols - 3] = 0; grid[rows - 3][cols - 2] = 0;

      const initial = {
        cols, rows, tileSize,
        width: cols * tileSize,
        height: rows * tileSize,
        grid,
        bombs: [],
        explosions: [],
        powerups: [],
        countdown: 3,
        isOver: false,
        winner: null,
        players: {
          'local-player': {
            id: 'local-player',
            username: username || 'Player',
            color: '#00f0ff',
            x: 1 * tileSize + tileSize / 2,
            y: 1 * tileSize + tileSize / 2,
            radius: 16,
            alive: true,
            bombCount: 1,
            maxBombs: 1,
            blastRange: 2,
            speed: 4
          },
          'ai-bot': {
            id: 'ai-bot',
            username: 'GRID-BOT',
            color: '#ff007f',
            x: (cols - 2) * tileSize + tileSize / 2,
            y: (rows - 2) * tileSize + tileSize / 2,
            radius: 16,
            alive: true,
            bombCount: 1,
            maxBombs: 1,
            blastRange: 2,
            speed: 3.5
          }
        }
      };

      setSoloState(initial);

      let count = 3;
      const countTimer = setInterval(() => {
        count--;
        setSoloState(prev => prev ? { ...prev, countdown: count > 0 ? count : null } : null);
        if (count <= 0) {
          clearInterval(countTimer);
          startSoloBattleLoop();
        }
      }, 1000);

      return () => {
        clearInterval(countTimer);
        if (soloLoopRef.current) clearInterval(soloLoopRef.current);
      };
    }
  }, [isSolo]);

  const startSoloBattleLoop = () => {
    soloLoopRef.current = setInterval(() => {
      setSoloState(prev => {
        if (!prev || prev.isOver || prev.countdown) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // Update Bombs
        for (let i = next.bombs.length - 1; i >= 0; i--) {
          const bomb = next.bombs[i];
          bomb.timer--;
          if (bomb.timer <= 0) {
            // Explode
            const tiles = [{ r: bomb.r, c: bomb.c }];
            const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
            for (const d of dirs) {
              for (let step = 1; step <= bomb.blastRange; step++) {
                const nr = bomb.r + d.dr * step;
                const nc = bomb.c + d.dc * step;
                if (nr < 0 || nr >= next.rows || nc < 0 || nc >= next.cols) break;
                if (next.grid[nr][nc] === 1) break;
                tiles.push({ r: nr, c: nc });
                if (next.grid[nr][nc] === 2) {
                  next.grid[nr][nc] = 0;
                  break;
                }
              }
            }
            next.explosions.push({ tiles, timer: 15 });
            const owner = next.players[bomb.ownerId];
            if (owner) owner.bombCount = Math.min(owner.maxBombs, owner.bombCount + 1);
            next.bombs.splice(i, 1);
            soundEngine.play('explosion');
          }
        }

        // Update Explosions
        for (let i = next.explosions.length - 1; i >= 0; i--) {
          const exp = next.explosions[i];
          exp.timer--;

          for (const p of Object.values(next.players)) {
            if (!p.alive) continue;
            const pc = Math.floor(p.x / next.tileSize);
            const pr = Math.floor(p.y / next.tileSize);
            if (exp.tiles.some(t => t.r === pr && t.c === pc)) {
              p.alive = false;
              soundEngine.play('explosion');
              next.isOver = true;
              next.winner = p.id === 'local-player' ? 'GRID-BOT' : username || 'Player';
              if (next.winner === (username || 'Player')) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                recordMatchResult('battle-grid', true);
              } else {
                recordMatchResult('battle-grid', false);
              }
            }
          }

          if (exp.timer <= 0) next.explosions.splice(i, 1);
        }

  const keysRef = useRef({ up: false, down: false, left: false, right: false });

        // Update Local Player movement at 60 FPS
        const p = next.players['local-player'];
        if (p && p.alive) {
          const k = keysRef.current;
          let dx = 0; let dy = 0;
          if (k.up) dy -= p.speed;
          if (k.down) dy += p.speed;
          if (k.left) dx -= p.speed;
          if (k.right) dx += p.speed;

          p.x = Math.max(p.radius + 20, Math.min(next.width - p.radius - 20, p.x + dx));
          p.y = Math.max(p.radius + 20, Math.min(next.height - p.radius - 20, p.y + dy));
        }

        return next;
      });
    }, 1000 / 60);
  };

  // Keyboard controls with preventDefault
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
        if (isOnline) sendInput({ placeBomb: true });
        else placeSoloBomb();
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

  const placeSoloBomb = () => {
    setSoloState(prev => {
      if (!prev || prev.isOver) return prev;
      const next = { ...prev };
      const p = next.players['local-player'];
      if (!p || !p.alive || p.bombCount <= 0) return prev;

      const c = Math.floor(p.x / next.tileSize);
      const r = Math.floor(p.y / next.tileSize);
      p.bombCount--;
      next.bombs.push({ r, c, ownerId: 'local-player', blastRange: p.blastRange, timer: 75 });
      soundEngine.play('click');
      return next;
    });
  };

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentState) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ts = currentState.tileSize || 50;

    // Grid blocks
    if (currentState.grid) {
      for (let r = 0; r < currentState.rows; r++) {
        for (let c = 0; c < currentState.cols; c++) {
          const val = currentState.grid[r][c];
          if (val === 1) {
            // Indestructible border/pillar
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(c * ts, r * ts, ts, ts);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(c * ts, r * ts, ts, ts);
          } else if (val === 2) {
            // Destructible cyber crate
            ctx.fillStyle = '#0f766e';
            ctx.fillRect(c * ts + 2, r * ts + 2, ts - 4, ts - 4);
            ctx.strokeStyle = '#14b8a6';
            ctx.strokeRect(c * ts + 2, r * ts + 2, ts - 4, ts - 4);
          }
        }
      }
    }

    // Bombs
    if (currentState.bombs) {
      for (const b of currentState.bombs) {
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(b.c * ts + ts / 2, b.r * ts + ts / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText('💣', b.c * ts + ts / 2 - 6, b.r * ts + ts / 2 + 4);
      }
    }

    // Explosions
    if (currentState.explosions) {
      for (const exp of currentState.explosions) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
        for (const t of exp.tiles) {
          ctx.fillRect(t.c * ts, t.r * ts, ts, ts);
        }
      }
    }

    // Players
    if (currentState.players) {
      for (const p of Object.values(currentState.players)) {
        if (!p.alive) continue;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [currentState]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 px-4 py-3 rounded-2xl bg-slate-900/90 border border-yellow-500/30">
        <div className="flex items-center gap-2">
          <Bomb className="w-5 h-5 text-yellow-400" />
          <span className="font-heading font-black text-white text-lg">BATTLE GRID</span>
        </div>
      </div>

      <div className="relative w-full aspect-[13/9] max-w-[650px] rounded-2xl overflow-hidden border-2 border-yellow-500/40 shadow-2xl bg-[#090d16]">
        <canvas ref={canvasRef} width={650} height={450} className="w-full h-full block" />

        {currentState?.countdown && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-8xl font-heading font-black text-yellow-400 animate-ping">{currentState.countdown}</span>
          </div>
        )}

        {currentState?.isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">SURVIVOR!</h2>
            <p className="text-xl font-heading font-bold text-yellow-400 mb-6">{currentState.winner} Won the Arena!</p>
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
      <div className="w-full max-w-[650px] mt-4 flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <button onPointerDown={() => handleSoloPlayerMove({ up: true })} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400"><ArrowUp /></button>
          <div />
          <button onPointerDown={() => handleSoloPlayerMove({ left: true })} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400"><ArrowLeft /></button>
          <button onPointerDown={() => handleSoloPlayerMove({ down: true })} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400"><ArrowDown /></button>
          <button onPointerDown={() => handleSoloPlayerMove({ right: true })} className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400"><ArrowRight /></button>
        </div>

        <button
          onPointerDown={() => handleSoloPlayerMove({ placeBomb: true })}
          className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 text-black font-heading font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-yellow-500/30 active:scale-95"
        >
          <Bomb className="w-7 h-7" />
          <span>BOMB</span>
        </button>
      </div>
    </div>
  );
}
