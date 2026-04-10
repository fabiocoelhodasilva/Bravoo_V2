"use client";

import { useEffect, useMemo, useRef } from "react";
import Globe from "globe.gl";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
    admin?: string;
    NAME?: string;
    nome?: string;
    NM_UF?: string;
    UF?: string;
    estado?: string;
    NM_REGIAO?: string;
    regiao?: string;
    REGIAO?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type GeoJsonData = {
  features?: GeoJsonFeature[];
};

type GlobeMode =
  | "america-sul"
  | "america-central"
  | "america-norte"
  | "europa"
  | "brasil-regioes"
  | "brasil-estados"
  | "mundo";

type AllowedCountryItem =
  | string
  | {
      en: string;
      pt?: string;
      aliases?: string[];
    };

type Props = {
  modo?: GlobeMode;
  resetKey?: string;
  allowedCountryNames?: AllowedCountryItem[];
  onCountryClick?: (nome: string) => void;
  correctCountries?: string[];
  flashingCountries?: string[];
  celebratingCountries?: string[];
  finalizado?: boolean;
  currentRegion?: string;
};

type CountryVisualState = {
  capColor: string;
  sideColor: string;
  altitude: number;
};

type NomeRegiaoBrasil =
  | "Norte"
  | "Nordeste"
  | "Centro-Oeste"
  | "Sudeste"
  | "Sul";

type GlobeInstance = {
  width: (value: number) => GlobeInstance;
  height: (value: number) => GlobeInstance;
  globeImageUrl: (value: string) => GlobeInstance;
  polygonAltitude: (fn: (feature: object) => number) => GlobeInstance;
  polygonCapColor: (fn: (feature: object) => string) => GlobeInstance;
  polygonSideColor: (fn: (feature: object) => string) => GlobeInstance;
  polygonStrokeColor: (fn: () => string) => GlobeInstance;
  polygonsTransitionDuration: (value: number) => GlobeInstance;
  onPolygonClick: (fn: (polygon: object) => void) => GlobeInstance;
  polygonsData: (data: GeoJsonFeature[]) => GlobeInstance;
  pointOfView: (
    view: { lat: number; lng: number; altitude: number },
    duration?: number
  ) => void;
  renderer?: () => {
    setPixelRatio?: (value: number) => void;
    dispose?: () => void;
    forceContextLoss?: () => void;
  };
  controls?: () => {
    enableZoom: boolean;
    enablePan: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    minDistance: number;
    maxDistance: number;
  };
  pauseAnimation?: () => void;
};

const GlobeCtor = Globe as unknown as new (element: HTMLElement) => GlobeInstance;

const geoJsonCache = new Map<string, GeoJsonFeature[]>();
const countrySeedCache = new Map<string, number>();
const naturalStyleCache = new Map<string, CountryVisualState>();

/* =================================
   CORES PASTEL — BRASIL REGIÕES
================================= */

const BRASIL_REGIOES_BASE: Record<string, CountryVisualState> = {
  norte: {
    capColor: "rgba(191, 219, 254, 0.28)",
    sideColor: "rgba(147, 197, 253, 0.08)",
    altitude: 0.02,
  },
  nordeste: {
    capColor: "rgba(254, 215, 170, 0.28)",
    sideColor: "rgba(251, 146, 60, 0.08)",
    altitude: 0.02,
  },
  "centro-oeste": {
    capColor: "rgba(187, 247, 208, 0.28)",
    sideColor: "rgba(74, 222, 128, 0.08)",
    altitude: 0.02,
  },
  sudeste: {
    capColor: "rgba(251, 207, 232, 0.28)",
    sideColor: "rgba(244, 114, 182, 0.08)",
    altitude: 0.02,
  },
  sul: {
    capColor: "rgba(221, 214, 254, 0.28)",
    sideColor: "rgba(168, 85, 247, 0.08)",
    altitude: 0.02,
  },
};

const BRASIL_REGIOES_ATIVO: Record<string, CountryVisualState> = {
  norte: {
    capColor: "rgba(147, 197, 253, 0.60)",
    sideColor: "rgba(96, 165, 250, 0.18)",
    altitude: 0.034,
  },
  nordeste: {
    capColor: "rgba(251, 146, 60, 0.60)",
    sideColor: "rgba(249, 115, 22, 0.18)",
    altitude: 0.034,
  },
  "centro-oeste": {
    capColor: "rgba(74, 222, 128, 0.60)",
    sideColor: "rgba(34, 197, 94, 0.18)",
    altitude: 0.034,
  },
  sudeste: {
    capColor: "rgba(244, 114, 182, 0.60)",
    sideColor: "rgba(236, 72, 153, 0.18)",
    altitude: 0.034,
  },
  sul: {
    capColor: "rgba(168, 85, 247, 0.60)",
    sideColor: "rgba(147, 51, 234, 0.18)",
    altitude: 0.034,
  },
};

const ESTADOS_POR_REGIAO: Record<NomeRegiaoBrasil, string[]> = {
  Norte: [
    "Acre",
    "Amapá",
    "Amazonas",
    "Pará",
    "Rondônia",
    "Roraima",
    "Tocantins",
  ],
  Nordeste: [
    "Alagoas",
    "Bahia",
    "Ceará",
    "Maranhão",
    "Paraíba",
    "Pernambuco",
    "Piauí",
    "Rio Grande do Norte",
    "Sergipe",
  ],
  "Centro-Oeste": [
    "Distrito Federal",
    "Goiás",
    "Mato Grosso",
    "Mato Grosso do Sul",
  ],
  Sudeste: [
    "Espírito Santo",
    "Minas Gerais",
    "Rio de Janeiro",
    "São Paulo",
  ],
  Sul: ["Paraná", "Rio Grande do Sul", "Santa Catarina"],
};

function normalizeCountryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getCountryName(feature: GeoJsonFeature) {
  return (
    feature.properties?.name ||
    feature.properties?.nome ||
    feature.properties?.NM_UF ||
    feature.properties?.UF ||
    feature.properties?.estado ||
    feature.properties?.NM_REGIAO ||
    feature.properties?.regiao ||
    feature.properties?.REGIAO ||
    feature.properties?.ADMIN ||
    feature.properties?.admin ||
    feature.properties?.NAME ||
    ""
  );
}

function getCountrySeed(nome: string) {
  const cached = countrySeedCache.get(nome);
  if (cached !== undefined) return cached;

  let total = 0;
  for (let i = 0; i < nome.length; i += 1) {
    total += nome.charCodeAt(i);
  }

  const seed = total % 5;
  countrySeedCache.set(nome, seed);
  return seed;
}

function getNaturalStyle(nome: string): CountryVisualState {
  const cached = naturalStyleCache.get(nome);
  if (cached) return cached;

  const seed = getCountrySeed(nome);

  const capPalette = [
    "rgba(255, 255, 255, 0.07)",
    "rgba(191, 219, 254, 0.08)",
    "rgba(186, 230, 253, 0.075)",
    "rgba(224, 242, 254, 0.07)",
    "rgba(255, 255, 255, 0.06)",
  ];

  const sidePalette = [
    "rgba(255, 255, 255, 0.025)",
    "rgba(191, 219, 254, 0.03)",
    "rgba(186, 230, 253, 0.028)",
    "rgba(224, 242, 254, 0.024)",
    "rgba(255, 255, 255, 0.02)",
  ];

  const style: CountryVisualState = {
    capColor: capPalette[seed],
    sideColor: sidePalette[seed],
    altitude: 0.018,
  };

  naturalStyleCache.set(nome, style);
  return style;
}

function getGeoJsonPath(modoAtual: GlobeMode) {
  if (modoAtual === "america-sul") return "/dados/america-sul-simplified.geojson";
  if (modoAtual === "america-central")
    return "/dados/america-central-simplified.geojson";
  if (modoAtual === "america-norte")
    return "/dados/america-norte-simplified.geojson";
  if (modoAtual === "europa") return "/dados/europa-simplified.geojson";
  if (modoAtual === "brasil-regioes")
    return "/dados/brasil-regioes-simplified.geojson";
  if (modoAtual === "brasil-estados")
    return "/dados/brasil-estados-simplified.geojson";

  return "/dados/countries.geojson";
}

function aplicarVistaInicial(globe: GlobeInstance, modoAtual: GlobeMode) {
  if (modoAtual === "america-sul") {
    globe.pointOfView({ lat: -20, lng: -58, altitude: 1.55 }, 0);
  } else if (modoAtual === "america-central") {
    globe.pointOfView({ lat: 16, lng: -85, altitude: 0.78 }, 0);
  } else if (modoAtual === "america-norte") {
    globe.pointOfView({ lat: 40, lng: -100, altitude: 1.2 }, 0);
  } else if (modoAtual === "europa") {
    globe.pointOfView({ lat: 54, lng: 15, altitude: 1.05 }, 0);
  } else if (modoAtual === "brasil-regioes") {
    globe.pointOfView({ lat: -14, lng: -52, altitude: 1.15 }, 0);
  } else if (modoAtual === "brasil-estados") {
    globe.pointOfView({ lat: -14, lng: -52, altitude: 1.15 }, 0);
  } else {
    globe.pointOfView({ lat: 10, lng: -30, altitude: 2.1 }, 0);
  }
}

function aplicarVistaFinal(globe: GlobeInstance, modoAtual: GlobeMode) {
  if (modoAtual === "america-sul") {
    globe.pointOfView({ lat: -20, lng: -58, altitude: 1.18 }, 1200);
  } else if (modoAtual === "america-central") {
    globe.pointOfView({ lat: 16, lng: -85, altitude: 0.64 }, 1200);
  } else if (modoAtual === "america-norte") {
    globe.pointOfView({ lat: 40, lng: -100, altitude: 0.95 }, 1200);
  } else if (modoAtual === "europa") {
    globe.pointOfView({ lat: 54, lng: 15, altitude: 0.86 }, 1200);
  } else if (modoAtual === "brasil-regioes") {
    globe.pointOfView({ lat: -14, lng: -52, altitude: 0.92 }, 1200);
  } else if (modoAtual === "brasil-estados") {
    globe.pointOfView({ lat: -14, lng: -52, altitude: 0.92 }, 1200);
  } else {
    globe.pointOfView({ lat: 10, lng: -30, altitude: 1.75 }, 1200);
  }
}

async function loadGeoJson(path: string): Promise<GeoJsonFeature[]> {
  const cached = geoJsonCache.get(path);
  if (cached) return cached;

  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Erro ao buscar GeoJSON: ${res.status}`);
  }

  const data: GeoJsonData = await res.json();
  const features = data.features ?? [];
  geoJsonCache.set(path, features);
  return features;
}

function obterRegiaoDoEstado(nomeEstado: string): NomeRegiaoBrasil | null {
  const nomeNormalizado = normalizeCountryName(nomeEstado);

  for (const [regiao, estados] of Object.entries(ESTADOS_POR_REGIAO)) {
    const encontrou = estados.some(
      (estado) => normalizeCountryName(estado) === nomeNormalizado
    );

    if (encontrou) {
      return regiao as NomeRegiaoBrasil;
    }
  }

  return null;
}

function getBaseStyleByRegion(regiao: NomeRegiaoBrasil | null): CountryVisualState | null {
  if (!regiao) return null;
  return BRASIL_REGIOES_BASE[normalizeCountryName(regiao)] || null;
}

function getActiveStyleByRegion(regiao: NomeRegiaoBrasil | null): CountryVisualState | null {
  if (!regiao) return null;
  return BRASIL_REGIOES_ATIVO[normalizeCountryName(regiao)] || null;
}

export default function GlobeScene({
  modo = "mundo",
  resetKey = "default",
  allowedCountryNames = [],
  onCountryClick,
  correctCountries = [],
  flashingCountries = [],
  celebratingCountries = [],
  finalizado = false,
  currentRegion,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onCountryClickRef = useRef<Props["onCountryClick"]>(onCountryClick);
  const isDraggingRef = useRef(false);
  const lastPointerDownRef = useRef({ x: 0, y: 0 });
  const clickLockRef = useRef(false);
  const clickUnlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  const allowedCountryMap = useMemo(() => {
    const map = new Map<string, string>();

    allowedCountryNames.forEach((item) => {
      if (typeof item === "string") {
        const normalized = normalizeCountryName(item);
        if (normalized) {
          map.set(normalized, item);
        }
        return;
      }

      const canonicalName = item.en;
      const allNames = [item.en, ...(item.aliases ?? [])];

      allNames.forEach((name) => {
        const normalized = normalizeCountryName(name);
        if (normalized) {
          map.set(normalized, canonicalName);
        }
      });
    });

    return map;
  }, [allowedCountryNames]);

  const correctSet = useMemo(
    () => new Set(correctCountries.map(normalizeCountryName)),
    [correctCountries]
  );

  const flashingSet = useMemo(
    () => new Set(flashingCountries.map(normalizeCountryName)),
    [flashingCountries]
  );

  const celebratingSet = useMemo(
    () => new Set(celebratingCountries.map(normalizeCountryName)),
    [celebratingCountries]
  );

  const currentRegionNormalized = useMemo(
    () => (currentRegion ? normalizeCountryName(currentRegion) : ""),
    [currentRegion]
  );

  const visualStateByName = useMemo(() => {
    const map = new Map<string, CountryVisualState>();

    const correctCapColor = "rgba(147, 197, 253, 0.20)";
    const correctSideColor = "rgba(96, 165, 250, 0.10)";

    const celebrateCapColor = "rgba(191, 219, 254, 0.38)";
    const celebrateSideColor = "rgba(147, 197, 253, 0.20)";

    const flashWrongCapColor = "rgba(248, 113, 113, 0.75)";
    const flashWrongSideColor = "rgba(248, 113, 113, 0.22)";

    const allNames = new Set<string>([
      ...correctSet,
      ...flashingSet,
      ...celebratingSet,
    ]);

    allNames.forEach((nomeNormalizado) => {
      if (modo === "brasil-regioes") {
        if (celebratingSet.has(nomeNormalizado)) {
          map.set(
            nomeNormalizado,
            BRASIL_REGIOES_ATIVO[nomeNormalizado] || {
              capColor: celebrateCapColor,
              sideColor: celebrateSideColor,
              altitude: 0.05,
            }
          );
          return;
        }

        if (correctSet.has(nomeNormalizado)) {
          map.set(
            nomeNormalizado,
            BRASIL_REGIOES_ATIVO[nomeNormalizado] || {
              capColor: correctCapColor,
              sideColor: correctSideColor,
              altitude: 0.032,
            }
          );
          return;
        }

        if (flashingSet.has(nomeNormalizado)) {
          map.set(nomeNormalizado, {
            capColor: flashWrongCapColor,
            sideColor: flashWrongSideColor,
            altitude: 0.032,
          });
        }

        return;
      }

      if (modo === "brasil-estados") {
        if (flashingSet.has(nomeNormalizado)) {
          map.set(nomeNormalizado, {
            capColor: flashWrongCapColor,
            sideColor: flashWrongSideColor,
            altitude: 0.032,
          });
          return;
        }

        const regiaoDoEstado = obterRegiaoDoEstado(nomeNormalizado);
        const activeStyle = getActiveStyleByRegion(regiaoDoEstado);

        if (celebratingSet.has(nomeNormalizado)) {
          map.set(
            nomeNormalizado,
            activeStyle || {
              capColor: celebrateCapColor,
              sideColor: celebrateSideColor,
              altitude: 0.05,
            }
          );
          return;
        }

        if (correctSet.has(nomeNormalizado)) {
          map.set(
            nomeNormalizado,
            activeStyle || {
              capColor: correctCapColor,
              sideColor: correctSideColor,
              altitude: 0.032,
            }
          );
        }
        return;
      }

      if (celebratingSet.has(nomeNormalizado)) {
        map.set(nomeNormalizado, {
          capColor: celebrateCapColor,
          sideColor: celebrateSideColor,
          altitude: 0.05,
        });
        return;
      }

      if (correctSet.has(nomeNormalizado)) {
        map.set(nomeNormalizado, {
          capColor: correctCapColor,
          sideColor: correctSideColor,
          altitude: 0.032,
        });
        return;
      }

      if (flashingSet.has(nomeNormalizado)) {
        map.set(nomeNormalizado, {
          capColor: flashWrongCapColor,
          sideColor: flashWrongSideColor,
          altitude: 0.032,
        });
      }
    });

    return map;
  }, [correctSet, flashingSet, celebratingSet, modo]);

  function getVisualState(feature: GeoJsonFeature): CountryVisualState {
    const nome = getCountryName(feature);
    const nomeNormalizado = normalizeCountryName(nome);

    if (modo === "brasil-regioes") {
      if (visualStateByName.has(nomeNormalizado)) {
        return visualStateByName.get(nomeNormalizado)!;
      }

      if (BRASIL_REGIOES_BASE[nomeNormalizado]) {
        return BRASIL_REGIOES_BASE[nomeNormalizado];
      }
    }

    if (modo === "brasil-estados") {
      if (visualStateByName.has(nomeNormalizado)) {
        return visualStateByName.get(nomeNormalizado)!;
      }

      const regiaoDoEstado = obterRegiaoDoEstado(nome);

      if (
        currentRegionNormalized &&
        regiaoDoEstado &&
        normalizeCountryName(regiaoDoEstado) === currentRegionNormalized
      ) {
        return (
          getBaseStyleByRegion(regiaoDoEstado) || getNaturalStyle(nome)
        );
      }
    }

    return visualStateByName.get(nomeNormalizado) || getNaturalStyle(nome);
  }

  function lockClickTemporarily() {
    clickLockRef.current = true;

    if (clickUnlockTimeoutRef.current) {
      clearTimeout(clickUnlockTimeoutRef.current);
    }

    clickUnlockTimeoutRef.current = setTimeout(() => {
      clickLockRef.current = false;
    }, 220);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (globeRef.current) return;

    const getContainerSize = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
    });

    const handlePointerDown = (event: PointerEvent) => {
      isDraggingRef.current = false;
      lastPointerDownRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const dx = Math.abs(event.clientX - lastPointerDownRef.current.x);
      const dy = Math.abs(event.clientY - lastPointerDownRef.current.y);

      if (dx > 6 || dy > 6) {
        isDraggingRef.current = true;
      }
    };

    const handlePointerUp = () => {
      window.setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerUp);

    const { width, height } = getContainerSize();

    const globe = new GlobeCtor(container)
      .width(width)
      .height(height)
      .globeImageUrl("/textures/earth-blue-marble.jpg")
      .polygonAltitude((feature: object) =>
        getVisualState(feature as GeoJsonFeature).altitude
      )
      .polygonCapColor((feature: object) =>
        getVisualState(feature as GeoJsonFeature).capColor
      )
      .polygonSideColor((feature: object) =>
        getVisualState(feature as GeoJsonFeature).sideColor
      )
      .polygonStrokeColor(() => "rgba(255,255,255,0.16)")
      .polygonsTransitionDuration(0)
      .onPolygonClick((polygon: object) => {
        if (isDraggingRef.current) return;
        if (clickLockRef.current) return;

        const nomeOriginal = getCountryName(polygon as GeoJsonFeature);
        const nomeNormalizado = normalizeCountryName(nomeOriginal);
        const nomeCanonico =
          allowedCountryMap.get(nomeNormalizado) || nomeOriginal;

        if (!nomeCanonico) return;

        lockClickTemporarily();
        onCountryClickRef.current?.(nomeCanonico);
      });

    globeRef.current = globe;

    const renderer = globe.renderer?.();
    if (renderer) {
      renderer.setPixelRatio?.(1);
    }

    const controls = globe.controls?.();
    if (controls) {
      controls.enableZoom = true;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.95;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance = 85;
      controls.maxDistance = 600;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!globeRef.current) return;
      const { width: nextWidth, height: nextHeight } = getContainerSize();
      globeRef.current.width(nextWidth).height(nextHeight);
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);

      resizeObserver.disconnect();
      resizeObserverRef.current = null;

      if (clickUnlockTimeoutRef.current) {
        clearTimeout(clickUnlockTimeoutRef.current);
      }

      if (globeRef.current) {
        try {
          globeRef.current.pauseAnimation?.();
          globeRef.current.onPolygonClick(() => {});
          const rendererInstance = globeRef.current.renderer?.();
          rendererInstance?.dispose?.();
          rendererInstance?.forceContextLoss?.();
        } catch {}

        globeRef.current = null;
      }

      container.innerHTML = "";
    };
  }, [allowedCountryMap, modo]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const geoJsonPath = getGeoJsonPath(modo);

    loadGeoJson(geoJsonPath)
      .then((features) => {
        const filteredFeatures =
          allowedCountryMap.size === 0
            ? features
            : features.filter((feature) => {
                const nome = getCountryName(feature);
                const nomeNormalizado = normalizeCountryName(nome);
                return allowedCountryMap.has(nomeNormalizado);
              });

        globe.polygonsData(filteredFeatures);

        requestAnimationFrame(() => {
          aplicarVistaInicial(globe, modo);
        });
      })
      .catch((error) => {
        console.error("Erro ao carregar GeoJSON:", error);
      });
  }, [modo, resetKey, allowedCountryMap]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    requestAnimationFrame(() => {
      aplicarVistaInicial(globe, modo);
    });
  }, [resetKey, modo]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe
      .polygonCapColor((feature: object) =>
        getVisualState(feature as GeoJsonFeature).capColor
      )
      .polygonSideColor((feature: object) =>
        getVisualState(feature as GeoJsonFeature).sideColor
      )
      .polygonAltitude((feature: object) =>
        getVisualState(feature as GeoJsonFeature).altitude
      )
      .polygonsTransitionDuration(0);
  }, [visualStateByName, modo, currentRegionNormalized]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (!controls) return;

    if (finalizado) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      aplicarVistaFinal(globe, modo);
    } else {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      aplicarVistaInicial(globe, modo);
    }
  }, [finalizado, modo]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden touch-none"
    />
  );
}