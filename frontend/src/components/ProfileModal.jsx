import React, { useState } from 'react';
import { X, User, Trophy, Flame, Swords, Palette, Check, ShieldCheck, Mail, LogIn, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { PLAYER_COLORS } from '../../../shared/constants.js';
import { soundEngine } from '../services/soundEngine.js';

export function ProfileModal({ isOpen, onClose, onOpenAuth }) {
  const { username, setUsername, avatar, setAvatar, color, setColor, stats, currentUser, isAuthenticated } = usePlayer();
  const [tempName, setTempName] = useState(username);

  if (!isOpen) return null;

  const avatars = ['⚡', '👾', '🚀', '🔥', '🔮', '🎮', '💀', '🤖', '👑', '🎯', '🐱', '🛡️'];

  const handleSave = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUsername(tempName.trim().slice(0, 16));
    }
    soundEngine.play('click');
    onClose();
  };

  const winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md p-6 bg-[#0e1626] border border-cyan-500/30 rounded-3xl shadow-2xl relative">
        
        <button
          onClick={() => { soundEngine.play('click'); onClose(); }}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          <span>CYBER PILOT PROFILE</span>
        </h3>

        {/* Guest Banner if not logged in */}
        {!isAuthenticated ? (
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-heading font-bold text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Playing as Guest</span>
              </div>
              <p className="text-[11px] text-slate-400">Sign in to save your stats and trophies permanently.</p>
            </div>
            <button
              onClick={() => { soundEngine.play('click'); onClose(); onOpenAuth('signup'); }}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-bold text-[11px] uppercase tracking-wider flex-shrink-0 cursor-pointer shadow-md"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-sm">
                {avatar}
              </div>
              <div>
                <div className="text-xs font-heading font-bold text-white flex items-center gap-1">
                  <span>{currentUser.name || username}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">{currentUser.email}</div>
              </div>
            </div>
            <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Member
            </span>
          </div>
        )}

        {/* Career Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-heading block uppercase">Matches</span>
            <span className="font-heading text-xl font-black text-white">{stats.matchesPlayed}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-emerald-400 font-heading block uppercase">Victories</span>
            <span className="font-heading text-xl font-black text-emerald-400">{stats.wins}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-cyan-400 font-heading block uppercase">Win Rate</span>
            <span className="font-heading text-xl font-black text-cyan-400">{winRate}%</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Username / Handle */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-1.5">
              Callsign / Handle
            </label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={16}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-1.5">
              Select Avatar Glyph
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => { soundEngine.play('click'); setAvatar(av); }}
                  className={`p-2 rounded-xl text-xl transition-all cursor-pointer ${
                    avatar === av
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block font-heading text-xs uppercase tracking-wider text-slate-300 mb-1.5">
              Signature Neon Aura
            </label>
            <div className="flex items-center gap-2.5">
              {PLAYER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { soundEngine.play('click'); setColor(c); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 16px ${c}` : 'none' }}
                >
                  {color === c && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all cursor-pointer mt-2"
          >
            Save Profile
          </button>
        </form>

      </div>
    </div>
  );
}
