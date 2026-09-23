import React, { useState, useEffect } from 'react';
import { X, Swords, Loader2, Sparkles } from 'lucide-react';
import { GAMES } from '../data/games.js';
import { useGame } from '../context/GameContext.jsx';
import { soundEngine } from '../services/soundEngine.js';

export function QuickMatchModal({ isOpen, onClose }) {
  const { isSearchingMatch, joinQuickMatch, cancelQuickMatch } = useGame();
  const [selectedGame, setSelectedGame] = useState('cyber-pong');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isSearchingMatch) {
      const interval = setInterval(() => {
        setDots(d => (d.length >= 3 ? '' : d + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSearchingMatch]);

  if (!isOpen) return null;

  const handleStartSearch = () => {
    joinQuickMatch(selectedGame);
  };

  const handleCancel = () => {
    cancelQuickMatch();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-6 bg-[#0f172a] border border-cyan-500/40 rounded-3xl shadow-2xl relative text-center">
        
        {/* Close */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 text-cyan-400">
          <Swords className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="font-heading text-2xl font-black text-white mb-2">
          QUICK MATCHMAKING
        </h3>

        {!isSearchingMatch ? (
          <div className="space-y-4 text-left mt-4">
            <p className="text-slate-400 text-xs text-center">
              Choose an arena to match with any available online challenger across all connected devices.
            </p>

            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-2">
                Target Arena
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                {GAMES.filter(g => g.multiplayer).map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartSearch}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer mt-4"
            >
              <Swords className="w-4 h-4" />
              Find Opponent
            </button>
          </div>
        ) : (
          <div className="py-8 space-y-4">
            {/* Animated Radar Scanning Pulse */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-full border border-pink-500/30 animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-black">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            </div>

            <p className="font-heading text-lg font-bold text-cyan-300">
              Scanning Matchmaking Pool{dots}
            </p>
            <p className="text-xs text-slate-400">
              Looking for open challengers in {GAMES.find(g => g.id === selectedGame)?.title}. Open a 2nd tab or share your link to match!
            </p>

            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-heading font-semibold border border-slate-700 cursor-pointer transition-colors"
            >
              Cancel Matchmaking
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
