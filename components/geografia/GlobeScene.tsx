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
  "France", // necessário para a Guiana Francesa aparecer em alguns GeoJSONs
];

export default function GlobeScene({
  modo = "mundo",
  onCountryClick,
}: Props) {
  const globeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const container = globeRef.current;
    container.innerHTML = "";

    let destroyed = false;

    const getCountryName = (feature: GeoJsonFeature) =>
      feature.properties?.name || feature.properties?.ADMIN || "";

    const getContainerSize = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
    });

    const { width, height } = getContainerSize();

    const globe = new Globe(container)
      .width(width)
      .height(height)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .polygonAltitude(0.06)
      .polygonCapColor(() => "rgba(93, 198, 161, 0.95)")
      .polygonSideColor(() => "rgba(93, 198, 161, 0.35)")
      .polygonStrokeColor(() => "rgba(255,255,255,0.7)")
      .polygonsTransitionDuration(0)
      .onPolygonClick((polygon: GeoJsonFeature) => {
        const nome = getCountryName(polygon);

        if (!nome) return;

        if (onCountryClick) {
          onCountryClick(nome);
        }
      });

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

          globe.pointOfView({ lat: -20, lng: -58, altitude: 1.55 }, 0);
        } else {
          globe.pointOfView({ lat: 10, lng: -30, altitude: 2.1 }, 0);
        }

        globe.polygonsData(features);
      })
      .catch((error) => {
        console.error("Erro ao carregar countries.geojson:", error);
      });

    const resizeObserver = new ResizeObserver(() => {
      if (destroyed) return;

      const { width, height } = getContainerSize();
      globe.width(width).height(height);
    });

    resizeObserver.observe(container);

    return () => {
      destroyed = true;
      resizeObserver.disconnect();
      container.innerHTML = "";
    };
  }, [modo, onCountryClick]);

  return (
    <div
      ref={globeRef}
      className="w-full h-full bg-black rounded-2xl overflow-hidden"
    />
  );
}