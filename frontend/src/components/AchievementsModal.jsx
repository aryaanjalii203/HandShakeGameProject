import React from 'react';
import { X, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { soundEngine } from '../services/soundEngine.js';

export function AchievementsModal({ isOpen, onClose }) {
  const { achievements } = usePlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cyber-card w-full max-w-lg p-6 bg-[#0c101a] border border-yellow-500/30 relative max-h-[85vh] flex flex-col">
        
        <button
          onClick={() => { soundEngine.play('click'); onClose(); }}
          className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span>CYBER BADGES & ACHIEVEMENTS</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Accomplish challenges in multiplayer and solo arenas to unlock rare titles.
        </p>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                ach.unlocked
                  ? 'bg-yellow-950/20 border-yellow-500/40'
                  : 'bg-slate-900/40 border-white/5 opacity-60'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-500" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-heading text-sm font-bold text-white">
                    {ach.title}
                  </h4>
                  {ach.unlocked && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
