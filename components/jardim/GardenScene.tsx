"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Sky, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import BottomNavJardim from "./BottomNavJardim";
import ItensDoJardimPanel, { JardimItemTipo } from "./ItensDoJardimPanel";
import { supabase } from "@/lib/supabase/client";

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
  type: JardimItemTipo;
  position: [number, number, number];
  scale: number;
};

type JardimItemBanco = {
  id: string;
  tipo: JardimItemTipo;
  pos_x: string | number;
  pos_y: string | number;
  pos_z: string | number;
  escala_base: string | number;
  percentual_escala: string | number;
};

const MIN_CAMERA_HEIGHT = 2.07;
const MAX_CAMERA_HEIGHT = 18;

const ENTRY_CAMERA_POSITION: [number, number, number] = [
  0,
  MIN_CAMERA_HEIGHT,
  98,
];

const GREENHOUSE_AREA = {
  centerX: -15,
  centerZ: 80,
  width: 20,
  depth: 12,
};

const PLANTING_AREA = {
  centerX: 0,
  centerZ: 35,
  size: 120,
  cellSize: 4,
};

const PORTAL_ENTRADA_PATH = "/models/jardim/arco_entrada.glb";

const ITEM_MODEL_PATHS: Record<JardimItemTipo, string> = {
  arvore_cerrado: "/models/jardim/arvore_cerrado.glb",
  arvore_selva: "/models/jardim/arvore_selva.glb",
  arvore_carvalho: "/models/jardim/arvore_carvalho.glb",
  arvore_japonesa: "/models/jardim/arvore_japonesa.glb",
  arvore_vermelha: "/models/jardim/arvore_vermelha.glb",

  flor_roxa: "/models/jardim/flor_roxa_c_planta.glb",
  flor_geranio_roxo: "/models/jardim/flor_geranio_roxo.glb",
  flor_margarida_branca: "/models/jardim/flor_margarida_branca.glb",
};

const ITEM_DEFAULT_SCALES: Record<JardimItemTipo, number> = {
  arvore_cerrado: 0.01,
  arvore_selva: 1.102,
  arvore_carvalho: 15.12,
  arvore_japonesa: .080,
  arvore_vermelha: .10,

  flor_roxa: 0.05,
  flor_geranio_roxo: 0.5,
  flor_margarida_branca: 5.8,
};

function isInsideGreenhouseArea(x: number, z: number) {
  const minX = GREENHOUSE_AREA.centerX - GREENHOUSE_AREA.width / 2;
  const maxX = GREENHOUSE_AREA.centerX + GREENHOUSE_AREA.width / 2;
  const minZ = GREENHOUSE_AREA.centerZ - GREENHOUSE_AREA.depth / 2;
  const maxZ = GREENHOUSE_AREA.centerZ + GREENHOUSE_AREA.depth / 2;

  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

function snapToPlantingGrid(
  point: THREE.Vector3
): [number, number, number] | null {
  const { centerX, centerZ, size, cellSize } = PLANTING_AREA;

  const minX = centerX - size / 2;
  const maxX = centerX + size / 2;
  const minZ = centerZ - size / 2;
  const maxZ = centerZ + size / 2;

  if (point.x < minX || point.x > maxX || point.z < minZ || point.z > maxZ) {
    return null;
  }

  const snappedX =
    minX + Math.floor((point.x - minX) / cellSize) * cellSize + cellSize / 2;

  const snappedZ =
    minZ + Math.floor((point.z - minZ) / cellSize) * cellSize + cellSize / 2;

  if (isInsideGreenhouseArea(snappedX, snappedZ)) {
    return null;
  }

  return [snappedX, 0, snappedZ];
}

function PortalEntrada() {
  const { scene } = useGLTF(PORTAL_ENTRADA_PATH);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, 0, 91]}
      scale={0.25}
      rotation={[0, Math.PI, 0]}
    />
  );
}

function AimPlacementSquare({
  pendingItemType,
  onAimPositionChange,
}: {
  pendingItemType: JardimItemTipo | null;
  onAimPositionChange: (position: [number, number, number] | null) => void;
}) {
  const { camera } = useThree();

  const raycasterRef = useRef(new THREE.Raycaster());
  const groundPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionRef = useRef(new THREE.Vector3());
  const lastKeyRef = useRef<string>("");

  const [position, setPosition] = useState<[number, number, number] | null>(
    null
  );

  useFrame(() => {
    if (!pendingItemType) {
      if (lastKeyRef.current !== "none") {
        lastKeyRef.current = "none";
        setPosition(null);
        onAimPositionChange(null);
      }
      return;
    }

    raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);

    const hit = raycasterRef.current.ray.intersectPlane(
      groundPlaneRef.current,
      intersectionRef.current
    );

    const snapped = hit ? snapToPlantingGrid(intersectionRef.current) : null;

    const key = snapped ? `${snapped[0]}|${snapped[2]}` : "none";

    if (key === lastKeyRef.current) return;

    lastKeyRef.current = key;
    setPosition(snapped);
    onAimPositionChange(snapped);
  });

  if (!pendingItemType || !position) return null;

  return (
    <group position={[position[0], 0.09, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PLANTING_AREA.cellSize, PLANTING_AREA.cellSize]} />
        <meshBasicMaterial
          color="#5dc6a1"
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            PLANTING_AREA.cellSize * 0.42,
            PLANTING_AREA.cellSize * 0.5,
            4,
          ]}
        />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SelectionMarker({
  position,
  radius = 0.9,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  return (
    <mesh
      position={[position[0], 0.08, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[radius * 0.62, radius, 48]} />
      <meshStandardMaterial
        color="#ef4444"
        transparent
        opacity={0.85}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function GardenModel({
  item,
  selectedGardenItemId,
  onSelectItem,
}: {
  item: GardenItem;
  selectedGardenItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  const modelPath = ITEM_MODEL_PATHS[item.type];
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const isSelected = selectedGardenItemId === item.id;
  const markerRadius = item.type.startsWith("arvore") ? 1.35 : 0.75;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onSelectItem(item.id);
  }

  return (
    <group>
      {isSelected && (
        <SelectionMarker position={item.position} radius={markerRadius} />
      )}

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

function Ground() {
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
      tex.repeat.set(10, 10);
      tex.anisotropy = 4;
      tex.needsUpdate = true;
    });

    color.colorSpace = THREE.SRGBColorSpace;
  }, [color, normal, roughness, ao]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
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
    camera.position.set(...ENTRY_CAMERA_POSITION);
    camera.rotation.order = "YXZ";
  }, [camera]);

  useFrame((_, delta) => {
    const horizontalSpeed = 4.4;
    const verticalSpeed = 5.5;

    camera.rotation.y = lookRef.current.yaw;
    camera.rotation.x = lookRef.current.pitch;

    const forward = new THREE.Vector3(
      -Math.sin(lookRef.current.yaw),
      0,
      -Math.cos(lookRef.current.yaw)
    ).normalize();

    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

    camera.position.add(
      forward
        .clone()
        .multiplyScalar(moveRef.current.forward * horizontalSpeed * delta)
    );

    camera.position.add(
      right
        .clone()
        .multiplyScalar(moveRef.current.strafe * horizontalSpeed * delta)
    );

    camera.position.y += moveRef.current.vertical * verticalSpeed * delta;
    camera.position.y = Math.max(
      MIN_CAMERA_HEIGHT,
      Math.min(MAX_CAMERA_HEIGHT, camera.position.y)
    );
  });

  return null;
}

function GardenItems({
  items,
  selectedGardenItemId,
  onSelectItem,
}: {
  items: GardenItem[];
  selectedGardenItemId: string | null;
  onSelectItem: (id: string) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <GardenModel
          key={item.id}
          item={item}
          selectedGardenItemId={selectedGardenItemId}
          onSelectItem={onSelectItem}
        />
      ))}
    </>
  );
}

function Scene({
  moveRef,
  lookRef,
  pendingItemType,
  selectedGardenItemId,
  onAimPositionChange,
  onSelectItem,
  items,
}: {
  moveRef: React.MutableRefObject<MoveState>;
  lookRef: React.MutableRefObject<LookState>;
  pendingItemType: JardimItemTipo | null;
  selectedGardenItemId: string | null;
  onAimPositionChange: (position: [number, number, number] | null) => void;
  onSelectItem: (id: string) => void;
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
      <directionalLight position={[5, 10, 2]} intensity={1.7} />

      <Ground />

      <AimPlacementSquare
        pendingItemType={pendingItemType}
        onAimPositionChange={onAimPositionChange}
      />

      <PortalEntrada />

      <GardenItems
        items={items}
        selectedGardenItemId={selectedGardenItemId}
        onSelectItem={onSelectItem}
      />

      <PlayerRig moveRef={moveRef} lookRef={lookRef} />
    </>
  );
}

export default function GardenScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const aimedPlantPositionRef = useRef<[number, number, number] | null>(null);

  const moveRef = useRef<MoveState>({
    forward: 0,
    strafe: 0,
    vertical: 0,
  });

  const lookRef = useRef<LookState>({
    yaw: 0,
    pitch: 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [flyMode, setFlyMode] = useState(true);
  const [pendingItemType, setPendingItemType] =
    useState<JardimItemTipo | null>(null);
  const [itemsPanelOpen, setItemsPanelOpen] = useState(false);
  const [items, setItems] = useState<GardenItem[]>([]);
  const [selectedGardenItemId, setSelectedGardenItemId] = useState<
    string | null
  >(null);

  const joystickThumbRef = useRef<HTMLDivElement>(null);
  const joystickCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lookTouchRef = useRef<{ x: number; y: number } | null>(null);

  const joystickSize = 120;
  const joystickRadius = joystickSize / 2;
  const thumbSize = 44;
  const maxThumbDistance = joystickRadius - thumbSize / 2;

  useEffect(() => {
    async function carregarItensDoJardim() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao buscar usuário:", userError);
        return;
      }

      if (!user) {
        console.warn("Usuário não logado. Jardim não carregado.");
        return;
      }

      const { data, error } = await supabase
        .from("next_jardim_itens_usuario")
        .select(
          "id, tipo, pos_x, pos_y, pos_z, escala_base, percentual_escala"
        )
        .eq("usuario_id", user.id)
        .eq("ativo", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar itens do jardim:", error);
        return;
      }

      const itensConvertidos: GardenItem[] = (data ?? []).map(
        (item: JardimItemBanco) => {
          const tipo = item.tipo;
          const escalaBase = Number(item.escala_base);
          const percentualEscala = Number(item.percentual_escala);

          return {
            id: item.id,
            type: tipo,
            position: [
              Number(item.pos_x),
              Number(item.pos_y),
              Number(item.pos_z),
            ],
            scale: escalaBase * percentualEscala,
          };
        }
      );

      setItems(itensConvertidos);
    }

    carregarItensDoJardim();
  }, []);

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
    if (isMobile || !flyMode) return;

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

      if (key === "w" && moveRef.current.forward > 0)
        moveRef.current.forward = 0;
      if (key === "s" && moveRef.current.forward < 0)
        moveRef.current.forward = 0;
      if (key === "a" && moveRef.current.strafe < 0)
        moveRef.current.strafe = 0;
      if (key === "d" && moveRef.current.strafe > 0)
        moveRef.current.strafe = 0;

      if (key === "q" && moveRef.current.vertical > 0)
        moveRef.current.vertical = 0;
      if (key === "e" && moveRef.current.vertical < 0)
        moveRef.current.vertical = 0;
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
  }, [isMobile, flyMode]);

  const instructionText = useMemo(() => {
    if (pendingItemType) {
      return "Ande pelo jardim, mire no chão e clique para plantar.";
    }

    if (selectedGardenItemId) {
      return "Item selecionado. Use o botão Deletar se quiser removê-lo.";
    }

    if (isMobile) {
      return "";
    }

    return "Movimento: W A S D para mover, Q para subir e E para descer. Use a barra inferior para alternar os modos.";
  }, [isMobile, pendingItemType, selectedGardenItemId]);

  function handleAimPositionChange(position: [number, number, number] | null) {
    aimedPlantPositionRef.current = position;
  }

  function plantPendingItemAtAim() {
    if (!pendingItemType) return;

    const position = aimedPlantPositionRef.current;

    if (!position) {
      alert("Mire para um ponto válido do chão para plantar.");
      return;
    }

    const newItem: GardenItem = {
      id: `${pendingItemType}-${Date.now()}`,
      type: pendingItemType,
      position,
      scale: ITEM_DEFAULT_SCALES[pendingItemType],
    };

    setItems((prev) => [...prev, newItem]);
    setPendingItemType(null);
    setSelectedGardenItemId(null);
    aimedPlantPositionRef.current = null;
  }

  function handleSelectGardenItem(id: string) {
    if (pendingItemType) return;
    setSelectedGardenItemId((current) => (current === id ? null : id));
  }

  function handleDeleteSelectedItem() {
    if (!selectedGardenItemId) return;

    setItems((prev) =>
      prev.filter((item) => item.id !== selectedGardenItemId)
    );

    setSelectedGardenItemId(null);
  }

  async function lockPointer(
    event?: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    const target = event?.target as HTMLElement | null;

    if (target?.closest("nav, button, a")) return;
    if (itemsPanelOpen) return;

    if (pendingItemType) {
      plantPendingItemAtAim();
      return;
    }

    if (selectedGardenItemId) {
      return;
    }

    if (isMobile || !flyMode) return;
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
    setItemsPanelOpen(false);
    setSelectedGardenItemId(null);

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {
      // evita erro silencioso
    }
  }

  async function handleSelectNewGardenItem(type: JardimItemTipo) {
    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;
    moveRef.current.vertical = 0;

    setItemsPanelOpen(false);
    setFlyMode(true);
    setSelectedGardenItemId(null);
    setPendingItemType(type);

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {
      // se o navegador bloquear, o usuário pode clicar na cena depois
    }
  }

  function handleJoystickStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!flyMode) return;

    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();

    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!flyMode) return;

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
    if (!flyMode) return;

    const touch = event.touches[0];
    lookTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleLookMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!flyMode) return;

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
    if (!flyMode) return;
    moveRef.current.vertical = 1;
  }

  function startFlyDown() {
    if (!flyMode) return;
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
      {instructionText && (
        <div className="absolute left-4 top-4 z-20 max-w-[360px] rounded-lg bg-black/45 px-4 py-2 text-sm text-white">
          {instructionText}
        </div>
      )}

      {pendingItemType && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-black/30" />
      )}

      {selectedGardenItemId && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteSelectedItem();
          }}
          className="absolute right-5 top-24 z-30 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
        >
          Deletar
        </button>
      )}

      <Canvas
        camera={{ position: ENTRY_CAMERA_POSITION, fov: 60 }}
        shadows={false}
        dpr={isMobile ? 1 : [1, 2]}
      >
        <Scene
          moveRef={moveRef}
          lookRef={lookRef}
          pendingItemType={pendingItemType}
          selectedGardenItemId={selectedGardenItemId}
          onAimPositionChange={handleAimPositionChange}
          onSelectItem={handleSelectGardenItem}
          items={items}
        />
      </Canvas>

      {itemsPanelOpen && (
        <ItensDoJardimPanel
          onClose={() => setItemsPanelOpen(false)}
          onSelectItem={handleSelectNewGardenItem}
          plantedItemTypes={items.map((item) => item.type)}
        />
      )}

      <BottomNavJardim
        flyMode={flyMode}
        onMenu={() => {
          console.log("abrir menu");
        }}
        onFly={() => {
          void activateFlyMode();
        }}
        onItems={() => {
          if (document.pointerLockElement === containerRef.current) {
            document.exitPointerLock?.();
          }

          moveRef.current.forward = 0;
          moveRef.current.strafe = 0;
          moveRef.current.vertical = 0;

          setPendingItemType(null);
          setSelectedGardenItemId(null);
          setItemsPanelOpen(true);
        }}
      />

      {isMobile && flyMode && (
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

Object.values(ITEM_MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path);
});

useGLTF.preload(PORTAL_ENTRADA_PATH);

useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_Color.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_NormalGL.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_Roughness.jpg");
useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_AmbientOcclusion.jpg");