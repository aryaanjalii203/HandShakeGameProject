import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Users, Crown, CheckCircle2, Clock, Copy, Check, QrCode, 
  Send, Zap, LogOut, MessageSquare, Play, Sparkles, AlertTriangle 
} from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { GAMES } from '../data/games.js';
import { soundEngine } from '../services/soundEngine.js';
import { ROOM_STATUS } from '../../../shared/constants.js';

export function RoomLobby() {
  const { activeRoom, socket, leaveRoom, toggleReady, selectGame, startGame, sendChat } = useGame();
  const { username } = usePlayer();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  const currentGame = GAMES.find(g => g.id === activeRoom?.gameType) || GAMES[0];
  const isHost = activeRoom?.hostId === socket?.id;
  const myPlayer = activeRoom?.players?.find(p => p.id === socket?.id);
  const canStart = activeRoom?.players?.length >= 2 && activeRoom?.players?.every(p => p.isReady);

  // Generate QR Code URL
  useEffect(() => {
    if (activeRoom?.id) {
      const joinUrl = `${window.location.origin}?room=${activeRoom.id}`;
      QRCode.toDataURL(joinUrl, {
        width: 256,
        margin: 1.5,
        color: {
          dark: '#00f0ff',
          light: '#07090e'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }
  }, [activeRoom?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages]);

  const handleCopyCode = () => {
    soundEngine.play('click');
    navigator.clipboard.writeText(activeRoom?.id || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    soundEngine.play('click');
    const joinUrl = `${window.location.origin}?room=${activeRoom?.id}`;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput('');
    }
  };

  const handleSendEmoji = (emoji) => {
    soundEngine.play('click');
    sendChat(emoji);
  };

  if (!activeRoom) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      
      {/* Top Banner: Room Code & Quick Share */}
      <div className="p-6 mb-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Room Code Badge */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-cyan-400 text-xs font-heading uppercase tracking-widest mb-1">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>ARENA ROOM CODE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-heading font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-200 to-white">
                {activeRoom.id}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Invite Link'}</span>
            </button>

            <button
              onClick={() => { soundEngine.play('click'); setShowQR(!showQR); }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-500/30 text-xs font-heading font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQR ? 'Hide QR Code' : 'Scan Phone QR'}</span>
            </button>

            <button
              onClick={leaveRoom}
              className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>

        </div>

        {/* QR Code Expansion Panel */}
        {showQR && qrDataUrl && (
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="p-3.5 bg-[#07090e] rounded-2xl border border-cyan-500/40 shadow-2xl mb-3">
              <img src={qrDataUrl} alt="Room QR Code" className="w-48 h-48 rounded-xl" />
            </div>
            <p className="text-sm font-heading font-bold text-cyan-300">
              Scan with your Phone's Camera to Join Instantaneously!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Both devices can play seamlessly across the same local network or internet.
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Left Roster & Game Setting | Right Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Arena Setup & Players */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Game Preview */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Target Arena
                </span>
                <h2 className="text-2xl font-heading font-black text-white mt-1">
                  {currentGame.title}
                </h2>
              </div>

              {/* Game Selector for Host */}
              {isHost && (
                <div className="w-full sm:w-auto">
                  <select
                    value={activeRoom.gameType}
                    onChange={(e) => selectGame(e.target.value, GAMES.find(g => g.id === e.target.value)?.maxPlayers || 2)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 border border-cyan-500/40 text-white text-xs font-heading font-bold focus:outline-none focus:border-cyan-400"
                  >
                    {GAMES.filter(g => g.multiplayer).map(g => (
                      <option key={g.id} value={g.id}>
                        Switch to: {g.title} ({g.playerCount})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {currentGame.tagline}
            </p>

            {/* Rules quick summary */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-cyan-400">Controls: </span>
              <span>{currentGame.controls}</span>
            </div>
          </div>

          {/* Player Roster */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Player Slots ({activeRoom.players?.length} / {activeRoom.maxPlayers})</span>
              </h3>
              <span className="text-xs text-slate-400">
                {activeRoom.players?.length < 2 ? 'Waiting for 2nd player to connect...' : 'Players Connected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {activeRoom.players?.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-4 rounded-2xl bg-black/50 border transition-all flex items-center justify-between gap-3"
                  style={{ borderColor: player.isReady ? `${player.color}88` : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-inner"
                      style={{ backgroundColor: `${player.color}33`, border: `2px solid ${player.color}` }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-sm font-bold text-white">
                          {player.username}
                        </span>
                        {player.isHost && (
                          <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" title="Room Host" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Player {idx + 1} • {player.isHost ? 'Host' : 'Challenger'}
                      </span>
                    </div>
                  </div>

                  {/* Ready Status Badge */}
                  <div>
                    {player.isReady ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-heading font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        READY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[11px] font-heading font-bold">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        WAITING
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty Slot Placeholders */}
              {Array.from({ length: Math.max(0, activeRoom.maxPlayers - activeRoom.players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-4 rounded-2xl bg-black/20 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs font-heading font-semibold"
                >
                  <span>Open Slot (Waiting for connection)</span>
                </div>
              ))}
            </div>

            {/* Ready / Start Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              
              {/* Toggle Ready Button (Non-host or host) */}
              {!isHost && (
                <button
                  onClick={toggleReady}
                  className={`py-3.5 px-6 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                    myPlayer?.isReady
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-lg shadow-pink-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{myPlayer?.isReady ? 'Cancel Ready' : "I'M READY TO PLAY!"}</span>
                </button>
              )}

              {/* Host Start Game Button */}
              {isHost && (
                <button
                  onClick={startGame}
                  disabled={!canStart}
                  className="py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START ARENA BATTLE</span>
                </button>
              )}

              {isHost && !canStart && (
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {activeRoom.players.length < 2 
                      ? 'Invite at least 1 more player to launch.' 
                      : 'Waiting for all challengers to click Ready.'}
                  </span>
                </p>
              )}
            </div>

          </div>

        </div>

        {/* Right 1 Col: In-Room Live Chat & Emojis */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>LOBBY COMMS</span>
            </h3>
            <span className="text-[10px] text-slate-400">Live</span>
          </div>

          {/* Chat message stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3 text-xs">
            {activeRoom.messages?.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-xl ${
                  msg.sender === 'SYSTEM'
                    ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 text-[11px]'
                    : msg.sender === username
                    ? 'bg-slate-800 border border-cyan-500/30 text-white ml-4'
                    : 'bg-black/60 border border-slate-800 text-slate-200 mr-4'
                }`}
              >
                {msg.sender !== 'SYSTEM' && (
                  <span className="font-heading font-bold text-cyan-400 block text-[10px]">
                    {msg.sender}
                  </span>
                )}
                <p className="break-words">{msg.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-between gap-1 mb-3 pt-2 border-t border-slate-800">
            {['🔥', '⚡', '🚀', '💀', '👑', '👾', '🎯'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm hover:scale-110 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message..."
              maxLength={100}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black font-bold transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
