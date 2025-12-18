import React from 'react';
import { useGameStore } from '../store';

export const UI: React.FC = () => {
  const coins = useGameStore((state) => state.coins);
  const gameOver = useGameStore((state) => state.gameOver);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white font-mono text-xl bg-black/50 p-4 rounded-lg">
        <div>COINS: <span className="text-yellow-400 font-bold">{coins}</span></div>
        <div className="text-sm text-gray-300 mt-2">WASD to Move | E to Scan</div>
      </div>

      {/* Crosshair */}
      <div className="crosshair" />

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center text-white z-50 pointer-events-auto">
          <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">GAME OVER</h1>
          <p className="text-2xl mb-8">You ran out of coins to bribe the hypocrites.</p>
          <div className="bg-white text-red-900 px-6 py-3 rounded font-bold animate-pulse">
            Press ANY KEY to Restart
          </div>
        </div>
      )}
    </div>
  );
};
