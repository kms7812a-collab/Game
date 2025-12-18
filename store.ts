import { create } from 'zustand';
import * as THREE from 'three';
import React from 'react';
import { NpcData, NpcState, NpcType } from './types';

interface GameState {
  coins: number;
  gameOver: boolean;
  gameStarted: boolean;
  npcs: Record<string, NpcData>;
  npcRefs: Record<string, THREE.Group>; // Direct access to mesh for position checks
  playerRef: React.MutableRefObject<THREE.Group | null> | null;
  
  // Actions
  addCoin: () => void;
  removeCoin: () => void;
  setGameOver: (status: boolean) => void;
  startGame: () => void;
  resetGame: () => void;
  
  // NPC Management
  registerNpc: (id: string, data: NpcData) => void;
  registerNpcRef: (id: string, ref: THREE.Group) => void;
  updateNpcState: (id: string, newState: NpcState) => void;
  removeNpc: (id: string) => void;
  setPlayerRef: (ref: React.MutableRefObject<THREE.Group | null>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  coins: 0,
  gameOver: false,
  gameStarted: false,
  npcs: {},
  npcRefs: {},
  playerRef: null,

  addCoin: () => set((state) => ({ coins: state.coins + 1 })),
  removeCoin: () => set((state) => ({ coins: Math.max(0, state.coins - 1) })),
  setGameOver: (status) => set({ gameOver: status }),
  
  startGame: () => set({ gameStarted: true, gameOver: false, coins: 0 }),
  
  resetGame: () => {
    // Determine a new random set of NPCs is handled by the GameController component 
    // watching the gameStarted/gameOver flags, but we clear data here
    set({ 
      coins: 0, 
      gameOver: false, 
      npcs: {}, 
      npcRefs: {} // Refs will re-register on mount
    });
  },

  registerNpc: (id, data) => set((state) => ({ 
    npcs: { ...state.npcs, [id]: data } 
  })),

  registerNpcRef: (id, ref) => {
      const refs = get().npcRefs;
      refs[id] = ref;
      // We don't necessarily need to trigger a full re-render for refs, 
      // but Zustand handles immutability.
      // This is used for the scanner loop.
  },

  updateNpcState: (id, newState) => set((state) => ({
    npcs: {
      ...state.npcs,
      [id]: { ...state.npcs[id], state: newState }
    }
  })),

  removeNpc: (id) => set((state) => {
    const newNpcs = { ...state.npcs };
    delete newNpcs[id];
    const newRefs = { ...state.npcRefs };
    delete newRefs[id];
    return { npcs: newNpcs, npcRefs: newRefs };
  }),

  setPlayerRef: (ref) => set({ playerRef: ref }),
}));