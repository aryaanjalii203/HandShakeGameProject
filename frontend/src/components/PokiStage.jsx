import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Users, Bot, Maximize, Share2, Heart, Star, QrCode, 
  Gamepad2, Sparkles, ChevronRight, Volume2, Info, RotateCcw, Swords,
  Shield, Zap, Target, Trophy, Flame
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useGame } from '../context/GameContext.jsx';

// 15 Interactive Game Components
import { CyberPongGame } from '../games/cyber-pong/CyberPongGame.jsx';
import { NeonDriftGame } from '../games/neon-drift/NeonDriftGame.jsx';
import { BattleGridGame } from '../games/battle-grid/BattleGridGame.jsx';
import { SpaceRaidersGame } from '../games/space-raiders/SpaceRaidersGame.jsx';
import { ColorClashGame } from '../games/color-clash/ColorClashGame.jsx';
import { WordBlitzGame } from '../games/word-blitz/WordBlitzGame.jsx';
import { MiniGolfGame } from '../games/mini-golf/MiniGolfGame.jsx';
import { TankArenaGame } from '../games/tank-arena/TankArenaGame.jsx';
import { PixelSoccerGame } from '../games/pixel-soccer/PixelSoccerGame.jsx';
import { TreasureRushGame } from '../games/treasure-rush/TreasureRushGame.jsx';
import { MemoryWarsGame } from '../games/memory-wars/MemoryWarsGame.jsx';
import { TowerDefendersGame } from '../games/tower-defenders/TowerDefendersGame.jsx';
import { SurvivalArenaGame } from '../games/survival-arena/SurvivalArenaGame.jsx';
import { QuickDrawGame } from '../games/quick-draw/QuickDrawGame.jsx';
import { MazeHuntersGame } from '../games/maze-hunters/MazeHuntersGame.jsx';

import { ROOM_STATUS } from '../../../shared/constants.js';

export function PokiStage({ game, onOpenCreateRoom, onOpenJoinRoom }) {
  const { favorites, toggleFavorite } = usePlayer();
  const { activeRoom } = useGame();
  
  const [isPlayingSolo, setIsPlayingSolo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const stageContainerRef = useRef(null);

  const isFav = favorites.includes(game.id);
  const isOnlinePlaying = activeRoom && activeRoom.status === ROOM_STATUS.PLAYING && activeRoom.gameType === game.id;
  const isGameActive = isOnlinePlaying || isPlayingSolo;

  // Reset solo mode when switching games
  useEffect(() => {
    setIsPlayingSolo(false);
  }, [game.id]);

  // CRITICAL: Global Page Scroll Lock while game is playing
  useEffect(() => {
    if (!isGameActive) return;

    const preventScrollKeys = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'PageUp', 'PageDown'].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventScrollKeys, { passive: false });
    return () => {
      window.removeEventListener('keydown', preventScrollKeys);
    };
  }, [isGameActive]);

  const handleShare = () => {
    soundEngine.play('click');
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleFullscreen = () => {
    soundEngine.play('click');
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Helper to render any of the 15 games
  const renderGameComponent = (soloMode) => {
    const onExitHandler = () => setIsPlayingSolo(false);

    switch (game.id) {
      case 'cyber-pong':
        return <CyberPongGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'neon-drift':
        return <NeonDriftGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'battle-grid':
        return <BattleGridGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'space-raiders':
        return <SpaceRaidersGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'color-clash':
        return <ColorClashGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'word-blitz':
        return <WordBlitzGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'mini-golf-chaos':
        return <MiniGolfGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'tank-arena':
        return <TankArenaGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'pixel-soccer':
        return <PixelSoccerGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'treasure-rush':
        return <TreasureRushGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'memory-wars':
        return <MemoryWarsGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'tower-defenders':
        return <TowerDefendersGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'survival-arena':
        return <SurvivalArenaGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'quick-draw':
        return <QuickDrawGame isSolo={soloMode} onExit={onExitHandler} />;
      case 'maze-hunters':
        return <MazeHuntersGame isSolo={soloMode} onExit={onExitHandler} />;
      default:
        return <CyberPongGame isSolo={soloMode} onExit={onExitHandler} />;
    }
  };

  return (
    <div ref={stageContainerRef} className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
      
      {/* Poki-Style Game Theater Stage */}
      <div className="bg-[#0f172a] border-2 border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Stage Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/95 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg sm:text-2xl font-black text-white">
                  {game.title}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {game.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {game.tagline}
              </p>
            </div>
          </div>

          {/* Quick Stage Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundEngine.play('click'); toggleFavorite(game.id); }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-pink-400 transition-colors cursor-pointer"
              title={isFav ? 'Liked' : 'Like Game'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Share Game"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Active Game Canvas OR Instant Play Real-Image Theater */}
        <div className="w-full bg-[#06080e] relative min-h-[480px] sm:min-h-[540px] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          
          {/* 1. If Active Online Match */}
          {isOnlinePlaying ? (
            <div className="w-full animate-fadeIn">
              {renderGameComponent(false)}
            </div>
          ) : isPlayingSolo ? (
            /* 2. If Playing Solo vs AI */
            <div className="w-full animate-fadeIn">
              {renderGameComponent(true)}
            </div>
          ) : (
            /* 3. Poki-Style Real-Image Instant Splash & Launch Stage */
            <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] rounded-2xl overflow-hidden flex items-center justify-center">
              
              {/* Background Real Game Graphic Artwork */}
              {game.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-full h-full object-cover filter brightness-[0.35] scale-105 transform hover:scale-100 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-[#06080e]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#06080e] via-transparent to-[#06080e]" />
                </div>
              )}

              {/* Theater Foreground Card */}
              <div className="relative z-10 text-center py-8 px-4 max-w-xl mx-auto animate-fadeIn backdrop-blur-[2px]">
                
                {/* Giant Glowing Play Button (Poki Style) */}
                <div 
                  onClick={() => { soundEngine.play('click'); setIsPlayingSolo(true); }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/50 cursor-pointer hover:scale-110 active:scale-95 transition-all group ring-4 ring-cyan-400/40"
                >
                  <Play className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-current ml-1 group-hover:scale-110 transition-transform" />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant HTML5 & Canvas 60 FPS</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-5xl font-black text-white mb-3 drop-shadow-lg tracking-tight">
                  {game.title}
                </h2>

                <p className="text-sm sm:text-base text-slate-200 mb-8 max-w-lg mx-auto leading-relaxed drop-shadow">
                  {game.description}
                </p>

                {/* Big Vibrant Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => { soundEngine.play('click'); setIsPlayingSolo(true); }}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/40 hover:scale-103 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>PLAY NOW (INSTANT)</span>
                  </button>

                  <button
                    onClick={() => { soundEngine.play('click'); onOpenCreateRoom(game.id); }}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-pink-500/40 hover:scale-103 active:scale-95 transition-all cursor-pointer ring-2 ring-white/20"
                  >
                    <Users className="w-5 h-5" />
                    <span>PLAY WITH FRIENDS (2P)</span>
                  </button>
                </div>

                {/* Player Count & Specs Pill */}
                <div className="flex items-center justify-center gap-4 mt-8 text-xs text-slate-300 font-semibold bg-black/50 py-2 px-4 rounded-full backdrop-blur-md border border-white/10 w-fit mx-auto">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cyan-400" /> {game.playerCount}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {game.rating} / 5</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 60Hz Physics</span>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Stage Bottom: Control Keys Diagram & Rules (Poki Style) */}
        <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          
          {/* Controls diagram */}
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-slate-300 uppercase tracking-wider">
              Controls:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-200">
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold">W</span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold">A</span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold">S</span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold">D</span>
              <span className="text-slate-500">or</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-bold">Arrow Keys / Spacebar / Touch Drag</span>
            </div>
          </div>

          {/* Quick Rules */}
          <div className="text-slate-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{game.rules?.[0] || 'Score points and outmaneuver your opponent.'}</span>
          </div>

        </div>

      </div>

    </div>
  );
}
