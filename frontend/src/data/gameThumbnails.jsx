import React from 'react';

// Real-time illustrated thumbnail graphics for all 15 games
export function GameThumbnail({ gameId, className = "w-full h-full" }) {
  switch (gameId) {
    case 'cyber-pong':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pongGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="pongGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <rect width="300" height="180" fill="url(#pongGrad)" />
          {/* Net */}
          <line x1="150" y1="10" x2="150" y2="170" stroke="#38bdf8" strokeDasharray="6 6" strokeWidth="2" opacity="0.6" />
          {/* Left Paddle */}
          <rect x="25" y="55" width="10" height="70" rx="5" fill="#00f0ff" filter="url(#pongGlow)" />
          {/* Right Paddle */}
          <rect x="265" y="70" width="10" height="70" rx="5" fill="#ff007f" filter="url(#pongGlow)" />
          {/* Ball & Trail */}
          <circle cx="110" cy="85" r="4" fill="#38bdf8" opacity="0.3" />
          <circle cx="125" cy="88" r="6" fill="#38bdf8" opacity="0.6" />
          <circle cx="140" cy="90" r="9" fill="#ffffff" filter="url(#pongGlow)" />
          <circle cx="140" cy="90" r="14" fill="#00f0ff" opacity="0.3" />
          {/* Cyber Powerup */}
          <circle cx="180" cy="40" r="10" fill="#ffe600" opacity="0.8" />
          <text x="176" y="44" fontSize="12" fill="#000" fontWeight="bold">⚡</text>
        </svg>
      );

    case 'neon-drift':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="driftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a044e" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <filter id="driftGlow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <rect width="300" height="180" fill="url(#driftGrad)" />
          {/* Track curves */}
          <path d="M 30 140 C 100 140, 120 40, 220 40 C 270 40, 280 120, 240 150 C 180 190, 80 150, 30 140" fill="none" stroke="#1e1b4b" strokeWidth="48" />
          <path d="M 30 140 C 100 140, 120 40, 220 40 C 270 40, 280 120, 240 150 C 180 190, 80 150, 30 140" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8 8" opacity="0.6" />
          {/* Drift Smoke */}
          <circle cx="120" cy="85" r="12" fill="#ffffff" opacity="0.2" />
          <circle cx="135" cy="78" r="16" fill="#ffffff" opacity="0.3" />
          {/* Neon Racecar */}
          <g transform="translate(150, 70) rotate(-25)">
            <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#00f0ff" filter="url(#driftGlow)" />
            <rect x="2" y="-7" width="12" height="14" rx="2" fill="#090d16" />
            <rect x="16" y="-8" width="4" height="4" fill="#ffe600" />
            <rect x="16" y="4" width="4" height="4" fill="#ffe600" />
            <line x1="-18" y1="-8" x2="-28" y2="-12" stroke="#ff007f" strokeWidth="3" opacity="0.8" />
            <line x1="-18" y1="8" x2="-28" y2="12" stroke="#ff007f" strokeWidth="3" opacity="0.8" />
          </g>
        </svg>
      );

    case 'battle-grid':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bombGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <rect width="300" height="180" fill="url(#bombGrad)" />
          {/* Grid Blocks */}
          {[...Array(6)].map((_, i) => (
            [...Array(4)].map((_, j) => (
              <rect key={`${i}-${j}`} x={35 + i * 40} y={20 + j * 40} width="30" height="30" rx="6" fill="#1e293b" stroke="#0f766e" strokeWidth="2" />
            ))
          ))}
          {/* Explosion Wave */}
          <rect x="115" y="20" width="30" height="150" fill="#f59e0b" opacity="0.7" rx="4" />
          <rect x="35" y="60" width="230" height="30" fill="#f59e0b" opacity="0.7" rx="4" />
          <circle cx="130" cy="75" r="22" fill="#ef4444" opacity="0.9" />
          {/* Bomb */}
          <circle cx="210" cy="115" r="14" fill="#090d16" stroke="#ef4444" strokeWidth="3" />
          <text x="202" y="122" fontSize="16">💣</text>
        </svg>
      );

    case 'space-raiders':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect width="300" height="180" fill="url(#spaceGrad)" />
          {/* Stars */}
          <circle cx="40" cy="30" r="1.5" fill="#fff" />
          <circle cx="90" cy="80" r="2" fill="#fff" />
          <circle cx="200" cy="25" r="1.5" fill="#fff" />
          <circle cx="260" cy="70" r="2" fill="#fff" />
          {/* Invaders */}
          <text x="50" y="45" fontSize="22">👾</text>
          <text x="110" y="45" fontSize="22">👾</text>
          <text x="170" y="45" fontSize="22">👾</text>
          <text x="230" y="45" fontSize="22">👾</text>
          <text x="80" y="80" fontSize="22">👾</text>
          <text x="140" y="80" fontSize="22">👾</text>
          <text x="200" y="80" fontSize="22">👾</text>
          {/* Lasers */}
          <line x1="140" y1="130" x2="140" y2="90" stroke="#34d399" strokeWidth="4" />
          <line x1="160" y1="130" x2="160" y2="90" stroke="#34d399" strokeWidth="4" />
          {/* Starship */}
          <polygon points="150,120 130,155 170,155" fill="#39ff14" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );

    case 'color-clash':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="colorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          <rect width="300" height="180" fill="url(#colorGrad)" />
          {/* Painted tile matrix */}
          {[...Array(8)].map((_, i) => (
            [...Array(5)].map((_, j) => {
              const isCyan = (i + j) % 2 === 0;
              return (
                <rect key={`${i}-${j}`} x={15 + i * 34} y={10 + j * 32} width="30" height="28" rx="4" fill={isCyan ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 0, 127, 0.6)'} />
              );
            })
          ))}
          <circle cx="85" cy="75" r="14" fill="#00f0ff" stroke="#fff" strokeWidth="3" />
          <circle cx="215" cy="105" r="14" fill="#ff007f" stroke="#fff" strokeWidth="3" />
        </svg>
      );

    case 'word-blitz':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#1e1b4b" />
          <g transform="translate(30, 40)">
            {['C', 'Y', 'B', 'E', 'R'].map((letter, i) => (
              <g key={i} transform={`translate(${i * 50}, 0)`}>
                <rect width="42" height="50" rx="8" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" />
                <text x="21" y="34" fontSize="24" fill="#ffffff" fontWeight="900" textAnchor="middle">{letter}</text>
              </g>
            ))}
          </g>
          <rect x="75" y="115" width="150" height="35" rx="10" fill="#10b981" />
          <text x="150" y="138" fontSize="16" fill="#ffffff" fontWeight="900" textAnchor="middle">+350 PTS!</text>
        </svg>
      );

    case 'mini-golf-chaos':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#064e3b" />
          {/* Green fairway */}
          <path d="M 40 140 Q 150 20, 260 90" fill="none" stroke="#10b981" strokeWidth="50" strokeLinecap="round" />
          {/* Flag & Hole */}
          <circle cx="240" cy="85" r="10" fill="#0f172a" />
          <line x1="240" y1="85" x2="240" y2="40" stroke="#fff" strokeWidth="3" />
          <polygon points="240,40 265,50 240,60" fill="#ef4444" />
          {/* Golf Ball */}
          <circle cx="60" cy="135" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="60" y1="135" x2="110" y2="105" stroke="#ffe600" strokeWidth="3" strokeDasharray="4 4" />
        </svg>
      );

    case 'tank-arena':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#1c1917" />
          {/* Walls */}
          <rect x="70" y="40" width="160" height="16" fill="#78716c" rx="4" />
          <rect x="140" y="90" width="20" height="60" fill="#78716c" rx="4" />
          {/* Tank 1 */}
          <rect x="40" y="110" width="34" height="26" rx="4" fill="#0284c7" />
          <circle cx="57" cy="123" r="8" fill="#0369a1" />
          <line x1="57" y1="123" x2="85" y2="115" stroke="#38bdf8" strokeWidth="5" />
          {/* Laser shell */}
          <circle cx="115" cy="107" r="4" fill="#f43f5e" />
          {/* Tank 2 */}
          <rect x="220" y="110" width="34" height="26" rx="4" fill="#e11d48" />
          <circle cx="237" cy="123" r="8" fill="#be123c" />
          <line x1="237" y1="123" x2="205" y2="115" stroke="#fb7185" strokeWidth="5" />
        </svg>
      );

    case 'pixel-soccer':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#15803d" />
          <circle cx="150" cy="90" r="45" fill="none" stroke="#fff" strokeWidth="3" opacity="0.6" />
          <line x1="150" y1="0" x2="150" y2="180" stroke="#fff" strokeWidth="3" opacity="0.6" />
          {/* Goal post */}
          <rect x="0" y="55" width="20" height="70" fill="none" stroke="#fff" strokeWidth="3" />
          <rect x="280" y="55" width="20" height="70" fill="none" stroke="#fff" strokeWidth="3" />
          {/* Players */}
          <circle cx="80" cy="90" r="14" fill="#00f0ff" stroke="#fff" strokeWidth="2" />
          <circle cx="220" cy="90" r="14" fill="#ff007f" stroke="#fff" strokeWidth="2" />
          {/* Soccer Ball */}
          <circle cx="140" cy="85" r="11" fill="#ffffff" stroke="#000" strokeWidth="2" />
          <text x="133" y="92" fontSize="13">⚽</text>
        </svg>
      );

    case 'treasure-rush':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#451a03" />
          {/* Dungeon Cobblestone */}
          <rect x="30" y="30" width="240" height="120" rx="12" fill="#78350f" stroke="#d97706" strokeWidth="3" />
          <text x="60" y="75" fontSize="28">💎</text>
          <text x="135" y="65" fontSize="28">🪙</text>
          <text x="210" y="75" fontSize="28">👑</text>
          <text x="90" y="125" fontSize="28">💰</text>
          <text x="175" y="125" fontSize="28">💎</text>
          <circle cx="150" cy="100" r="15" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          <text x="142" y="106" fontSize="16">🏃</text>
        </svg>
      );

    case 'memory-wars':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#0f172a" />
          {[...Array(4)].map((_, i) => (
            [...Array(2)].map((_, j) => (
              <g key={`${i}-${j}`} transform={`translate(${40 + i * 60}, ${35 + j * 60})`}>
                <rect width="48" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="24" y="33" fontSize="20" textAnchor="middle">
                  {i === 0 ? '⚡' : i === 1 ? '🔥' : i === 2 ? '💎' : '👾'}
                </text>
              </g>
            ))
          ))}
        </svg>
      );

    case 'tower-defenders':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#111827" />
          {/* Road */}
          <path d="M 0 90 L 120 90 L 120 40 L 220 40 L 220 140 L 300 140" fill="none" stroke="#374151" strokeWidth="36" strokeLinecap="square" />
          {/* Turrets */}
          <circle cx="65" cy="45" r="16" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
          <line x1="65" y1="45" x2="95" y2="75" stroke="#38bdf8" strokeWidth="4" />
          <circle cx="170" cy="90" r="16" fill="#7c3aed" stroke="#a855f7" strokeWidth="3" />
          <line x1="170" y1="90" x2="140" y2="55" stroke="#a855f7" strokeWidth="4" />
          {/* Enemy creeps */}
          <circle cx="70" cy="90" r="8" fill="#ef4444" />
          <circle cx="140" cy="40" r="8" fill="#ef4444" />
        </svg>
      );

    case 'survival-arena':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#09090b" />
          {/* Hazard perimeter */}
          <circle cx="150" cy="90" r="70" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="12 6" />
          <circle cx="150" cy="90" r="50" fill="#18181b" stroke="#f59e0b" strokeWidth="3" />
          {/* Rotating laser beam */}
          <line x1="150" y1="90" x2="220" y2="40" stroke="#f43f5e" strokeWidth="5" />
          <line x1="150" y1="90" x2="80" y2="140" stroke="#f43f5e" strokeWidth="5" />
          {/* Survivor */}
          <circle cx="125" cy="80" r="10" fill="#22c55e" stroke="#fff" strokeWidth="2" />
        </svg>
      );

    case 'quick-draw':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#7f1d1d" />
          <rect x="40" y="45" width="220" height="90" rx="16" fill="#991b1b" stroke="#f87171" strokeWidth="3" />
          <text x="150" y="95" fontSize="32" fill="#fef08a" fontWeight="900" textAnchor="middle" letterSpacing="4">DRAW!</text>
          <text x="150" y="122" fontSize="13" fill="#ffffff" textAnchor="middle">0.142 SECONDS</text>
        </svg>
      );

    case 'maze-hunters':
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#042f2e" />
          {/* Labyrinth walls */}
          <path d="M 40 30 L 260 30 L 260 150 L 40 150 Z M 80 70 L 220 70 M 80 110 L 160 110 M 180 70 L 180 130" fill="none" stroke="#14b8a6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Runner & Hunter */}
          <circle cx="65" cy="90" r="8" fill="#38bdf8" />
          <circle cx="230" cy="130" r="10" fill="#ef4444" stroke="#fff" strokeWidth="2" />
          <text x="224" y="135" fontSize="12">👁️</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 300 180" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="180" fill="#1e293b" />
          <text x="150" y="95" fontSize="24" fill="#ffffff" textAnchor="middle">🎮</text>
        </svg>
      );
  }
}
