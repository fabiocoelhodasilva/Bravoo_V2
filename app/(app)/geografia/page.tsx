"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GeografiaMenu from "@/components/geografia/GeografiaMenu";

const ROTAS_JOGOS_GEOGRAFIA = [
  "/geografia/america-do-sul/paises",
  "/geografia/america-central/paises",
  "/geografia/america-do-norte/paises",
  "/geografia/europa",
  "/geografia/brasil",
];

const RECURSOS_MAPA_GEOGRAFIA = [
  "/textures/earth-blue-marble.jpg",
  "/dados/america-sul-simplified.geojson",
  "/dados/america-central-simplified.geojson",
  "/dados/america-norte-simplified.geojson",
  "/dados/europa-simplified.geojson",
  "/dados/brasil-estados.json",
];

export default function GeografiaPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    const idleWindow = window as unknown as {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const prepararJogos = () => {
      if (cancelado) return;

      ROTAS_JOGOS_GEOGRAFIA.forEach((rota) => {
        router.prefetch(rota);
      });

      void import("@/components/geografia/GlobeScene");

      void Promise.allSettled(
        RECURSOS_MAPA_GEOGRAFIA.map((recurso) =>
          fetch(recurso, { cache: "force-cache" })
        )
      );
    };

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(prepararJogos, {
        timeout: 1800,
      });

      return () => {
        cancelado = true;
        idleWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = setTimeout(prepararJogos, 500);

    return () => {
      cancelado = true;
      clearTimeout(timeoutId);
    };
  }, [router]);

  return <GeografiaMenu />;
}
