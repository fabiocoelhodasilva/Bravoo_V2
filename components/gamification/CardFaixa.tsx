"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
      onTouchStart={onClick}
      className="
        flex items-center justify-center
        rounded-full
        border border-white/8
        bg-white/[0.04]
        px-3 py-1
        text-[10px]
        font-bold
        uppercase
        tracking-[0.08em]
        text-white/78
        transition
        hover:bg-white/[0.07]
        hover:text-white
      "
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  function alternarAbertura(
    e:
      | ReactMouseEvent<HTMLButtonElement>
      | ReactTouchEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();
    e.preventDefault();
    setAberto((prev) => !prev);
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
      <div
        className={`rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5 ${className}`}
      >
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
  const classificacaoAtualId = classificacaoAtual?.classificacao_id ?? faixaExibida.id;

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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className="
          w-full rounded-[14px]
          border border-white/8
          bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]
          px-3 py-2.5
          text-left
          transition-all
        "
      >
        <div className="text-center">
          <div className="flex items-center justify-between gap-2">
            <div className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              Galeria da Persistência
            </div>

            <div className="shrink-0">
              <BotaoTabelaFaixas onClick={alternarAbertura} />
            </div>
          </div>

          <div className="mt-3 px-1">
            <div className="flex items-center justify-between gap-3 text-[12px] font-semibold">
              <span style={{ color: corFaixa }}>{nomeFaixa}</span>
              <span className="shrink-0 text-white">{montarTextoFaixa()}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`absolute left-1/2 top-full z-50 mt-2 w-[340px] max-w-[92vw] -translate-x-1/2 transition-all ${
          aberto
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <TabelaFaixas
          faixas={faixas}
          classificacaoAtualId={classificacaoAtualId}
        />
      </div>
    </div>
  );
}