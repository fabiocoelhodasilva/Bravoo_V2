"use client";

import { useMemo, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import type {
  ClassificacaoAtualMateriaView,
  FaixaGamificacao,
} from "@/lib/gamificacao/gamificacao-types";
import TabelaFaixas from "@/components/gamification/TabelaFaixas";

type CardFaixaProps = {
  classificacaoAtual: ClassificacaoAtualMateriaView | null;
  faixas: FaixaGamificacao[];
  className?: string;
};

type BotaoTabelaFaixasProps = {
  onClick: (
    e:
      | ReactMouseEvent<HTMLButtonElement>
      | ReactTouchEvent<HTMLButtonElement>
  ) => void;
};

function BotaoTabelaFaixas({ onClick }: BotaoTabelaFaixasProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/78 transition hover:bg-white/[0.07] hover:text-white"
    >
      Faixas
    </button>
  );
}

export default function CardFaixa({
  classificacaoAtual,
  faixas,
  className = "",
}: CardFaixaProps) {
  const [aberto, setAberto] = useState(false);

  function abrir() {
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  const faixaInicial = useMemo(() => {
    if (!faixas.length) return null;
    return [...faixas].sort((a, b) => a.ordem - b.ordem)[0];
  }, [faixas]);

  const faixaExibida = useMemo(() => {
    if (classificacaoAtual) {
      return {
        id: classificacaoAtual.classificacao_id,
        nome: classificacaoAtual.classificacao_nome,
        cor: classificacaoAtual.classificacao_cor ?? "#FFFFFF",
        diasMinimos: classificacaoAtual.classificacao_dias_minimos,
        diasMaximos: classificacaoAtual.classificacao_dias_maximos,
      };
    }

    if (faixaInicial) {
      return {
        id: faixaInicial.id,
        nome: faixaInicial.nome,
        cor: faixaInicial.cor ?? "#FFFFFF",
        diasMinimos: faixaInicial.diasMinimos,
        diasMaximos: faixaInicial.diasMaximos,
      };
    }

    return null;
  }, [classificacaoAtual, faixaInicial]);

  if (!faixaExibida) {
    return (
      <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div className="text-center text-[12px] font-medium text-white/70">
          Faixas indisponíveis
        </div>
      </div>
    );
  }

  const nomeFaixa = faixaExibida.nome;
  const diasMinimos = faixaExibida.diasMinimos;
  const diasMaximos = faixaExibida.diasMaximos;
  const corFaixa = faixaExibida.cor;
  const classificacaoAtualId =
    classificacaoAtual?.classificacao_id ?? faixaExibida.id;

  function montarTextoFaixa() {
    if (diasMaximos === null) {
      return diasMinimos === 0
        ? "a partir de 0 dias seguidos"
        : `a partir de ${diasMinimos} dias seguidos`;
    }

    if (diasMinimos === 0) {
      return `até ${diasMaximos} dias seguidos`;
    }

    return `${diasMinimos} a ${diasMaximos} dias seguidos`;
  }

  return (
    <>
      {/* CARD */}
      <div className={`relative ${className}`}>
        <div className="w-full rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              Galeria da Persistência
            </div>

            <BotaoTabelaFaixas onClick={abrir} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-[12px] font-semibold">
            <span style={{ color: corFaixa }}>{nomeFaixa}</span>
            <span className="text-white">{montarTextoFaixa()}</span>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {aberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4">
          <div className="relative w-full max-w-sm">
            {/* BOTÃO X */}
            <button
              onClick={fechar}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black border border-white/20 text-white text-lg"
            >
              ✕
            </button>

            <TabelaFaixas
              faixas={faixas}
              classificacaoAtualId={classificacaoAtualId}
            />
          </div>
        </div>
      )}
    </>
  );
}