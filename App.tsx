import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { GameController } from './components/GameController';
import { UI } from './components/UI';

const App: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-sky-300">
      <Canvas shadows camera={{ position: [0, 2, 0], fov: 75 }}>
        <fog attach="fog" args={['#87CEEB', 10, 60]} />
        <Suspense fallback={null}>
          <GameController />
        </Suspense>
      </Canvas>
      <Loader />
      <UI />
    </div>
  );
};

export default App;
