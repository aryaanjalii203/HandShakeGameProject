import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Shield, Trophy, RotateCcw, LogOut, Zap } from 'lucide-react';

export function TowerDefendersGame({ isSolo = true, onExit }) {
  const { recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);
  const [credits, setCredits] = useState(250);
  const [wave, setWave] = useState(1);
  const [baseHp, setBaseHp] = useState(100);
  const [isOver, setIsOver] = useState(false);

  const stateRef = useRef({
    turrets: [
      { x: 180, y: 150, range: 140, damage: 15, cooldown: 0 },
      { x: 420, y: 350, range: 140, damage: 15, cooldown: 0 }
    ],
    enemies: [],
    spawnTimer: 0,
    lasers: []
  });

  const path = [
    { x: 0, y: 240 },
    { x: 260, y: 240 },
    { x: 260, y: 100 },
    { x: 540, y: 100 },
    { x: 540, y: 380 },
    { x: 800, y: 380 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;

      // Spawn enemies
      s.spawnTimer++;
      if (s.spawnTimer > Math.max(25, 60 - wave * 4)) {
        s.spawnTimer = 0;
        s.enemies.push({
          x: path[0].x,
          y: path[0].y,
          pathIdx: 0,
          hp: 40 + wave * 15,
          maxHp: 40 + wave * 15,
          speed: 1.8 + wave * 0.2
        });
      }

      // Move enemies along waypoint path
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const en = s.enemies[i];
        const target = path[en.pathIdx + 1];
        if (!target) {
          // Reached Base
          s.enemies.splice(i, 1);
          setBaseHp(h => {
            const next = h - 15;
            if (next <= 0 && !isOver) {
              setIsOver(true);
              recordMatchResult('tower-defenders', false);
            }
            return Math.max(0, next);
          });
          soundEngine.play('explosion');
          continue;
        }

        const angle = Math.atan2(target.y - en.y, target.x - en.x);
        en.x += Math.cos(angle) * en.speed;
        en.y += Math.sin(angle) * en.speed;

        if (Math.hypot(en.x - target.x, en.y - target.y) < 6) {
          en.pathIdx++;
        }
      }

      // Turrets shoot enemies
      for (const t of s.turrets) {
        if (t.cooldown > 0) t.cooldown--;
        if (t.cooldown === 0) {
          const target = s.enemies.find(en => Math.hypot(en.x - t.x, en.y - t.y) < t.range);
          if (target) {
            t.cooldown = 18;
            target.hp -= t.damage;
            s.lasers.push({ x1: t.x, y1: t.y, x2: target.x, y2: target.y, timer: 4 });
            soundEngine.play('laser');

            if (target.hp <= 0) {
              const idx = s.enemies.indexOf(target);
              if (idx !== -1) s.enemies.splice(idx, 1);
              setCredits(c => c + 35);
              soundEngine.play('powerup');
            }
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road path
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 44;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let p = 1; p < path.length; p++) ctx.lineTo(path[p].x, path[p].y);
      ctx.stroke();

      // Road center stripe
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Turrets
      for (const t of s.turrets) {
        // Range ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(t.x - 3, t.y - 12, 6, 24);
        ctx.shadowBlur = 0;
      }

      // Draw Lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        const lz = s.lasers[i];
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lz.x1, lz.y1);
        ctx.lineTo(lz.x2, lz.y2);
        ctx.stroke();
        lz.timer--;
        if (lz.timer <= 0) s.lasers.splice(i, 1);
      }

      // Draw Enemies
      for (const en of s.enemies) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 11, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x - 12, en.y - 18, 24 * (en.hp / en.maxHp), 4);
      }

      if (!isOver) animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [wave, isOver]);

  const handleCanvasClick = (e) => {
    if (credits < 100) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);

    soundEngine.play('click');
    setCredits(c => c - 100);
    stateRef.current.turrets.push({
      x, y, range: 140, damage: 15, cooldown: 0
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-blue-500/30">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-heading font-black text-white text-lg">TOWER DEFENDERS</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-yellow-400">⚡ Energy Credits: {credits}</span>
          <span className="text-cyan-400">Wave {wave}</span>
          <span className="text-red-400">Base Shield: {baseHp}%</span>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-2xl bg-[#090d16]">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-pointer"
        />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">REACTOR OVERRUN!</h2>
            <p className="text-xl font-heading font-bold text-cyan-400 mb-6">Survived to Wave {wave}</p>
            <div className="flex gap-4">
              <button onClick={() => { setBaseHp(100); setCredits(250); setWave(1); stateRef.current.enemies = []; setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button onClick={onExit} className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[800px] mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
        Click anywhere on the arena grid to build a <b>Plasma Laser Turret (Cost: 100 Credits)</b>!
      </div>
    </div>
  );
}
