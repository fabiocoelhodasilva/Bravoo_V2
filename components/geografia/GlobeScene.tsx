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
];

export default function GlobeScene({ modo = "mundo" }: Props) {
  const globeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const container = globeRef.current;
    container.innerHTML = "";

    const globe = Globe()(container)
      .width(window.innerWidth)
      .height(window.innerHeight - 48)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .polygonAltitude(0.06)
      .polygonCapColor(() => "rgba(93, 198, 161, 0.85)")
      .polygonSideColor(() => "rgba(93, 198, 161, 0.35)")
      .polygonStrokeColor(() => "#000")
      .polygonsTransitionDuration(0);

    fetch("/dados/countries.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro ao buscar GeoJSON: ${res.status}`);
        }
        return res.json();
      })
      .then((data: GeoJsonData) => {
        let features = data.features ?? [];

        if (modo === "america-sul") {
          features = features.filter((feature) => {
            const nome =
              feature.properties?.name ||
              feature.properties?.ADMIN ||
              "";

            return PAISES_AMERICA_SUL.includes(nome);
          });
        }

        globe.polygonsData(features);
      })
      .catch((error) => {
        console.error("Erro ao carregar countries.geojson:", error);
      });

    const handleResize = () => {
      globe.width(window.innerWidth).height(window.innerHeight - 48);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.innerHTML = "";
    };
  }, [modo]);

  return (
    <div
      ref={globeRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
      }}
    />
  );
}