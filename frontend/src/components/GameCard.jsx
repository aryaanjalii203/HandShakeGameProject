import React, { useState } from 'react';
import { Users, Star, Play, Heart, Sparkles } from 'lucide-react';
import { soundEngine } from '../services/soundEngine.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { GameThumbnail } from '../data/gameThumbnails.jsx';

export function GameCard({ game, isSelected, onSelectGame }) {
  const { favorites, toggleFavorite } = usePlayer();
  const [imgError, setImgError] = useState(false);
  const isFav = favorites.includes(game.id);

  return (
    <div
      onClick={() => {
        soundEngine.play('click');
        onSelectGame(game);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className={`poki-tile cursor-pointer group flex flex-col justify-between ${
        isSelected ? 'ring-2 ring-cyan-400 scale-[1.02] shadow-2xl shadow-cyan-500/30' : ''
      }`}
    >
      {/* Top High-Quality Real-Time Image Graphic */}
      <div className="h-44 w-full relative overflow-hidden bg-slate-950">
        {!imgError && game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90 group-hover:brightness-105"
            loading="lazy"
          />
        ) : (
          <GameThumbnail gameId={game.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}

        {/* Gradient dark overlay on image bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-lg">
            {game.category}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.play('click');
              toggleFavorite(game.id);
            }}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-pink-400 transition-colors backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
          </button>
        </div>

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="p-3.5 bg-slate-900 flex flex-col gap-2 border-t border-slate-800">
        <div>
          <h3 className="font-heading text-sm font-black text-white group-hover:text-cyan-400 transition-colors truncate">
            {game.title}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {game.tagline}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-300 text-[11px]">{game.playerCount}</span>
          </div>

          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-white text-[11px]">{game.rating}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
