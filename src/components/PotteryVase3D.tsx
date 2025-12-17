import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const Vase = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  // Create vase profile points for lathe geometry
  const points: THREE.Vector2[] = [];
  
  // Bottom base
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.3, 0));
  points.push(new THREE.Vector2(0.35, 0.05));
  
  // Lower body curve
  points.push(new THREE.Vector2(0.5, 0.2));
  points.push(new THREE.Vector2(0.7, 0.5));
  points.push(new THREE.Vector2(0.8, 0.8));
  
  // Widest part (belly)
  points.push(new THREE.Vector2(0.85, 1.1));
  points.push(new THREE.Vector2(0.82, 1.4));
  
  // Upper curve narrowing
  points.push(new THREE.Vector2(0.7, 1.7));
  points.push(new THREE.Vector2(0.55, 2.0));
  points.push(new THREE.Vector2(0.4, 2.2));
  
  // Neck
  points.push(new THREE.Vector2(0.35, 2.4));
  points.push(new THREE.Vector2(0.32, 2.6));
  points.push(new THREE.Vector2(0.35, 2.75));
  
  // Rim flare
  points.push(new THREE.Vector2(0.42, 2.85));
  points.push(new THREE.Vector2(0.45, 2.9));
  points.push(new THREE.Vector2(0.43, 2.95));
  points.push(new THREE.Vector2(0.38, 2.98));
  points.push(new THREE.Vector2(0.35, 3.0));

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh ref={meshRef} position={[0, -1.5, 0]} castShadow receiveShadow>
        <latheGeometry args={[points, 64]} />
        <meshStandardMaterial
          color="#8B7355"
          roughness={0.7}
          metalness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>
      
      {/* Inner shadow at the top */}
      <mesh position={[0, 1.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.33, 32]} />
        <meshStandardMaterial color="#3d3228" roughness={1} />
      </mesh>
    </Float>
  );
};

const PotteryVase3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 3, 2]} intensity={0.3} color="#f5e6d3" />
        <pointLight position={[0, -2, 3]} intensity={0.2} color="#d4a574" />
        
        <Vase />
        
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};

export default PotteryVase3D;
