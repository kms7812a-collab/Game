import React, { useMemo } from 'react';
import { Box, Plane } from '@react-three/drei';
import { BuildingData, CITY_SIZE, STREET_WIDTH, BUILDING_SIZE } from '../types';

interface WorldProps {
  onBuildingsGenerated: (buildings: BuildingData[]) => void;
}

export const World: React.FC<WorldProps> = ({ onBuildingsGenerated }) => {
  const buildings = useMemo(() => {
    const b: BuildingData[] = [];
    const gridSize = Math.floor(CITY_SIZE / (BUILDING_SIZE + STREET_WIDTH));
    const offset = (gridSize * (BUILDING_SIZE + STREET_WIDTH)) / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Leave center empty for spawn
        if (x > gridSize / 2 - 2 && x < gridSize / 2 + 2 && 
            z > gridSize / 2 - 2 && z < gridSize / 2 + 2) {
          continue;
        }

        // Random height
        const height = Math.random() * 10 + 5;
        const xPos = x * (BUILDING_SIZE + STREET_WIDTH) - offset;
        const zPos = z * (BUILDING_SIZE + STREET_WIDTH) - offset;

        b.push({
          id: `b-${x}-${z}`,
          position: [xPos, height / 2, zPos],
          size: [BUILDING_SIZE, height, BUILDING_SIZE],
        });
      }
    }
    return b;
  }, []);

  // Report buildings to parent for collision logic
  React.useEffect(() => {
    onBuildingsGenerated(buildings);
  }, [buildings, onBuildingsGenerated]);

  return (
    <group>
      {/* Ground */}
      <Plane 
        args={[200, 200]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#eeeeee" />
      </Plane>
      
      {/* Grid Helper for visual style */}
      <gridHelper args={[200, 50]} position={[0, 0.01, 0]} />

      {/* Buildings */}
      {buildings.map((b) => (
        <Box 
          key={b.id} 
          position={b.position} 
          args={b.size}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#8899a6" roughness={0.8} />
        </Box>
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* City decoration: Trees (Simple green cones) */}
      <Tree position={[10, 0, 10]} />
      <Tree position={[-15, 0, -15]} />
      <Tree position={[20, 0, -20]} />
      <Tree position={[-20, 0, 20]} />
    </group>
  );
};

const Tree = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 1, 0]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
    <mesh position={[0, 3, 0]} castShadow>
      <coneGeometry args={[2, 4, 8]} />
      <meshStandardMaterial color="#228B22" />
    </mesh>
  </group>
);
