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
    await onSaveProgress(objetivo.id, valorRef.current);
  }

  const label = valor >= 100 ? "100% ✓" : `${valor}%`;

  return (
    <article className="w-full border-b border-white/8 py-1.5">
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
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          disabled={isSaving || isDeleting}
          className="min-w-0 flex-1 cursor-pointer"
          style={{ accentColor: corCategoria }}
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