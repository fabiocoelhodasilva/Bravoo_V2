"use client";

import { useEffect, useMemo, useRef } from "react";
import Globe from "globe.gl";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: any;
  };
};

type GeoJsonData = {
  features?: GeoJsonFeature[];
};

type Props = {
  modo?: "america-sul" | "mundo";
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

  const style = {
    capColor: capPalette[seed],
    sideColor: sidePalette[seed],
    altitude: 0.022,
  };

  naturalStyleCache.set(nome, style);
  return style;
}

function aplicarVistaInicial(globe: any, modoAtual: "america-sul" | "mundo") {
  if (modoAtual === "america-sul") {
    globe.pointOfView({ lat: -20, lng: -58, altitude: 1.55 }, 0);
  } else {
    globe.pointOfView({ lat: 10, lng: -30, altitude: 2.1 }, 0);
  }
}

async function loadGeoJson(path: string): Promise<GeoJsonFeature[]> {
  const cached = geoJsonCache.get(path);
  if (cached) return cached;

  const res = await fetch(path);
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
  const globeInstanceRef = useRef<any>(null);
  const onCountryClickRef = useRef<Props["onCountryClick"]>(onCountryClick);
  const resizeFrameRef = useRef<number | null>(null);

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
          altitude: 0.06,
        });
        return;
      }

      if (correctSet.has(nome)) {
        map.set(nome, {
          capColor: correctCapColor,
          sideColor: correctSideColor,
          altitude: 0.038,
        });
        return;
      }

      if (flashingSet.has(nome)) {
        map.set(nome, {
          capColor: flashWrongCapColor,
          sideColor: flashWrongSideColor,
          altitude: 0.038,
        });
      }
    });

    return map;
  }, [correctSet, flashingSet, celebratingSet]);

  function getVisualState(feature: GeoJsonFeature): CountryVisualState {
    const nome = getCountryName(feature);
    return visualStateByName.get(nome) || getNaturalStyle(nome);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    const getContainerSize = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
    });

    const { width, height } = getContainerSize();

    const globe = new Globe(container)
      .width(width)
      .height(height)
      .globeImageUrl("/textures/earth-blue-marble-min.jpg")
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
        const nome = getCountryName(polygon as GeoJsonFeature);
        if (!nome) return;
        onCountryClickRef.current?.(nome);
      });

    globeInstanceRef.current = globe;

    const renderer = globe.renderer?.();
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
    }

    const geoJsonPath =
      modo === "america-sul"
        ? "/dados/america-sul-simplified.geojson"
        : "/dados/countries.geojson";

    loadGeoJson(geoJsonPath)
      .then((features) => {
        if (destroyed) return;

        globe.polygonsData(features);
        aplicarVistaInicial(globe, modo);

        const controls = globe.controls?.();
        if (controls) {
          controls.enableZoom = true;
          controls.enablePan = false;
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controls.rotateSpeed = 0.7;
          controls.zoomSpeed = 0.8;
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0.55;
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar GeoJSON:", error);
      });

    const resizeObserver = new ResizeObserver(() => {
      if (destroyed || !globeInstanceRef.current) return;

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        const { width, height } = getContainerSize();
        globeInstanceRef.current.width(width).height(height);
      });
    });

    resizeObserver.observe(container);

    return () => {
      destroyed = true;
      resizeObserver.disconnect();

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      globeInstanceRef.current = null;
      container.innerHTML = "";
    };
  }, [modo]);

  useEffect(() => {
    const globe = globeInstanceRef.current;
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
  }, [visualStateByName]);

  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (!controls) return;

    if (finalizado) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.65;

      if (modo === "america-sul") {
        globe.pointOfView({ lat: -20, lng: -58, altitude: 1.18 }, 1200);
      } else {
        globe.pointOfView({ lat: 10, lng: -30, altitude: 1.75 }, 1200);
      }
    } else {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.55;
    }
  }, [finalizado, modo]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden"
    />
  );
}