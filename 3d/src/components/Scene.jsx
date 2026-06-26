import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

import Asteroids from './Asteroids';
import SpaceStation from './SpaceStation';
import Planets from './Planets';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  varying vec2 vUv;

  float random (in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }

  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i); float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm (in vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }

  void main() {
      vec2 uv = vUv * 2.0 - 1.0; 
      float radius = length(uv);

      float angle = fbm(uv + u_time * 2.0) * 3.14159;
      vec2 distortedUv = vec2(
          uv.x * cos(angle) - uv.y * sin(angle),
          uv.x * sin(angle) + uv.y * cos(angle)
      );

      float f = fbm(distortedUv * 3.0 - u_time * 5.0);

      vec3 color = vec3(0.0);
      float alpha = smoothstep(1.0, 0.4, radius) * f;
      float fadeOut = smoothstep(0.15, 0.02, u_time);

      gl_FragColor = vec4(color, alpha * fadeOut);
  }
`;

export default function Scene({ progress }) {
  const portalRef = useRef();
  const materialRef = useRef();
  const currentScroll = useRef(0);

  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 10),    
    new THREE.Vector3(-5, 2, 0),    
    new THREE.Vector3(5, -2, -15),  
    new THREE.Vector3(-2, 0, -30),  
    new THREE.Vector3(0, 0, -50)    
  ]), []);

  const wormholeRings = useMemo(() => {
    const rings = [];
    const ringCount = 50; 
    for (let i = 0; i < ringCount; i++) {
      const t = i / (ringCount - 1);
      const position = curve.getPointAt(t);
      const nextPosition = curve.getPointAt(Math.min(1.0, t + 0.01));
      const dummy = new THREE.Object3D();
      dummy.position.copy(position);
      dummy.lookAt(nextPosition);
      rings.push({ position, quaternion: dummy.quaternion });
    }
    return rings;
  }, [curve]);

  const uniforms = useMemo(() => ({ u_time: { value: 0.0 } }), []);

  useFrame(({ camera }) => {
    currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, progress, 0.05);

    const pointOnCurve = curve.getPoint(currentScroll.current);
    camera.position.copy(pointOnCurve); 

    // --- BUGFIX: The Vector Math Override ---
    let targetLookAt;
    if (currentScroll.current >= 0.99) {
      // If we are at the end of the track, stare permanently at the Solar System
      targetLookAt = new THREE.Vector3(0, -5, -80);
    } else {
      // Otherwise, keep looking ahead on the track
      const lookAhead = Math.min(1.0, currentScroll.current + 0.05);
      targetLookAt = curve.getPoint(lookAhead);
    }
    
    const dummyCamera = new THREE.PerspectiveCamera();
    dummyCamera.position.copy(camera.position);
    dummyCamera.lookAt(targetLookAt);
    camera.quaternion.slerp(dummyCamera.quaternion, 0.05);

    if (materialRef.current) {
        materialRef.current.uniforms.u_time.value = currentScroll.current;
    }

    if (portalRef.current) {
        const portalOffset = new THREE.Vector3(0, 0, -2);
        portalOffset.applyQuaternion(camera.quaternion);
        portalRef.current.position.copy(camera.position).add(portalOffset);
        portalRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#00ffff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <mesh ref={portalRef}>
        <planeGeometry args={[10, 10]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {wormholeRings.map((ring, index) => (
        <mesh key={index} position={ring.position} quaternion={ring.quaternion}>
          <torusGeometry args={[3, 0.02, 16, 64]} />
          <meshBasicMaterial color="#00ffff" transparent={true} opacity={0.3} />
        </mesh>
      ))}

      <Asteroids count={200} />
      <SpaceStation />
      <Planets />
    </>
  );
}