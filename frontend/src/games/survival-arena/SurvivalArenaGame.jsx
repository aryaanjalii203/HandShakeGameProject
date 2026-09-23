import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Flame, Shield, Zap } from 'lucide-react';

export function SurvivalArenaGame({ isSolo = true, onExit }) {
  const { recordMatchResult, stats } = usePlayer();
  const canvasRef = useRef(null);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [highScore, setHighScore] = useState(() => (stats?.highScores?.['survival-arena'] || 0));

  const stateRef = useRef({
    player: { x: 400, y: 110, radius: 13, speed: 5.5 },
    beamAngle: 0,
    beamSpeed: 0.010, // Balanced starting rotation (~10s per full rotation)
    hazards: [],
    spawnTimer: 0,
    countdownVal: 3,
    invulnerableFrames: 180, // 3 seconds grace period at 60 FPS
    keys: { up: false, down: false, left: false, right: false },
    elapsedTicks: 0
  });

  // Countdown and survival timer
  useEffect(() => {
    let timer = null;
    let countTimer = null;

    countTimer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countTimer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    timer = setInterval(() => {
      if (!isOver && stateRef.current.countdownVal <= 0) {
        setSurvivalTime(t => {
          const nextTime = t + 1;
          const currentScore = nextTime * 100;
          if (currentScore > highScore) setHighScore(currentScore);
          return nextTime;
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(countTimer);
    };
  }, [isOver, highScore]);

  // Keyboard controls with preventDefault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = stateRef.current.keys;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') k.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') k.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(e.key)) {
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

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      const s = stateRef.current;
      const p = s.player;
      s.elapsedTicks++;

      // Update countdown internal state
      if (s.countdownVal > 0) {
        if (s.elapsedTicks % 60 === 0) {
          s.countdownVal--;
        }
      }

      if (s.invulnerableFrames > 0) {
        s.invulnerableFrames--;
      }

      // Player Movement (active immediately so player can position)
      if (s.keys.up) p.y -= p.speed;
      if (s.keys.down) p.y += p.speed;
      if (s.keys.left) p.x -= p.speed;
      if (s.keys.right) p.x += p.speed;

      // Keep inside Arena circular boundary
      const distFromCenter = Math.hypot(p.x - 400, p.y - 250);
      const maxRadius = 210;
      if (distFromCenter > maxRadius - p.radius) {
        const angle = Math.atan2(p.y - 250, p.x - 400);
        p.x = 400 + Math.cos(angle) * (maxRadius - p.radius);
        p.y = 250 + Math.sin(angle) * (maxRadius - p.radius);
      }

      // Rotate Laser Sweeper Beam smoothly
      // Starts gentle (0.010 rad/frame) and smoothly scales by +0.00002 per frame
      s.beamSpeed = 0.010 + Math.min(0.025, s.elapsedTicks * 0.00002);
      s.beamAngle += s.beamSpeed;

      // Hazards only spawn after countdown
      if (s.countdownVal <= 0) {
        s.spawnTimer++;
        const spawnInterval = Math.max(45, 90 - Math.floor(s.elapsedTicks / 180));
        if (s.spawnTimer > spawnInterval) {
          s.spawnTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.8 + Math.random() * 1.5;
          s.hazards.push({
            x: 400 + Math.cos(angle) * 320,
            y: 250 + Math.sin(angle) * 320,
            vx: -Math.cos(angle) * speed,
            vy: -Math.sin(angle) * speed,
            radius: 9,
            pulse: 0
          });
        }
      }

      // Check Hazard Collisions
      for (let i = s.hazards.length - 1; i >= 0; i--) {
        const h = s.hazards[i];
        h.x += h.vx;
        h.y += h.vy;
        h.pulse += 0.1;

        if (s.invulnerableFrames <= 0 && Math.hypot(p.x - h.x, p.y - h.y) < p.radius + h.radius) {
          setIsOver(true);
          soundEngine.play('explosion');
          recordMatchResult('survival-arena', true, survivalTime * 100);
          break;
        }

        if (h.x < -40 || h.x > 840 || h.y < -40 || h.y > 540) {
          s.hazards.splice(i, 1);
        }
      }

      // Check Laser Beam Line Collision
      const beamLen = 330;
      const beamX1 = 400 + Math.cos(s.beamAngle) * beamLen;
      const beamY1 = 250 + Math.sin(s.beamAngle) * beamLen;
      const beamX2 = 400 - Math.cos(s.beamAngle) * beamLen;
      const beamY2 = 250 - Math.sin(s.beamAngle) * beamLen;

      // Distance from player to segment
      const l2 = (beamLen * 2) * (beamLen * 2);
      const t = Math.max(0, Math.min(1, ((p.x - beamX2) * (beamX1 - beamX2) + (p.y - beamY2) * (beamY1 - beamY2)) / l2));
      const projX = beamX2 + t * (beamX1 - beamX2);
      const projY = beamY2 + t * (beamY1 - beamY2);

      // Collision trigger (only if not invulnerable and game active)
      if (s.invulnerableFrames <= 0 && s.countdownVal <= 0 && Math.hypot(p.x - projX, p.y - projY) < p.radius + 5) {
        setIsOver(true);
        soundEngine.play('explosion');
        recordMatchResult('survival-arena', true, survivalTime * 100);
      }

      // -------------------------------------------------------------
      // RENDERING
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Arena Floor Dark Tech Grid
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background decorative grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let gx = 50; gx < 800; gx += 50) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, 500);
        ctx.stroke();
      }
      for (let gy = 50; gy < 500; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(800, gy);
        ctx.stroke();
      }

      // Outer Danger Ring
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(400, 250, 210, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Safe Ring
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(400, 250, 110, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Laser Sweeper Beam (Glowing)
      const laserGlow = ctx.createLinearGradient(beamX1, beamY1, beamX2, beamY2);
      laserGlow.addColorStop(0, '#ff0055');
      laserGlow.addColorStop(0.5, '#ffffff');
      laserGlow.addColorStop(1, '#ff0055');

      ctx.strokeStyle = laserGlow;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = s.invulnerableFrames > 0 ? 8 : 18;
      ctx.beginPath();
      ctx.moveTo(beamX1, beamY1);
      ctx.lineTo(beamX2, beamY2);
      ctx.stroke();

      // Outer laser aura
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(beamX1, beamY1);
      ctx.lineTo(beamX2, beamY2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center Core Reactor
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(400, 250, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(400, 250, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hazards (Fireballs)
      for (const h of s.hazards) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius + Math.sin(h.pulse) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player Ball
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Player Inner Eye/Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - 3, p.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Invulnerability Shield Barrier
      if (s.invulnerableFrames > 0) {
        const pulse = (Math.sin(s.elapsedTicks * 0.15) + 1) * 0.5;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 8 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // On-Screen Countdown Display
      if (s.countdownVal > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(250, 180, 300, 140);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 180, 300, 140);

        ctx.font = 'bold 20px "Orbitron", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('GET READY!', 400, 220);

        ctx.font = '900 52px "Orbitron", sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.fillText(`${s.countdownVal}`, 400, 280);
        ctx.shadowBlur = 0;
      }

      if (!isOver) animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isOver, survivalTime]);

  const handleRestart = () => {
    stateRef.current.player = { x: 400, y: 110, radius: 13, speed: 5.5 };
    stateRef.current.beamAngle = 0;
    stateRef.current.beamSpeed = 0.010;
    stateRef.current.hazards = [];
    stateRef.current.spawnTimer = 0;
    stateRef.current.countdownVal = 3;
    stateRef.current.invulnerableFrames = 180;
    stateRef.current.elapsedTicks = 0;
    setSurvivalTime(0);
    setCountdown(3);
    setIsOver(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-2 flex flex-col items-center select-none">
      
      {/* Top Game HUD Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-6 py-2.5 rounded-2xl bg-slate-900/90 border border-red-500/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="font-heading font-black text-white text-lg tracking-wide">SURVIVAL ARENA</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
            DODGE & SURVIVE
          </span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <div className="flex items-center gap-1.5 text-yellow-400">
            <span>⏱️ Survival:</span>
            <span className="text-white font-mono text-base">{survivalTime}s</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Score:</span>
            <span className="text-white font-mono text-base">{survivalTime * 100}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-purple-400">
            <Trophy className="w-4 h-4" />
            <span>Best:</span>
            <span className="text-white font-mono text-base">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-2xl bg-[#09090b]">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full block" />

        {/* Game Over Screen */}
        {isOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mb-3 shadow-lg shadow-red-500/30 animate-bounce">
              <Flame className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-wide">ELIMINATED!</h2>
            <p className="text-lg font-heading font-bold text-slate-300 mb-1">
              You survived for <span className="text-yellow-400 font-black text-xl">{survivalTime} Seconds</span>
            </p>
            <p className="text-sm font-heading font-bold text-cyan-400 mb-6">
              Final Score: <span className="text-white font-mono">{survivalTime * 100} pts</span>
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleRestart} 
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/30 transition-transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button 
                onClick={onExit} 
                className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="w-full max-w-[800px] mt-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 text-center flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span><b>3s Shield</b> at spawn</span>
        </span>
        <span>•</span>
        <span>Controls: <b>[WASD]</b> or <b>[Arrow Keys]</b> to move your cyber sphere</span>
        <span>•</span>
        <span>Dodge the rotating laser & fireballs</span>
      </div>
    </div>
  );
}
