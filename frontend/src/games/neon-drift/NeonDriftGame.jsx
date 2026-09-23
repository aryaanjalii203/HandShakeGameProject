import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { soundEngine } from '../../services/soundEngine.js';
import { Gauge, Trophy, RotateCcw, LogOut, ArrowUp, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

export function NeonDriftGame({ isSolo = false, onExit }) {
  const { gameState, sendInput, activeRoom, restartGame, leaveRoom } = useGame();
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [soloState, setSoloState] = useState(null);
  const soloLoopRef = useRef(null);
  const inputsRef = useRef({ forward: false, reverse: false, left: false, right: false });

  const isOnline = !isSolo && activeRoom;
  const currentState = isOnline ? gameState : soloState;

  // Solo mode loop
  useEffect(() => {
    if (isSolo) {
      const p1Id = 'local-player';
      const aiId = 'ai-racer';
      const width = 900;
      const height = 600;

      const initial = {
        width,
        height,
        countdown: 3,
        isOver: false,
        winner: null,
        startTime: null,
        boostPads: [
          { x: 450, y: 100, width: 60, height: 40 },
          { x: 450, y: 500, width: 60, height: 40 }
        ],
        cars: {
          [p1Id]: {
            id: p1Id,
            username: username || 'Player',
            color: '#00f0ff',
            x: 180,
            y: 480,
            angle: 0,
            speed: 0,
            maxSpeed: 7.5,
            lap: 1,
            totalLaps: 3,
            currentCheckpoint: 0,
            boostTimer: 0,
            finished: false
          },
          [aiId]: {
            id: aiId,
            username: 'NEON-BOT',
            color: '#ff007f',
            x: 180,
            y: 515,
            angle: 0,
            speed: 0,
            maxSpeed: 6.8,
            lap: 1,
            totalLaps: 3,
            currentCheckpoint: 0,
            boostTimer: 0,
            finished: false
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
          initial.startTime = Date.now();
          startSoloDriftLoop();
        }
      }, 1000);

      return () => {
        clearInterval(timer);
        if (soloLoopRef.current) clearInterval(soloLoopRef.current);
      };
    }
  }, [isSolo]);

  const startSoloDriftLoop = () => {
    const checkpoints = [
      { id: 0, x: 150, y: 120, radius: 80 },
      { id: 1, x: 750, y: 120, radius: 80 },
      { id: 2, x: 750, y: 480, radius: 80 },
      { id: 3, x: 150, y: 480, radius: 80 }
    ];

    soloLoopRef.current = setInterval(() => {
      setSoloState(prev => {
        if (!prev || prev.isOver || prev.countdown) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // Update AI racer
        const ai = next.cars['ai-racer'];
        if (ai && !ai.finished) {
          const target = checkpoints[ai.currentCheckpoint];
          const targetAngle = Math.atan2(target.y - ai.y, target.x - ai.x);
          let angleDiff = targetAngle - ai.angle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          ai.angle += Math.max(-0.06, Math.min(0.06, angleDiff));
          ai.speed = Math.min(ai.maxSpeed, ai.speed + 0.2);
          ai.x += Math.cos(ai.angle) * ai.speed;
          ai.y += Math.sin(ai.angle) * ai.speed;

          if (Math.hypot(ai.x - target.x, ai.y - target.y) < target.radius) {
            ai.currentCheckpoint = (ai.currentCheckpoint + 1) % checkpoints.length;
            if (ai.currentCheckpoint === 0) {
              ai.lap++;
              if (ai.lap > ai.totalLaps) {
                ai.finished = true;
                if (!next.winner) {
                  next.winner = ai.username;
                  next.isOver = true;
                  recordMatchResult('neon-drift', false);
                }
              }
            }
          }
        }

        // Update Local Player Car
        const p = next.cars['local-player'];
        if (p && !p.finished) {
          const inp = inputsRef.current;
          if (inp.left) p.angle -= 0.055;
          if (inp.right) p.angle += 0.055;
          if (inp.forward) p.speed = Math.min(p.maxSpeed, p.speed + 0.35);
          else if (inp.reverse) p.speed = Math.max(-2.5, p.speed - 0.25);
          else p.speed *= 0.96;

          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;
          p.x = Math.max(30, Math.min(next.width - 30, p.x));
          p.y = Math.max(30, Math.min(next.height - 30, p.y));

          // Check checkpoints
          const target = checkpoints[p.currentCheckpoint];
          if (Math.hypot(p.x - target.x, p.y - target.y) < target.radius) {
            p.currentCheckpoint = (p.currentCheckpoint + 1) % checkpoints.length;
            if (p.currentCheckpoint === 0) {
              p.lap++;
              if (p.lap > p.totalLaps) {
                p.finished = true;
                if (!next.winner) {
                  next.winner = p.username;
                  next.isOver = true;
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                  recordMatchResult('neon-drift', true);
                }
              }
            }
          }
        }

        return next;
      });
    }, 1000 / 60);
  };

  // Keyboard controls with preventDefault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      let changed = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { inputsRef.current.forward = true; changed = true; }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { inputsRef.current.reverse = true; changed = true; }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { inputsRef.current.left = true; changed = true; }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { inputsRef.current.right = true; changed = true; }

      if (changed && isOnline) {
        sendInput(inputsRef.current);
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      let changed = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { inputsRef.current.forward = false; changed = true; }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { inputsRef.current.reverse = false; changed = true; }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { inputsRef.current.left = false; changed = true; }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { inputsRef.current.right = false; changed = true; }

      if (changed && isOnline) {
        sendInput(inputsRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOnline, sendInput]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentState) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Track Outer Oval Boundary
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 12;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Track Inner Island
    ctx.fillStyle = '#07090e';
    ctx.fillRect(220, 200, canvas.width - 440, canvas.height - 400);
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.lineWidth = 8;
    ctx.strokeRect(220, 200, canvas.width - 440, canvas.height - 400);

    // Finish Line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(150, 480);
    ctx.lineTo(150, 540);
    ctx.stroke();
    ctx.setLineDash([]);

    // Boost Pads
    if (currentState.boostPads) {
      for (const pad of currentState.boostPads) {
        ctx.fillStyle = 'rgba(255, 230, 0, 0.2)';
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 2;
        ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
        ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
      }
    }

    // Render Cars
    if (currentState.cars) {
      for (const car of Object.values(currentState.cars)) {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);

        ctx.shadowColor = car.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = car.color;
        ctx.fillRect(-18, -10, 36, 20);

        ctx.fillStyle = '#07090e';
        ctx.fillRect(2, -7, 10, 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, -8, 3, 4);
        ctx.fillRect(16, 4, 3, 4);

        ctx.restore();
      }
    }
  }, [currentState]);

  const cars = currentState?.cars ? Object.values(currentState.cars) : [];

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-pink-400" />
          <span className="font-heading font-black text-white text-lg">NEON DRIFT</span>
        </div>

        <div className="flex items-center gap-6">
          {cars.map(car => (
            <div key={car.id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: car.color }} />
              <span className="font-heading text-xs text-white">{car.username}</span>
              <span className="font-heading text-xs font-bold text-cyan-400">Lap {car.lap}/3</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[3/2] max-w-[900px] rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-2xl bg-[#07090e]">
        <canvas ref={canvasRef} width={900} height={600} className="w-full h-full block" />

        {/* Countdown */}
        {currentState?.countdown && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
            <span className="text-8xl font-heading font-black text-pink-500 animate-ping">
              {currentState.countdown}
            </span>
          </div>
        )}

        {/* Game Over */}
        {currentState?.isOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">PODIUM FINISH!</h2>
            <p className="text-xl font-heading font-bold text-pink-400 mb-6">{currentState.winner} Takes First Place!</p>
            <div className="flex gap-4">
              <button onClick={() => { if (isOnline) restartGame(); else onExit(); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
              <button onClick={() => { if (isOnline) leaveRoom(); onExit(); }} className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[900px] mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
        Controls: <b>[WASD]</b> or <b>[Arrow Keys]</b> to Steer, Drift, and Accelerate!
      </div>

    </div>
  );
}
