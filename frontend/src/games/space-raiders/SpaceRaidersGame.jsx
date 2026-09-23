import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { soundEngine } from '../../services/soundEngine.js';
import { Rocket, Trophy, RotateCcw, LogOut, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

export function SpaceRaidersGame({ isSolo = false, onExit }) {
  const { gameState, sendInput, activeRoom, restartGame, leaveRoom } = useGame();
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [soloState, setSoloState] = useState(null);
  const soloLoopRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });

  const isOnline = !isSolo && activeRoom;
  const currentState = isOnline ? gameState : soloState;

  // Solo mode initialization
  useEffect(() => {
    if (isSolo) {
      const width = 800;
      const height = 600;

      const aliens = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          aliens.push({
            id: `a-${r}-${c}`,
            x: 100 + c * 70,
            y: 80 + r * 50,
            width: 32,
            height: 24,
            hp: r === 0 ? 2 : 1,
            points: (4 - r) * 100
          });
        }
      }

      const initial = {
        width, height,
        aliens,
        lasers: [],
        alienLasers: [],
        wave: 1,
        alienDirection: 1,
        alienStepTimer: 0,
        countdown: 3,
        isOver: false,
        winner: null,
        players: {
          'local-player': {
            id: 'local-player',
            username: username || 'Pilot',
            color: '#39ff14',
            x: 400,
            y: 530,
            width: 32,
            height: 28,
            speed: 6,
            score: 0,
            lives: 3,
            shootCooldown: 0
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
          startSoloSpaceLoop();
        }
      }, 1000);

      return () => {
        clearInterval(timer);
        if (soloLoopRef.current) clearInterval(soloLoopRef.current);
      };
    }
  }, [isSolo]);

  const startSoloSpaceLoop = () => {
    soloLoopRef.current = setInterval(() => {
      setSoloState(prev => {
        if (!prev || prev.isOver || prev.countdown) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // Player laser movement
        for (let i = next.lasers.length - 1; i >= 0; i--) {
          const lz = next.lasers[i];
          lz.y += lz.vy;

          let hit = false;
          for (let aIdx = next.aliens.length - 1; aIdx >= 0; aIdx--) {
            const al = next.aliens[aIdx];
            if (Math.abs(lz.x - al.x) < 20 && Math.abs(lz.y - al.y) < 15) {
              al.hp--;
              hit = true;
              if (al.hp <= 0) {
                next.players['local-player'].score += al.points;
                next.aliens.splice(aIdx, 1);
                soundEngine.play('alien_kill');
              }
              break;
            }
          }
          if (hit || lz.y < 0) next.lasers.splice(i, 1);
        }

        // Alien movement
        next.alienStepTimer++;
        if (next.alienStepTimer > 25) {
          next.alienStepTimer = 0;
          let edge = false;
          for (const al of next.aliens) {
            al.x += next.alienDirection * 15;
            if (al.x < 40 || al.x > next.width - 40) edge = true;
          }
          if (edge) {
            next.alienDirection *= -1;
            for (const al of next.aliens) al.y += 18;
          }
        }

        // Check wave cleared
        if (next.aliens.length === 0) {
          next.isOver = true;
          next.winner = username || 'Pilot';
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          recordMatchResult('space-raiders', true, next.players['local-player'].score);
        }

        // Continuous Player Ship Movement at 60 FPS
        const p = next.players['local-player'];
        if (p) {
          if (keysRef.current.left) p.x = Math.max(30, p.x - p.speed);
          if (keysRef.current.right) p.x = Math.min(next.width - 30, p.x + p.speed);
        }

        return next;
      });
    }, 1000 / 60);
  };

  // Keyboard controls with preventDefault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;

      if (e.code === 'Space' || e.key === ' ') {
        if (isOnline) sendInput({ shoot: true });
        else shootSoloLaser();
      } else if (isOnline) {
        sendInput(keysRef.current);
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
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

  const shootSoloLaser = () => {
    setSoloState(prev => {
      if (!prev || prev.isOver) return prev;
      const next = { ...prev };
      const p = next.players['local-player'];
      if (!p) return prev;

      next.lasers.push({ x: p.x, y: p.y - 15, vy: -12, color: p.color });
      soundEngine.play('laser');
      return next;
    });
  };

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentState) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars background
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % canvas.width;
      const sy = (i * 131) % canvas.height;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Aliens
    if (currentState.aliens) {
      for (const al of currentState.aliens) {
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(al.x - al.width / 2, al.y - al.height / 2, al.width, al.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Orbitron';
        ctx.fillText('👾', al.x - 9, al.y + 5);
      }
    }

    // Lasers
    if (currentState.lasers) {
      for (const lz of currentState.lasers) {
        ctx.fillStyle = lz.color || '#39ff14';
        ctx.fillRect(lz.x - 2, lz.y - 8, 4, 16);
      }
    }

    // Players
    if (currentState.players) {
      for (const p of Object.values(currentState.players)) {
        ctx.fillStyle = p.color || '#39ff14';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 14);
        ctx.lineTo(p.x - 16, p.y + 14);
        ctx.lineTo(p.x + 16, p.y + 14);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [currentState]);

  const p = currentState?.players ? Object.values(currentState.players)[0] : null;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 px-4 py-3 rounded-2xl bg-slate-900/90 border border-green-500/30">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-green-400" />
          <span className="font-heading font-black text-white text-lg">SPACE RAIDERS</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-heading font-bold">
          <span className="text-green-400">Score: {p?.score || 0}</span>
          <span className="text-pink-400">Lives: {'❤️'.repeat(p?.lives || 3)}</span>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] max-w-[800px] rounded-2xl overflow-hidden border-2 border-green-500/40 shadow-2xl bg-[#04060a]">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full block" />

        {currentState?.countdown && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-8xl font-heading font-black text-green-400 animate-ping">{currentState.countdown}</span>
          </div>
        )}

        {currentState?.isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">SECTOR CLEARED!</h2>
            <p className="text-xl font-heading font-bold text-green-400 mb-6">{currentState.winner} High Score: {p?.score || 0}</p>
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
      <div className="w-full max-w-[800px] mt-4 flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
        <div className="flex gap-3">
          <button onPointerDown={() => handleSoloMove({ left: true })} className="w-16 h-14 rounded-xl bg-slate-800 text-green-400 flex items-center justify-center"><ArrowLeft /></button>
          <button onPointerDown={() => handleSoloMove({ right: true })} className="w-16 h-14 rounded-xl bg-slate-800 text-green-400 flex items-center justify-center"><ArrowRight /></button>
        </div>
        <button
          onPointerDown={() => handleSoloMove({ shoot: true })}
          className="px-8 h-14 rounded-xl bg-green-500 text-black font-heading font-black text-sm flex items-center gap-2 active:scale-95"
        >
          <Zap className="w-5 h-5 fill-current" />
          FIRE LASER
        </button>
      </div>
    </div>
  );
}
