"use client";

import { useEffect, useMemo, useRef } from "react";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
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
  | "europa-ocidental"
  | "mundo";

type Props = {
  modo?: GlobeMode;
  onCountryClick?: (nome: string) => void;
  correctCountries?: string[];
  flashingCountries?: string[];
  celebratingCountries?: string[];
  finalizado?: boolean;
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

const geoJsonCache = new Map<string, GeoJsonFeature[]>();
const countrySeedCache = new Map<string, number>();
const naturalStyleCache = new Map<string, CountryVisualState>();

function getCountryName(feature: GeoJsonFeature) {
  return feature.properties?.name || feature.properties?.ADMIN || "";
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
  if (modoAtual === "america-central") {
    return "/dados/america-central-simplified.geojson";
  }
  if (modoAtual === "america-norte") {
    return "/dados/america-norte-simplified.geojson";
  }
  if (modoAtual === "europa-ocidental") {
    return "/dados/europa-ocidental-simplified.geojson";
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
  } else if (modoAtual === "europa-ocidental") {
    globe.pointOfView({ lat: 47, lng: 6, altitude: 0.82 }, 0);
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
  } else if (modoAtual === "europa-ocidental") {
    globe.pointOfView({ lat: 47, lng: 6, altitude: 0.68 }, 1200);
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

export default function GlobeScene({
  modo = "mundo",
  onCountryClick,
  correctCountries = [],
  flashingCountries = [],
  celebratingCountries = [],
  finalizado = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const globeReadyRef = useRef(false);

  const onCountryClickRef = useRef<Props["onCountryClick"]>(onCountryClick);
  const isDraggingRef = useRef(false);
  const lastPointerDownRef = useRef({ x: 0, y: 0 });
  const clickLockRef = useRef(false);
  const clickUnlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentFeaturesRef = useRef<GeoJsonFeature[]>([]);
  const visualStateRef = useRef<Map<string, CountryVisualState>>(new Map());

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  const correctSet = useMemo(() => new Set(correctCountries), [correctCountries]);
  const flashingSet = useMemo(() => new Set(flashingCountries), [flashingCountries]);
  const celebratingSet = useMemo(
    () => new Set(celebratingCountries),
    [celebratingCountries]
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

    allNames.forEach((nome) => {
      if (celebratingSet.has(nome)) {
        map.set(nome, {
          capColor: celebrateCapColor,
          sideColor: celebrateSideColor,
          altitude: 0.05,
        });
        return;
      }

      if (correctSet.has(nome)) {
        map.set(nome, {
          capColor: correctCapColor,
          sideColor: correctSideColor,
          altitude: 0.032,
        });
        return;
      }

      if (flashingSet.has(nome)) {
        map.set(nome, {
          capColor: flashWrongCapColor,
          sideColor: flashWrongSideColor,
          altitude: 0.032,
        });
      }
    });

    return map;
  }, [correctSet, flashingSet, celebratingSet]);

  useEffect(() => {
    visualStateRef.current = visualStateByName;
  }, [visualStateByName]);

  function getVisualState(feature: GeoJsonFeature): CountryVisualState {
    const nome = getCountryName(feature);
    return visualStateRef.current.get(nome) || getNaturalStyle(nome);
  }

  function lockClickTemporarily() {
    clickLockRef.current = true;

    if (clickUnlockTimeoutRef.current) {
      clearTimeout(clickUnlockTimeoutRef.current);
    }

    clickUnlockTimeoutRef.current = setTimeout(() => {
      clickLockRef.current = false;
    }, 180);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (globeRef.current) return;

    let cancelled = false;

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

    async function initGlobe() {
      try {
        const GlobeModule = await import("globe.gl");
        if (cancelled) return;

        const Globe = GlobeModule.default;
        const { width, height } = getContainerSize();

        const globe = Globe()(container)
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

            const nome = getCountryName(polygon as GeoJsonFeature);
            if (!nome) return;

            lockClickTemporarily();
            onCountryClickRef.current?.(nome);
          });

        if (cancelled) {
          try {
            globe.pauseAnimation?.();
            globe.onPolygonClick(() => {});
            const rendererInstance = globe.renderer?.();
            rendererInstance?.dispose?.();
            rendererInstance?.forceContextLoss?.();
          } catch {}
          return;
        }

        globeRef.current = globe;
        globeReadyRef.current = true;

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
          controls.zoomSpeed = 0.9;
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0.5;
          controls.minDistance = 75;
          controls.maxDistance = 420;
        }

        const resizeObserver = new ResizeObserver(() => {
          if (!globeRef.current) return;
          const { width: nextWidth, height: nextHeight } = getContainerSize();
          globeRef.current.width(nextWidth).height(nextHeight);
        });

        resizeObserver.observe(container);
        resizeObserverRef.current = resizeObserver;

        const geoJsonPath = getGeoJsonPath(modo);
        const features = await loadGeoJson(geoJsonPath);

        if (cancelled || !globeRef.current) return;

        currentFeaturesRef.current = features;
        globe.polygonsData(features);

        requestAnimationFrame(() => {
          if (!cancelled) {
            aplicarVistaInicial(globe, modo);
          }
        });
      } catch (error) {
        console.error("Erro ao inicializar globo:", error);
      }
    }

    void initGlobe();

    return () => {
      cancelled = true;
      globeReadyRef.current = false;

      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);

      resizeObserverRef.current?.disconnect();
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
  }, []);

  useEffect(() => {
    if (!globeReadyRef.current) return;

    const globe = globeRef.current;
    if (!globe) return;

    const geoJsonPath = getGeoJsonPath(modo);

    loadGeoJson(geoJsonPath)
      .then((features) => {
        currentFeaturesRef.current = features;
        globe.polygonsData(features);

        requestAnimationFrame(() => {
          aplicarVistaInicial(globe, modo);
        });
      })
      .catch((error) => {
        console.error("Erro ao carregar GeoJSON:", error);
      });
  }, [modo]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    if (!currentFeaturesRef.current.length) return;

    globe.polygonsData(currentFeaturesRef.current).polygonsTransitionDuration(0);
  }, [visualStateByName]);

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
    }
  }, [finalizado, modo]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden touch-none"
    />
  );
}