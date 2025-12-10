import React, { useState, useEffect, useRef, useCallback } from 'react';
// Import the Farcaster SDK
import { sdk } from '@farcaster/miniapp-sdk'; 

import { GameState, HitMarker } from '../types';
import { Play, RotateCcw, Zap } from 'lucide-react';
import normalDan from '../src/assets/normaldan.svg';
import hurtDan from '../src/assets/hurtdan.svg';

// === CONFIGURATION ===
// Use actual SVG files from `src/assets` so they render correctly
const TARGET_NORMAL: string = normalDan;
const TARGET_HURT: string = hurtDan;

// Boxing Glove SVG
const BOXING_GLOVE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20,50 Q10,50 10,40 Q10,10 40,10 Q60,10 70,30 L80,30 Q90,30 90,50 Q90,70 80,70 L70,70 Q70,90 40,90 Q10,90 20,50 Z' fill='%23dc2626' stroke='%237f1d1d' stroke-width='3'/%3E%3Cpath d='M70,30 Q60,30 60,50 Q60,70 70,70' fill='none' stroke='%237f1d1d' stroke-width='3'/%3E%3Crect x='75' y='35' width='15' height='30' rx='5' fill='%23991b1b'/%3E%3C/svg%3E";

const GAME_DURATION = 30; // seconds
const INITIAL_MOVE_INTERVAL = 800; // ms
const MIN_MOVE_INTERVAL = 300; // ms
const SCORE_BASE = 100;
const COMBO_TIMEOUT = 1200; // ms
const TARGET_SIZE = 112; // px (w-28 = 7rem = 112px)

interface GameProps {
  onGameEnd: (score: number) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
}

export const Game: React.FC<GameProps> = ({ onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  // Use numeric position for collision detection
  const [targetPos, setTargetPos] = useState({ x: 150, y: 150 });
  
  const [hits, setHits] = useState<HitMarker[]>([]);
  const [bloodParticles, setBloodParticles] = useState<Particle[]>([]);
  const [glove, setGlove] = useState<{x: number, y: number, id: number} | null>(null);

  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isHurt, setIsHurt] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(INITIAL_MOVE_INTERVAL);

  // ⭐️ FIX: Use the imported SDK to call actions.ready()
  useEffect(() => {
    // The Farcaster docs suggest `await sdk.actions.ready()`.
    // In React's useEffect, we call it directly.
    // We add a check for the SDK just in case, though the import usually handles this.
    if (sdk && sdk.actions && sdk.actions.ready) {
      try {
        // NOTE: While the docs use 'await', we call it without 'await' in this 
        // useEffect hook as it's not designed to be async, but the function 
        // itself is likely returning a promise that the Farcaster environment handles.
        sdk.actions.ready();
        // console.log('Farcaster SDK imported ready() called.');
      } catch (error) {
        // console.error('Error calling sdk.actions.ready():', error);
      }
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const moveTarget = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const maxLeft = clientWidth - TARGET_SIZE;
      const maxTop = clientHeight - TARGET_SIZE;
      
      const newLeft = Math.floor(Math.random() * maxLeft);
      const newTop = Math.floor(Math.random() * maxTop);
      
      setTargetPos({ x: newLeft, y: newTop });
    }
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(GAME_DURATION);
    setGameState(GameState.PLAYING);
    setHits([]);
    setBloodParticles([]);
    setGlove(null);
    currentIntervalRef.current = INITIAL_MOVE_INTERVAL;
    moveTarget();
  };

  const endGame = useCallback(async () => {
    setGameState(GameState.GAME_OVER);
    if (moveTimerRef.current) clearInterval(moveTimerRef.current);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    onGameEnd(score);
  }, [onGameEnd, score]);

  // Game Loop: Timer
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, endGame]);

  // Game Loop: Movement
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      moveTimerRef.current = setInterval(moveTarget, currentIntervalRef.current);
      return () => {
        if (moveTimerRef.current) clearInterval(moveTimerRef.current);
      };
    }
  }, [gameState, moveTarget]);

  // --- INTERACTION HANDLER ---
  const handleInteraction = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING) return;
    
    // 1. Get Coordinates relative to container
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    // 2. Show Boxing Glove
    setGlove({ x, y, id: Date.now() });

    // 3. Collision Detection
    // Target Center
    const targetCenterX = targetPos.x + TARGET_SIZE / 2;
    const targetCenterY = targetPos.y + TARGET_SIZE / 2;
    const radius = TARGET_SIZE / 2;

    const distance = Math.sqrt(Math.pow(x - targetCenterX, 2) + Math.pow(y - targetCenterY, 2));

    // HIT LOGIC
    if (distance < radius) {
      handleHitSuccess(x, y);
    }
  };

  const handleHitSuccess = (hitX: number, hitY: number) => {
      // Combo Logic
      let newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
  
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, COMBO_TIMEOUT);
  
      // Score Logic
      const variance = Math.floor(Math.random() * 10);
      const comboBonus = Math.min(newCombo * 10, 500); 
      const points = SCORE_BASE + variance + comboBonus;
      setScore(prev => prev + points);
  
      // Difficulty
      if (newCombo % 5 === 0 && currentIntervalRef.current > MIN_MOVE_INTERVAL) {
        currentIntervalRef.current = Math.max(MIN_MOVE_INTERVAL, currentIntervalRef.current - 50);
      }
      
      // Hit Marker
      const newHit: HitMarker = { id: Date.now(), x: hitX, y: hitY, value: points };
      setHits(prev => [...prev, newHit]);
      setTimeout(() => {
        setHits(prev => prev.filter(h => h.id !== newHit.id));
      }, 500);

      // Blood Effect
      const drops = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: hitX,
        y: hitY,
        angle: (Math.random() * 90) + 45, // Downward spread
      }));
      setBloodParticles(prev => [...prev, ...drops]);
      // Cleanup blood after animation
      setTimeout(() => {
        setBloodParticles(prev => prev.filter(p => !drops.find(d => d.id === p.id)));
      }, 800);
  
      // Visuals
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
  
      setIsHurt(true);
      setTimeout(() => setIsHurt(false), 300);
  
      // Move Target
      moveTarget();
      if (moveTimerRef.current) clearInterval(moveTimerRef.current);
      moveTimerRef.current = setInterval(moveTarget, currentIntervalRef.current);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 relative overflow-hidden select-none ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase font-bold">Time</span>
          <span className={`text-3xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </span>
          {/* Combo Indicator */}
          <div className={`mt-2 transition-opacity duration-200 ${combo > 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-1 text-yellow-400">
               <Zap className="w-4 h-4 fill-current animate-pulse" />
               <span className="text-sm font-bold uppercase italic">Combo</span>
            </div>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 italic">
              x{combo}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase font-bold">Score</span>
          <span className="text-4xl font-black font-mono text-white drop-shadow-lg">
            {score.toLocaleString()}
          </span>
          {maxCombo > 5 && (
            <span className="text-xs text-green-400 font-mono mt-1">
              Best Combo: x{maxCombo}
            </span>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-900 overflow-hidden cursor-crosshair touch-manipulation active:cursor-none"
        onPointerDown={handleInteraction}
      >
        {/* Ring Ropes Decoration */}
        <div className="absolute top-[20%] w-full h-1 bg-gray-800 opacity-30 pointer-events-none"></div>
        <div className="absolute top-[50%] w-full h-1 bg-gray-800 opacity-30 pointer-events-none"></div>
        <div className="absolute top-[80%] w-full h-1 bg-gray-800 opacity-30 pointer-events-none"></div>

        {gameState === GameState.PLAYING && (
          <div
            className="absolute shadow-2xl transition-all duration-100"
            style={{ 
              width: TARGET_SIZE,
              height: TARGET_SIZE,
              top: targetPos.y, 
              left: targetPos.x,
              transition: 'top 0.1s ease-out, left 0.1s ease-out' 
            }}
          >
            {/* The Target Object */}
            <div className="w-full h-full relative group">
              <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse opacity-20 blur-xl"></div>
              <img 
                src={isHurt ? TARGET_HURT : TARGET_NORMAL} 
                alt="Target" 
                className={`w-full h-full object-cover rounded-full border-4 ${isHurt ? 'border-red-500 bg-transparent scale-95' : 'border-gray-200 bg-transparent'} transition-all duration-75 relative z-10 pointer-events-none select-none`}
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* Blood Drops */}
        {bloodParticles.map(p => (
           <div 
             key={p.id}
             className="absolute w-4 h-4 rounded-full bg-red-600 pointer-events-none z-20"
             style={{ 
               top: p.y, 
               left: p.x,
               animation: `blood-drop 0.8s ease-in forwards`,
               '--tw-enter-translate-x': `${(Math.random() - 0.5) * 100}px`,
             } as React.CSSProperties}
           >
             <style>{`
               @keyframes blood-drop {
                 0% { transform: translate(0, 0) scale(1); opacity: 1; }
                 100% { transform: translate(${(Math.random() - 0.5) * 60}px, 150px) scale(0.5); opacity: 0; }
               }
             `}</style>
           </div>
        ))}

        {/* Hit Markers */}
        {hits.map(hit => (
          <div
            key={hit.id}
            className="absolute animate-pop pointer-events-none z-30"
            style={{ top: hit.y - 20, left: hit.x - 20 }}
          >
             <span className="text-5xl font-black text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,1)] italic tracking-tighter transform -rotate-12 block">POW!</span>
             <span className="absolute -top-6 left-10 text-xl font-bold text-white drop-shadow-md">+{hit.value}</span>
          </div>
        ))}

        {/* Boxing Glove Cursor */}
        {glove && (
          <div 
            key={glove.id}
            className="absolute pointer-events-none z-40"
            style={{ 
              top: glove.y - 50, 
              left: glove.x - 50,
              animation: 'punch 0.15s ease-out forwards'
            }}
          >
            <style>{`
              @keyframes punch {
                0% { transform: scale(1.5) rotate(-15deg); }
                50% { transform: scale(1) rotate(0deg); }
                100% { transform: scale(1); }
              }
            `}</style>
            <img src={BOXING_GLOVE} width={100} height={100} alt="Glove" className="filter drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Overlays */}
      {gameState === GameState.IDLE && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="text-center p-8">
            <h1 className="text-6xl font-black text-white italic mb-2 tracking-tighter drop-shadow-2xl">FACE<br/>BOXER</h1>
            <p className="text-gray-400 mb-8 font-mono">
              TAP TO PUNCH.<br/>
              HIT THE FACE.
            </p>
            <button 
              onClick={startGame}
              className="bg-red-600 hover:bg-red-700 text-white text-2xl font-black italic py-6 px-16 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] transform transition hover:scale-110 active:scale-95 flex items-center mx-auto gap-2 ring-4 ring-red-900"
            >
              <Play fill="currentColor" /> FIGHT!
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-sm p-6 text-center">
            <h2 className="text-4xl font-black text-white italic uppercase mb-6 transform -rotate-2">Knockout!</h2>
            
            <div className="bg-gray-800 rounded-3xl p-6 mb-6 border-2 border-gray-700 relative overflow-hidden shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-left">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Score</p>
                  <p className="text-3xl font-black text-white font-mono">{score.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Max Combo</p>
                  <p className="text-3xl font-black text-yellow-400 font-mono">x{maxCombo}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-white text-black hover:bg-gray-200 font-black italic text-xl py-4 px-8 rounded-xl shadow-xl transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={24} /> REMATCH
            </button>
          </div>
        </div>
      )}
    </div>
  );
};