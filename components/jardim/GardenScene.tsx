"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Sky, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import BottomNavJardim from "./BottomNavJardim";

type MoveState = {
  forward: number;
  strafe: number;
  vertical: number;
};

type LookState = {
  yaw: number;
  pitch: number;
};

type GardenItem = {
  id: string;
  type: "tree" | "flower";
  position: [number, number, number];
  scale: number;
};

const MIN_CAMERA_HEIGHT = 1.8;
const MAX_CAMERA_HEIGHT = 18;

function SelectionMarker({
  position,
  radius = 0.9,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  return (
    <mesh
      position={[position[0], 0.03, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[radius * 0.62, radius, 48]} />
      <meshStandardMaterial
        color="#b91c1c"
        transparent
        opacity={0.7}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function TreeBeautiful({
  item,
  placementMode,
  selectedItemId,
  onSelectItem,
}: {
  item: GardenItem;
  placementMode: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  const { scene } = useGLTF("/models/jardim/tree_beautiful.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const isSelected = placementMode && selectedItemId === item.id;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!placementMode) return;
    event.stopPropagation();
    onSelectItem(item.id);
  }

  return (
    <group>
      {isSelected && <SelectionMarker position={item.position} radius={1.2} />}

      <primitive
        object={clonedScene}
        position={item.position}
        scale={item.scale}
        rotation={[0, 0, 0]}
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}

function FlorRoxa({
  item,
  placementMode,
  selectedItemId,
  onSelectItem,
}: {
  item: GardenItem;
  placementMode: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  const { scene } = useGLTF("/models/jardim/flor_roxa_c_planta.glb");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const isSelected = placementMode && selectedItemId === item.id;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!placementMode) return;
    event.stopPropagation();
    onSelectItem(item.id);
  }

  return (
    <group>
      {isSelected && <SelectionMarker position={item.position} radius={0.6} />}

      <primitive
        object={clonedScene}
        position={item.position}
        scale={item.scale}
        rotation={[0, 0, 0]}
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}

function Ground({
  onPlaceSelectedItem,
  placementMode,
  selectedItemId,
}: {
  onPlaceSelectedItem: (point: THREE.Vector3) => void;
  placementMode: boolean;
  selectedItemId: string | null;
}) {
  const [color, normal, roughness, ao] = useTexture([
    "/textures/jardim/grama/Grass004_1K-JPG_Color.jpg",
    "/textures/jardim/grama/Grass004_1K-JPG_NormalGL.jpg",
    "/textures/jardim/grama/Grass004_1K-JPG_Roughness.jpg",
    "/textures/jardim/grama/Grass004_1K-JPG_AmbientOcclusion.jpg",
  ]);

  useEffect(() => {
    const textures = [color, normal, roughness, ao];

    textures.forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    });

    color.colorSpace = THREE.SRGBColorSpace;
  }, [color, normal, roughness, ao]);

  function handlePlace(event: ThreeEvent<PointerEvent>) {
    if (!placementMode) return;
    if (!selectedItemId) return;

    event.stopPropagation();

    const { x, z } = event.point;
    onPlaceSelectedItem(new THREE.Vector3(x, 0, z));
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onPointerDown={handlePlace}
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={color}
        normalMap={normal}
        roughnessMap={roughness}
        aoMap={ao}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function PlayerRig({
  moveRef,
  lookRef,
}: {
  moveRef: React.MutableRefObject<MoveState>;
  lookRef: React.MutableRefObject<LookState>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, MIN_CAMERA_HEIGHT, 8);
    camera.rotation.order = "YXZ";
  }, [camera]);

  useFrame((_, delta) => {
    const horizontalSpeed = 4;
    const verticalSpeed = 5;

    camera.rotation.y = lookRef.current.yaw;
    camera.rotation.x = lookRef.current.pitch;

    const forward = new THREE.Vector3(
      -Math.sin(lookRef.current.yaw),
      0,
      -Math.cos(lookRef.current.yaw)
    ).normalize();

    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();

    const moveForward = moveRef.current.forward * horizontalSpeed * delta;
    const moveStrafe = moveRef.current.strafe * horizontalSpeed * delta;
    const moveVertical = moveRef.current.vertical * verticalSpeed * delta;

    camera.position.add(forward.clone().multiplyScalar(moveForward));
    camera.position.add(right.clone().multiplyScalar(moveStrafe));

    camera.position.y += moveVertical;
    camera.position.y = Math.max(
      MIN_CAMERA_HEIGHT,
      Math.min(MAX_CAMERA_HEIGHT, camera.position.y)
    );
  });

  return null;
}

function GardenItems({
  items,
  placementMode,
  selectedItemId,
  onSelectItem,
}: {
  items: GardenItem[];
  placementMode: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  return (
    <>
      {items.map((item) => {
        if (item.type === "tree") {
          return (
            <TreeBeautiful
              key={item.id}
              item={item}
              placementMode={placementMode}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          );
        }

        return (
          <FlorRoxa
            key={item.id}
            item={item}
            placementMode={placementMode}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
          />
        );
      })}
    </>
  );
}

function Scene({
  moveRef,
  lookRef,
  placementMode,
  selectedItemId,
  onSelectItem,
  onPlaceSelectedItem,
  items,
}: {
  moveRef: React.MutableRefObject<MoveState>;
  lookRef: React.MutableRefObject<LookState>;
  placementMode: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onPlaceSelectedItem: (point: THREE.Vector3) => void;
  items: GardenItem[];
}) {
  return (
    <>
      <color attach="background" args={["#bcd3ff"]} />
      <fog attach="fog" args={["#bcd3ff", 50, 180]} />

      <Sky
        distance={450000}
        sunPosition={[5, 8, 2]}
        inclination={0.49}
        azimuth={0.23}
        turbidity={3}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <ambientLight intensity={0.65} />

      <directionalLight
        position={[5, 10, 2]}
        intensity={1.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Ground
        placementMode={placementMode}
        selectedItemId={selectedItemId}
        onPlaceSelectedItem={onPlaceSelectedItem}
      />

      <GardenItems
        items={items}
        placementMode={placementMode}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
      />

      <PlayerRig moveRef={moveRef} lookRef={lookRef} />
    </>
  );
}

export default function GardenScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  const moveRef = useRef<MoveState>({
    forward: 0,
    strafe: 0,
    vertical: 0,
  });

  const lookRef = useRef<LookState>({
    yaw: Math.PI,
    pitch: 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [flyMode, setFlyMode] = useState(true);
  const [placementMode, setPlacementMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [items, setItems] = useState<GardenItem[]>([
    {
      id: "tree-1",
      type: "tree",
      position: [0, 0, -8],
      scale: 0.02,
    },
    {
      id: "flower-1",
      type: "flower",
      position: [1.5, 0, -7.5],
      scale: 0.03,
    },
  ]);

  const joystickThumbRef = useRef<HTMLDivElement>(null);
  const joystickCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lookTouchRef = useRef<{ x: number; y: number } | null>(null);

  const joystickSize = 120;
  const joystickRadius = joystickSize / 2;
  const thumbSize = 44;
  const maxThumbDistance = joystickRadius - thumbSize / 2;

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener?.("change", update);

    return () => {
      media.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    if (placementMode) {
      moveRef.current.forward = 0;
      moveRef.current.strafe = 0;
      moveRef.current.vertical = 0;
      lookTouchRef.current = null;

      if (joystickThumbRef.current) {
        joystickThumbRef.current.style.transform =
          "translate(-50%, -50%) translate(0px, 0px)";
      }

      if (document.pointerLockElement === containerRef.current) {
        document.exitPointerLock?.();
      }
    } else {
      setSelectedItemId(null);
    }
  }, [placementMode]);

  useEffect(() => {
    if (isMobile || placementMode || !flyMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "w") moveRef.current.forward = 1;
      if (key === "s") moveRef.current.forward = -1;
      if (key === "a") moveRef.current.strafe = -1;
      if (key === "d") moveRef.current.strafe = 1;

      if (key === "q") moveRef.current.vertical = 1;
      if (key === "e") moveRef.current.vertical = -1;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "w" && moveRef.current.forward > 0) moveRef.current.forward = 0;
      if (key === "s" && moveRef.current.forward < 0) moveRef.current.forward = 0;
      if (key === "a" && moveRef.current.strafe < 0) moveRef.current.strafe = 0;
      if (key === "d" && moveRef.current.strafe > 0) moveRef.current.strafe = 0;

      if (key === "q" && moveRef.current.vertical > 0) moveRef.current.vertical = 0;
      if (key === "e" && moveRef.current.vertical < 0) moveRef.current.vertical = 0;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;

      const sensitivity = 0.0025;

      lookRef.current.yaw -= event.movementX * sensitivity;
      lookRef.current.pitch -= event.movementY * sensitivity;

      const maxPitch = Math.PI / 2.4;
      lookRef.current.pitch = Math.max(
        -maxPitch,
        Math.min(maxPitch, lookRef.current.pitch)
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMobile, placementMode, flyMode]);

  const instructionText = useMemo(() => {
    if (placementMode) {
      if (!selectedItemId) {
        return "Modo edição: clique no item que deseja alterar.";
      }

      return "Agora clique no local do chão onde deseja inserir o item.";
    }

    if (isMobile) {
      return "Use a barra inferior para voar. Botões + e - controlam a altura.";
    }

    return "Voar: W A S D para mover, Q para subir e E para descer. Use a barra inferior para alternar os modos.";
  }, [isMobile, placementMode, selectedItemId]);

  async function lockPointer(
    event?: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    const target = event?.target as HTMLElement | null;

    if (target?.closest("nav, button, a")) return;
    if (isMobile || placementMode || !flyMode) return;
    if (!containerRef.current) return;
    if (document.pointerLockElement === containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {
      // navegador pode bloquear se não considerar gesto válido
    }
  }

  async function activateFlyMode() {
    setFlyMode(true);
    setPlacementMode(false);
    setSelectedItemId(null);

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {
      // evita erro silencioso
    }
  }

  function handleSelectItem(id: string) {
    if (!placementMode) return;
    setSelectedItemId(id);
  }

  function handlePlaceSelectedItem(point: THREE.Vector3) {
    if (!selectedItemId) return;

    const newPosition: [number, number, number] = [point.x, 0, point.z];

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId
          ? { ...item, position: newPosition }
          : item
      )
    );

    setSelectedItemId(null);
  }

  function handleJoystickStart(event: React.TouchEvent<HTMLDivElement>) {
    if (placementMode || !flyMode) return;

    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();

    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickMove(event: React.TouchEvent<HTMLDivElement>) {
    if (placementMode || !flyMode) return;

    const touch = event.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickEnd() {
    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;

    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform =
        "translate(-50%, -50%) translate(0px, 0px)";
    }
  }

  function updateJoystick(clientX: number, clientY: number) {
    if (!joystickCenterRef.current) return;

    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, maxThumbDistance);
    const angle = Math.atan2(dy, dx);

    const limitedX = Math.cos(angle) * clampedDistance;
    const limitedY = Math.sin(angle) * clampedDistance;

    const normalizedX = limitedX / maxThumbDistance;
    const normalizedY = limitedY / maxThumbDistance;

    moveRef.current.strafe = normalizedX;
    moveRef.current.forward = -normalizedY;

    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform = `translate(-50%, -50%) translate(${limitedX}px, ${limitedY}px)`;
    }
  }

  function handleLookStart(event: React.TouchEvent<HTMLDivElement>) {
    if (placementMode || !flyMode) return;

    const touch = event.touches[0];
    lookTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleLookMove(event: React.TouchEvent<HTMLDivElement>) {
    if (placementMode || !flyMode) return;

    const touch = event.touches[0];

    if (!lookTouchRef.current) {
      lookTouchRef.current = { x: touch.clientX, y: touch.clientY };
      return;
    }

    const dx = touch.clientX - lookTouchRef.current.x;
    const dy = touch.clientY - lookTouchRef.current.y;

    lookTouchRef.current = { x: touch.clientX, y: touch.clientY };

    const sensitivity = 0.01;

    lookRef.current.yaw -= dx * sensitivity;
    lookRef.current.pitch -= dy * sensitivity;

    const maxPitch = Math.PI / 2.4;
    lookRef.current.pitch = Math.max(
      -maxPitch,
      Math.min(maxPitch, lookRef.current.pitch)
    );
  }

  function handleLookEnd() {
    lookTouchRef.current = null;
  }

  function startFlyUp() {
    if (!flyMode || placementMode) return;
    moveRef.current.vertical = 1;
  }

  function startFlyDown() {
    if (!flyMode || placementMode) return;
    moveRef.current.vertical = -1;
  }

  function stopVerticalMovement() {
    moveRef.current.vertical = 0;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden touch-none"
      onClick={lockPointer}
    >
      <div className="absolute left-4 top-4 z-20 max-w-[340px] rounded-lg bg-black/45 px-4 py-2 text-sm text-white">
        {instructionText}
      </div>

      <Canvas camera={{ position: [0, MIN_CAMERA_HEIGHT, 8], fov: 60 }} shadows="basic">
        <Scene
          moveRef={moveRef}
          lookRef={lookRef}
          placementMode={placementMode}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          onPlaceSelectedItem={handlePlaceSelectedItem}
          items={items}
        />
      </Canvas>

      <BottomNavJardim
        flyMode={flyMode}
        editMode={placementMode}
        onMenu={() => {
          console.log("abrir menu");
        }}
        onFly={() => {
          void activateFlyMode();
        }}
        onEdit={() => {
          if (document.pointerLockElement === containerRef.current) {
            document.exitPointerLock?.();
          }

          moveRef.current.vertical = 0;
          setFlyMode(false);
          setPlacementMode(true);
          setSelectedItemId(null);
        }}
      />

      {isMobile && flyMode && !placementMode && (
        <>
          <div
            className="absolute bottom-[92px] left-6 z-30 rounded-full border border-white/30 bg-black/25"
            style={{
              width: joystickSize,
              height: joystickSize,
              touchAction: "none",
            }}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
          >
            <div
              ref={joystickThumbRef}
              className="absolute left-1/2 top-1/2 rounded-full bg-white/75"
              style={{
                width: thumbSize,
                height: thumbSize,
                transform: "translate(-50%, -50%) translate(0px, 0px)",
              }}
            />
          </div>

          <div
            className="absolute right-0 top-0 z-20 h-[calc(100%-64px)] w-1/2"
            style={{ touchAction: "none" }}
            onTouchStart={handleLookStart}
            onTouchMove={handleLookMove}
            onTouchEnd={handleLookEnd}
            onTouchCancel={handleLookEnd}
          />

          <div className="absolute bottom-[98px] right-5 z-30 flex flex-col gap-3">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl font-bold text-white"
              style={{ touchAction: "none" }}
              onTouchStart={startFlyUp}
              onTouchEnd={stopVerticalMovement}
              onTouchCancel={stopVerticalMovement}
            >
              +
            </button>

            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl font-bold text-white"
              style={{ touchAction: "none" }}
              onTouchStart={startFlyDown}
              onTouchEnd={stopVerticalMovement}
              onTouchCancel={stopVerticalMovement}
            >
              −
            </button>
          </div>
        </>
      )}
    </div>
  );
}

useGLTF.preload("/models/jardim/tree_beautiful.glb");
useGLTF.preload("/models/jardim/flor_roxa_c_planta.glb");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_Color.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_NormalGL.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_Roughness.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_AmbientOcclusion.jpg");