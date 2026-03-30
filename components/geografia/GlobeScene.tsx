"use client";

import { useEffect, useMemo, useRef } from "react";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
    NAME?: string;
    sovereignt?: string;
  };
};

type GeoJsonResponse = {
  features: GeoJsonFeature[];
};

type GlobeMode =
  | "america-do-sul"
  | "america-central"
  | "america-do-norte"
  | "europa-ocidental"
  | "europa-oriental";

type Props = {
  modo?: GlobeMode | string;
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

type GlobeControls = {
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  enableDamping?: boolean;
  dampingFactor?: number;
  zoomSpeed?: number;
  rotateSpeed?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  update?: () => void;
};

type GlobeRenderer = {
  setPixelRatio?: (value: number) => void;
};

type GlobeInstance = {
  width: (v: number) => GlobeInstance;
  height: (v: number) => GlobeInstance;
  globeImageUrl: (v: string) => GlobeInstance;
  backgroundColor?: (v: string) => GlobeInstance;
  polygonsData: (data: GeoJsonFeature[]) => GlobeInstance;
  polygonAltitude: (fn: (f: object) => number) => GlobeInstance;
  polygonCapColor: (fn: (f: object) => string) => GlobeInstance;
  polygonSideColor: (fn: (f: object) => string) => GlobeInstance;
  polygonStrokeColor: (fn: (f: object) => string) => GlobeInstance;
  polygonsTransitionDuration: (v: number) => GlobeInstance;
  onPolygonClick: (fn: (p: object) => void) => GlobeInstance;
  pointOfView: (
    view: { lat: number; lng: number; altitude: number },
    duration?: number
  ) => void;
  controls?: () => GlobeControls;
  renderer?: () => GlobeRenderer;
};

const geoJsonCache = new Map<string, GeoJsonFeature[]>();
const filteredGeoJsonCache = new Map<string, GeoJsonFeature[]>();
const naturalStyleCache = new Map<string, CountryVisualState>();

function getCountryName(feature: GeoJsonFeature) {
  return (
    feature.properties?.name ||
    feature.properties?.ADMIN ||
    feature.properties?.NAME ||
    feature.properties?.sovereignt ||
    ""
  );
}

function normalizeCountryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getNaturalStyle(nome: string): CountryVisualState {
  const cached = naturalStyleCache.get(nome);
  if (cached) return cached;

  const style: CountryVisualState = {
    capColor: "rgba(255,255,255,0.07)",
    sideColor: "rgba(255,255,255,0.03)",
    altitude: 0.018,
  };

  naturalStyleCache.set(nome, style);
  return style;
}

async function loadGeoJson(path: string): Promise<GeoJsonFeature[]> {
  const cached = geoJsonCache.get(path);
  if (cached) return cached;

  const res = await fetch(path, { cache: "force-cache" });
  const data: GeoJsonResponse = await res.json();

  const features = Array.isArray(data.features) ? data.features : [];
  geoJsonCache.set(path, features);

  return features;
}

const REGION_COUNTRIES: Record<Exclude<GlobeMode, "europa-ocidental"> | "europa-oriental", string[]> = {
  "america-do-sul": [
    "Argentina",
    "Bolivia",
    "Brazil",
    "Chile",
    "Colombia",
    "Ecuador",
    "Guyana",
    "Paraguay",
    "Peru",
    "Suriname",
    "Uruguay",
    "Venezuela",
    "French Guiana",
  ],
  "america-central": [
    "Belize",
    "Costa Rica",
    "El Salvador",
    "Guatemala",
    "Honduras",
    "Nicaragua",
    "Panama",
  ],
  "america-do-norte": [
    "Canada",
    "United States of America",
    "United States",
    "Mexico",
    "Greenland",
  ],
  "europa-oriental": [
    "Poland",
    "Czech Republic",
    "Czechia",
    "Slovakia",
    "Hungary",
    "Romania",
    "Bulgaria",
    "Ukraine",
    "Belarus",
    "Moldova",
    "Lithuania",
    "Latvia",
    "Estonia",
    "Albania",
    "Bosnia and Herzegovina",
    "Bosnia and Herz.",
    "Serbia",
    "Croatia",
    "Slovenia",
    "Montenegro",
    "North Macedonia",
    "Macedonia",
    "Kosovo",
  ],
};

function getGeoJsonSourcePath(modo: string) {
  if (modo === "europa-ocidental") {
    return "/dados/europa-ocidental-simplified.geojson";
  }

  return "/dados/countries.geojson";
}

function filterFeaturesByMode(
  modo: string,
  features: GeoJsonFeature[]
): GeoJsonFeature[] {
  if (modo === "europa-ocidental") {
    return features;
  }

  const countries = REGION_COUNTRIES[modo as keyof typeof REGION_COUNTRIES];
  if (!countries) {
    return [];
  }

  const allowed = new Set(countries.map(normalizeCountryName));

  return features.filter((feature) => {
    const nome = normalizeCountryName(getCountryName(feature));
    return allowed.has(nome);
  });
}

async function loadFeaturesForMode(modo: string): Promise<GeoJsonFeature[]> {
  const cacheKey = `mode:${modo}`;
  const cached = filteredGeoJsonCache.get(cacheKey);
  if (cached) return cached;

  const sourcePath = getGeoJsonSourcePath(modo);
  const rawFeatures = await loadGeoJson(sourcePath);
  const filtered = filterFeaturesByMode(modo, rawFeatures);

  filteredGeoJsonCache.set(cacheKey, filtered);
  return filtered;
}

function getInitialView(modo: string) {
  switch (modo) {
    case "america-do-sul":
      return { lat: -18, lng: -60, altitude: 1.8 };

    case "america-central":
      return { lat: 15, lng: -88, altitude: 1.9 };

    case "america-do-norte":
      return { lat: 40, lng: -100, altitude: 1.75 };

    case "europa-ocidental":
      return { lat: 48, lng: 5, altitude: 1.55 };

    case "europa-oriental":
      return { lat: 49, lng: 24, altitude: 1.65 };

    default:
      return { lat: 20, lng: 0, altitude: 2.1 };
  }
}

export default function GlobeScene({
  modo = "america-do-sul",
  onCountryClick,
  correctCountries = [],
  flashingCountries = [],
  celebratingCountries = [],
  finalizado = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const featuresRef = useRef<GeoJsonFeature[]>([]);
  const onCountryClickRef = useRef<Props["onCountryClick"]>(onCountryClick);
  const visualStateRef = useRef<Map<string, CountryVisualState>>(new Map());

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

  const visualStateByName = useMemo(() => {
    const map = new Map<string, CountryVisualState>();

    correctSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(147,197,253,0.28)",
        sideColor: "rgba(96,165,250,0.16)",
        altitude: 0.04,
      });
    });

    celebratingSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(191,219,254,0.45)",
        sideColor: "rgba(147,197,253,0.22)",
        altitude: 0.06,
      });
    });

    flashingSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(248,113,113,0.85)",
        sideColor: "rgba(248,113,113,0.28)",
        altitude: 0.045,
      });
    });

    return map;
  }, [correctSet, flashingSet, celebratingSet]);

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  useEffect(() => {
    visualStateRef.current = visualStateByName;
  }, [visualStateByName]);

  function getVisualState(feature: GeoJsonFeature): CountryVisualState {
    const nome = normalizeCountryName(getCountryName(feature));
    return visualStateRef.current.get(nome) || getNaturalStyle(nome);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    async function initGlobe() {
      const GlobeModule = await import("globe.gl");
      if (cancelled) return;

      const GlobeCtor = GlobeModule.default as unknown as new (
        element: HTMLElement
      ) => GlobeInstance;

      if (cancelled || !containerRef.current) return;

      container.innerHTML = "";

      const mountEl = containerRef.current;
      const width = mountEl.clientWidth || 300;
      const height = mountEl.clientHeight || 300;

      const globe = new GlobeCtor(mountEl)
        .width(width)
        .height(height)
        .globeImageUrl("/textures/earth-blue-marble.jpg")
        .polygonAltitude((f) => getVisualState(f as GeoJsonFeature).altitude)
        .polygonCapColor((f) => getVisualState(f as GeoJsonFeature).capColor)
        .polygonSideColor((f) => getVisualState(f as GeoJsonFeature).sideColor)
        .polygonStrokeColor(() => "rgba(255,255,255,0.18)")
        .polygonsTransitionDuration(0)
        .onPolygonClick((p) => {
          const nome = getCountryName(p as GeoJsonFeature);
          if (nome) {
            onCountryClickRef.current?.(nome);
          }
        });

      globeRef.current = globe;

      const renderer = globe.renderer?.();
      if (renderer?.setPixelRatio) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
      }

      const controls = globe.controls?.();
      if (controls) {
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.zoomSpeed = 0.8;
        controls.rotateSpeed = 0.55;
        controls.minDistance = 110;
        controls.maxDistance = 420;

        // nunca girar sozinho
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;

        controls.update?.();
      }

      const features = await loadFeaturesForMode(modo);

      if (cancelled || !globeRef.current) return;

      featuresRef.current = features;
      globe.polygonsData(features);

      const initialView = getInitialView(modo);
      globe.pointOfView(initialView, 0);

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = new ResizeObserver(() => {
        const currentGlobe = globeRef.current;
        const currentContainer = containerRef.current;
        if (!currentGlobe || !currentContainer) return;

        const nextWidth = currentContainer.clientWidth || 300;
        const nextHeight = currentContainer.clientHeight || 300;

        currentGlobe.width(nextWidth).height(nextHeight);
      });

      resizeObserverRef.current.observe(mountEl);
    }

    initGlobe();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      globeRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [modo]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.polygonsTransitionDuration(0);

    if (featuresRef.current.length > 0) {
      globe.polygonsData(featuresRef.current);
    }
  }, [visualStateByName]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (!controls) return;

    // mantém sem giro mesmo finalizado
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controls.update?.();
  }, [finalizado]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden touch-none"
    />
  );
}