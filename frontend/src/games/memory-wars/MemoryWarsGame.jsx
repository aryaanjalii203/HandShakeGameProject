import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../services/soundEngine.js';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { Trophy, RotateCcw, LogOut, Sparkles } from 'lucide-react';

export function MemoryWarsGame({ isSolo = true, onExit }) {
  const { recordMatchResult } = usePlayer();

  const glyphs = ['⚡', '🔥', '💎', '👾', '🚀', '👑', '💣', '🛡️'];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);

  const initGame = () => {
    const deck = [...glyphs, ...glyphs]
      .sort(() => Math.random() - 0.5)
      .map((glyph, id) => ({ id, glyph }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setIsOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;

    soundEngine.play('click');
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const c1 = cards[newFlipped[0]];
      const c2 = cards[newFlipped[1]];

      if (c1.glyph === c2.glyph) {
        soundEngine.play('powerup');
        setMatched(m => {
          const next = [...m, newFlipped[0], newFlipped[1]];
          if (next.length === cards.length) {
            setIsOver(true);
            confetti({ particleCount: 100, spread: 70 });
            recordMatchResult('memory-wars', true, score + 500);
          }
          return next;
        });
        setScore(s => s + 250);
        setFlipped([]);
      } else {
        soundEngine.play('wall_hit');
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 flex flex-col items-center select-none animate-fadeIn">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-6 py-3 rounded-2xl bg-slate-900 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-heading font-black text-white text-lg">MEMORY WARS</span>
        </div>
        <div className="flex items-center gap-6 font-heading font-bold text-sm">
          <span className="text-cyan-400">Score: {score}</span>
          <span className="text-yellow-400">Moves: {moves}</span>
          <span className="text-emerald-400">Pairs: {matched.length / 2} / 8</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full bg-[#0f172a] border border-purple-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[460px]">
        
        {!isOver ? (
          <div className="grid grid-cols-4 gap-3.5 w-full max-w-md">
            {cards.map((card) => {
              const isCardFlipped = flipped.includes(card.id) || matched.includes(card.id);
              const isCardMatched = matched.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-3xl font-bold transition-all transform cursor-pointer ${
                    isCardMatched
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 opacity-80 scale-95'
                      : isCardFlipped
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:scale-102'
                  }`}
                >
                  {isCardFlipped ? card.glyph : '❓'}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce mb-3" />
            <h2 className="text-4xl font-heading font-black text-white mb-2">MATRIX SOLVED!</h2>
            <p className="text-2xl font-heading font-bold text-purple-400 mb-6">Completed in {moves} Moves • Score: {score}</p>
            <div className="flex gap-4">
              <button onClick={initGame} className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-heading font-bold text-sm uppercase flex items-center gap-2 cursor-pointer shadow-lg">
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
