import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Sparkles, Check, Flame } from 'lucide-react';

export function WordBlitzGame({ isSolo = true, onExit }) {
  const { username, recordMatchResult } = usePlayer();

  const wordSets = [
    { target: 'CYBER', letters: ['C', 'Y', 'B', 'E', 'R', 'S', 'P'] },
    { target: 'PULSE', letters: ['P', 'U', 'L', 'S', 'E', 'O', 'N'] },
    { target: 'LASER', letters: ['L', 'A', 'S', 'E', 'R', 'T', 'Z'] },
    { target: 'NEONS', letters: ['N', 'E', 'O', 'N', 'S', 'X', 'I'] },
    { target: 'BLITZ', letters: ['B', 'L', 'I', 'T', 'Z', 'A', 'R'] }
  ];

  const validWords = new Set([
    'CYBER', 'CRY', 'BYE', 'SPY', 'RUB', 'BUY', 'CUB', 'USE', 'PULSE', 'PLUS', 'SOUP', 'POLE',
    'LASER', 'SEAL', 'SALE', 'REAL', 'EARL', 'LATE', 'RATE', 'REST', 'STAR', 'NEONS', 'NOON', 'NONE',
    'BLITZ', 'BIT', 'BAT', 'TAB', 'RIB', 'AIR', 'BAIL'
  ]);

  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [solvedWords, setSolvedWords] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isOver, setIsOver] = useState(false);

  const currentSet = wordSets[currentSetIdx];

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsOver(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      recordMatchResult('word-blitz', true, score);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleLetterClick = (letter, idx) => {
    soundEngine.play('click');
    setSelectedLetters(prev => [...prev, { letter, idx }]);
  };

  const handleClear = () => {
    soundEngine.play('click');
    setSelectedLetters([]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOver) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWord();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setSelectedLetters(prev => prev.slice(0, -1));
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
        return;
      }

      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        // Find first unused tile with this letter
        const availableIdx = currentSet.letters.findIndex((l, idx) => l === char && !selectedLetters.some(sel => sel.idx === idx));
        if (availableIdx !== -1) {
          e.preventDefault();
          handleLetterClick(char, availableIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLetters, currentSet, isOver]);

  const handleSubmitWord = () => {
    const word = selectedLetters.map(l => l.letter).join('');
    if (word.length >= 3 && !solvedWords.includes(word)) {
      soundEngine.play('powerup');
      const pts = word.length * 100 + streak * 50;
      setScore(s => s + pts);
      setStreak(st => st + 1);
      setSolvedWords(prev => [word, ...prev]);
      setSelectedLetters([]);

      // Next puzzle if found target
      if (word === currentSet.target || solvedWords.length >= 3) {
        setCurrentSetIdx(i => (i + 1) % wordSets.length);
      }
    } else {
      soundEngine.play('wall_hit');
      setStreak(0);
      setSelectedLetters([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 flex flex-col items-center select-none animate-fadeIn">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-6 py-3 rounded-2xl bg-slate-900 border border-blue-500/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="font-heading font-black text-white text-lg">WORD BLITZ</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-yellow-400">⏱️ {timeLeft}s</span>
          <span className="text-cyan-400">Score: {score}</span>
          <span className="text-pink-400 flex items-center gap-1"><Flame className="w-4 h-4 fill-current" /> {streak}x</span>
        </div>
      </div>

      {/* Main Board */}
      <div className="w-full bg-[#0f172a] border border-blue-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center min-h-[420px] justify-between">
        
        {!isOver ? (
          <>
            {/* Word spelling display */}
            <div className="h-16 w-full flex items-center justify-center gap-2 border-b border-slate-800 pb-2">
              {selectedLetters.length === 0 ? (
                <span className="text-slate-500 font-heading text-sm uppercase tracking-widest">
                  Tap / Click letter tiles below to form words
                </span>
              ) : (
                selectedLetters.map((item, i) => (
                  <div key={i} className="w-12 h-14 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-black font-heading text-white shadow-lg shadow-cyan-500/30 animate-scaleIn">
                    {item.letter}
                  </div>
                ))
              )}
            </div>

            {/* Letter Tiles Rack */}
            <div className="flex flex-wrap items-center justify-center gap-3 my-6">
              {currentSet.letters.map((letter, idx) => {
                const isUsed = selectedLetters.some(l => l.idx === idx);
                return (
                  <button
                    key={idx}
                    disabled={isUsed}
                    onClick={() => handleLetterClick(letter, idx)}
                    className={`w-14 h-16 rounded-2xl text-2xl font-heading font-black flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                      isUsed 
                        ? 'opacity-30 bg-slate-800 text-slate-500' 
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-2 border-cyan-500/40 hover:scale-105 active:scale-95 shadow-cyan-500/10'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 w-full max-w-sm">
              <button
                onClick={handleClear}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading font-bold text-xs uppercase cursor-pointer border border-slate-700"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitWord}
                disabled={selectedLetters.length < 3}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-30 text-white font-heading font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Submit
              </button>
            </div>

            {/* Solved Words stream */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Solved:</span>
              {solvedWords.map((w, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {w}
                </span>
              ))}
            </div>
          </>
        ) : (
          /* Game Over */
          <div className="my-auto flex flex-col items-center text-center">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-3" />
            <h2 className="text-3xl font-heading font-black text-white mb-1">TIME'S UP!</h2>
            <p className="text-2xl font-heading font-black text-cyan-400 mb-6">Final Score: {score} Points</p>
            <div className="flex gap-4">
              <button onClick={() => { setTimeLeft(60); setScore(0); setSolvedWords([]); setIsOver(false); }} className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={onExit} className="py-3 px-6 rounded-xl bg-slate-800 text-slate-300 font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer">
                <LogOut className="w-4 h-4" /> Return to Arenas
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
