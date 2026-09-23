import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Volume2, VolumeX, Trophy, User, PlusCircle, Search, 
  Sparkles, Gamepad2, Wifi, LogIn, UserPlus, LogOut, ChevronDown, 
  ShieldCheck, Heart 
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useGame } from '../context/GameContext.jsx';

export function Navbar({ 
  onOpenCreateJoin, 
  onOpenProfile, 
  onOpenAchievements, 
  onOpenAuth,
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory 
}) {
  const { username, avatar, color, currentUser, isAuthenticated, signOut } = usePlayer();
  const { ping, activeRoom, leaveRoom } = useGame();
  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) soundEngine.play('click');
  };

  const handleSignOut = () => {
    soundEngine.play('click');
    setShowDropdown(false);
    signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo - Poki Style */}
        <div 
          onClick={() => { soundEngine.play('click'); if (activeRoom) leaveRoom(); }}
          className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xl sm:text-2xl font-black tracking-wider text-white">
                PLAY<span className="text-cyan-400">FORGE</span>
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 15 multiplayer arcade games..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/60 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          
          {/* Latency Ping */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <Wifi className={`w-3 h-3 ${ping < 60 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{ping || 12}ms</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Badges Trophy */}
          <button
            onClick={() => { soundEngine.play('click'); onOpenAchievements(); }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-yellow-400 hover:scale-105 transition-all hidden sm:flex items-center gap-1.5 cursor-pointer"
            title="Achievements & Trophies"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Create / Join Room CTA */}
          <button
            onClick={() => { soundEngine.play('click'); onOpenCreateJoin(); }}
            className="btn-poki-play text-xs !py-2 !px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Room Lobby</span>
            <span className="sm:hidden">Lobby</span>
          </button>

          {/* ========================================================= */}
          {/* USER AUTH & PROFILE SECTION                               */}
          {/* ========================================================= */}
          {isAuthenticated ? (
            /* LOGGED IN USER DROPDOWN */
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => { soundEngine.play('click'); setShowDropdown(!showDropdown); }}
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-slate-800/90 border border-slate-700 hover:border-cyan-400 cursor-pointer transition-all hover:scale-102 select-none"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-inner"
                  style={{ backgroundColor: `${color}33`, border: `1.5px solid ${color}` }}
                >
                  {avatar}
                </div>
                <span className="font-heading text-xs font-bold text-slate-200 truncate max-w-[90px]">
                  {username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Account Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0e1626] border border-cyan-500/30 shadow-2xl overflow-hidden z-50 animate-fadeIn">
                  
                  {/* User Profile Header */}
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-md"
                        style={{ backgroundColor: `${color}33`, border: `2px solid ${color}` }}
                      >
                        {avatar}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-heading text-sm font-bold text-white truncate flex items-center gap-1">
                          <span>{currentUser.name || username}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {currentUser.email || `@${username}`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-400 font-heading uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                      <span>Pro Gamer Account</span>
                      <span>Verified</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5 space-y-1 text-xs text-slate-300">
                    <button
                      onClick={() => { soundEngine.play('click'); setShowDropdown(false); onOpenProfile(); }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      <span>Pilot Profile & Aura</span>
                    </button>
                    <button
                      onClick={() => { soundEngine.play('click'); setShowDropdown(false); onOpenAchievements(); }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span>Trophies & Badges</span>
                    </button>
                    
                    <div className="border-t border-slate-800/80 my-1" />

                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 rounded-xl hover:bg-red-500/15 text-red-400 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            /* GUEST USER SIGN IN & SIGN UP CTAS (Shopping / Modern Web Platform Style) */
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { soundEngine.play('click'); onOpenAuth('signin'); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => { soundEngine.play('click'); onOpenAuth('signup'); }}
                className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-bold text-xs uppercase tracking-wider items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
