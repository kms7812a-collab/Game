import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { BuildingData, PLAYER_SPEED, SCAN_ANGLE, SCAN_DISTANCE, NpcType, NpcState } from '../types';

interface PlayerProps {
  buildings: BuildingData[];
}

export const Player: React.FC<PlayerProps> = ({ buildings }) => {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const setPlayerRef = useGameStore((state) => state.setPlayerRef);
  const updateNpcState = useGameStore((state) => state.updateNpcState);
  const npcRefs = useGameStore((state) => state.npcRefs);
  const npcs = useGameStore((state) => state.npcs);
  const gameOver = useGameStore((state) => state.gameOver);
  
  // Movement State
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  
  // Scanner Visuals
  const [isScanning, setIsScanning] = useState(false);
  const scannerLightRef = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    if (playerRef.current) {
      setPlayerRef(playerRef);
    }
  }, [setPlayerRef]);

  // Input Handling
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (gameOver) return;
      switch (event.code) {
        case 'KeyW': moveForward.current = true; break;
        case 'KeyS': moveBackward.current = true; break;
        case 'KeyA': moveLeft.current = true; break;
        case 'KeyD': moveRight.current = true; break;
        case 'KeyE': handleScan(); break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': moveForward.current = false; break;
        case 'KeyS': moveBackward.current = false; break;
        case 'KeyA': moveLeft.current = false; break;
        case 'KeyD': moveRight.current = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, npcs, npcRefs]); // Dep array includes state needed for scan

  const handleScan = () => {
    if (isScanning || gameOver) return;
    
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 300); // Visual effect duration

    if (!playerRef.current) return;

    const playerPos = playerRef.current.position;
    const playerDir = new THREE.Vector3();
    camera.getWorldDirection(playerDir);
    playerDir.y = 0; // Flatten scan to horizontal plane
    playerDir.normalize();

    // Iterate all NPCs to check if they are in cone
    Object.keys(npcRefs).forEach((id) => {
      const npcObj = npcRefs[id];
      const npcData = npcs[id];
      
      if (!npcObj || !npcData) return;
      
      // Calculate direction to NPC
      const toNpc = new THREE.Vector3().subVectors(npcObj.position, playerPos);
      toNpc.y = 0; // Ignore height diff
      const dist = toNpc.length();

      if (dist < SCAN_DISTANCE) {
        toNpc.normalize();
        const angle = playerDir.angleTo(toNpc);
        
        if (angle < SCAN_ANGLE / 2) {
            // NPC is hit by scan
            if (npcData.state === NpcState.IDLE) {
                const newState = npcData.type === NpcType.GOOD 
                    ? NpcState.SCANNED_GOOD 
                    : NpcState.SCANNED_BAD;
                updateNpcState(id, newState);
            }
        }
      }
    });
  };

  const checkCollision = (position: THREE.Vector3) => {
    // Simple AABB collision with buildings
    // Player radius approx 0.5
    const r = 0.5;
    for (const b of buildings) {
      const minX = b.position[0] - b.size[0] / 2 - r;
      const maxX = b.position[0] + b.size[0] / 2 + r;
      const minZ = b.position[2] - b.size[2] / 2 - r;
      const maxZ = b.position[2] + b.size[2] / 2 + r;

      if (position.x > minX && position.x < maxX && position.z > minZ && position.z < maxZ) {
        return true;
      }
    }
    return false;
  };

  useFrame((state, delta) => {
    if (!playerRef.current || gameOver) return;

    // Movement Logic
    const speed = PLAYER_SPEED * delta;
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(moveBackward.current) - Number(moveForward.current));
    const sideVector = new THREE.Vector3(Number(moveLeft.current) - Number(moveRight.current), 0, 0);

    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed);

    // Convert local direction to world direction based on camera yaw ONLY
    const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    direction.applyEuler(euler);

    const newPos = playerRef.current.position.clone().add(direction);

    if (!checkCollision(newPos)) {
        playerRef.current.position.copy(newPos);
    }

    // Sync Camera to Player
    // Over the shoulder view? Or First Person? Prompt said "Camera: first‑person or over‑the‑shoulder"
    // Let's do First Person for simplicity of scanner alignment
    camera.position.copy(playerRef.current.position).add(new THREE.Vector3(0, 1.6, 0));
  });

  return (
    <>
      <group ref={playerRef} position={[0, 0, 0]}>
        {/* Physical body proxy (invisible but useful for debugging) */}
        <mesh visible={false}>
            <capsuleGeometry args={[0.5, 1.8]} />
            <meshBasicMaterial color="blue" />
        </mesh>
      </group>
      
      {/* Scanner Visual Effect */}
      {isScanning && (
        <group position={camera.position} rotation={camera.rotation}>
            <mesh position={[0, 0, -5]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[2, 10, 32, 1, true]} />
                <meshBasicMaterial 
                    color="#00ffcc" 
                    transparent 
                    opacity={0.3} 
                    side={THREE.DoubleSide} 
                    depthWrite={false}
                />
            </mesh>
        </group>
      )}

      <PointerLockControls 
        selector="#root"
        maxPolarAngle={Math.PI / 2 + 0.1} // Allow slight look down
        minPolarAngle={Math.PI / 2 - 0.1} // Allow slight look up, essentially clamped to horizon
      />
    </>
  );
};
