import * as THREE from 'three';

export enum NpcType {
  GOOD = 'GOOD',
  HYPOCRITE = 'HYPOCRITE',
}

export enum NpcState {
  IDLE = 'IDLE',
  SCANNED_GOOD = 'SCANNED_GOOD',
  SCANNED_BAD = 'SCANNED_BAD',
}

export interface BuildingData {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
}

export interface NpcData {
  id: string;
  type: NpcType;
  state: NpcState;
  position: [number, number, number]; // Initial position
}

export const CITY_SIZE = 100;
export const STREET_WIDTH = 4;
export const BUILDING_SIZE = 6;
export const PLAYER_SPEED = 5;
export const NPC_SPEED_IDLE = 2;
export const NPC_SPEED_CHASE = 4.5;
export const SCAN_DISTANCE = 15;
export const SCAN_ANGLE = Math.PI / 4; // 45 degrees
export const INTERACTION_DISTANCE = 1.2;
