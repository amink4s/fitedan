import React, { useState } from 'react';
import { User, ScoreEntry } from './types';
import { UserProfile } from './components/UserProfile';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { Gamepad2, Trophy } from 'lucide-react';

// MOCK DATA for placeholders
const MOCK_USER: User = {
  username: "PlayerOne",
  pfpUrl: "" // Empty string renders the placeholder icon
};

const MOCK_LEADERBOARD: ScoreEntry[] = [
  { id: '1', username: "IronMike", score: 450, date: '2m ago' },
  { id: '2', username: "SpeedDemon", score: 380, date: '1h ago' },
  { id: '3', username: "GlassJoe", score: 120, date: '1d ago' },
];

function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [leaderboardData, setLeaderboardData] = useState<ScoreEntry[]>(MOCK_LEADERBOARD);

  const handleGameEnd = (score: number) => {
    // In a real app, you would send this to your database API
    const newEntry: ScoreEntry = {
      id: Date.now().toString(),
      username: MOCK_USER.username,
      score: score,
      date: 'Just now'
    };
    
    // Optimistic update for the leaderboard
    setLeaderboardData(prev => [newEntry, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center">
      {/* Mobile-first container max-width */}
      <div className="w-full max-w-md bg-gray-900 shadow-2xl flex flex-col h-[100dvh] relative border-x border-gray-800">
        
        {/* Header */}
        <UserProfile user={MOCK_USER} />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'game' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <Game onGameEnd={handleGameEnd} />
          </div>
          
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'leaderboard' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <Leaderboard scores={leaderboardData} />
          </div>
        </main>

        {/* Bottom Tab Navigation */}
        <nav className="flex bg-gray-900 border-t border-gray-800 pb-safe">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors ${
              activeTab === 'game' 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Gamepad2 className={`mb-1 ${activeTab === 'game' ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">Fight</span>
          </button>
          
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors ${
              activeTab === 'leaderboard' 
                ? 'text-yellow-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Trophy className={`mb-1 ${activeTab === 'leaderboard' ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">Rankings</span>
          </button>
        </nav>

        {/* Safe area padding for newer iPhones */}
        <div className="h-[env(safe-area-inset-bottom)] bg-gray-900"></div>
      </div>
    </div>
  );
}

export default App;