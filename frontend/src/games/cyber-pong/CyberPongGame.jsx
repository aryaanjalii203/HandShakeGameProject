import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { soundEngine } from '../../services/soundEngine.js';
import { Zap, Trophy, RotateCcw, LogOut, Smartphone } from 'lucide-react';

export function CyberPongGame({ isSolo = false, onExit }) {
  const { gameState, sendInput, activeRoom, restartGame, leaveRoom } = useGame();
  const { username, recordMatchResult } = usePlayer();
  const canvasRef = useRef(null);

  const [soloState, setSoloState] = useState(null);
  const [localGameOver, setLocalGameOver] = useState(null);
  const soloLoopRef = useRef(null);

  const isOnline = !isSolo && activeRoom;
  const currentState = isOnline ? gameState : soloState;

  const keysRef = useRef({ up: false, down: false });

  // Solo Mode Game Engine Initialization
  useEffect(() => {
    if (isSolo) {
      const p1Id = 'local-player';
      const p2Id = 'ai-bot';
      const width = 800;
      const height = 500;

      const initialState = {
        width,
        height,
        scoreLimit: 7,
        countdown: 3,
        isOver: false,
        winner: null,
        paddles: {
          [p1Id]: {
            id: p1Id,
            username: username || 'Player',
            side: 'left',
            x: 25,
            y: 205,
            width: 14,
            height: 90,
            baseHeight: 90,
            speed: 8,
            score: 0,
            color: '#00f0ff',
            powerup: null,
            powerupTimer: 0
          },
          [p2Id]: {
            id: p2Id,
            username: 'CYBER-AI (Hard)',
            side: 'right',
            x: 761,
            y: 205,
            width: 14,
            height: 90,
            baseHeight: 90,
            speed: 7,
            score: 0,
            color: '#ff007f',
            powerup: null,
            powerupTimer: 0
          }
        },
        balls: [
          {
            id: 'b1',
            x: 400,
            y: 250,
            vx: 6,
            vy: 2,
            radius: 9,
            baseSpeed: 6.5,
            speed: 6.5,
            color: '#00f0ff'
          }
        ],
        powerups: []
      };

      setSoloState(initialState);

      let count = 3;
      const countTimer = setInterval(() => {
        count--;
        setSoloState(prev => prev ? { ...prev, countdown: count > 0 ? count : null } : null);
        if (count <= 0) {
          clearInterval(countTimer);
          startSoloLoop();
        }
      }, 1000);

      return () => {
        clearInterval(countTimer);
        if (soloLoopRef.current) clearInterval(soloLoopRef.current);
      };
    }
  }, [isSolo]);

  const startSoloLoop = () => {
    let powerupTimer = 0;

    soloLoopRef.current = setInterval(() => {
      setSoloState(prev => {
        if (!prev || prev.isOver || prev.countdown) return prev;
        const next = JSON.parse(JSON.stringify(prev));

        // 0. Continuous Player Paddle Movement
        const p1 = next.paddles['local-player'];
        if (p1) {
          if (keysRef.current.up) p1.y -= p1.speed;
          if (keysRef.current.down) p1.y += p1.speed;
          p1.y = Math.max(10, Math.min(next.height - p1.height - 10, p1.y));
        }

        // 1. AI Paddle Movement Logic
        const ball = next.balls[0];
        const aiPaddle = next.paddles['ai-bot'];
        if (ball && aiPaddle) {
          const targetY = ball.y - aiPaddle.height / 2;
          const diff = targetY - aiPaddle.y;
          aiPaddle.y += Math.max(-aiPaddle.speed, Math.min(aiPaddle.speed, diff * 0.15));
          aiPaddle.y = Math.max(10, Math.min(next.height - aiPaddle.height - 10, aiPaddle.y));
        }

        // 2. Powerups spawn
        powerupTimer++;
        if (powerupTimer > 60 * 12 && next.powerups.length < 2) {
          powerupTimer = 0;
          const types = ['multi_ball', 'speed_boost', 'long_paddle'];
          next.powerups.push({
            id: `pw-${Date.now()}`,
            type: types[Math.floor(Math.random() * types.length)],
            x: 200 + Math.random() * 400,
            y: 80 + Math.random() * (next.height - 160),
            radius: 16
          });
        }

        // 3. Move & Bounce Balls
        for (let i = next.balls.length - 1; i >= 0; i--) {
          const b = next.balls[i];
          b.x += b.vx;
          b.y += b.vy;

          // Wall bounce
          if (b.y - b.radius <= 0) {
            b.y = b.radius;
            b.vy = Math.abs(b.vy);
            soundEngine.play('wall_hit');
          } else if (b.y + b.radius >= next.height) {
            b.y = next.height - b.radius;
            b.vy = -Math.abs(b.vy);
            soundEngine.play('wall_hit');
          }

          // Paddle collision
          for (const paddle of Object.values(next.paddles)) {
            if (
              b.x - b.radius < paddle.x + paddle.width &&
              b.x + b.radius > paddle.x &&
              b.y + b.radius > paddle.y &&
              b.y - b.radius < paddle.y + paddle.height
            ) {
              const hitOffset = (b.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
              const bounceAngle = hitOffset * (Math.PI / 3.2);
              b.speed = Math.min(15, b.speed + 0.35);

              const dir = paddle.side === 'left' ? 1 : -1;
              b.vx = Math.cos(bounceAngle) * b.speed * dir;
              b.vy = Math.sin(bounceAngle) * b.speed;

              if (paddle.side === 'left') {
                b.x = paddle.x + paddle.width + b.radius;
              } else {
                b.x = paddle.x - b.radius;
              }
              soundEngine.play('paddle_hit');
            }
          }

          // Goal Scoring
          if (b.x < 0) {
            next.paddles['ai-bot'].score++;
            soundEngine.play('score');
            if (next.paddles['ai-bot'].score >= next.scoreLimit) {
              next.isOver = true;
              next.winner = 'CYBER-AI (Hard)';
              setLocalGameOver({ winner: next.winner });
              recordMatchResult('cyber-pong', false, next.paddles['local-player'].score);
            } else {
              b.x = next.width / 2;
              b.y = next.height / 2;
              b.vx = 6.5;
              b.vy = 2;
              b.speed = 6.5;
            }
            break;
          } else if (b.x > next.width) {
            next.paddles['local-player'].score++;
            soundEngine.play('score');
            if (next.paddles['local-player'].score >= next.scoreLimit) {
              next.isOver = true;
              next.winner = username || 'Player';
              setLocalGameOver({ winner: next.winner });
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              recordMatchResult('cyber-pong', true, next.paddles['local-player'].score);
            } else {
              b.x = next.width / 2;
              b.y = next.height / 2;
              b.vx = -6.5;
              b.vy = -2;
              b.speed = 6.5;
            }
            break;
          }
        }

        return next;
      });
    }, 1000 / 60);
  };

  // Keyboard Event Listeners with PREVENT DEFAULT (Stops window scrolling!)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', ' '].includes(e.key)) {
        e.preventDefault(); // Prevents page from scrolling
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = true;
        if (isOnline) sendInput({ up: true, down: false, targetY: null });
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = true;
        if (isOnline) sendInput({ up: false, down: true, targetY: null });
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = false;
        if (isOnline) sendInput({ up: false, down: keysRef.current.down, targetY: null });
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = false;
        if (isOnline) sendInput({ up: keysRef.current.up, down: false, targetY: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOnline, sendInput]);

  const moveSoloPlayer = (deltaY) => {
    setSoloState(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const p = next.paddles['local-player'];
      if (p) {
        p.y = Math.max(10, Math.min(next.height - p.height - 10, p.y + deltaY));
      }
      return next;
    });
  };

  // Touch Drag Controller with scaled coordinates
  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleY = 500 / rect.height;
    const targetY = (clientY - rect.top) * scaleY;

    if (isOnline) {
      sendInput({ targetY, up: false, down: false });
    } else {
      setSoloState(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        const p = next.paddles['local-player'];
        if (p) {
          p.y = Math.max(10, Math.min(next.height - p.height - 10, targetY - p.height / 2));
        }
        return next;
      });
    }
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentState) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Cyber Grid Background
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Center Net Line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Render Paddles
    if (currentState.paddles) {
      for (const p of Object.values(currentState.paddles)) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + 3, p.y + 6, p.width - 6, p.height - 12);
        ctx.shadowBlur = 0;
      }
    }

    // 4. Render Balls with Motion Trails
    if (currentState.balls) {
      for (const b of currentState.balls) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = b.color || '#00f0ff';

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // 5. Render Powerups
    if (currentState.powerups) {
      for (const pw of currentState.powerups) {
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', pw.x, pw.y);
        ctx.shadowBlur = 0;
      }
    }
  }, [currentState]);

  useEffect(() => {
    if (currentState?.isOver && currentState?.winner) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
    }
  }, [currentState?.isOver]);

  const paddles = currentState?.paddles ? Object.values(currentState.paddles) : [];
  const p1 = paddles[0];
  const p2 = paddles[1];

  return (
    <div className="w-full max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      
      {/* Header Scoreboard */}
      <div className="w-full flex items-center justify-between mb-3 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/30">
        
        {/* Left Player */}
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: p1?.color || '#00f0ff' }} />
          <div>
            <span className="font-heading font-black text-sm text-white block">
              {p1?.username || 'Player 1'}
            </span>
            <span className="text-[10px] text-cyan-400 uppercase font-bold">Left Wing</span>
          </div>
          <span className="text-3xl font-heading font-black text-cyan-400 ml-2">
            {p1?.score || 0}
          </span>
        </div>

        {/* Center Target Indicator */}
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
            Target: 7 Points
          </span>
          <span className="text-xs font-heading font-black text-pink-400">
            {isSolo ? 'SOLO VS AI' : `ROOM ${activeRoom?.id}`}
          </span>
        </div>

        {/* Right Player */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-heading font-black text-pink-500 mr-2">
            {p2?.score || 0}
          </span>
          <div className="text-right">
            <span className="font-heading font-black text-sm text-white block">
              {p2?.username || 'Player 2'}
            </span>
            <span className="text-[10px] text-pink-400 uppercase font-bold">Right Wing</span>
          </div>
          <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: p2?.color || '#ff007f' }} />
        </div>

      </div>

      {/* Main Canvas Arena */}
      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl bg-[#06080e] touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onTouchMove={handleTouchMove}
          onMouseMove={(e) => { if (e.buttons === 1) handleTouchMove(e); }}
          className="w-full h-full block cursor-ns-resize"
        />

        {/* Countdown Overlay */}
        {currentState?.countdown && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
            <span className="text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 animate-ping">
              {currentState.countdown}
            </span>
            <p className="text-sm font-heading font-bold text-cyan-300 mt-4 tracking-widest uppercase">
              Prepare for Duel
            </p>
          </div>
        )}

        {/* Game Over Celebration Screen */}
        {currentState?.isOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white mb-2">
              VICTORY!
            </h2>
            <p className="text-xl font-heading font-bold text-cyan-400 mb-6">
              {currentState.winner} Dominated the Arena!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {isOnline ? (
                <button
                  onClick={restartGame}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Rematch</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSoloState(null);
                    onExit();
                  }}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (isOnline) leaveRoom();
                  onExit();
                }}
                className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Return to Arenas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="w-full max-w-[800px] mt-3 flex items-center justify-between gap-2 text-xs text-slate-400 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>Mobile: Drag paddle on screen</span>
        </div>
        <div>
          <span>Desktop: <b>[W / S]</b> or <b>[↑ / ↓]</b> Arrow Keys (Screen is locked in place)</span>
        </div>
      </div>

    </div>
  );
}
