"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { Objetivo } from "@/types/objetivos";
import { clampProgress } from "@/lib/objetivos/objetivos-utils";
import DeleteButton from "@/components/ui/DeleteButton";

type Props = {
  objetivo: Objetivo;
  corCategoria: string;
  isSaving: boolean;
  isDeleting: boolean;
  onSaveProgress: (objetivoId: string, progresso: number) => Promise<void>;
  onDelete: (objetivoId: string) => Promise<void>;
};

function ObjetivoItemCardComponent({
  objetivo,
  corCategoria,
  isSaving,
  isDeleting,
  onSaveProgress,
  onDelete,
}: Props) {
  const initialValue = clampProgress(objetivo.progresso_percentual);
  const [valor, setValor] = useState(initialValue);
  const valorRef = useRef(initialValue);
  const salvandoRef = useRef(false);

  useEffect(() => {
    const next = clampProgress(objetivo.progresso_percentual);
    setValor(next);
    valorRef.current = next;
  }, [objetivo.progresso_percentual]);

  function handleChange(nextValue: number) {
    const safeValue = clampProgress(nextValue);
    setValor(safeValue);
    valorRef.current = safeValue;
  }

  async function handleCommit() {
    if (salvandoRef.current || isDeleting) return;

    salvandoRef.current = true;

    try {
      await onSaveProgress(objetivo.id, valorRef.current);
    } finally {
      salvandoRef.current = false;
    }
  }

  const label = valor >= 100 ? "100% ✓" : `${valor}%`;

  return (
    <article className="w-full border-b border-white/8 py-1.5">
      <style jsx>{`
        .objetivo-range {
          --range-color: ${corCategoria};
          --range-value: ${valor}%;
          appearance: none;
          -webkit-appearance: none;
          height: 24px;
          background: transparent;
          outline: none;
          touch-action: pan-y;
        }

        .objetivo-range::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--range-color) 0%,
            var(--range-color) var(--range-value),
            rgba(255, 255, 255, 0.16) var(--range-value),
            rgba(255, 255, 255, 0.16) 100%
          );
        }

        .objetivo-range::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          margin-top: -6px;
          border-radius: 999px;
          border: 3px solid #111;
          background: var(--range-color);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18),
            0 0 12px color-mix(in srgb, var(--range-color) 65%, transparent);
        }

        .objetivo-range::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
        }

        .objetivo-range::-moz-range-progress {
          height: 8px;
          border-radius: 999px;
          background: var(--range-color);
        }

        .objetivo-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 3px solid #111;
          background: var(--range-color);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18);
        }

        .objetivo-range:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }
      `}</style>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 truncate text-[0.74rem] font-medium leading-none text-white">
          {objetivo.titulo || "Sem título"}
        </div>

        <DeleteButton
          onClick={() => onDelete(objetivo.id)}
          disabled={isDeleting}
          ariaLabel={`Excluir objetivo ${objetivo.titulo || ""}`.trim()}
          title="Excluir objetivo"
          className="mt-0 h-6 w-6 border-0 bg-transparent p-0 text-white/45 hover:bg-transparent hover:text-[#ff8f8f]"
        />
      </div>

      <div className="mt-0.5 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={valor}
          onChange={(e) => handleChange(Number(e.target.value))}
          onPointerUp={() => void handleCommit()}
          onKeyUp={(e) => {
            if (
              e.key === "ArrowLeft" ||
              e.key === "ArrowRight" ||
              e.key === "Home" ||
              e.key === "End"
            ) {
              void handleCommit();
            }
          }}
          disabled={isDeleting}
          className="objetivo-range min-w-0 flex-1 cursor-pointer"
          aria-label={`Progresso do objetivo ${objetivo.titulo || "sem título"}`}
        />

        <div
          className="shrink-0 text-[0.62rem] font-semibold leading-none"
          style={{ color: corCategoria }}
        >
          {label}
        </div>

        <div className="min-w-[44px] shrink-0 text-[0.6rem] leading-none text-white/35">
          {isSaving ? "Salvando" : ""}
        </div>
      </div>
    </article>
  );
}

export const ObjetivoItemCard = memo(
  ObjetivoItemCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.objetivo.id === nextProps.objetivo.id &&
      prevProps.objetivo.titulo === nextProps.objetivo.titulo &&
      prevProps.objetivo.progresso_percentual ===
        nextProps.objetivo.progresso_percentual &&
      prevProps.corCategoria === nextProps.corCategoria &&
      prevProps.isSaving === nextProps.isSaving &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.onSaveProgress === nextProps.onSaveProgress &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);

ObjetivoItemCard.displayName = "ObjetivoItemCard";
