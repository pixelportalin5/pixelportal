import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Asteroids({ count = 200 }) {
  const meshRef = useRef();
  // We use a dummy object to calculate the position of each asteroid before sending it to the GPU
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      // Scatter the asteroids randomly along the space tunnel
      dummy.position.set(
        (Math.random() - 0.5) * 80, 
        (Math.random() - 0.5) * 80, 
        (Math.random() - 0.5) * 100 - 20 
      );
      // Give each one a random spin and size
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.scale.setScalar(Math.random() * 0.5 + 0.1);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(() => {
    // SOW Requirement: Apply a slow rotation to the entire instanced group
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
      meshRef.current.rotation.z += 0.0002;
    }
  });

  return (
    // The InstancedMesh is the secret to 60fps mobile performance
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      {/* A dodecahedron makes a perfect low-poly asteroid */}
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#444444" roughness={0.9} />
    </instancedMesh>
  );
}