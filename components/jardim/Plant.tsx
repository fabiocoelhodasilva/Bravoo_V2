"use client";

import { useGLTF } from "@react-three/drei";

type Props = {
  position: [number, number, number];
  type: "new" | "waiting" | "answered";
};

export default function Plant({ position, type }: Props) {

  let model = "/models/jardim/flower-y.glb";

  if (type === "waiting") model = "/models/jardim/flower-r.glb";
  if (type === "answered") model = "/models/jardim/flower-w.glb";

  const { scene } = useGLTF(model);

  return (
    <primitive
      object={scene.clone()}
      scale={0.7}
      position={position}
    />
  );
}