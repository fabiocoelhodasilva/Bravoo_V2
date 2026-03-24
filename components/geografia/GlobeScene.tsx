"use client";

import { useEffect, useRef } from "react";
import Globe from "globe.gl";

type GeoJsonFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
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

const PAISES_AMERICA_SUL = [
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
  "France",
];

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

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
  }, [onCountryClick]);

  const getCountryName = (feature: GeoJsonFeature) =>
    feature.properties?.name || feature.properties?.ADMIN || "";

  function getCountrySeed(nome: string) {
    let total = 0;

    for (let i = 0; i < nome.length; i += 1) {
      total += nome.charCodeAt(i);
    }

    return total % 5;
  }

  function getNaturalCapColor(nome: string) {
    const seed = getCountrySeed(nome);

    const capPalette = [
      "rgba(255, 255, 255, 0.07)",
      "rgba(191, 219, 254, 0.08)",
      "rgba(186, 230, 253, 0.075)",
      "rgba(224, 242, 254, 0.07)",
      "rgba(255, 255, 255, 0.06)",
    ];

    return capPalette[seed];
  }

  function getNaturalSideColor(nome: string) {
    const seed = getCountrySeed(nome);

    const sidePalette = [
      "rgba(255, 255, 255, 0.025)",
      "rgba(191, 219, 254, 0.03)",
      "rgba(186, 230, 253, 0.028)",
      "rgba(224, 242, 254, 0.024)",
      "rgba(255, 255, 255, 0.02)",
    ];

    return sidePalette[seed];
  }

  const correctCapColor = "rgba(147, 197, 253, 0.20)";
  const correctSideColor = "rgba(96, 165, 250, 0.10)";

  const celebrateCapColor = "rgba(191, 219, 254, 0.38)";
  const celebrateSideColor = "rgba(147, 197, 253, 0.20)";

  const flashWrongCapColor = "rgba(248, 113, 113, 0.75)";
  const flashWrongSideColor = "rgba(248, 113, 113, 0.22)";

  function getCapColor(feature: GeoJsonFeature) {
    const nome = getCountryName(feature);

    if (celebratingCountries.includes(nome)) return celebrateCapColor;
    if (correctCountries.includes(nome)) return correctCapColor;
    if (flashingCountries.includes(nome)) return flashWrongCapColor;

    return getNaturalCapColor(nome);
  }

  function getSideColor(feature: GeoJsonFeature) {
    const nome = getCountryName(feature);

    if (celebratingCountries.includes(nome)) return celebrateSideColor;
    if (correctCountries.includes(nome)) return correctSideColor;
    if (flashingCountries.includes(nome)) return flashWrongSideColor;

    return getNaturalSideColor(nome);
  }

  function getAltitude(feature: GeoJsonFeature) {
    const nome = getCountryName(feature);

    if (celebratingCountries.includes(nome)) return 0.065;
    if (correctCountries.includes(nome)) return 0.04;
    if (flashingCountries.includes(nome)) return 0.04;

    return 0.025;
  }

  function aplicarVistaInicial(globe: any) {
    if (modo === "america-sul") {
      globe.pointOfView({ lat: -20, lng: -58, altitude: 1.55 }, 0);
    } else {
      globe.pointOfView({ lat: 10, lng: -30, altitude: 2.1 }, 0);
    }
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
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .polygonAltitude((feature: object) => getAltitude(feature as GeoJsonFeature))
      .polygonCapColor((feature: object) => getCapColor(feature as GeoJsonFeature))
      .polygonSideColor((feature: object) => getSideColor(feature as GeoJsonFeature))
      .polygonStrokeColor(() => "rgba(255,255,255,0.18)")
      .polygonsTransitionDuration(180)
      .onPolygonClick((polygon: object) => {
        const nome = getCountryName(polygon as GeoJsonFeature);
        if (!nome) return;
        onCountryClickRef.current?.(nome);
      });

    globeInstanceRef.current = globe;

    fetch("/dados/countries.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro ao buscar GeoJSON: ${res.status}`);
        }
        return res.json();
      })
      .then((data: GeoJsonData) => {
        if (destroyed) return;

        let features = data.features ?? [];

        if (modo === "america-sul") {
          features = features.filter((feature) =>
            PAISES_AMERICA_SUL.includes(getCountryName(feature))
          );
        }

        globe.polygonsData(features);
        aplicarVistaInicial(globe);

        const controls = globe.controls?.();
        if (controls) {
          controls.enableZoom = true;
          controls.enablePan = false;
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0.6;
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar countries.geojson:", error);
      });

    const resizeObserver = new ResizeObserver(() => {
      if (destroyed || !globeInstanceRef.current) return;

      const { width, height } = getContainerSize();
      globeInstanceRef.current.width(width).height(height);
    });

    resizeObserver.observe(container);

    return () => {
      destroyed = true;
      resizeObserver.disconnect();
      globeInstanceRef.current = null;
      container.innerHTML = "";
    };
  }, [modo]);

  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    globe
      .polygonCapColor((feature: object) => getCapColor(feature as GeoJsonFeature))
      .polygonSideColor((feature: object) => getSideColor(feature as GeoJsonFeature))
      .polygonAltitude((feature: object) => getAltitude(feature as GeoJsonFeature))
      .polygonsTransitionDuration(180);
  }, [correctCountries, flashingCountries, celebratingCountries]);

  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    const controls = globe.controls?.();
    if (!controls) return;

    if (finalizado) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.7;

      if (modo === "america-sul") {
        globe.pointOfView({ lat: -20, lng: -58, altitude: 1.18 }, 1200);
      } else {
        globe.pointOfView({ lat: 10, lng: -30, altitude: 1.75 }, 1200);
      }
    } else {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.6;
      aplicarVistaInicial(globe);
    }
  }, [finalizado, modo]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden"
    />
  );
}