import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { NpcData, NpcState, NpcType, NPC_SPEED_IDLE, NPC_SPEED_CHASE, BuildingData, INTERACTION_DISTANCE } from '../types';

interface NpcProps {
  data: NpcData;
  buildings: BuildingData[];
}

export const Npc: React.FC<NpcProps> = ({ data, buildings }) => {
  const groupRef = useRef<THREE.Group>(null);
  const registerNpcRef = useGameStore((state) => state.registerNpcRef);
  const playerRef = useGameStore((state) => state.playerRef);
  
  // Game Actions
  const addCoin = useGameStore((state) => state.addCoin);
  const removeCoin = useGameStore((state) => state.removeCoin);
  const removeNpc = useGameStore((state) => state.removeNpc);
  const setGameOver = useGameStore((state) => state.setGameOver);
  const coins = useGameStore((state) => state.coins);
  const gameOver = useGameStore((state) => state.gameOver);

  // Local state for random movement
  const directionRef = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const timeToChangeDirRef = useRef(0);

  useEffect(() => {
    if (groupRef.current) {
      registerNpcRef(data.id, groupRef.current);
    }
  }, [data.id, registerNpcRef]);

  // Determine Color
  const color = useMemo(() => {
    if (data.state === NpcState.IDLE) return '#cccccc'; // Grey/White for unknown
    if (data.state === NpcState.SCANNED_GOOD) return '#00ff00'; // Green
    if (data.state === NpcState.SCANNED_BAD) return '#ff0000'; // Red
    return '#ffffff';
  }, [data.state]);

  useFrame((state, delta) => {
    if (!groupRef.current || gameOver) return;

    const pos = groupRef.current.position;
    
    // --- BEHAVIOR ---
    
    // 1. GOOD & SCANNED: Stand Still.
    if (data.state === NpcState.SCANNED_GOOD) {
      // Logic for interaction with player handled below
    } 
    
    // 2. HYPOCRITE & SCANNED: Chase Player.
    else if (data.state === NpcState.SCANNED_BAD) {
        if (playerRef?.current) {
            const playerPos = playerRef.current.position;
            const dirToPlayer = new THREE.Vector3().subVectors(playerPos, pos).normalize();
            dirToPlayer.y = 0; // Keep on ground
            
            // Move
            const moveVec = dirToPlayer.multiplyScalar(NPC_SPEED_CHASE * delta);
            const newPos = pos.clone().add(moveVec);
            
            if (!checkCollision(newPos, buildings)) {
                pos.copy(newPos);
                groupRef.current.lookAt(playerPos.x, pos.y, playerPos.z);
            }
        }
    } 
    
    // 3. IDLE: Random Walk.
    else {
        timeToChangeDirRef.current -= delta;
        if (timeToChangeDirRef.current <= 0) {
            directionRef.current = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            timeToChangeDirRef.current = Math.random() * 2 + 1; // Change every 1-3 seconds
        }

        const moveVec = directionRef.current.clone().multiplyScalar(NPC_SPEED_IDLE * delta);
        const newPos = pos.clone().add(moveVec);

        if (!checkCollision(newPos, buildings)) {
            pos.copy(newPos);
            groupRef.current.lookAt(newPos.x, pos.y, newPos.z);
        } else {
            // Hit wall, turn around
            directionRef.current.negate();
        }
    }

    // --- INTERACTION WITH PLAYER ---
    if (playerRef?.current && data.state !== NpcState.IDLE) {
        const dist = pos.distanceTo(playerRef.current.position);
        
        if (dist < INTERACTION_DISTANCE) {
            if (data.state === NpcState.SCANNED_GOOD) {
                // Collect Good Citizen
                addCoin();
                removeNpc(data.id);
            } else if (data.state === NpcState.SCANNED_BAD) {
                // Caught by Hypocrite
                if (coins > 0) {
                    removeCoin();
                    removeNpc(data.id); // Pay with coin to remove enemy
                } else {
                    setGameOver(true);
                }
            }
        }
    }
  });

  return (
    <group ref={groupRef} position={data.position}>
      {/* Simple Low Poly Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#ffe0bd" />
      </mesh>
      {/* Visual Indicator for State (Floating Icon) */}
      {data.state === NpcState.SCANNED_GOOD && (
          <mesh position={[0, 2.5, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshBasicMaterial color="#00ff00" />
          </mesh>
      )}
       {data.state === NpcState.SCANNED_BAD && (
          <mesh position={[0, 2.5, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshBasicMaterial color="#ff0000" />
          </mesh>
      )}
    </group>
  );
};

// Simple collision function reused (should be utility ideally)
function checkCollision(position: THREE.Vector3, buildings: BuildingData[]) {
    const r = 0.5; // NPC radius
    for (const b of buildings) {
      const minX = b.position[0] - b.size[0] / 2 - r;
      const maxX = b.position[0] + b.size[0] / 2 + r;
      const minZ = b.position[2] - b.size[2] / 2 - r;
      const maxZ = b.position[2] + b.size[2] / 2 + r;

      if (position.x > minX && position.x < maxX && position.z > minZ && position.z < maxZ) {
        return true;
      }
    }
    // Also keep within city bounds somewhat
    if (Math.abs(position.x) > 50 || Math.abs(position.z) > 50) return true;
    return false;
}
