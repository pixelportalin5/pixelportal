import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarSystem from './components/SolarSystem';
import UI from './components/UI';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 420, 1500], fov: 50, near: 0.1, far: 20000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000005']} />
        <Suspense fallback={null}>
          <SolarSystem />
        </Suspense>
      </Canvas>
      <UI />
    </div>
  );
}