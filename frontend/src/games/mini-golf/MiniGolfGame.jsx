import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Flag, Trophy, RotateCcw, LogOut } from 'lucide-react';

export function MiniGolfGame({ isSolo = true, onExit }) {
  const { recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [isOver, setIsOver] = useState(false);

  const stateRef = useRef({
    ball: { x: 120, y: 350, vx: 0, vy: 0, radius: 8 },
    holePos: { x: 680, y: 150, radius: 14 },
    obstacles: [
      { x: 350, y: 100, w: 30, h: 280 },
      { x: 500, y: 0, w: 30, h: 220 }
    ],
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 0, y: 0 },
    inHole: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;
      const b = s.ball;

      // Ball Physics
      if (Math.hypot(b.vx, b.vy) > 0.05) {
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.975; // Friction
        b.vy *= 0.975;

        // Wall collisions
        if (b.x - b.radius <= 20) { b.x = 20 + b.radius; b.vx = -b.vx * 0.8; soundEngine.play('wall_hit'); }
        if (b.x + b.radius >= 780) { b.x = 780 - b.radius; b.vx = -b.vx * 0.8; soundEngine.play('wall_hit'); }
        if (b.y - b.radius <= 20) { b.y = 20 + b.radius; b.vy = -b.vy * 0.8; soundEngine.play('wall_hit'); }
        if (b.y + b.radius >= 480) { b.y = 480 - b.radius; b.vy = -b.vy * 0.8; soundEngine.play('wall_hit'); }

        // Obstacle collisions
        for (const ob of s.obstacles) {
          if (b.x + b.radius > ob.x && b.x - b.radius < ob.x + ob.w &&
              b.y + b.radius > ob.y && b.y - b.radius < ob.y + ob.h) {
            b.vx = -b.vx * 0.8;
            b.vy = -b.vy * 0.8;
            soundEngine.play('wall_hit');
          }
        }

        // Sink in hole check
        if (Math.hypot(b.x - s.holePos.x, b.y - s.holePos.y) < s.holePos.radius && !s.inHole) {
          s.inHole = true;
          b.vx = 0; b.vy = 0;
          b.x = s.holePos.x; b.y = s.holePos.y;
          soundEngine.play('powerup');
          confetti({ particleCount: 80, spread: 60 });
          setTimeout(nextHole, 1200);
        }
      } else {
        b.vx = 0; b.vy = 0;
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Putting Green Floor
      ctx.fillStyle = '#065f46';
      ctx.fillRect(20, 20, 760, 460);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 460);

      // Obstacles
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      for (const ob of s.obstacles) {
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      }

      // Hole
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(s.holePos.x, s.holePos.y, s.holePos.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6ee7b7';
      ctx.stroke();

      // Flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(s.holePos.x, s.holePos.y - 30);
      ctx.lineTo(s.holePos.x + 20, s.holePos.y - 20);
      ctx.lineTo(s.holePos.x, s.holePos.y - 10);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.holePos.x, s.holePos.y);
      ctx.lineTo(s.holePos.x, s.holePos.y - 35);
      ctx.stroke();

      // Aiming Line & Power
      if (s.isDragging) {
        const dx = s.dragStart.x - s.dragCurrent.x;
        const dy = s.dragStart.y - s.dragCurrent.y;
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + dx * 2, b.y + dy * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const nextHole = () => {
    if (hole >= 3) {
      setIsOver(true);
      recordMatchResult('mini-golf-chaos', true, totalStrokes + strokes);
      return;
    }
    setTotalStrokes(prev => prev + strokes);
    setStrokes(0);
    setHole(h => h + 1);
    const s = stateRef.current;
    s.inHole = false;
    s.ball.x = 120;
    s.ball.y = 250;
    s.holePos.x = 650;
    s.holePos.y = 250 + (Math.random() * 200 - 100);
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);
    const s = stateRef.current;

    if (Math.hypot(x - s.ball.x, y - s.ball.y) < 50 && s.ball.vx === 0 && s.ball.vy === 0) {
      s.isDragging = true;
      s.dragStart = { x, y };
      s.dragCurrent = { x, y };
    }
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);
    stateRef.current.dragCurrent = { x, y };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (s.isDragging) {
      s.isDragging = false;
      const dx = (s.dragStart.x - s.dragCurrent.x) * 0.14;
      const dy = (s.dragStart.y - s.dragCurrent.y) * 0.14;
      if (Math.hypot(dx, dy) > 0.5) {
        s.ball.vx = Math.max(-18, Math.min(18, dx));
        s.ball.vy = Math.max(-18, Math.min(18, dy));
        setStrokes(st => st + 1);
        soundEngine.play('paddle_hit');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-emerald-500/30">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-emerald-400" />
          <span className="font-heading font-black text-white text-lg">MINI GOLF CHAOS</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-cyan-400">Hole: {hole} / 3</span>
          <span className="text-yellow-400">Strokes this hole: {strokes}</span>
          <span className="text-pink-400">Total: {totalStrokes + strokes}</span>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-[#06080e] touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-crosshair"
        />

        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">COURSE FINISHED!</h2>
            <p className="text-xl font-heading font-bold text-emerald-400 mb-6">Total Score: {totalStrokes + strokes} Strokes</p>
            <div className="flex gap-4">
              <button onClick={() => { setHole(1); setStrokes(0); setTotalStrokes(0); setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
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
        Click / Touch and Drag back from the white golf ball to aim trajectory & power, release to putt!
      </div>
    </div>
  );
}
