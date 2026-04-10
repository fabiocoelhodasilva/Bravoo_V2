"use client";

import { useGLTF } from "@react-three/drei";

export default function FaithTree(props:any) {
  const { scene } = useGLTF("/models/jardim/tree.glb");

  return (
    <primitive
      object={scene}
      scale={1.8}
      position={[0,0,0]}
      {...props}
    />
  );
}