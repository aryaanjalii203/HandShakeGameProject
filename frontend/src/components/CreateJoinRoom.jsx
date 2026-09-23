import React, { useState } from 'react';
import { X, Zap, Users, ArrowRight, AlertCircle, Gamepad2 } from 'lucide-react';
import { GAMES } from '../data/games.js';
import { useGame } from '../context/GameContext.jsx';
import { soundEngine } from '../services/soundEngine.js';

export function CreateJoinRoom({ isOpen, onClose, initialTab = 'create', defaultGame = 'cyber-pong' }) {
  const [tab, setTab] = useState(initialTab);
  const [selectedGame, setSelectedGame] = useState(defaultGame);
  const [roomCode, setRoomCode] = useState('');
  const { createRoom, joinRoom, roomError } = useGame();

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    const game = GAMES.find(g => g.id === selectedGame);
    createRoom(selectedGame, game?.maxPlayers || 2);
    onClose();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim().length >= 4) {
      joinRoom(roomCode.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-6 bg-[#0f172a] border border-cyan-500/40 rounded-2xl shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={() => { soundEngine.play('click'); onClose(); }}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <button
            onClick={() => { soundEngine.play('click'); setTab('create'); }}
            className={`flex-1 py-2.5 rounded-xl font-heading text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            Create Arena
          </button>
          <button
            onClick={() => { soundEngine.play('click'); setTab('join'); }}
            className={`flex-1 py-2.5 rounded-xl font-heading text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Join with Code
          </button>
        </div>

        {/* Error notification */}
        {roomError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{roomError}</span>
          </div>
        )}

        {/* Tab 1: Create Room */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-2">
                Select Game Arena
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                {GAMES.filter(g => g.multiplayer).map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.playerCount})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <p className="font-bold text-cyan-400 mb-1">
                {GAMES.find(g => g.id === selectedGame)?.title}
              </p>
              <p>{GAMES.find(g => g.id === selectedGame)?.tagline}</p>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer mt-3"
            >
              <Zap className="w-4 h-4 fill-current" />
              Launch Arena Lobby
            </button>
          </form>
        )}

        {/* Tab 2: Join with Code */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-2">
                Enter 6-Digit Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="e.g. X7K29B"
                maxLength={6}
                className="w-full text-center text-2xl font-heading font-black tracking-widest px-4 py-3 rounded-xl bg-slate-900 border border-pink-500/40 text-pink-400 placeholder-slate-600 focus:outline-none focus:border-pink-400 shadow-inner"
                autoFocus
              />
            </div>

            <p className="text-xs text-slate-400 text-center">
              Ask your friend or host for their 6-character room code or scan their QR code with your phone.
            </p>

            <button
              type="submit"
              disabled={roomCode.trim().length < 4}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 disabled:opacity-40 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 transition-all cursor-pointer mt-3"
            >
              <ArrowRight className="w-4 h-4" />
              Enter Room
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
