import { useState, useRef, useEffect } from 'react';
import { Html, CameraControls } from '@react-three/drei';
import * as THREE from 'three';

// 1. Imports
import sunVideo from '../assets/sun.mp4';
import planet0 from '../assets/planet0.mp4';
import planet1 from '../assets/planet1.mp4';
import planet2 from '../assets/planet2.mp4';
import planet3 from '../assets/planet3.mp4';
import planet4 from '../assets/planet4.mp4';
import planet5 from '../assets/planet5.mp4';
import planet6 from '../assets/planet6.mp4';
import planet7 from '../assets/planet7.mp4';

const SUN_DATA = { color: '#ffffff' };

// 2. MASSIVE DISTANCES
const PLANET_DATA = [
  { id: 0, name: "Mercury", distance: 150, size: 0.4, video: planet0 },
  { id: 1, name: "Venus",   distance: 250, size: 0.9, video: planet1 },
  { id: 2, name: "Earth",   distance: 350, size: 1.0, video: planet2 },
  { id: 3, name: "Mars",    distance: 450, size: 0.5, video: planet3 },
  { id: 4, name: "Jupiter", distance: 600, size: 2.5, video: planet4 },
  { id: 5, name: "Saturn",  distance: 780, size: 2.2, video: planet5 },
  { id: 6, name: "Uranus",  distance: 950, size: 1.5, video: planet6 },
  { id: 7, name: "Neptune", distance: 1100, size: 1.4, video: planet7 },
];

function Planet({ data, setFocusedPlanet }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!data.video) return null;

  const pixelSize = data.size * 80; 
  const xPosition = data.id % 2 === 0 ? data.distance : -data.distance;

  return (
    <group position={[xPosition, 0, 0]}>
      {/* Invisible hover & click mesh */}
      <mesh 
        visible={false} 
        onPointerOver={() => {
          setIsHovered(true);
          document.body.style.cursor = 'pointer'; // Make it look clickable!
        }} 
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation(); // Stops the click from hitting the background
          setFocusedPlanet(data); // Tells the camera to fly here
        }}
      >
        <sphereGeometry args={[data.size * 2, 32, 32]} />
        <meshBasicMaterial />
      </mesh>

      <Html center style={{ pointerEvents: 'none', zIndex: 10 }}>
        <video 
          src={data.video} 
          autoPlay loop muted playsInline 
          className={`planet-video ${isHovered ? 'hovered' : ''}`}
          style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }} 
        />
      </Html>
    </group>
  );
}

export default function Planets() {
  const controlsRef = useRef();
  
  // This state tracks which planet we are looking at
  const [focusedPlanet, setFocusedPlanet] = useState(null);

  // This hook controls the camera flying animation
  useEffect(() => {
    if (controlsRef.current) {
      if (focusedPlanet) {
        // Calculate where the planet is (left or right side)
        const targetX = focusedPlanet.id % 2 === 0 ? focusedPlanet.distance : -focusedPlanet.distance;
        
        // Fly to the planet!
        // setLookAt( cameraX, cameraY, cameraZ,   targetX, targetY, targetZ,   animateBox )
        controlsRef.current.setLookAt(
          targetX, 20, 80, // Position camera slightly above and in front of the planet
          targetX, 0, 0,   // Look exactly at the center of the planet
          true             // Smoothly animate
        );
      } else {
        // Fly back to the full Solar System view
        controlsRef.current.setLookAt(
          0, 150, 1000, // Position camera way back
          0, 0, 0,      // Look at the Sun
          true
        );
      }
    }
  }, [focusedPlanet]);

  return (
    <group position={[0, 0, 0]}>
      
      {/* The Upgraded Camera Controls */}
      <CameraControls ref={controlsRef} makeDefault />
      
      {/* The Central Sun - Now Clickable to Reset View! */}
      <group position={[0, 0, 0]}>
        <mesh 
          visible={false} 
          onClick={(e) => {
            e.stopPropagation();
            setFocusedPlanet(null); // Resets the camera
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <sphereGeometry args={[8, 32, 32]} />
          <meshBasicMaterial />
        </mesh>

        <Html center style={{ pointerEvents: 'none', zIndex: 1 }}>
          <video src={sunVideo} autoPlay loop muted playsInline className="sun-video" />
        </Html>
        <pointLight color={SUN_DATA.color} intensity={100} distance={2000} />
      </group>

      {/* The Orbiting Planets */}
      {PLANET_DATA.map((planet) => (
        <group key={planet.id}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.distance - 0.5, planet.distance + 0.5, 128]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <Planet 
            data={planet} 
            setFocusedPlanet={setFocusedPlanet} // Pass the click function down to the planet
          />
        </group>
      ))}
    </group>
  );
}