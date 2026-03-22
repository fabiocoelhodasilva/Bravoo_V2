"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Objetivo } from "@/types/objetivos";
import {
  agruparObjetivosPorCategoria,
  calcularMetricas,
  calcularRankingCategorias,
  getObjetivosPageCssVars,
} from "@/lib/objetivos/objetivos-utils";
import { ObjetivosResumo } from "./ObjetivosResumo";
import { ObjetivosCategoriaCard } from "./ObjetivosCategoriaCard";
import BottomNav from "../ui/BottomNav";

type Props = {
  objetivos: Objetivo[];
  loadingMessage?: string;
  savingIds: string[];
  deletingIds: string[];
  onLogout: () => Promise<void>;
  onSaveProgress: (objetivoId: string, progresso: number) => Promise<void>;
  onDelete: (objetivoId: string) => Promise<void>;
};

export function ObjetivosPageView({
  objetivos,
  loadingMessage,
  savingIds,
  deletingIds,
  onLogout,
  onSaveProgress,
  onDelete,
}: Props) {
  const [expandirTudo, setExpandirTudo] = useState(false);

  const metricas = useMemo(() => calcularMetricas(objetivos), [objetivos]);
  const ranking = useMemo(
    () => calcularRankingCategorias(objetivos),
    [objetivos]
  );
  const grupos = useMemo(
    () => agruparObjetivosPorCategoria(objetivos),
    [objetivos]
  );

  return (
    <main
      className="min-h-screen bg-black text-white flex flex-col"
      style={getObjetivosPageCssVars()}
    >
      <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-5 h-[48px] flex items-center justify-between bg-[#050505]/95 backdrop-blur border-b border-white/5">
        <div className="gradient-text text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90">
          Bravoo
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-[var(--color-2)] text-[0.8rem] font-semibold"
        >
          Logout
        </button>
      </header>

      <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 pt-[60px] pb-[90px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.2rem] sm:text-[1.5rem] font-semibold tracking-[-0.2px] text-[#f8f8f8]">
            Objetivos em {new Date().getFullYear()}
          </h2>

          <Link
            href="/objetivos/novo"
            aria-label="Criar novo objetivo"
            title="Criar novo objetivo"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--color-2)] text-[1.3rem] font-bold text-black shadow-md transition active:scale-[0.95]"
          >
            +
          </Link>
        </div>

        {objetivos.length > 0 && (
          <div className="mb-3">
            <ObjetivosResumo
              media={metricas.media}
              concluidos={metricas.concluidos}
              total={metricas.total}
              ranking={ranking}
            />
          </div>
        )}

        {loadingMessage && (
          <div className="mb-3 text-[0.8rem] text-[#aaa]">
            {loadingMessage}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {grupos.map((grupo, index) => (
            <ObjetivosCategoriaCard
              key={grupo.key}
              grupo={grupo}
              savingIds={savingIds}
              deletingIds={deletingIds}
              onSaveProgress={onSaveProgress}
              onDelete={onDelete}
              defaultOpen={index === 0}
              expandirTudo={expandirTudo}
            />
          ))}
        </div>

        {grupos.length > 1 && (
          <button
            type="button"
            onClick={() => setExpandirTudo((prev) => !prev)}
            className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[0.95rem] font-semibold text-[#e7e0cf] shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
          >
            {expandirTudo ? "Recolher tudo" : "Expandir tudo"}
          </button>
        )}

        <Link
          href="/aluno"
          className="mx-auto mt-8 block text-center text-[0.9rem] font-semibold text-[var(--color-2)]"
        >
          ← Voltar
        </Link>
      </div>

      <BottomNav active="objetivos" />
    </main>
  );
}