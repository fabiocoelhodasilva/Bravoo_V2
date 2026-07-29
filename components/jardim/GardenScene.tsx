"use client";

import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Sky, useGLTF, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import BottomNavJardim from "./BottomNavJardim";
import ItensDoJardimPanel, { JardimItemTipo } from "./ItensDoJardimPanel";
import OracaoDashboardPanel from "./OracaoDashboardPanel";
import { supabase } from "@/lib/supabase/client";
import {
  buscarMinutosOracaoHoje,
  buscarSaldoItensJardimHoje,
  buscarStatusSaudeJardim,
  garantirSincronizacaoJardim,
  registrarResgateItemJardim,
} from "@/lib/gamificacao/oracao/oracao-actions";
import { buscarResumoDashboardOracao } from "@/lib/gamificacao/oracao/oracao-dashboard-client";

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
  percentualEscala: number;
  rotationY: number;
};

type JardimItemBanco = {
  id: string;
  tipo: JardimItemTipo;
  pos_x: string | number;
  pos_y: string | number;
  pos_z: string | number;
  escala_base: string | number;
  percentual_escala: string | number;
  rotation_y: string | number | null;
};

type DadosOracaoJardim = {
  minutosHoje: number;
  saldoItensJardim: number;
  saudeJardimPercentual: number;
  carregando: boolean;
};

type CacheOracaoJardim = {
  minutosHoje: number;
  saldoItensJardim: number;
  saudeJardimPercentual?: number;
  atualizadoEm: number;
};

type ResumoDashboardOracao = {
  minutosHoje: number;
  minutosAno: number;
  metaDiaria: number;
  persistenciaDias: number;
};

const MIN_CAMERA_HEIGHT = 4.07;
const MAX_CAMERA_HEIGHT = 18;

const ENTRY_CAMERA_POSITION: [number, number, number] = [
  0,
  MIN_CAMERA_HEIGHT,
  98,
];

const PLANTING_AREA = {
  centerX: 0,
  centerZ: 0,
  size: 196,
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

  jabami_sakura: "/models/jardim/jabami_sakura.glb",
  japanese_maple: "/models/jardim/japanese_maple.glb",
  chinese_jungle_geranium: "/models/jardim/chinese_jungle_geranium.glb",
  banana_tree: "/models/jardim/banana_tree.glb",
  beaked_yucca_1730: "/models/jardim/beaked_yucca_1730.glb",
  beech_fern_plant: "/models/jardim/beech_fern_plant.glb",
  hibiscus: "/models/jardim/hibiscus.glb",
  lavanda_roxa: "/models/jardim/lavanda_roxa.glb",
};

const ITEM_DEFAULT_SCALES: Record<JardimItemTipo, number> = {
  arvore_cerrado: 0.01,
  arvore_selva: 0.4,
  arvore_carvalho: 10.12,
  arvore_japonesa: 0.08,
  arvore_vermelha: 0.08,

  flor_roxa: 0.04,
  flor_geranio_roxo: 0.1,
  flor_margarida_branca: 3.8,

  jabami_sakura: 1.3,
  japanese_maple: 2.3,
  chinese_jungle_geranium: 2.3,
  banana_tree: 1.5,
  beaked_yucca_1730: 2.5,
  beech_fern_plant: 4.1,
  hibiscus: 7.2,
  lavanda_roxa: 1.9,
};


const ITEM_DISPLAY_NAMES: Record<JardimItemTipo, string> = {
  arvore_cerrado: "árvore do cerrado",
  arvore_selva: "árvore da selva",
  arvore_carvalho: "árvore carvalho",
  arvore_japonesa: "árvore japonesa",
  arvore_vermelha: "árvore vermelha",

  flor_roxa: "flor roxa",
  flor_geranio_roxo: "gerânio roxo",
  flor_margarida_branca: "margarida branca",

  jabami_sakura: "sakura japonesa",
  japanese_maple: "maple japonês",
  chinese_jungle_geranium: "gerânio selvagem",
  banana_tree: "bananeira",
  beaked_yucca_1730: "yucca",
  beech_fern_plant: "samambaia beech",
  hibiscus: "hibisco",
  lavanda_roxa: "lavanda roxa",
};

function getGardenItemDisplayName(type: JardimItemTipo) {
  return ITEM_DISPLAY_NAMES[type] ?? "planta";
}

function normalizarPercentualCrescimento(percentualEscala: number) {
  if (!Number.isFinite(percentualEscala)) return 0;

  // No banco, o crescimento é salvo como decimal: 0.2 = 20%, 1 = 100%.
  return Math.min(100, Math.max(0, Math.round(percentualEscala * 100)));
}

const ITEM_Y_OFFSETS: Partial<Record<JardimItemTipo, number>> = {
  flor_geranio_roxo: 0.7,
  arvore_japonesa: -0.5,
  arvore_selva: 0.9,
  japanese_maple: 0,
  jabami_sakura: 0,
  banana_tree: 0,
};

const TREE_ITEM_TYPES = new Set<JardimItemTipo>([
  "arvore_cerrado",
  "arvore_selva",
  "arvore_carvalho",
  "arvore_japonesa",
  "arvore_vermelha",
  "jabami_sakura",
  "japanese_maple",
  "banana_tree",
]);

function isTreeItem(type: JardimItemTipo) {
  return TREE_ITEM_TYPES.has(type);
}

const CACHE_ORACAO_JARDIM_KEY = "cache_oracao_jardim_hoje";

function limparCacheOracaoJardim() {
  try {
    sessionStorage.removeItem(CACHE_ORACAO_JARDIM_KEY);
  } catch {}
}

function salvarCacheOracaoJardim(
  minutosHoje: number,
  saldoItensJardim: number,
  saudeJardimPercentual?: number
) {
  try {
    const cache: CacheOracaoJardim = {
      minutosHoje,
      saldoItensJardim,
      saudeJardimPercentual,
      atualizadoEm: Date.now(),
    };

    sessionStorage.setItem(CACHE_ORACAO_JARDIM_KEY, JSON.stringify(cache));
  } catch {}
}

function safePreventDefault(
  event:
    | React.TouchEvent<HTMLElement>
    | React.MouseEvent<HTMLElement>
    | React.SyntheticEvent<HTMLElement>
    | undefined
) {
  if (event?.cancelable) {
    event.preventDefault();
  }
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

  return [snappedX, 0, snappedZ];
}

function PortalEntrada() {
  const { scene } = useGLTF(PORTAL_ENTRADA_PATH);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, 0, 78]}
      scale={0.5}
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
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const isSelected = selectedGardenItemId === item.id;
  const treeItem = isTreeItem(item.type);
  const markerRadius = treeItem ? 1.65 : 0.95;
  const yOffset = ITEM_Y_OFFSETS[item.type] ?? 0;

  const hitboxSize: [number, number, number] = treeItem
    ? [4.2, 7.5, 4.2]
    : [2.6, 2.6, 2.6];

  const hitboxCenterY = treeItem
    ? item.position[1] + 3.75
    : item.position[1] + 1.3;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation?.();
    onSelectItem(item.id);
  }

  return (
    <group>
      {isSelected && (
        <SelectionMarker position={item.position} radius={markerRadius} />
      )}

      <mesh
        position={[item.position[0], hitboxCenterY, item.position[2]]}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={hitboxSize} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          color="#ffffff"
        />
      </mesh>

      <primitive
        object={clonedScene}
        position={[
          item.position[0],
          item.position[1] + yOffset,
          item.position[2],
        ]}
        scale={item.scale}
        rotation={[0, item.rotationY, 0]}
        onPointerDown={handlePointerDown}
      />
    </group>
  );
}

function Ground() {
  const color = useTexture("/textures/jardim/grama/Grass004_1K-JPG_Color.jpg");

  useEffect(() => {
    color.wrapS = THREE.RepeatWrapping;
    color.wrapT = THREE.RepeatWrapping;
    color.repeat.set(10, 10);
    color.anisotropy = 4;
    color.colorSpace = THREE.SRGBColorSpace;
    color.needsUpdate = true;
  }, [color]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial map={color} toneMapped={false} />
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
    const horizontalSpeed = 8.6;
    const verticalSpeed = 6.5;

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
        <Suspense key={item.id} fallback={null}>
          <GardenModel
            item={item}
            selectedGardenItemId={selectedGardenItemId}
            onSelectItem={onSelectItem}
          />
        </Suspense>
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
      <color attach="background" args={["#8fc9ff"]} />
      <fog attach="fog" args={["#b7dcff", 90, 260]} />

      <Sky
        distance={450000}
        sunPosition={[20, 15, 10]}
        inclination={0.48}
        azimuth={0.25}
        turbidity={1.4}
        rayleigh={3}
        mieCoefficient={0.002}
        mieDirectionalG={0.78}
      />

      <ambientLight intensity={0.72} />
      <directionalLight position={[20, 15, 10]} intensity={1.45} />

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
  const isPlantingRef = useRef(false);
  const lastMobileTouchPlantRef = useRef(0);
  const jardimSyncPromiseRef = useRef<Promise<void> | null>(null);

  const [jardimSincronizado, setJardimSincronizado] = useState(false);
  const [dadosOracaoJardim, setDadosOracaoJardim] =
    useState<DadosOracaoJardim>({
      minutosHoje: 0,
      saldoItensJardim: 0,
      saudeJardimPercentual: 30,
      carregando: true,
    });

  const [resumoDashboardOracao, setResumoDashboardOracao] =
    useState<ResumoDashboardOracao | null>(null);
  const [resumoDashboardOracaoCarregando, setResumoDashboardOracaoCarregando] =
    useState(true);

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  const touchMovedRef = useRef(false);

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
  const [oracaoDashboardOpen, setOracaoDashboardOpen] = useState(false);
  const [items, setItems] = useState<GardenItem[]>([]);
  const [selectedGardenItemId, setSelectedGardenItemId] = useState<
    string | null
  >(null);
  const [movingGardenItemId, setMovingGardenItemId] = useState<string | null>(
    null
  );
  const [plantingFeedbackMessage, setPlantingFeedbackMessage] = useState("");

  const selectedGardenItem = useMemo(() => {
    return items.find((item) => item.id === selectedGardenItemId) ?? null;
  }, [items, selectedGardenItemId]);

  const movingGardenItem = useMemo(() => {
    return items.find((item) => item.id === movingGardenItemId) ?? null;
  }, [items, movingGardenItemId]);

  const placementItemType = pendingItemType ?? movingGardenItem?.type ?? null;
  const placementModeActive = placementItemType !== null;

  const selectedGardenItemGrowthPercent = normalizarPercentualCrescimento(
    selectedGardenItem?.percentualEscala ?? 0
  );
  const selectedGardenItemGrowthRemaining = Math.max(
    0,
    100 - selectedGardenItemGrowthPercent
  );

  const joystickThumbRef = useRef<HTMLDivElement>(null);
  const joystickCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lookTouchRef = useRef<{ x: number; y: number } | null>(null);

  const joystickSize = 120;
  const joystickRadius = joystickSize / 2;
  const thumbSize = 44;
  const maxThumbDistance = joystickRadius - thumbSize / 2;

  function sincronizarJardimUmaVez() {
    if (!jardimSyncPromiseRef.current) {
      jardimSyncPromiseRef.current = garantirSincronizacaoJardim()
        .then(() => {
          setJardimSincronizado(true);
        })
        .catch((syncError) => {
          console.error("Erro ao sincronizar créditos do jardim:", syncError);
          jardimSyncPromiseRef.current = null;
          setJardimSincronizado(false);
        });
    }

    return jardimSyncPromiseRef.current;
  }

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
      .select("id, tipo, pos_x, pos_y, pos_z, escala_base, percentual_escala, rotation_y")
      .eq("usuario_id", user.id)
      .eq("ativo", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar itens do jardim:", error);
      return;
    }

    const itensConvertidos: GardenItem[] = (data ?? [])
      .filter((item: JardimItemBanco) => {
        return item.tipo in ITEM_MODEL_PATHS;
      })
      .map((item: JardimItemBanco) => {
        const escalaBase = Number(item.escala_base);
        const percentualEscala = Number(item.percentual_escala);

        return {
          id: item.id,
          type: item.tipo,
          position: [
            Number(item.pos_x),
            Number(item.pos_y),
            Number(item.pos_z),
          ],
          scale: escalaBase * percentualEscala,
          percentualEscala,
          rotationY: Number(item.rotation_y ?? 0),
        };
      });

    setItems(itensConvertidos);
  }

  function atualizarDadosOracaoJardim(dados: {
    minutosHoje: number;
    saldoItensJardim: number;
    saudeJardimPercentual?: number;
  }) {
    setDadosOracaoJardim((atual) => {
      const saudeJardimPercentual =
        dados.saudeJardimPercentual ?? atual.saudeJardimPercentual;

      salvarCacheOracaoJardim(
        dados.minutosHoje,
        dados.saldoItensJardim,
        saudeJardimPercentual
      );

      return {
        minutosHoje: dados.minutosHoje,
        saldoItensJardim: dados.saldoItensJardim,
        saudeJardimPercentual,
        carregando: false,
      };
    });
  }

  function atualizarSaldoItensJardimLocalmente(delta: number) {
    setDadosOracaoJardim((atual) => {
      const novoSaldo = Math.max(0, atual.saldoItensJardim + delta);

      salvarCacheOracaoJardim(
        atual.minutosHoje,
        novoSaldo,
        atual.saudeJardimPercentual
      );

      return {
        ...atual,
        saldoItensJardim: novoSaldo,
        carregando: false,
      };
    });
  }

  async function carregarDadosOracaoJardim() {
    setDadosOracaoJardim((atual) => ({
      ...atual,
      carregando: true,
    }));

    try {
      await sincronizarJardimUmaVez();

      const [minutosHoje, saldoItensJardim, statusSaudeJardim] =
        await Promise.all([
          buscarMinutosOracaoHoje(),
          buscarSaldoItensJardimHoje(),
          buscarStatusSaudeJardim(),
        ]);

      atualizarDadosOracaoJardim({
        minutosHoje,
        saldoItensJardim,
        saudeJardimPercentual: statusSaudeJardim.percentual,
      });
    } catch (error) {
      console.error("Erro ao pré-carregar dados de oração do jardim:", error);

      setDadosOracaoJardim((atual) => ({
        ...atual,
        carregando: false,
      }));
    }
  }

  async function carregarResumoDashboardOracaoEmBackground() {
    setResumoDashboardOracaoCarregando(true);

    try {
      const resumo = await buscarResumoDashboardOracao();

      setResumoDashboardOracao(resumo);
    } catch (error) {
      console.error(
        "Erro ao pré-carregar resumo do dashboard de oração:",
        error
      );

      setResumoDashboardOracao(null);
    } finally {
      setResumoDashboardOracaoCarregando(false);
    }
  }

  function atualizarJardimAposOracaoRegistrada() {
    limparCacheOracaoJardim();

    // Força uma nova sincronização, porque a oração acabou de alterar os créditos do dia.
    jardimSyncPromiseRef.current = null;
    setJardimSincronizado(false);

    void carregarDadosOracaoJardim();
    void carregarResumoDashboardOracaoEmBackground();
  }

  useEffect(() => {
    void Promise.all([
      carregarItensDoJardim(),
      carregarDadosOracaoJardim(),
      carregarResumoDashboardOracaoEmBackground(),
    ]);
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

      if (key === "w" && moveRef.current.forward > 0) {
        moveRef.current.forward = 0;
      }

      if (key === "s" && moveRef.current.forward < 0) {
        moveRef.current.forward = 0;
      }

      if (key === "a" && moveRef.current.strafe < 0) {
        moveRef.current.strafe = 0;
      }

      if (key === "d" && moveRef.current.strafe > 0) {
        moveRef.current.strafe = 0;
      }

      if (key === "q" && moveRef.current.vertical > 0) {
        moveRef.current.vertical = 0;
      }

      if (key === "e" && moveRef.current.vertical < 0) {
        moveRef.current.vertical = 0;
      }
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
    if (movingGardenItemId) {
      return "Ande pelo jardim, mire no novo local e clique para mover a planta.";
    }

    if (pendingItemType) {
      return "Ande pelo jardim, mire no chão e clique para plantar.";
    }

    if (isMobile || selectedGardenItemId) {
      return "";
    }

    return "Movimento: W A S D para mover, Q para subir e E para descer.";
  }, [
    isMobile,
    movingGardenItemId,
    pendingItemType,
    selectedGardenItemId,
  ]);

  function handleAimPositionChange(position: [number, number, number] | null) {
    aimedPlantPositionRef.current = position;
  }

  async function plantPendingItemAtAim() {
    if (!pendingItemType) return;
    if (isPlantingRef.current) return;

    const itemTypeToPlant = pendingItemType;
    const position = aimedPlantPositionRef.current;

    if (!position) {
      alert("Mire para um ponto válido do chão para plantar.");
      return;
    }

    isPlantingRef.current = true;

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const escalaBase = ITEM_DEFAULT_SCALES[itemTypeToPlant];
    const percentualInicial = 0.2;

    const optimisticItem: GardenItem = {
      id: tempId,
      type: itemTypeToPlant,
      position,
      scale: escalaBase * percentualInicial,
      percentualEscala: percentualInicial,
      rotationY: lookRef.current.yaw,
    };

    setItems((prev) => [...prev, optimisticItem]);
    setPendingItemType(null);
    setSelectedGardenItemId(null);
    setPlantingFeedbackMessage(
      `Sua ${getGardenItemDisplayName(
        itemTypeToPlant
      )} acabou de nascer no jardim. Com oração diária, ela vai crescer pouco a pouco.`
    );
    aimedPlantPositionRef.current = null;

    window.setTimeout(() => {
      setPlantingFeedbackMessage("");
    }, 5200);

    if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("Usuário não logado.");
      }

      const { data, error } = await supabase
        .from("next_jardim_itens_usuario")
        .insert({
          usuario_id: user.id,
          tipo: itemTypeToPlant,
          pos_x: position[0],
          pos_y: position[1],
          pos_z: position[2],
          escala_base: escalaBase,
          percentual_escala: percentualInicial,
          rotation_y: lookRef.current.yaw,
          ativo: true,
        })
        .select("id, tipo, pos_x, pos_y, pos_z, escala_base, percentual_escala, rotation_y")
        .single();

      if (error || !data) {
        throw error ?? new Error("Erro ao inserir item no jardim.");
      }

      try {
        await registrarResgateItemJardim(itemTypeToPlant);
      } catch (resgateError) {
        console.error("Erro ao consumir crédito do jardim:", resgateError);

        await supabase
          .from("next_jardim_itens_usuario")
          .update({
            ativo: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        throw resgateError;
      }

      atualizarSaldoItensJardimLocalmente(-1);

      const savedItem: GardenItem = {
        id: data.id,
        type: data.tipo as JardimItemTipo,
        position: [
          Number(data.pos_x),
          Number(data.pos_y),
          Number(data.pos_z),
        ],
        scale: Number(data.escala_base) * Number(data.percentual_escala),
        percentualEscala: Number(data.percentual_escala),
        rotationY: Number(data.rotation_y ?? 0),
      };

      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? savedItem : item))
      );

      limparCacheOracaoJardim();
    } catch (error) {
      console.error("Erro ao plantar item no jardim:", error);

      setItems((prev) => prev.filter((item) => item.id !== tempId));

      alert("Não foi possível plantar este item agora.");
    } finally {
      isPlantingRef.current = false;
    }
  }

  async function handleMoveSelectedItem() {
    if (!selectedGardenItem) return;
    if (selectedGardenItem.id.startsWith("temp-")) return;

    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;
    moveRef.current.vertical = 0;

    aimedPlantPositionRef.current = null;
    setPendingItemType(null);
    setMovingGardenItemId(selectedGardenItem.id);
    setSelectedGardenItemId(null);
    setItemsPanelOpen(false);
    setOracaoDashboardOpen(false);
    setFlyMode(true);

    if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {}
  }

  async function movePendingItemAtAim() {
    if (!movingGardenItem) return;
    if (movingGardenItem.id.startsWith("temp-")) return;
    if (isPlantingRef.current) return;

    const position = aimedPlantPositionRef.current;

    if (!position) {
      alert("Mire para um ponto válido do chão para mover a planta.");
      return;
    }

    const localOcupado = items.some((item) => {
      if (item.id === movingGardenItem.id) return false;

      return (
        item.position[0] === position[0] && item.position[2] === position[2]
      );
    });

    if (localOcupado) {
      alert("Já existe uma planta nesse local. Escolha outro ponto.");
      return;
    }

    const posicaoOriginal = movingGardenItem.position;
    const itemId = movingGardenItem.id;

    isPlantingRef.current = true;

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, position } : item
      )
    );

    try {
      const { data, error } = await supabase.rpc("mover_item_jardim", {
        p_item_id: itemId,
        p_pos_x: position[0],
        p_pos_y: position[1],
        p_pos_z: position[2],
      });

      if (error || data !== true) {
        throw error ?? new Error("A movimentação não foi confirmada.");
      }

      setMovingGardenItemId(null);
      aimedPlantPositionRef.current = null;
      setPlantingFeedbackMessage(
        `Sua ${getGardenItemDisplayName(
          movingGardenItem.type
        )} foi movida sem perder o crescimento.`
      );

      window.setTimeout(() => {
        setPlantingFeedbackMessage("");
      }, 3500);

      if (navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch (error) {
      console.error("Erro ao mover item do jardim:", error);

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, position: posicaoOriginal } : item
        )
      );

      alert("Não foi possível mover esta planta agora.");
    } finally {
      isPlantingRef.current = false;
    }
  }

  function handleSelectGardenItem(id: string) {
    if (pendingItemType || movingGardenItemId) return;

    setSelectedGardenItemId((current) => (current === id ? null : id));
  }

  async function handleDeleteSelectedItem() {
    if (!selectedGardenItemId) return;
    if (selectedGardenItemId.startsWith("temp-")) return;

    const { error } = await supabase.rpc("remover_item_jardim_com_devolucao", {
      p_item_id: selectedGardenItemId,
    });

    if (error) {
      console.error("Erro ao remover item do jardim:", error);
      alert("Não foi possível remover este item agora.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== selectedGardenItemId));

    setSelectedGardenItemId(null);

    limparCacheOracaoJardim();
    atualizarSaldoItensJardimLocalmente(1);

    garantirSincronizacaoJardim().catch((syncError) => {
      console.error("Erro ao sincronizar créditos do jardim:", syncError);
    });
  }

  async function abrirPainelItensDoJardim() {
    if (document.pointerLockElement === containerRef.current) {
      document.exitPointerLock?.();
    }

    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;
    moveRef.current.vertical = 0;

    setPendingItemType(null);
    setMovingGardenItemId(null);
    aimedPlantPositionRef.current = null;
    setSelectedGardenItemId(null);
    setOracaoDashboardOpen(false);

    if (dadosOracaoJardim.carregando) {
      void carregarDadosOracaoJardim();
    }

    void sincronizarJardimUmaVez();

    setItemsPanelOpen(true);
  }

  async function abrirMeuJardimAposOracao() {
    await abrirPainelItensDoJardim();
  }

  function abrirDashboardOracao() {
    if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    if (document.pointerLockElement === containerRef.current) {
      document.exitPointerLock?.();
    }

    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;
    moveRef.current.vertical = 0;

    setPendingItemType(null);
    setMovingGardenItemId(null);
    aimedPlantPositionRef.current = null;
    setSelectedGardenItemId(null);
    setItemsPanelOpen(false);

    if (!resumoDashboardOracao && !resumoDashboardOracaoCarregando) {
      void carregarResumoDashboardOracaoEmBackground();
    }

    setOracaoDashboardOpen(true);
  }

  async function lockPointer(
    event?: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    const target = event?.target as HTMLElement | null;

    if (target?.closest("nav, button, a, .jardim-joystick-controle")) return;
    if (itemsPanelOpen || oracaoDashboardOpen) return;

    if (isMobile && Date.now() - lastMobileTouchPlantRef.current < 450) {
      return;
    }

    if (movingGardenItemId) {
      await movePendingItemAtAim();
      return;
    }

    if (pendingItemType) {
      await plantPendingItemAtAim();
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
    } catch {}
  }

  function handleSceneTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!isMobile) return;
    if (!placementModeActive) return;
    if (itemsPanelOpen || oracaoDashboardOpen) return;

    const target = event.target as HTMLElement | null;

    if (target?.closest("nav, button, a, .jardim-joystick-controle")) {
      return;
    }

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    touchMovedRef.current = false;
  }

  function handleSceneTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!isMobile) return;
    if (!placementModeActive) return;
    if (!touchStartRef.current) return;

    const touch = event.touches[0];

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 12) {
      touchMovedRef.current = true;
    }
  }

  async function handleSceneTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!isMobile) return;
    if (!placementModeActive) return;
    if (!touchStartRef.current) return;

    const target = event.target as HTMLElement | null;

    if (target?.closest("nav, button, a, .jardim-joystick-controle")) {
      touchStartRef.current = null;
      touchMovedRef.current = false;
      return;
    }

    const elapsed = Date.now() - touchStartRef.current.time;
    const isTap = !touchMovedRef.current && elapsed < 320;

    touchStartRef.current = null;
    touchMovedRef.current = false;

    if (!isTap) return;

    event.stopPropagation();
    lastMobileTouchPlantRef.current = Date.now();

    if (movingGardenItemId) {
      await movePendingItemAtAim();
      return;
    }

    await plantPendingItemAtAim();
  }

  async function activateFlyMode() {
    setFlyMode(true);
    setItemsPanelOpen(false);
    setOracaoDashboardOpen(false);
    setMovingGardenItemId(null);
    aimedPlantPositionRef.current = null;
    setSelectedGardenItemId(null);

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {}
  }

  async function handleSelectNewGardenItem(type: JardimItemTipo) {
    moveRef.current.forward = 0;
    moveRef.current.strafe = 0;
    moveRef.current.vertical = 0;

    useGLTF.preload(ITEM_MODEL_PATHS[type]);

    setItemsPanelOpen(false);
    setOracaoDashboardOpen(false);
    setFlyMode(true);
    setMovingGardenItemId(null);
    aimedPlantPositionRef.current = null;
    setSelectedGardenItemId(null);
    setPendingItemType(type);

    if (isMobile || !containerRef.current) return;

    try {
      await containerRef.current.requestPointerLock();
    } catch {}
  }

  function handleJoystickStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!flyMode) return;

    safePreventDefault(event);

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

    safePreventDefault(event);

    const touch = event.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
  }

  function handleJoystickEnd(event?: React.TouchEvent<HTMLDivElement>) {
    safePreventDefault(event);

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

    safePreventDefault(event);

    const touch = event.touches[0];

    lookTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleLookMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!flyMode) return;

    safePreventDefault(event);

    const touch = event.touches[0];

    if (!lookTouchRef.current) {
      lookTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };

      return;
    }

    const dx = touch.clientX - lookTouchRef.current.x;
    const dy = touch.clientY - lookTouchRef.current.y;

    lookTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    const limitedDx = Math.max(-40, Math.min(40, dx));
    const limitedDy = Math.max(-30, Math.min(30, dy));

    const horizontalSensitivity = 0.006;
    const verticalSensitivity = 0.0035;

    lookRef.current.yaw -= limitedDx * horizontalSensitivity;
    lookRef.current.pitch -= limitedDy * verticalSensitivity;

    const maxPitchUp = Math.PI / 5;
    const maxPitchDown = Math.PI / 3.2;

    lookRef.current.pitch = Math.max(
      -maxPitchUp,
      Math.min(maxPitchDown, lookRef.current.pitch)
    );
  }

  function handleLookEnd(event?: React.TouchEvent<HTMLDivElement>) {
    safePreventDefault(event);
    lookTouchRef.current = null;
  }

  function startFlyUp(event?: React.TouchEvent<HTMLButtonElement>) {
    safePreventDefault(event);

    if (!flyMode) return;

    moveRef.current.vertical = 1;
  }

  function startFlyDown(event?: React.TouchEvent<HTMLButtonElement>) {
    safePreventDefault(event);

    if (!flyMode) return;

    moveRef.current.vertical = -1;
  }

  function stopVerticalMovement(event?: React.TouchEvent<HTMLButtonElement>) {
    safePreventDefault(event);
    moveRef.current.vertical = 0;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden touch-none select-none"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "none",
      }}
      onClick={lockPointer}
      onTouchStart={handleSceneTouchStart}
      onTouchMove={handleSceneTouchMove}
      onTouchEnd={handleSceneTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
        touchMovedRef.current = false;
      }}
      onContextMenu={(event) => safePreventDefault(event)}
    >
      {instructionText && (
        <div className="absolute left-4 top-4 z-20 max-w-[360px] select-none rounded-lg bg-black/45 px-4 py-2 text-sm text-white">
          {instructionText}
        </div>
      )}

      {selectedGardenItem && (
        <div className="absolute left-4 right-4 top-20 z-30 mx-auto w-[min(360px,calc(100vw-32px))] select-none sm:left-auto sm:right-5 sm:top-24 sm:mx-0">
          <div className="overflow-hidden rounded-[22px] border border-[#5dc6a1]/25 bg-[#101514]/95 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#5dc6a1]">
                  Crescimento da planta
                </div>

                <div className="mt-1 text-base font-black capitalize leading-tight">
                  {getGardenItemDisplayName(selectedGardenItem.type)}
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedGardenItemId(null);
                }}
                onContextMenu={(event) => safePreventDefault(event)}
                aria-label="Fechar painel da planta"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-black text-white transition hover:bg-white/20 active:scale-[0.96]"
                style={{
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-xs font-bold text-white/70">
                <span>Tamanho atual</span>
                <span className="text-[#5dc6a1]">
                  {selectedGardenItemGrowthPercent}%
                </span>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#5dc6a1] transition-all"
                  style={{ width: `${selectedGardenItemGrowthPercent}%` }}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-[#5dc6a1]/15 bg-[#5dc6a1]/10 px-3 py-2 text-xs font-semibold leading-relaxed text-white/70">
                {selectedGardenItemGrowthPercent >= 100
                  ? "🌿 Esta planta está totalmente desenvolvida."
                  : `🌱 Faltam ${Math.ceil(selectedGardenItemGrowthRemaining / 10)} ${
                      Math.ceil(selectedGardenItemGrowthRemaining / 10) === 1
                        ? "dia"
                        : "dias"
                    } de oração para atingir o tamanho máximo.`}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleMoveSelectedItem();
                }}
                onContextMenu={(event) => safePreventDefault(event)}
                className="mt-3 w-full rounded-2xl border border-[#3d7a99]/40 bg-[#3d7a99]/18 px-4 py-3 text-sm font-black text-[#9edcff] shadow-lg transition hover:bg-[#3d7a99]/28 active:scale-[0.98]"
                style={{
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                ↔ Mover planta
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDeleteSelectedItem();
                }}
                onContextMenu={(event) => safePreventDefault(event)}
                className="mt-2 w-full rounded-2xl border border-red-500/30 bg-red-500/12 px-4 py-3 text-sm font-black text-red-200 shadow-lg transition hover:bg-red-500/20 active:scale-[0.98]"
                style={{
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                🗑 Remover planta
              </button>
            </div>
          </div>
        </div>
      )}

      {plantingFeedbackMessage && (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-[80] flex justify-center sm:top-6">
          <div className="max-w-[430px] rounded-2xl border border-[#5dc6a1]/30 bg-[#101514]/95 px-5 py-4 text-center text-sm font-bold leading-relaxed text-white shadow-2xl backdrop-blur-md">
            <span className="text-[#5dc6a1]">🌱 </span>
            {plantingFeedbackMessage}
          </div>
        </div>
      )}

      <Canvas
        camera={{
          position: ENTRY_CAMERA_POSITION,
          fov: 60,
        }}
        shadows={false}
        dpr={isMobile ? 1 : [1, 2]}
      >
        <Scene
          moveRef={moveRef}
          lookRef={lookRef}
          pendingItemType={placementItemType}
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
          minutosHojeInicial={dadosOracaoJardim.minutosHoje}
          saldoItensJardimInicial={dadosOracaoJardim.saldoItensJardim}
          saudeJardimPercentualInicial={dadosOracaoJardim.saudeJardimPercentual}
          dadosOracaoPreCarregados={
            jardimSincronizado && !dadosOracaoJardim.carregando
          }
          onDadosOracaoAtualizados={atualizarDadosOracaoJardim}
        />
      )}

      {oracaoDashboardOpen && (
        <OracaoDashboardPanel
          onClose={() => setOracaoDashboardOpen(false)}
          dadosIniciais={resumoDashboardOracao ?? undefined}
          dadosIniciaisCarregando={resumoDashboardOracaoCarregando}
          onResumoAtualizado={setResumoDashboardOracao}
          onOracaoRegistrada={atualizarJardimAposOracaoRegistrada}
          onAbrirMeuJardim={abrirMeuJardimAposOracao}
        />
      )}

      <BottomNavJardim
        flyMode={flyMode}
        saudeJardimPercentual={dadosOracaoJardim.saudeJardimPercentual}
        saudeJardimCarregando={dadosOracaoJardim.carregando}
        onMenu={() => {
          console.log("abrir menu");
        }}
        onFly={() => {
          void activateFlyMode();
        }}
        onItems={() => {
          void abrirPainelItensDoJardim();
        }}
        onOracao={abrirDashboardOracao}
      />

      {isMobile && flyMode && (
        <>
          <div
            className="jardim-joystick-controle absolute bottom-[72px] left-5 z-30 select-none rounded-full border border-white/30 bg-black/25 touch-none"
            style={{
              width: joystickSize,
              height: joystickSize,
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onContextMenu={(event) => safePreventDefault(event)}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
          >
            <div
              ref={joystickThumbRef}
              className="absolute left-1/2 top-1/2 select-none rounded-full bg-white/75"
              style={{
                width: thumbSize,
                height: thumbSize,
                transform: "translate(-50%, -50%) translate(0px, 0px)",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            />
          </div>

          <div
            className="absolute right-0 top-0 z-20 h-[calc(100%-64px)] w-1/2 select-none touch-none"
            style={{
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onContextMenu={(event) => safePreventDefault(event)}
            onTouchStart={handleLookStart}
            onTouchMove={handleLookMove}
            onTouchEnd={handleLookEnd}
            onTouchCancel={handleLookEnd}
          />

          <div
            className="absolute bottom-[72px] right-5 z-40 flex select-none flex-col items-center gap-3 touch-none"
            style={{
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onContextMenu={(event) => safePreventDefault(event)}
          >
            <button
              type="button"
              className="flex h-12 w-12 select-none items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl font-bold text-white touch-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
              onContextMenu={(event) => safePreventDefault(event)}
              onSelect={(event) => safePreventDefault(event)}
              onTouchStart={startFlyUp}
              onTouchEnd={stopVerticalMovement}
              onTouchCancel={stopVerticalMovement}
            >
              +
            </button>

            <button
              type="button"
              className="flex h-12 w-12 select-none items-center justify-center rounded-full border border-white/20 bg-black/40 text-2xl font-bold text-white touch-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
              onContextMenu={(event) => safePreventDefault(event)}
              onSelect={(event) => safePreventDefault(event)}
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

useGLTF.preload(PORTAL_ENTRADA_PATH);

useTexture.preload("/textures/jardim/grama/Grass004_1K-JPG_Color.jpg");