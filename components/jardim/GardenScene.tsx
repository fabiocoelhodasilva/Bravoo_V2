"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, useGLTF } from "@react-three/drei";

function Model({
  path,
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  path: string;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(path);

  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#6f9f4d" />
    </mesh>
  );
}

export default function GardenScene() {
  return (
    <Canvas shadows camera={{ position: [0, 6, 14], fov: 45 }}>
      <color attach="background" args={["#dff3ff"]} />
      <fog attach="fog" args={["#dff3ff", 18, 40]} />

      <Sky sunPosition={[5, 8, 2]} />
      <ambientLight intensity={0.9} />
      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Ground />

      {/* ÁRVORES */}

     <Model
  path="/models/jardim/big-tree.glb"
  position={[4, 0, -1]}
  scale={4.9}
/>

      <Model
  path="/models/jardim/tree-pink.glb"
  position={[0, 0, 4]}
  scale={0.04}
/>

      {/* FLORES */}
     <Model
  path="/models/jardim/flower-r.glb"
  position={[-1.5, 0, -2.5]}
  scale={0.02}
/>


      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1.5, 0]}
      />
    </Canvas>
  );
}