"use client";

import type { ReactNode } from "react";
import type {
  ClassificacaoAtualMateriaView,
  FaixaGamificacao,
} from "@/lib/gamificacao/gamificacao-types";
import CardFaixa from "@/components/gamification/CardFaixa";
import RegrasGamificacao from "@/components/gamification/RegrasGamificacao";

type GamificationBarProps = {
  classificacaoAtual: ClassificacaoAtualMateriaView | null;
  faixas: FaixaGamificacao[];
  escudosDisponiveis: number;
  moedas: number;
  diasSeguidos: number;
  className?: string;
};

type ItemResumoProps = {
  icone: ReactNode;
  valor: number;
};

function IconeMoeda() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#e9891d" />
      <circle cx="12" cy="12" r="6" fill="#f1a94c" />
    </svg>
  );
}

function ItemResumo({ icone, valor }: ItemResumoProps) {
  return (
    <div className="flex h-[34px] min-w-[64px] items-center justify-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
      <span className="flex items-center justify-center leading-none">
        {icone}
      </span>
      <span className="text-[12px] font-bold text-white">{valor}</span>
    </div>
  );
}

// Skeleton adicionado para evitar layout shift durante carregamento.
// ANTES: GeografiaMenu não renderizava nada enquanto carregava (sumia o espaço).
// PARA REVERTER: remover este componente e o import dele em GeografiaMenu.
export function GamificationBarSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mb-4 w-full max-w-sm rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.96),rgba(10,10,10,0.96))] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${className}`}
    >
      {/* linha do CardFaixa */}
      <div className="w-full rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-2.5 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-6 w-12 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* linha de escudo / moeda / dias */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[34px] w-[64px] animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
        <div className="h-[34px] w-[34px] animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export default function GamificationBar({
  classificacaoAtual,
  faixas,
  escudosDisponiveis,
  moedas,
  diasSeguidos,
  className = "",
}: GamificationBarProps) {
  return (
    <div
      className={`relative mb-4 w-full max-w-sm rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,24,0.96),rgba(10,10,10,0.96))] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${className}`}
    >
      <CardFaixa classificacaoAtual={classificacaoAtual} faixas={faixas} />

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ItemResumo
            icone={<span className="text-[14px] text-white">🛡️</span>}
            valor={escudosDisponiveis}
          />

          <ItemResumo icone={<IconeMoeda />} valor={moedas} />

          <ItemResumo
            icone={<span className="text-[14px] text-white">🔥</span>}
            valor={diasSeguidos}
          />
        </div>

        <div className="shrink-0">
          <RegrasGamificacao />
        </div>
      </div>
    </div>
  );
}