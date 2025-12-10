import React from 'react';
import { ScoreEntry } from '../types';
import { Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardProps {
  scores: ScoreEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  // Sort scores descending just in case
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 1: return <Medal className="w-5 h-5 text-gray-300" />;
      case 2: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold w-5 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-900 text-white">
      <div className="p-6 text-center bg-gray-800 shadow-md">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 uppercase tracking-widest italic">
          Hall of Fame
        </h2>
        <p className="text-gray-400 text-sm mt-1">Top hitters this week</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Placeholder for DB Connection */}
        {/* TODO: Connect this to your backend database (e.g., Firebase, Supabase) to fetch real scores */}
        
        {sortedScores.map((entry, index) => (
          <div 
            key={entry.id}
            className={`flex items-center justify-between p-4 rounded-xl border ${
              index === 0 
                ? 'bg-gradient-to-r from-yellow-900/20 to-gray-800 border-yellow-500/50' 
                : 'bg-gray-800 border-gray-700'
            } transition-transform hover:scale-[1.01]`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getRankIcon(index)}
              </div>
              <div>
                <p className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                  {entry.username}
                </p>
                <p className="text-xs text-gray-500">{entry.date}</p>
              </div>
            </div>
            <div className="text-xl font-black font-mono tracking-tighter text-white">
              {entry.score.toLocaleString()}
            </div>
          </div>
        ))}

        {sortedScores.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No scores yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};
