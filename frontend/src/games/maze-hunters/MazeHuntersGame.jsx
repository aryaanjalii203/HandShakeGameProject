import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Compass } from 'lucide-react';

export function MazeHuntersGame({ isSolo = true, onExit }) {
  const { recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);
  const [batteriesCollected, setBatteriesCollected] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const stateRef = useRef({
    player: { x: 80, y: 80, radius: 12, speed: 4.5 },
    hunter: { x: 720, y: 420, radius: 14, speed: 2.6 },
    batteries: [
      { x: 200, y: 150, collected: false },
      { x: 600, y: 120, collected: false },
      { x: 380, y: 250, collected: false },
      { x: 180, y: 380, collected: false },
      { x: 650, y: 380, collected: false }
    ],
    walls: [
      // Border walls
      { x: 30, y: 30, w: 740, h: 10 },
      { x: 30, y: 460, w: 740, h: 10 },
      { x: 30, y: 30, w: 10, h: 440 },
      { x: 760, y: 30, w: 10, h: 440 },
      // Labyrinth inner barriers
      { x: 140, y: 30, w: 10, h: 180 },
      { x: 140, y: 280, w: 10, h: 190 },
      { x: 260, y: 120, w: 260, h: 10 },
      { x: 260, y: 340, w: 260, h: 10 },
      { x: 500, y: 120, w: 10, h: 230 },
      { x: 640, y: 30, w: 10, h: 200 },
      { x: 640, y: 300, w: 10, h: 170 }
    ],
    keys: { up: false, down: false, left: false, right: false }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const checkCollision = (x, y, radius) => {
    for (const w of stateRef.current.walls) {
      if (x + radius > w.x && x - radius < w.x + w.w &&
          y + radius > w.y && y - radius < w.y + w.h) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;
      const p = s.player;
      const h = s.hunter;

      // Player Movement with wall collision
      let dx = 0; let dy = 0;
      if (s.keys.up) dy -= p.speed;
      if (s.keys.down) dy += p.speed;
      if (s.keys.left) dx -= p.speed;
      if (s.keys.right) dx += p.speed;

      if (!checkCollision(p.x + dx, p.y, p.radius)) p.x += dx;
      if (!checkCollision(p.x, p.y + dy, p.radius)) p.y += dy;

      // Hunter AI tracking
      const angle = Math.atan2(p.y - h.y, p.x - h.x);
      const hx = Math.cos(angle) * h.speed;
      const hy = Math.sin(angle) * h.speed;
      if (!checkCollision(h.x + hx, h.y, h.radius)) h.x += hx;
      if (!checkCollision(h.x, h.y + hy, h.radius)) h.y += hy;

      // Hunter catches player
      if (Math.hypot(p.x - h.x, p.y - h.y) < p.radius + h.radius) {
        soundEngine.play('explosion');
        setIsOver(true);
        setWinner('HUNTER SENTINEL');
        recordMatchResult('maze-hunters', false);
      }

      // Collect Batteries
      for (const bat of s.batteries) {
        if (!bat.collected && Math.hypot(p.x - bat.x, p.y - bat.y) < p.radius + 15) {
          bat.collected = true;
          soundEngine.play('powerup');
          setBatteriesCollected(c => {
            const next = c + 1;
            if (next >= 5) {
              setIsOver(true);
              setWinner('RUNNER (ESCAPED!)');
              confetti({ particleCount: 100, spread: 70 });
              recordMatchResult('maze-hunters', true, 1000);
            }
            return next;
          });
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Walls
      ctx.fillStyle = '#115e59';
      ctx.strokeStyle = '#2dd4bf';
      for (const w of s.walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }

      // Batteries
      for (const bat of s.batteries) {
        if (!bat.collected) {
          ctx.font = '18px sans-serif';
          ctx.fillText('🔋', bat.x - 9, bat.y + 7);
        }
      }

      // Hunter
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '14px sans-serif';
      ctx.fillText('👁️', h.x - 7, h.y + 5);

      // Player
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!isOver) animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isOver]);

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-teal-500/30">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-teal-400" />
          <span className="font-heading font-black text-white text-lg">MAZE HUNTERS</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-yellow-400">⚡ Batteries: {batteriesCollected} / 5</span>
          <span className="text-red-400">Radar: Hunter Approaching!</span>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-teal-500/40 shadow-2xl bg-[#031d1c]">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full block" />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">{winner}</h2>
            <p className="text-xl font-heading font-bold text-teal-400 mb-6">{winner.includes('ESCAPED') ? 'You collected all batteries and escaped the labyrinth!' : 'Caught by the Hunter sentinel!'}</p>
            <div className="flex gap-4">
              <button onClick={() => { setBatteriesCollected(0); stateRef.current.batteries.forEach(b => b.collected = false); stateRef.current.player = { x: 80, y: 80, radius: 12, speed: 4.5 }; stateRef.current.hunter = { x: 720, y: 420, radius: 14, speed: 2.6 }; setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={onExit} className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[800px] mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
        Controls: <b>[WASD]</b> or <b>[Arrow Keys]</b> to navigate the labyrinth, gather 5 batteries, and avoid the red Hunter!
      </div>
    </div>
  );
}
