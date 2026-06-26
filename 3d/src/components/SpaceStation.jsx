import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SpaceStation() {
  const stationRef = useRef();

  useFrame(() => {
    // Slowly spin the space station
    if (stationRef.current) {
      stationRef.current.rotation.y += 0.002;
      stationRef.current.rotation.x += 0.001;
    }
  });

  return (
    // We place the station near the end of the track
    <group ref={stationRef} position={[0, -5, -40]}>
      
      {/* Outer Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, 0.5, 16, 100]} />
        <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Inner Core */}
      <mesh>
        <cylinderGeometry args={[2, 2, 10, 32]} />
        <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* SOW Requirement: Neon Cyan PointLights inside the station */}
      <pointLight position={[0, 4, 0]} color="#00ffff" intensity={50} distance={20} />
      <pointLight position={[0, -4, 0]} color="#00ffff" intensity={50} distance={20} />
      
    </group>
  );
}