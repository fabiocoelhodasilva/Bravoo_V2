"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type Props = {
  position?: [number, number, number];
};

export default function PrayerLight({ position = [0, 0.9, 0] }: Props) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.position.y += 0.01;
    ref.current.position.x += Math.sin(state.clock.elapsedTime * 2) * 0.0008;
    ref.current.position.z += Math.cos(state.clock.elapsedTime * 2) * 0.0008;

    if (ref.current.position.y > 2.6) {
      ref.current.position.y = position[1];
      ref.current.position.x = position[0];
      ref.current.position.z = position[2];
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshBasicMaterial color="#fff2a8" />
    </mesh>
  );
}