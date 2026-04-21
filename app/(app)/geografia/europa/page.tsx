"use client";

import { useMemo, useState } from "react";
import GeografiaPaisesPage from "@/components/geografia/GeografiaPaisesPage";
import BarraFasesEuropa from "@/components/geografia/BarraFasesEuropa";
import { REGIOES_CONFIG } from "@/lib/geografia/regioes-config";

const FASES_EUROPA = [
  { id: "europa-fase-1", label: "Fase 1", status: "concluida" as const },
  { id: "europa-fase-2", label: "Fase 2", status: "concluida" as const },
  { id: "europa-fase-3", label: "Fase 3", status: "ativa" as const },
  { id: "europa-fase-4", label: "Fase 4", status: "concluida" as const },
  { id: "europa-fase-5", label: "Fase 5", status: "concluida" as const },
  { id: "europa-fase-6", label: "Fase 6", status: "concluida" as const },
];

export default function EuropaPage() {
  const [faseAtualId, setFaseAtualId] = useState("europa-fase-1");

  const configAtual = useMemo(() => {
    return REGIOES_CONFIG[faseAtualId];
  }, [faseAtualId]);

  const fasesComEstado = useMemo(() => {
    return FASES_EUROPA.map((fase) => ({
      ...fase,
      status:
        fase.id === faseAtualId
          ? ("ativa" as const)
          : ("concluida" as const),
    }));
  }, [faseAtualId]);

  function handleSelecionarFase(id: string) {
    const fase = FASES_EUROPA.find((item) => item.id === id);
    if (!fase) return;
    setFaseAtualId(id);
  }

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <div className="pb-[96px]">
        <GeografiaPaisesPage config={configAtual} />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/92 backdrop-blur-sm border-t border-white/10 px-4 py-2 md:px-6">
        <BarraFasesEuropa
          fases={fasesComEstado}
          onSelecionarFase={handleSelecionarFase}
        />
      </footer>
    </div>
  );
}