import React from 'react';
import { User } from '../types';
import { User as UserIcon } from 'lucide-react';

interface UserProfileProps {
  user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="relative">
        {user.pfpUrl ? (
          <img 
            src={user.pfpUrl} 
            alt={user.username} 
            className="w-10 h-10 rounded-full border-2 border-yellow-500 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-yellow-500 bg-gray-700 flex items-center justify-center text-gray-400">
            <UserIcon size={20} />
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white tracking-wide">{user.username}</span>
        <span className="text-xs text-yellow-500 font-medium">Lvl 1 Contender</span>
      </div>
    </div>
  );
};
