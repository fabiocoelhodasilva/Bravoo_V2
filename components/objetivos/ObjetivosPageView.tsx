"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Objetivo } from "@/types/objetivos";
import {
  agruparObjetivosPorCategoria,
  calcularMetricas,
  calcularRankingCategorias,
  getObjetivosPageCssVars,
} from "@/lib/objetivos/objetivos-utils";
import { ObjetivosResumo } from "./ObjetivosResumo";
import { ObjetivosCategoriaCard } from "./ObjetivosCategoriaCard";

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
      <header className="w-full px-5 py-3 flex justify-between items-center bg-[#050505] border-b border-[#333]">
        <div
          className="text-[1.4rem] font-bold"
          style={{
            background:
              "radial-gradient(circle,#c94a4a,#d8a44b,#3d7a99,#5dc6a1)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Bravoo
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLogout}
            className="text-[var(--color-2)] text-[0.85rem] font-semibold bg-transparent border-none cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1100px] mx-auto mt-5 px-4 pb-10">
        <div className="flex justify-between items-center gap-3 mb-1 flex-wrap">
          <h2 className="m-0 text-[1.6rem] font-semibold">
            Objetivos em {new Date().getFullYear()}
          </h2>

          <Link
            href="/objetivos/novo"
            className="bg-[var(--color-2)] text-black font-extrabold border-none px-[18px] py-[9px] rounded-full no-underline transition hover:scale-[1.03] shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
          >
            + Novo
          </Link>
        </div>

        <p className="text-[0.95rem] text-[#ccc] mb-[18px]">
          Arraste a barra para ajustar o progresso.
        </p>

        <section className="bg-[#111] rounded-[18px] border border-[#333] p-[18px]">
          {objetivos.length > 0 && (
            <ObjetivosResumo
              media={metricas.media}
              concluidos={metricas.concluidos}
              total={metricas.total}
              ranking={ranking}
            />
          )}

          {loadingMessage ? (
            <div className="text-[0.85rem] text-[#aaa] mb-3">
              {loadingMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-[14px]">
            {grupos.map((grupo) => (
              <ObjetivosCategoriaCard
                key={grupo.key}
                grupo={grupo}
                savingIds={savingIds}
                deletingIds={deletingIds}
                onSaveProgress={onSaveProgress}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>

        <Link
          href="/aluno"
          className="block text-center mx-auto mt-[30px] text-[var(--color-2)] no-underline font-semibold"
        >
          ← Voltar
        </Link>
      </div>
    </main>
  );
}