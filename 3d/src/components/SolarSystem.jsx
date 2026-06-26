import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { SUN, PLANETS, ORBIT_SPEED } from '../data';

function PlanetModel({ data, registerRef }) {
  const groupRef = useRef();
  const { scene } = useGLTF(data.model);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  const hovered = useStore((s) => s.hovered === data.id);
  const setHovered = useStore((s) => s.setHovered);
  const setFocused = useStore((s) => s.setFocused);

  useEffect(() => { 
    registerRef(data.id, groupRef.current); 
  }, [registerRef, data.id]);

  const normalizedScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const currentRadius = sphere.radius || 1;
    const targetRadius = data.radius * (data.scale || 1.0);
    return targetRadius / currentRadius;
  }, [clonedScene, data.radius, data.scale]);

  const planetRef = useRef();

  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.2 * delta;
    }
  });

  return (
    <group ref={groupRef} position={[data.distance, 0, 0]}>
      <group
        ref={planetRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(data.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); setFocused(data.id); }}
      >
        <primitive object={clonedScene} scale={[normalizedScale, normalizedScale, normalizedScale]} />
      </group>
    </group>
  );
}

function OrbitingPlanet({ data, registerRef }) {
  const orbitRef = useRef();
  useFrame((_, delta) => { orbitRef.current.rotation.y += data.speed * ORBIT_SPEED * delta; });
  return (
    <group ref={orbitRef}>
      <PlanetModel data={data} registerRef={registerRef} />
    </group>
  );
}

function OrbitRing({ distance }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[distance - 0.4, distance + 0.4, 256]} />
      <meshBasicMaterial color="#8fd6ff" transparent opacity={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Sun() {
  const { scene } = useGLTF(SUN.model);
  const setFocused = useStore((s) => s.setFocused);
  const sunRef = useRef();

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          // If no emissive texture/color, set a default warm golden glow
          if (!child.material.emissive || child.material.emissive.getHex() === 0x000000) {
            child.material.emissive = new THREE.Color("#ffaa44");
          }
          child.material.emissiveIntensity = 2.0;
          child.material.toneMapped = false;
        }
      }
    });
  }, [scene]);

  const normalizedScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const currentRadius = sphere.radius || 1;
    const targetRadius = SUN.radius * (SUN.scale || 1.0);
    return targetRadius / currentRadius;
  }, [scene]);

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.04 * delta;
    }
  });

  return (
    <group 
      ref={sunRef}
      onClick={(e) => { e.stopPropagation(); setFocused('sun'); }} 
      onPointerOver={() => (document.body.style.cursor = 'pointer')} 
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <primitive object={scene} scale={[normalizedScale, normalizedScale, normalizedScale]} />
      <pointLight intensity={3500} distance={10000} decay={1.0} color="#fff8e7" />
    </group>
  );
}

function CameraRig({ refs }) {
  const { camera } = useThree();
  const focused = useStore((s) => s.focused);

  // Persistent vectors — never recreated
  const smoothPos = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useMemo(() => new THREE.Vector3(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const tmpVec2 = useMemo(() => new THREE.Vector3(), []);
  const tmpVec3 = useMemo(() => new THREE.Vector3(), []);

  const transitionRef = useRef({
    active: false,
    progress: 0,
    duration: 2.0,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(),
    endLook: new THREE.Vector3(),
    control: new THREE.Vector3(),
  });
  const previousFocused = useRef(focused);
  const autoOrbitRef = useRef({
    angle: 0,
    velocity: 0,
    targetVelocity: 0,
    manualOverride: false,
  });
  const initialized = useRef(false);

  // Initialize smooth vectors to camera's starting position
  useEffect(() => {
    if (!initialized.current) {
      smoothPos.copy(camera.position);
      smoothLook.set(0, 0, 0);
      initialized.current = true;
    }
  }, [camera, smoothPos, smoothLook]);

  const getTargetPose = () => {
    if (focused === null) {
      return { position: new THREE.Vector3(0, 420, 1500), lookAt: new THREE.Vector3(0, 0, 0) };
    }

    if (focused === 'sun') {
      return { position: new THREE.Vector3(0, 70, 260), lookAt: new THREE.Vector3(0, 0, 0) };
    }

    const obj = refs.current.get(focused);
    if (!obj) {
      return { position: new THREE.Vector3(0, 420, 1500), lookAt: new THREE.Vector3(0, 0, 0) };
    }

    obj.getWorldPosition(tmpVec);
    const r = PLANETS[focused].radius;
    return {
      position: new THREE.Vector3(tmpVec.x + r * 3, tmpVec.y + r * 1.6, tmpVec.z + r * 6),
      lookAt: tmpVec.clone(),
    };
  };

  useEffect(() => {
    if (previousFocused.current === focused) return;
    previousFocused.current = focused;

    if (focused === null) {
      autoOrbitRef.current.manualOverride = false;
      autoOrbitRef.current.targetVelocity = 0.015;
    }

    const nextPose = getTargetPose();
    const transition = transitionRef.current;
    transition.active = true;
    transition.progress = 0;
    transition.startPos.copy(camera.position);
    transition.endPos.copy(nextPose.position);
    transition.startLook.copy(smoothLook);
    transition.endLook.copy(nextPose.lookAt);

    const midpoint = tmpVec2.copy(transition.startPos).lerp(transition.endPos, 0.5);
    const dist = transition.startPos.distanceTo(transition.endPos);
    const arcHeight = Math.max(90, dist * 0.15);
    transition.control.copy(midpoint).add(tmpVec3.set(0, arcHeight, 0));

    // Scale duration based on travel distance for consistent perceived speed
    transition.duration = THREE.MathUtils.clamp(dist * 0.0015, 1.2, 3.0);
  }, [camera, focused, refs]);

  useEffect(() => {
    const handlePointerDown = () => {
      autoOrbitRef.current.manualOverride = true;
      autoOrbitRef.current.targetVelocity = 0;
    };

    const handlePointerUp = () => {
      autoOrbitRef.current.manualOverride = false;
      autoOrbitRef.current.targetVelocity = 0.015;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05); // Prevent huge jumps on tab-switch
    const transition = transitionRef.current;

    if (transition.active) {
      transition.progress = Math.min(1, transition.progress + clampedDelta / transition.duration);
      const t = transition.progress;
      // Smooth ease-in-out (quintic for extra smoothness)
      const eased = t * t * t * (t * (t * 6 - 15) + 10);

      // Quadratic Bézier — reuse tmpVec, tmpVec2, tmpVec3 instead of allocating
      const inv = 1 - eased;
      tmpVec.copy(transition.startPos).multiplyScalar(inv * inv);
      tmpVec2.copy(transition.control).multiplyScalar(2 * inv * eased);
      tmpVec3.copy(transition.endPos).multiplyScalar(eased * eased);
      smoothPos.copy(tmpVec).add(tmpVec2).add(tmpVec3);

      smoothLook.copy(transition.startLook).lerp(transition.endLook, eased);
      camera.position.copy(smoothPos);
      camera.lookAt(smoothLook);

      if (transition.progress >= 1) {
        transition.active = false;
        camera.position.copy(transition.endPos);
        smoothPos.copy(transition.endPos);
        smoothLook.copy(transition.endLook);
        camera.lookAt(smoothLook);
      }
      return;
    }

    // Frame-rate-independent damping factor
    const damping = 1 - Math.exp(-3.0 * clampedDelta);

    if (focused === null) {
      const orbit = autoOrbitRef.current;
      orbit.targetVelocity = 0.015;

      if (!orbit.manualOverride) {
        orbit.velocity = THREE.MathUtils.lerp(orbit.velocity, orbit.targetVelocity, 0.03);
        orbit.angle += orbit.velocity * clampedDelta * 0.8;
        tmpVec.set(
          Math.cos(orbit.angle) * 1400,
          420,
          Math.sin(orbit.angle) * 1400
        );
        smoothPos.lerp(tmpVec, damping);
        camera.position.copy(smoothPos);
        smoothLook.lerp(tmpVec2.set(0, 0, 0), damping);
        camera.lookAt(smoothLook);
      }
      return;
    }

    if (focused === 'sun') {
      tmpVec.set(0, 70, 260);
      smoothPos.lerp(tmpVec, damping);
      camera.position.copy(smoothPos);
      smoothLook.lerp(tmpVec2.set(0, 0, 0), damping);
      camera.lookAt(smoothLook);
      return;
    }

    const obj = refs.current.get(focused);
    if (obj) {
      obj.getWorldPosition(tmpVec);
      const r = PLANETS[focused].radius;
      tmpVec2.set(tmpVec.x + r * 3, tmpVec.y + r * 1.6, tmpVec.z + r * 6);
      smoothPos.lerp(tmpVec2, damping);
      camera.position.copy(smoothPos);
      smoothLook.lerp(tmpVec, damping);
      camera.lookAt(smoothLook);
    }
  });

  return null;
}

export default function SolarSystem() {
  const refs = useRef(new Map());
  const registerRef = useMemo(() => (id, obj) => { if (obj) refs.current.set(id, obj); }, []);
  
  return (
    <>
      <CameraRig refs={refs} />
      <ambientLight intensity={1.8} />
      <directionalLight intensity={1.2} position={[1000, 1000, 1000]} />
      <Stars radius={4000} depth={800} count={6000} factor={24} saturation={0} fade speed={0.4} />
      <Sparkles count={200} scale={[3000, 600, 3000]} size={3} speed={0.2} opacity={0.4} color="#9fd6ff" />
      <Sun />
      {PLANETS.map((p) => (
        <group key={p.id}>
          <OrbitRing distance={p.distance} />
          <OrbitingPlanet data={p} registerRef={registerRef} />
        </group>
      ))}
    </>
  );
}