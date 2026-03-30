"use client";

import { useEffect, useMemo, useRef } from "react";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
  };
};

type Props = {
  modo?: string;
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
  width: (v: number) => GlobeInstance;
  height: (v: number) => GlobeInstance;
  globeImageUrl: (v: string) => GlobeInstance;
  polygonAltitude: (fn: (f: object) => number) => GlobeInstance;
  polygonCapColor: (fn: (f: object) => string) => GlobeInstance;
  polygonSideColor: (fn: (f: object) => string) => GlobeInstance;
  polygonStrokeColor: (fn: () => string) => GlobeInstance;
  polygonsTransitionDuration: (v: number) => GlobeInstance;
  onPolygonClick: (fn: (p: object) => void) => GlobeInstance;
  polygonsData: (data: GeoJsonFeature[]) => GlobeInstance;
  pointOfView: (view: { lat: number; lng: number; altitude: number }, duration?: number) => void;
  controls?: () => any;
  renderer?: () => any;
};

const geoJsonCache = new Map<string, GeoJsonFeature[]>();
const naturalStyleCache = new Map<string, CountryVisualState>();

function getCountryName(feature: GeoJsonFeature) {
  return feature.properties?.name || feature.properties?.ADMIN || "";
}

function getNaturalStyle(nome: string): CountryVisualState {
  const cached = naturalStyleCache.get(nome);
  if (cached) return cached;

  const style = {
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
  const data = await res.json();

  geoJsonCache.set(path, data.features);
  return data.features;
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

  const visualStateRef = useRef<Map<string, CountryVisualState>>(new Map());

  const correctSet = useMemo(() => new Set(correctCountries), [correctCountries]);
  const flashingSet = useMemo(() => new Set(flashingCountries), [flashingCountries]);
  const celebratingSet = useMemo(() => new Set(celebratingCountries), [celebratingCountries]);

  const visualStateByName = useMemo(() => {
    const map = new Map<string, CountryVisualState>();

    correctSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(147,197,253,0.25)",
        sideColor: "rgba(96,165,250,0.15)",
        altitude: 0.04,
      });
    });

    celebratingSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(191,219,254,0.45)",
        sideColor: "rgba(147,197,253,0.2)",
        altitude: 0.06,
      });
    });

    flashingSet.forEach((nome) => {
      map.set(nome, {
        capColor: "rgba(248,113,113,0.8)",
        sideColor: "rgba(248,113,113,0.25)",
        altitude: 0.04,
      });
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

      const mountEl = container as HTMLElement;

      const width = mountEl.clientWidth;
      const height = mountEl.clientHeight;

      const globe = new GlobeCtor(mountEl)
        .width(width)
        .height(height)
        .globeImageUrl("/textures/earth-blue-marble.jpg")
        .polygonAltitude((f) => getVisualState(f as GeoJsonFeature).altitude)
        .polygonCapColor((f) => getVisualState(f as GeoJsonFeature).capColor)
        .polygonSideColor((f) => getVisualState(f as GeoJsonFeature).sideColor)
        .polygonStrokeColor(() => "rgba(255,255,255,0.2)")
        .polygonsTransitionDuration(0)
        .onPolygonClick((p) => {
          const nome = getCountryName(p as GeoJsonFeature);
          if (nome) onCountryClick?.(nome);
        });

      globeRef.current = globe;

      const controls = globe.controls?.();

      if (controls) {
        controls.enableZoom = true;

        /** ZOOM MAIS PROFUNDO PARA PAÍSES PEQUENOS */
        controls.minDistance = 40;

        controls.maxDistance = 420;
        controls.zoomSpeed = 0.8;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
      }

      const path =
        modo === "europa-ocidental"
          ? "/dados/europa-ocidental-simplified.geojson"
          : "/dados/countries.geojson";

      const features = await loadGeoJson(path);

      if (cancelled) return;

      globe.polygonsData(features);
    }

    initGlobe();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [modo, onCountryClick]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.polygonsTransitionDuration(0);
  }, [visualStateByName]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (!controls) return;

    if (finalizado) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
    } else {
      controls.autoRotate = false;
    }
  }, [finalizado]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden touch-none"
    />
  );
}