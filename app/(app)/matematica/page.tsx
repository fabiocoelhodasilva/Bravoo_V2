"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MatematicaMenu from "@/components/matematica/MatematicaMenu";

/* =========================================================
   Constantes
========================================================= */

const ROTAS_JOGOS_MATEMATICA = ["/matematica/multiplicacao"];

/* =========================================================
   Componente principal
========================================================= */

export default function MatematicaPage() {
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

      ROTAS_JOGOS_MATEMATICA.forEach((rota) => {
        router.prefetch(rota);
      });
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

  return <MatematicaMenu />;
}