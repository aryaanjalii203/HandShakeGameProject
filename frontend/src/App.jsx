import React, { useState, useEffect, useMemo } from 'react';
import { PlayerProvider } from './context/PlayerContext.jsx';
import { GameProvider, useGame } from './context/GameContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { PokiStage } from './components/PokiStage.jsx';
import { GameGrid } from './components/GameGrid.jsx';
import { CreateJoinRoom } from './components/CreateJoinRoom.jsx';
import { QuickMatchModal } from './components/QuickMatchModal.jsx';
import { ProfileModal } from './components/ProfileModal.jsx';
import { AchievementsModal } from './components/AchievementsModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { RoomLobby } from './components/RoomLobby.jsx';

import { GAMES } from './data/games.js';
import { ROOM_STATUS } from '../../shared/constants.js';

function MainApp() {
  const { activeRoom, joinRoom } = useGame();

  const [selectedGame, setSelectedGame] = useState(GAMES[0]); // Default to Cyber Pong
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'join' | 'quick' | 'profile' | 'achievements' | 'signin' | 'signup' | 'forgot'

  // Auto-join via URL (e.g. ?room=X7K29B)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      joinRoom(roomParam.toUpperCase());
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [joinRoom]);

  // Filter games based on search and category
  const filteredGames = useMemo(() => {
    return GAMES.filter(game => {
      const matchSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || game.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* Poki Navbar */}
      <div>
        <Navbar
          onOpenCreateJoin={() => setActiveModal('create')}
          onOpenProfile={() => setActiveModal('profile')}
          onOpenAchievements={() => setActiveModal('achievements')}
          onOpenAuth={(mode) => setActiveModal(mode || 'signin')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* If Player is currently in a Lobby (before starting) */}
        {activeRoom && activeRoom.status !== ROOM_STATUS.PLAYING ? (
          <main className="container mx-auto py-6">
            <RoomLobby />
          </main>
        ) : (
          /* Main Poki Experience: Center Stage Theater + Game Grid */
          <main>
            {/* The Poki Game Stage Frame */}
            <PokiStage
              game={activeRoom?.status === ROOM_STATUS.PLAYING ? GAMES.find(g => g.id === activeRoom.gameType) || selectedGame : selectedGame}
              onOpenCreateRoom={(gameId) => {
                const g = GAMES.find(x => x.id === gameId);
                if (g) setSelectedGame(g);
                setActiveModal('create');
              }}
              onOpenJoinRoom={() => setActiveModal('join')}
            />

            {/* Poki Mosaic Game Discovery Grid */}
            <GameGrid
              games={filteredGames}
              selectedGame={selectedGame}
              onSelectGame={(g) => setSelectedGame(g)}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onlyFavorites={onlyFavorites}
              setOnlyFavorites={setOnlyFavorites}
            />
          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b12] py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-heading">
            <span className="text-cyan-400 font-bold">PLAYFORGE</span> © 2026 • Real-Time Multiplayer Web Gaming Arena
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-semibold">
            <span>Authoritative 60Hz Physics</span>
            <span>•</span>
            <span>Vercel Cloud Ready</span>
            <span>•</span>
            <span>No Download Required</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateJoinRoom
        isOpen={activeModal === 'create' || activeModal === 'join'}
        onClose={() => setActiveModal(null)}
        initialTab={activeModal === 'join' ? 'join' : 'create'}
        defaultGame={selectedGame.id}
      />

      <QuickMatchModal
        isOpen={activeModal === 'quick'}
        onClose={() => setActiveModal(null)}
      />

      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        onOpenAuth={(mode) => setActiveModal(mode || 'signup')}
      />

      <AchievementsModal
        isOpen={activeModal === 'achievements'}
        onClose={() => setActiveModal(null)}
      />

      <AuthModal
        isOpen={activeModal === 'signin' || activeModal === 'signup' || activeModal === 'forgot'}
        initialMode={activeModal === 'signup' ? 'signup' : activeModal === 'forgot' ? 'forgot' : 'signin'}
        onClose={() => setActiveModal(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <GameProvider>
        <MainApp />
      </GameProvider>
    </PlayerProvider>
  );
}
