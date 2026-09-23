import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut } from 'lucide-react';

export function PixelSoccerGame({ isSolo = true, onExit }) {
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [isOver, setIsOver] = useState(false);

  const stateRef = useRef({
    p1: { x: 150, y: 380, vx: 0, vy: 0, isGrounded: true, color: '#00f0ff' },
    p2: { x: 650, y: 380, vx: 0, vy: 0, isGrounded: true, color: '#ef4444' },
    ball: { x: 400, y: 250, vx: 0, vy: 0, radius: 14 },
    keys: { left: false, right: false, jump: false, kick: false }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.jump = true;
      if (e.code === 'Space') k.kick = true;
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'w', 'W', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.jump = false;
      if (e.code === 'Space') k.kick = false;
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
      const p1 = s.p1;
      const p2 = s.p2;
      const b = s.ball;

      // P1 physics
      if (s.keys.left) p1.vx = -6;
      else if (s.keys.right) p1.vx = 6;
      else p1.vx *= 0.8;

      if (s.keys.jump && p1.isGrounded) {
        p1.vy = -14;
        p1.isGrounded = false;
      }
      p1.vy += 0.8; // Gravity
      p1.x += p1.vx;
      p1.y += p1.vy;
      if (p1.y >= 380) { p1.y = 380; p1.vy = 0; p1.isGrounded = true; }
      p1.x = Math.max(50, Math.min(380, p1.x));

      // P2 AI physics
      if (b.x > 350) {
        if (b.x > p2.x + 10) p2.vx = 4;
        else if (b.x < p2.x - 10) p2.vx = -4;
        if (b.y < 300 && p2.isGrounded && Math.random() < 0.05) {
          p2.vy = -13;
          p2.isGrounded = false;
        }
      } else {
        p2.vx = (600 - p2.x) * 0.05;
      }
      p2.vy += 0.8;
      p2.x += p2.vx;
      p2.y += p2.vy;
      if (p2.y >= 380) { p2.y = 380; p2.vy = 0; p2.isGrounded = true; }
      p2.x = Math.max(420, Math.min(750, p2.x));

      // Ball Physics
      b.vy += 0.5; // Gravity
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.985;

      // Ground & Ceiling
      if (b.y >= 390) { b.y = 390; b.vy = -b.vy * 0.75; }
      if (b.y <= 20) { b.y = 20; b.vy = Math.abs(b.vy); }

      // Player 1 Kick Collision
      if (Math.hypot(b.x - p1.x, b.y - (p1.y - 20)) < 36) {
        const kickPower = s.keys.kick ? 1.6 : 1.0;
        b.vx = (b.x - p1.x) * 0.45 * kickPower + 4;
        b.vy = -Math.abs(b.vy) * 0.8 - 4 * kickPower;
        soundEngine.play('paddle_hit');
      }

      // Player 2 Kick Collision
      if (Math.hypot(b.x - p2.x, b.y - (p2.y - 20)) < 36) {
        b.vx = (b.x - p2.x) * 0.45 - 4;
        b.vy = -Math.abs(b.vy) * 0.8 - 4;
        soundEngine.play('paddle_hit');
      }

      // Goal Checks (Goal Net X: < 50 or > 750, Y: > 240)
      if (b.x < 40 && b.y > 230) {
        // P2 scores
        soundEngine.play('score');
        setP2Score(s2 => {
          const next = s2 + 1;
          if (next >= 5) { setIsOver(true); recordMatchResult('pixel-soccer', false); }
          return next;
        });
        resetBall(1);
      } else if (b.x > 760 && b.y > 230) {
        // P1 scores
        soundEngine.play('score');
        confetti({ particleCount: 80, spread: 60 });
        setP1Score(s1 => {
          const next = s1 + 1;
          if (next >= 5) { setIsOver(true); recordMatchResult('pixel-soccer', true); }
          return next;
        });
        resetBall(-1);
      } else {
        if (b.x < 30) { b.x = 30; b.vx = Math.abs(b.vx); }
        if (b.x > 770) { b.x = 770; b.vx = -Math.abs(b.vx); }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pitch background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 410, canvas.width, 90);

      // Center Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(400, 100);
      ctx.lineTo(400, 410);
      ctx.stroke();

      // Goal Posts
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 240, 45, 170);
      ctx.fillRect(755, 240, 45, 170);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 245, 35, 160);
      ctx.fillRect(760, 245, 35, 160);

      // Draw Players
      const drawPlayer = (p, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 20, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(p.x - 10, p.y - 10, 20, 25);
      };
      drawPlayer(p1, '#00f0ff');
      drawPlayer(p2, '#ef4444');

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚽', b.x - 7, b.y + 5);

      if (!isOver) animationId = requestAnimationFrame(gameLoop);
    };

    const resetBall = (dir) => {
      const b = stateRef.current.ball;
      b.x = 400; b.y = 200;
      b.vx = dir * 5; b.vy = -4;
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isOver]);

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-green-500/30">
        <span className="font-heading font-black text-cyan-400 text-lg">{username || 'Player'}: {p1Score}</span>
        <span className="font-heading font-black text-white text-sm">FIRST TO 5 GOALS</span>
        <span className="font-heading font-black text-red-400 text-lg">AI BOT: {p2Score}</span>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-green-500/40 shadow-2xl bg-[#06080e]">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full block" />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">FULL TIME!</h2>
            <p className="text-xl font-heading font-bold text-cyan-400 mb-6">{p1Score >= 5 ? 'YOU WON THE MATCH!' : 'AI BOT WON!'}</p>
            <div className="flex gap-4">
              <button onClick={() => { setP1Score(0); setP2Score(0); setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
              <button onClick={onExit} className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[800px] mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
        Controls: <b>[A / D]</b> or <b>[← / →]</b> Move + <b>[W / ↑]</b> Jump + <b>[Spacebar]</b> Power Kick!
      </div>
    </div>
  );
}
