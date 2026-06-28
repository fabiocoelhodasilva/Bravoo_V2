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

  const temObjetivos = objetivos.length > 0;
  const temMaisDeUmGrupo = grupos.length > 1;

  return (
    <main
      className="min-h-screen bg-black text-white flex flex-col"
      style={getObjetivosPageCssVars()}
    >
      <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-5 h-[44px] sm:h-[48px] flex items-center justify-between bg-[#050505]/95 backdrop-blur border-b border-white/5">
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

      <div className="flex-1 w-full max-w-[1100px] mx-auto px-3 pt-[50px] pb-[110px] sm:px-4 sm:pt-[60px] sm:pb-[120px]">
        <div className="mb-2 flex flex-col items-center sm:mb-5">
          <div className="relative w-full">
            <h1 className="mb-2 text-center text-[1.55rem] font-bold leading-tight gradient-text sm:mb-6 sm:text-4xl">
              Meus Objetivos
            </h1>

            <Link
              href="/objetivos/novo"
              aria-label="Criar novo objetivo"
              title="Criar novo objetivo"
              className="absolute right-0 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 sm:h-[38px] sm:w-[38px] items-center justify-center rounded-full bg-[var(--color-2)] text-[1.3rem] font-bold text-black shadow-md transition active:scale-[0.95]"
            >
              +
            </Link>
          </div>
        </div>

        {loadingMessage && (
          <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[0.85rem] text-[#b9b9b9]">
            {loadingMessage}
          </div>
        )}

        {temObjetivos && (
          <div className="objetivos-resumo-mobile mb-3">
            <ObjetivosResumo
              media={metricas.media}
              concluidos={metricas.concluidos}
              total={metricas.total}
              ranking={ranking}
            />
          </div>
        )}

        {!loadingMessage && !temObjetivos && (
          <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] sm:mt-6 sm:rounded-[22px] sm:px-5 sm:py-6">
            <h3 className="text-[0.95rem] font-semibold text-[#f5f5f5] sm:text-[1.05rem]">
              Você ainda não criou objetivos
            </h3>

            <p className="mt-2 text-[0.82rem] leading-5 text-[#b7b7b7] sm:text-[0.9rem] sm:leading-6">
              Comece criando seu primeiro objetivo para acompanhar seu progresso
              ao longo do ano.
            </p>

            <Link
              href="/objetivos/novo"
              className="mx-auto mt-4 inline-flex items-center justify-center rounded-full bg-[var(--color-2)] px-4 py-2.5 text-[0.84rem] font-semibold text-black shadow-md transition active:scale-[0.98] sm:mt-5 sm:px-5 sm:py-3 sm:text-[0.92rem]"
            >
              Criar primeiro objetivo
            </Link>
          </div>
        )}

        {temObjetivos && (
          <>
            <div className="objetivos-cards-mobile flex flex-col gap-1 sm:gap-2.5">
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

            {temMaisDeUmGrupo && (
              <button
                type="button"
                onClick={() => setExpandirTudo((prev) => !prev)}
                className="mt-4 w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[0.85rem] font-semibold text-[#e7e0cf] shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition active:scale-[0.99] sm:mt-5 sm:py-3 sm:text-[0.95rem]"
              >
                {expandirTudo ? "Recolher tudo" : "Expandir tudo"}
              </button>
            )}
          </>
        )}
      </div>


      <style jsx global>{`
        @media (max-width: 639px) {
          .objetivos-resumo-mobile {
            margin-bottom: 12px;
          }

          .objetivos-resumo-mobile > * {
            border-radius: 20px !important;
            padding: 8px 12px !important;
          }

          .objetivos-resumo-mobile h1,
          .objetivos-resumo-mobile h2,
          .objetivos-resumo-mobile h3,
          .objetivos-resumo-mobile p,
          .objetivos-resumo-mobile span,
          .objetivos-resumo-mobile div {
            line-height: 1.12 !important;
          }

          .objetivos-resumo-mobile [class*="text-"] {
            font-size: 0.78rem !important;
          }

          .objetivos-resumo-mobile [class*="text-[2"],
          .objetivos-resumo-mobile [class*="text-3"],
          .objetivos-resumo-mobile [class*="text-4"] {
            font-size: 1.35rem !important;
          }

          .objetivos-cards-mobile > * {
            border-radius: 16px !important;
          }

          .objetivos-cards-mobile article,
          .objetivos-cards-mobile section,
          .objetivos-cards-mobile details,
          .objetivos-cards-mobile > div {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          .objetivos-cards-mobile h1,
          .objetivos-cards-mobile h2,
          .objetivos-cards-mobile h3,
          .objetivos-cards-mobile h4 {
            font-size: 0.9rem !important;
            line-height: 1.18 !important;
          }

          .objetivos-cards-mobile p,
          .objetivos-cards-mobile span,
          .objetivos-cards-mobile label {
            font-size: 0.76rem !important;
            line-height: 1.18 !important;
          }

          .objetivos-cards-mobile input,
          .objetivos-cards-mobile button {
            min-height: 30px !important;
            font-size: 0.78rem !important;
          }
        }
      `}</style>

      <BottomNav active="objetivos" />
    </main>
  );
}