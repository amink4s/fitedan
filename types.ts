export interface User {
  username: string;
  pfpUrl: string;
}

export interface ScoreEntry {
  id: string;
  username: string;
  score: number;
  date: string;
  rank?: number;
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface HitMarker {
  id: number;
  x: number;
  y: number;
  value: number;
}
