import React from 'react';
import { Zap, Users, Play, Sparkles, QrCode, Smartphone, Swords } from 'lucide-react';
import { soundEngine } from '../services/soundEngine.js';

export function Hero({ onOpenCreateRoom, onOpenJoinRoom, onOpenQuickMatch, onPlaySolo }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10">
      {/* Background Neon ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/20 via-pink-500/15 to-blue-600/20 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-heading font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>REAL-TIME CROSS-DEVICE MULTIPLAYER ARCADE</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight mb-4 text-white">
          BATTLE ANYONE,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300">
            ANY DEVICE.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-medium">
          Jump straight into instant multiplayer action. Create a private arena room, share your 6-digit code or scan the QR code with your phone to play in real-time.
        </p>

        {/* Call to Actions Grid */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 max-w-2xl mx-auto mb-10">
          <button
            onClick={() => { soundEngine.play('click'); onOpenCreateRoom(); }}
            className="btn-cyber-primary w-full sm:w-auto text-sm"
          >
            <Zap className="w-4 h-4 fill-current" />
            Create Arena Room
          </button>

          <button
            onClick={() => { soundEngine.play('click'); onOpenJoinRoom(); }}
            className="btn-cyber-pink w-full sm:w-auto text-sm"
          >
            <Users className="w-4 h-4" />
            Join with Code
          </button>

          <button
            onClick={() => { soundEngine.play('click'); onOpenQuickMatch(); }}
            className="btn-cyber-outline w-full sm:w-auto text-sm"
          >
            <Swords className="w-4 h-4" />
            Quick Match 1v1
          </button>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t border-white/10 text-slate-300 text-xs font-semibold">
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>60Hz Physics Sync</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>Touch & Keyboard</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
            <QrCode className="w-4 h-4 text-yellow-400" />
            <span>Scan QR to Join</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
            <Users className="w-4 h-4 text-green-400" />
            <span>2–4 Player Lobbies</span>
          </div>
        </div>

      </div>
    </section>
  );
}
