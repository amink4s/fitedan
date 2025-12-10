import React, { useState, useEffect } from 'react';
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
  // Attempt to call Farcaster Mini App SDK `ready` action when the app mounts.
  // This helps Farcaster hide its splash screen and show the mini app when the SDK is available.
  useEffect(() => {
    let cancelled = false;

    const tryCallReady = async () => {
      // 1) Try well-known global objects that host a `ready` method
      const globalCandidates = ['farcaster', 'Farcaster', 'FarcasterSDK', 'farcasterSDK', 'miniApp', 'MiniApp', 'FarcasterMiniApp'];
      for (const name of globalCandidates) {
        try {
          // @ts-ignore
          const obj = (window as any)[name];
          if (obj && typeof obj.ready === 'function') {
            try {
              await obj.ready();
              console.info(`[Farcaster] called ready() on window.${name}`);
              return;
            } catch (err) {
              console.warn(`[Farcaster] window.${name}.ready() threw:`, err);
            }
          }
        } catch (err) {
          // ignore
        }
        if (cancelled) return;
      }

      // 2) Try dynamic imports for a few plausible package names (if the host bundles one)
      const pkgCandidates = ['@farcaster/miniapp', '@farcaster/mini-app', '@farcaster/sdk', '@farcaster/farcaster-mini'];
      for (const pkg of pkgCandidates) {
        try {
          // dynamic import; will fail if package isn't present, which we catch
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mod = await import(/* webpackIgnore: true */ pkg).catch(() => null);
          if (!mod) continue;
          const sdk = (mod && (mod.default || mod)) as any;
          if (sdk && typeof sdk.ready === 'function') {
            try {
              await sdk.ready();
              console.info(`[Farcaster] called ready() from package ${pkg}`);
              return;
            } catch (err) {
              console.warn(`[Farcaster] ${pkg}.ready() threw:`, err);
            }
          }
        } catch (err) {
          // ignore import failures
        }
        if (cancelled) return;
      }

      // 3) Fallback: if there's a `postMessage` handshake pattern the host uses, send a notification
      try {
        window.parent.postMessage && window.parent.postMessage({ type: 'mini-app-loaded' }, '*');
        console.info('[Farcaster] posted mini-app-loaded to parent window');
      } catch (err) {
        // ignore
      }
    };

    tryCallReady();

    return () => { cancelled = true; };
  }, []);

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