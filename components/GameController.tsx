import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../store';
import { World } from './World';
import { Player } from './Player';
import { Npc } from './Npc';
import { BuildingData, NpcType, NpcState, NpcData } from '../types';

export const GameController: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const registerNpc = useGameStore((state) => state.registerNpc);
  const resetGame = useGameStore((state) => state.resetGame);
  const npcs = useGameStore((state) => state.npcs);
  const gameStarted = useGameStore((state) => state.gameStarted);

  // Initial Spawn
  useEffect(() => {
    resetGame();
    spawnWave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnWave = () => {
    const NPC_COUNT = 20;
    for (let i = 0; i < NPC_COUNT; i++) {
      const id = uuidv4();
      const type = Math.random() > 0.5 ? NpcType.GOOD : NpcType.HYPOCRITE;
      
      // Random position avoiding center (0,0) and hopefully buildings
      // Since buildings are on a grid, we can spawn on streets easily.
      // Streets are at intervals of roughly 10 units.
      let x = (Math.random() - 0.5) * 80;
      let z = (Math.random() - 0.5) * 80;
      
      // Simple correction to ensure not inside the exact center spawn
      if (Math.abs(x) < 5 && Math.abs(z) < 5) x += 10;

      registerNpc(id, {
        id,
        type,
        state: NpcState.IDLE,
        position: [x, 0, z]
      });
    }
  };

  const handleRestart = () => {
      resetGame();
      spawnWave();
  };

  // Keyboard listener for restart
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (useGameStore.getState().gameOver) {
            handleRestart();
          }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <World onBuildingsGenerated={setBuildings} />
      <Player buildings={buildings} />
      {Object.values(npcs).map((npc: NpcData) => (
        <Npc key={npc.id} data={npc} buildings={buildings} />
      ))}
    </>
  );
};