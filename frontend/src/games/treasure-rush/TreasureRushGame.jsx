import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Coins } from 'lucide-react';

export function TreasureRushGame({ isSolo = true, onExit }) {
  const { recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40);

  const stateRef = useRef({
    player: { x: 400, y: 250, radius: 14, speed: 5 },
    gems: [],
    enemies: [
      { x: 100, y: 100, vx: 3, vy: 2, radius: 16 },
      { x: 700, y: 400, vx: -2, vy: -3, radius: 16 }
    ],
    keys: { up: false, down: false, left: false, right: false }
  });

  // Spawn initial gems
  useEffect(() => {
    const gems = [];
    for (let i = 0; i < 20; i++) {
      gems.push({
        x: 60 + Math.random() * 680,
        y: 60 + Math.random() * 380,
        type: Math.random() > 0.7 ? 'diamond' : 'coin',
        value: Math.random() > 0.7 ? 250 : 100
      });
    }
    stateRef.current.gems = gems;
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsOver(true);
      confetti({ particleCount: 100, spread: 70 });
      recordMatchResult('treasure-rush', true, score);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Keys with prevent default
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;
      const p = s.player;

      // Move player
      if (s.keys.up) p.y -= p.speed;
      if (s.keys.down) p.y += p.speed;
      if (s.keys.left) p.x -= p.speed;
      if (s.keys.right) p.x += p.speed;
      p.x = Math.max(30, Math.min(770, p.x));
      p.y = Math.max(30, Math.min(470, p.y));

      // Move enemies
      for (const en of s.enemies) {
        en.x += en.vx;
        en.y += en.vy;
        if (en.x < 40 || en.x > 760) en.vx *= -1;
        if (en.y < 40 || en.y > 460) en.vy *= -1;

        if (Math.hypot(p.x - en.x, p.y - en.y) < p.radius + en.radius) {
          soundEngine.play('wall_hit');
          p.x = 400; p.y = 250;
        }
      }

      // Collect gems
      for (let i = s.gems.length - 1; i >= 0; i--) {
        const gem = s.gems[i];
        if (Math.hypot(p.x - gem.x, p.y - gem.y) < p.radius + 14) {
          soundEngine.play('powerup');
          setScore(sc => sc + gem.value);
          s.gems.splice(i, 1);
          // Spawn replacement gem
          s.gems.push({
            x: 60 + Math.random() * 680,
            y: 60 + Math.random() * 380,
            type: Math.random() > 0.7 ? 'diamond' : 'coin',
            value: Math.random() > 0.7 ? 250 : 100
          });
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dungeon grid tiles
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw Gems
      for (const g of s.gems) {
        ctx.font = '18px sans-serif';
        ctx.fillText(g.type === 'diamond' ? '💎' : '🪙', g.x - 9, g.y + 7);
      }

      // Draw Enemies
      for (const en of s.enemies) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '16px sans-serif';
        ctx.fillText('💀', en.x - 8, en.y + 6);
      }

      // Draw Player
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '14px sans-serif';
      ctx.fillText('🏃', p.x - 7, p.y + 5);

      if (!isOver) animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isOver]);

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-amber-500/30">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-heading font-black text-white text-lg">TREASURE RUSH</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-yellow-400">⏱️ {timeLeft}s</span>
          <span className="text-cyan-400">Total Loot: ${score}</span>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-[#06080e]">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full block" />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">RUN COMPLETE!</h2>
            <p className="text-xl font-heading font-bold text-yellow-400 mb-6">Total Vault Wealth: ${score}</p>
            <div className="flex gap-4">
              <button onClick={() => { setScore(0); setTimeLeft(40); setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
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
        Controls: <b>[WASD]</b> or <b>[Arrow Keys]</b> to run and grab loot while dodging skull sentinels!
      </div>
    </div>
  );
}
