import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Target, Zap } from 'lucide-react';

export function QuickDrawGame({ isSolo = true, onExit }) {
  const { username, recordMatchResult } = usePlayer();

  const [state, setState] = useState('waiting'); // 'waiting' | 'ready' | 'draw' | 'result' | 'foul'
  const [reactionTime, setReactionTime] = useState(null);
  const [botReactionTime, setBotReactionTime] = useState(null);
  const [winner, setWinner] = useState(null);

  const drawTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  const startRound = () => {
    setState('waiting');
    setReactionTime(null);
    setBotReactionTime(null);
    setWinner(null);

    // Random delay between 2.5s and 5.5s
    const delay = 2500 + Math.random() * 3000;

    timeoutRef.current = setTimeout(() => {
      setState('draw');
      drawTimeRef.current = performance.now();
      soundEngine.play('powerup');
    }, delay);
  };

  useEffect(() => {
    startRound();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleShoot = () => {
    if (state === 'waiting') {
      // Early draw penalty!
      clearTimeout(timeoutRef.current);
      setState('foul');
      soundEngine.play('wall_hit');
      return;
    }

    if (state === 'draw') {
      const myTime = Math.round(performance.now() - drawTimeRef.current);
      // Bot reacts between 220ms and 360ms
      const botTime = Math.round(230 + Math.random() * 120);

      setReactionTime(myTime);
      setBotReactionTime(botTime);
      soundEngine.play('laser');

      if (myTime < botTime) {
        setWinner(username || 'Player');
        confetti({ particleCount: 100, spread: 70 });
        recordMatchResult('quick-draw', true, 1000 - myTime);
      } else {
        setWinner('CYBER SLINGER BOT');
        recordMatchResult('quick-draw', false);
      }

      setState('result');
    }
  };

  // Spacebar key listener with preventDefault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleShoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 flex flex-col items-center select-none animate-fadeIn">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-6 py-3 rounded-2xl bg-slate-900 border border-red-500/30">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400" />
          <span className="font-heading font-black text-white text-lg">QUICK DRAW 2099</span>
        </div>
        <div className="text-xs font-heading text-slate-400 font-bold">
          1v1 SUB-MILLISECOND REFLEX DUEL
        </div>
      </div>

      {/* Main Standoff Display */}
      <div 
        onClick={handleShoot}
        className={`w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[460px] text-center border-2 transition-all cursor-pointer ${
          state === 'draw'
            ? 'bg-gradient-to-tr from-yellow-500 via-amber-500 to-red-600 border-yellow-300 scale-102 shadow-yellow-500/50'
            : state === 'foul'
            ? 'bg-red-950/90 border-red-500'
            : 'bg-[#0f172a] border-red-500/30'
        }`}
      >
        {state === 'waiting' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto text-3xl animate-pulse">
              🎯
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white">
              WAIT FOR THE SIGNAL...
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Keep your finger on the trigger. Do not shoot early!
            </p>
          </div>
        )}

        {state === 'draw' && (
          <div className="animate-ping">
            <h1 className="text-6xl sm:text-8xl font-heading font-black text-white drop-shadow-2xl">
              ⚡ DRAW! ⚡
            </h1>
          </div>
        )}

        {state === 'foul' && (
          <div className="space-y-4">
            <h2 className="text-4xl font-heading font-black text-red-400">
              FOUL! SHOT TOO EARLY!
            </h2>
            <p className="text-sm text-slate-400">
              You fired before the signal!
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); startRound(); }}
              className="py-3.5 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-bold text-sm uppercase shadow-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {state === 'result' && (
          <div className="space-y-6 animate-fadeIn">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mx-auto" />
            <div>
              <h2 className="text-4xl font-heading font-black text-white mb-2">
                {winner === (username || 'Player') ? 'YOU WIN THE DUEL!' : 'OPPONENT WAS FASTER!'}
              </h2>
              <div className="flex items-center justify-center gap-8 text-lg font-heading font-bold mt-4">
                <span className="text-cyan-400">Your Reflex: {reactionTime} ms</span>
                <span className="text-red-400">AI Slinger: {botReactionTime} ms</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={(e) => { e.stopPropagation(); startRound(); }}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RotateCcw className="w-4 h-4" /> Next Round
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onExit(); }}
                className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
        Tap screen or press <b>[Spacebar]</b> immediately when <b>DRAW!</b> appears!
      </div>

    </div>
  );
}
