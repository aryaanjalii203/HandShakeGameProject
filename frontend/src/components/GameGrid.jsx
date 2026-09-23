import React from 'react';
import { Sparkles, Heart, Flame, Gamepad2 } from 'lucide-react';
import { CATEGORIES } from '../data/categories.js';
import { GameCard } from './GameCard.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { soundEngine } from '../services/soundEngine.js';

export function GameGrid({ games, selectedGame, onSelectGame, selectedCategory, setSelectedCategory, onlyFavorites, setOnlyFavorites }) {
  const { favorites } = usePlayer();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Category Chips Bar (Poki Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.play('click');
                setSelectedCategory(cat.id);
                setOnlyFavorites(false);
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-heading font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id && !onlyFavorites
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}

          {/* Favorites Filter */}
          <button
            onClick={() => {
              soundEngine.play('click');
              setOnlyFavorites(!onlyFavorites);
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-heading font-bold transition-all flex items-center gap-1.5 ${
              onlyFavorites
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 scale-105'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : 'text-pink-400'}`} />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-semibold hidden sm:block">
          Showing <span className="text-cyan-400 font-bold">{games.length}</span> Arenas
        </div>
      </div>

      {/* Poki Game Tile Grid */}
      {games.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-heading text-lg text-slate-300">No games found</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting another category or clear your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGame?.id === game.id}
              onSelectGame={onSelectGame}
            />
          ))}
        </div>
      )}

    </section>
  );
}
