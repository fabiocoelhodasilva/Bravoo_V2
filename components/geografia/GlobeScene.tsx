"use client";

import { useEffect, useMemo, useRef } from "react";
import Globe from "globe.gl";
import { feature as topojsonFeature } from "topojson-client";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
    admin?: string;
    NAME?: string;
    nome?: string;
    regiao?: string;
    REGIAO?: string;
    NM_REGIAO?: string;
    regiaoJogo?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  id?: string;
};

type GeoJsonData = {
  features?: GeoJsonFeature[];
};

type TopoJsonData = {
  type?: string;
  objects?: Record<string, unknown>;
};

type GlobeMode =
  | "america-sul"
  | "america-central"
  | "america-norte"
  | "europa"
  | "brasil-regioes"
  | "brasil-estados"
  | "brasil-capitais"
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
  activeRegion?: string;
};

type CountryVisualState = {
  capColor: string;
  sideColor: string;
  altitude: number;
};

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

const BRASIL_REGIOES_BASE: Record<string, CountryVisualState> = {
  norte: {
    capColor: "rgba(191, 219, 254, 0.30)",
    sideColor: "rgba(147, 197, 253, 0.08)",
    altitude: 0.02,
  },
  nordeste: {
    capColor: "rgba(254, 215, 170, 0.30)",
    sideColor: "rgba(251, 146, 60, 0.08)",
    altitude: 0.02,
  },
  "centro-oeste": {
    capColor: "rgba(187, 247, 208, 0.30)",
    sideColor: "rgba(74, 222, 128, 0.08)",
    altitude: 0.02,
  },
  sudeste: {
    capColor: "rgba(251, 207, 232, 0.30)",
    sideColor: "rgba(244, 114, 182, 0.08)",
    altitude: 0.02,
  },
  sul: {
    capColor: "rgba(221, 214, 254, 0.30)",
    sideColor: "rgba(168, 85, 247, 0.08)",
    altitude: 0.02,
  },
};

const BRASIL_REGIOES_ATIVO: Record<string, CountryVisualState> = {
  norte: {
    capColor: "rgba(147, 197, 253, 0.62)",
    sideColor: "rgba(96, 165, 250, 0.18)",
    altitude: 0.034,
  },
  nordeste: {
    capColor: "rgba(251, 146, 60, 0.62)",
    sideColor: "rgba(249, 115, 22, 0.18)",
    altitude: 0.034,
  },
  "centro-oeste": {
    capColor: "rgba(74, 222, 128, 0.62)",
    sideColor: "rgba(34, 197, 94, 0.18)",
    altitude: 0.034,
  },
  sudeste: {
    capColor: "rgba(244, 114, 182, 0.62)",
    sideColor: "rgba(236, 72, 153, 0.18)",
    altitude: 0.034,
  },
  sul: {
    capColor: "rgba(168, 85, 247, 0.62)",
    sideColor: "rgba(147, 51, 234, 0.18)",
    altitude: 0.034,
  },
};

const ESTADO_PARA_REGIAO: Record<string, string> = {
  acre: "Norte",
  amapa: "Norte",
  amazonas: "Norte",
  para: "Norte",
  rondonia: "Norte",
  roraima: "Norte",
  tocantins: "Norte",

  alagoas: "Nordeste",
  bahia: "Nordeste",
  ceara: "Nordeste",
  maranhao: "Nordeste",
  paraiba: "Nordeste",
  pernambuco: "Nordeste",
  piaui: "Nordeste",
  "rio grande do norte": "Nordeste",
  sergipe: "Nordeste",

  "distrito federal": "Centro-Oeste",
  goias: "Centro-Oeste",
  "mato grosso": "Centro-Oeste",
  "mato grosso do sul": "Centro-Oeste",

  "espirito santo": "Sudeste",
  "minas gerais": "Sudeste",
  "rio de janeiro": "Sudeste",
  "sao paulo": "Sudeste",

  parana: "Sul",
  "rio grande do sul": "Sul",
  "santa catarina": "Sul",
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

function getFeatureStateName(feature: GeoJsonFeature) {
  return (
    feature.properties?.name ||
    feature.properties?.nome ||
    feature.properties?.ADMIN ||
    feature.properties?.admin ||
    feature.properties?.NAME ||
    ""
  );
}

function getFeatureRegionName(feature: GeoJsonFeature) {
  const nomeEstado = getFeatureStateName(feature);
  const nomeEstadoNormalizado = normalizeCountryName(nomeEstado);

  return (
    feature.properties?.regiaoJogo ||
    feature.properties?.regiao ||
    feature.properties?.REGIAO ||
    feature.properties?.NM_REGIAO ||
    ESTADO_PARA_REGIAO[nomeEstadoNormalizado] ||
    ""
  );
}

function getCountryName(feature: GeoJsonFeature, modo: GlobeMode) {
  if (modo === "brasil-regioes") {
    return getFeatureRegionName(feature);
  }

  return getFeatureStateName(feature) || getFeatureRegionName(feature);
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

function isBrasilModo(modoAtual: GlobeMode) {
  return (
    modoAtual === "brasil-regioes" ||
    modoAtual === "brasil-estados" ||
    modoAtual === "brasil-capitais"
  );
}

function isBrasilEstadosLike(modoAtual: GlobeMode) {
  return modoAtual === "brasil-estados" || modoAtual === "brasil-capitais";
}

function getGeoJsonPath(modoAtual: GlobeMode) {
  if (modoAtual === "america-sul") return "/dados/america-sul-simplified.geojson";
  if (modoAtual === "america-central") return "/dados/america-central-simplified.geojson";
  if (modoAtual === "america-norte") return "/dados/america-norte-simplified.geojson";
  if (modoAtual === "europa") return "/dados/europa-simplified.geojson";
  if (modoAtual === "brasil-regioes") return "/dados/brasil-estados.json";
  if (modoAtual === "brasil-estados" || modoAtual === "brasil-capitais") {
    return "/dados/brasil-estados.json";
  }

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
  } else if (isBrasilModo(modoAtual)) {
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
  } else if (isBrasilModo(modoAtual)) {
    globe.pointOfView({ lat: -14, lng: -52, altitude: 0.92 }, 1200);
  } else {
    globe.pointOfView({ lat: 10, lng: -30, altitude: 1.75 }, 1200);
  }
}

function mapearEstadoParaRegiao(feature: GeoJsonFeature): GeoJsonFeature {
  const nomeEstado = feature.properties?.nome || feature.properties?.name || "";
  const nomeEstadoNormalizado = normalizeCountryName(nomeEstado);
  const regiao = ESTADO_PARA_REGIAO[nomeEstadoNormalizado] || "";

  return {
    ...feature,
    properties: {
      ...feature.properties,
      regiaoJogo: regiao || nomeEstado,
    },
  };
}

async function loadGeoJson(path: string): Promise<GeoJsonFeature[]> {
  const cached = geoJsonCache.get(path);
  if (cached) return cached;

  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Erro ao buscar GeoJSON/TopoJSON: ${res.status}`);
  }

  const data = (await res.json()) as GeoJsonData & TopoJsonData;

  if (Array.isArray(data.features)) {
    const features = data.features ?? [];
    geoJsonCache.set(path, features);
    return features;
  }

  if (data.type === "Topology" && data.objects) {
    const objectKey =
      "estados" in data.objects ? "estados" : Object.keys(data.objects)[0];

    if (!objectKey) {
      throw new Error("TopoJSON sem objeto válido.");
    }

    const geojson = topojsonFeature(
      data as never,
      data.objects[objectKey] as never
    ) as {
      type: string;
      features?: GeoJsonFeature[];
    };

    let features = geojson.features ?? [];

    if (path.includes("/dados/brasil-estados.json")) {
      features = features.map(mapearEstadoParaRegiao);
    }

    geoJsonCache.set(path, features);
    return features;
  }

  throw new Error("Formato de arquivo geográfico não reconhecido.");
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
  activeRegion,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const onCountryClickRef = useRef<Props["onCountryClick"]>(onCountryClick);
  const allowedCountryMapRef = useRef<Map<string, string>>(new Map());
  const modoRef = useRef<GlobeMode>(modo);

  const isDraggingRef = useRef(false);
  const lastPointerDownRef = useRef({ x: 0, y: 0 });
  const clickLockRef = useRef(false);
  const clickUnlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

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
      const allNames = [item.en, ...(item.aliases ?? []), item.pt ?? ""];

      allNames.forEach((name) => {
        const normalized = normalizeCountryName(name);
        if (normalized) {
          map.set(normalized, canonicalName);
        }
      });
    });

    return map;
  }, [allowedCountryNames]);

  useEffect(() => {
    allowedCountryMapRef.current = allowedCountryMap;
  }, [allowedCountryMap]);

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

  function getVisualState(feature: GeoJsonFeature): CountryVisualState {
    const nome = getCountryName(feature, modo);
    const nomeNormalizado = normalizeCountryName(nome);

    const flashWrongCapColor = "rgba(248, 113, 113, 0.75)";
    const flashWrongSideColor = "rgba(248, 113, 113, 0.22)";

    const correctCapColor = "rgba(147, 197, 253, 0.20)";
    const correctSideColor = "rgba(96, 165, 250, 0.10)";

    const celebrateCapColor = "rgba(191, 219, 254, 0.38)";
    const celebrateSideColor = "rgba(147, 197, 253, 0.20)";

    if (modo === "brasil-regioes") {
      if (flashingSet.has(nomeNormalizado)) {
        return {
          capColor: flashWrongCapColor,
          sideColor: flashWrongSideColor,
          altitude: 0.032,
        };
      }

      if (correctSet.has(nomeNormalizado) || celebratingSet.has(nomeNormalizado)) {
        return (
          BRASIL_REGIOES_ATIVO[nomeNormalizado] || {
            capColor: celebrateCapColor,
            sideColor: celebrateSideColor,
            altitude: 0.034,
          }
        );
      }

      if (BRASIL_REGIOES_BASE[nomeNormalizado]) {
        return BRASIL_REGIOES_BASE[nomeNormalizado];
      }
    }

    if (isBrasilEstadosLike(modo)) {
      const nomeEstado = getFeatureStateName(feature);
      const nomeEstadoNormalizado = normalizeCountryName(nomeEstado);
      const nomeRegiao = getFeatureRegionName(feature);
      const nomeRegiaoNormalizado = normalizeCountryName(nomeRegiao);

      const regiaoAtivaNormalizada = normalizeCountryName(activeRegion || "");

      const estiloBase =
        BRASIL_REGIOES_BASE[nomeRegiaoNormalizado] || {
          capColor: "rgba(255,255,255,0.07)",
          sideColor: "rgba(255,255,255,0.03)",
          altitude: 0.02,
        };

      const estiloAtivo =
        BRASIL_REGIOES_ATIVO[nomeRegiaoNormalizado] || {
          capColor: "rgba(191, 219, 254, 0.45)",
          sideColor: "rgba(147, 197, 253, 0.18)",
          altitude: 0.034,
        };

      if (flashingSet.has(nomeEstadoNormalizado)) {
        return {
          capColor: flashWrongCapColor,
          sideColor: flashWrongSideColor,
          altitude: 0.032,
        };
      }

      if (
        correctSet.has(nomeEstadoNormalizado) ||
        celebratingSet.has(nomeEstadoNormalizado)
      ) {
        return {
          capColor: estiloAtivo.capColor,
          sideColor: estiloAtivo.sideColor,
          altitude: 0.042,
        };
      }

      if (
        !regiaoAtivaNormalizada ||
        nomeRegiaoNormalizado !== regiaoAtivaNormalizada
      ) {
        return {
          capColor: "rgba(255,255,255,0.035)",
          sideColor: "rgba(255,255,255,0.015)",
          altitude: 0.012,
        };
      }

      return {
        capColor: estiloBase.capColor,
        sideColor: estiloBase.sideColor,
        altitude: 0.022,
      };
    }

    if (flashingSet.has(nomeNormalizado)) {
      return {
        capColor: flashWrongCapColor,
        sideColor: flashWrongSideColor,
        altitude: 0.032,
      };
    }

    if (celebratingSet.has(nomeNormalizado)) {
      return {
        capColor: celebrateCapColor,
        sideColor: celebrateSideColor,
        altitude: 0.05,
      };
    }

    if (correctSet.has(nomeNormalizado)) {
      return {
        capColor: correctCapColor,
        sideColor: correctSideColor,
        altitude: 0.032,
      };
    }

    return getNaturalStyle(nome);
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

        const modoAtual = modoRef.current;
        const nomeOriginal = getCountryName(
          polygon as GeoJsonFeature,
          modoAtual
        );
        const nomeNormalizado = normalizeCountryName(nomeOriginal);
        const nomeCanonico =
          allowedCountryMapRef.current.get(nomeNormalizado) || nomeOriginal;

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
        } catch {
          // noop
        }

        globeRef.current = null;
      }

      container.innerHTML = "";
    };
  }, []);

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
                const nome = getCountryName(feature, modo);
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
  }, [modo, correctSet, celebratingSet, flashingSet, activeRegion]);

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