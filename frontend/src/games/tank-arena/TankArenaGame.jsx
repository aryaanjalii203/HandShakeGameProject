import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Shield, Trophy, RotateCcw, LogOut } from 'lucide-react';

export function TankArenaGame({ isSolo = true, onExit }) {
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const stateRef = useRef({
    player: { x: 100, y: 250, angle: 0, speed: 0, maxSpeed: 4, hp: 100, color: '#00f0ff' },
    bot: { x: 700, y: 250, angle: Math.PI, speed: 0, maxSpeed: 3, hp: 100, color: '#ef4444', shootTimer: 0 },
    bullets: [],
    obstacles: [
      { x: 250, y: 100, w: 30, h: 300 },
      { x: 520, y: 100, w: 30, h: 300 },
      { x: 340, y: 220, w: 120, h: 60 }
    ],
    keys: { forward: false, reverse: false, left: false, right: false, shoot: false }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.forward = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.reverse = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
      if (e.code === 'Space') shootBullet(stateRef.current.player);
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.forward = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.reverse = false;
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

  const shootBullet = (tank) => {
    soundEngine.play('laser');
    stateRef.current.bullets.push({
      x: tank.x + Math.cos(tank.angle) * 22,
      y: tank.y + Math.sin(tank.angle) * 22,
      vx: Math.cos(tank.angle) * 9,
      vy: Math.sin(tank.angle) * 9,
      bounces: 0,
      owner: tank === stateRef.current.player ? 'player' : 'bot'
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;
      const p = s.player;
      const b = s.bot;

      // Update Player Tank
      if (s.keys.left) p.angle -= 0.05;
      if (s.keys.right) p.angle += 0.05;
      if (s.keys.forward) p.speed = Math.min(p.maxSpeed, p.speed + 0.2);
      else if (s.keys.reverse) p.speed = Math.max(-2, p.speed - 0.2);
      else p.speed *= 0.92;

      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      p.x = Math.max(30, Math.min(770, p.x));
      p.y = Math.max(30, Math.min(470, p.y));

      // Update Bot Tank AI
      b.shootTimer++;
      const angleToPlayer = Math.atan2(p.y - b.y, p.x - b.x);
      b.angle += (angleToPlayer - b.angle) * 0.04;
      b.speed = 1.8;
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
      b.x = Math.max(30, Math.min(770, b.x));
      b.y = Math.max(30, Math.min(470, b.y));

      if (b.shootTimer > 75) {
        b.shootTimer = 0;
        shootBullet(b);
      }

      // Update Bullets & Bounces
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const bl = s.bullets[i];
        bl.x += bl.vx;
        bl.y += bl.vy;

        // Bounce off arena walls
        if (bl.x < 10 || bl.x > 790) { bl.vx *= -1; bl.bounces++; soundEngine.play('wall_hit'); }
        if (bl.y < 10 || bl.y > 490) { bl.vy *= -1; bl.bounces++; soundEngine.play('wall_hit'); }

        // Bounce off obstacles
        for (const ob of s.obstacles) {
          if (bl.x > ob.x && bl.x < ob.x + ob.w && bl.y > ob.y && bl.y < ob.y + ob.h) {
            bl.vx *= -1;
            bl.vy *= -1;
            bl.bounces++;
            soundEngine.play('wall_hit');
          }
        }

        // Damage tanks
        if (bl.owner !== 'player' && Math.hypot(bl.x - p.x, bl.y - p.y) < 22) {
          p.hp -= 20;
          soundEngine.play('explosion');
          s.bullets.splice(i, 1);
          if (p.hp <= 0 && !isOver) {
            setIsOver(true);
            setWinner('CYBER-TANK-BOT');
            recordMatchResult('tank-arena', false);
          }
          continue;
        }

        if (bl.owner !== 'bot' && Math.hypot(bl.x - b.x, bl.y - b.y) < 22) {
          b.hp -= 25;
          soundEngine.play('explosion');
          s.bullets.splice(i, 1);
          if (b.hp <= 0 && !isOver) {
            setIsOver(true);
            setWinner(username || 'Player');
            confetti({ particleCount: 100, spread: 70 });
            recordMatchResult('tank-arena', true);
          }
          continue;
        }

        if (bl.bounces > 2) {
          s.bullets.splice(i, 1);
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Arena Floor
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Obstacles
      ctx.fillStyle = '#44403c';
      ctx.strokeStyle = '#78716c';
      for (const ob of s.obstacles) {
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      }

      // Draw Tank Function
      const drawTank = (tank, color) => {
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillRect(-18, -14, 36, 28);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fillRect(0, -3, 22, 6);
        ctx.restore();
      };

      drawTank(p, '#00f0ff');
      drawTank(b, '#ef4444');

      // Bullets
      for (const bl of s.bullets) {
        ctx.fillStyle = bl.owner === 'player' ? '#00f0ff' : '#ef4444';
        ctx.beginPath();
        ctx.arc(bl.x, bl.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isOver) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isOver]);

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-red-500/30">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-heading font-black text-white text-lg">TANK ARENA 2099</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-cyan-400">Player HP: {stateRef.current.player.hp}%</span>
          <span className="text-red-400">Enemy Tank: {stateRef.current.bot.hp}%</span>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-2xl bg-[#090d16]">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full block" />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">MATCH OVER!</h2>
            <p className="text-xl font-heading font-bold text-cyan-400 mb-6">{winner} Won the Tank Duel!</p>
            <div className="flex gap-4">
              <button onClick={() => { stateRef.current.player.hp = 100; stateRef.current.bot.hp = 100; stateRef.current.bullets = []; setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
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
        Controls: <b>[WASD]</b> or <b>[Arrow Keys]</b> to Drive & Steer + <b>[Spacebar]</b> to Fire Laser Shells!
      </div>
    </div>
  );
}
