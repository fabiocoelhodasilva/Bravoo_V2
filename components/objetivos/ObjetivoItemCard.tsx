"use client";

import { useEffect, useRef, useState } from "react";
import type { Objetivo } from "@/types/objetivos";
import { clampProgress } from "@/lib/objetivos/objetivos-utils";

type Props = {
  objetivo: Objetivo;
  corCategoria: string;
  isSaving: boolean;
  isDeleting: boolean;
  onSaveProgress: (objetivoId: string, progresso: number) => Promise<void>;
  onDelete: (objetivoId: string) => Promise<void>;
};

export function ObjetivoItemCard({
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
    <article className="border-b border-white/8 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 truncate text-[0.74rem] font-medium leading-none text-white">
          {objetivo.titulo || "Sem título"}
        </div>

        <button
          type="button"
          onClick={() => onDelete(objetivo.id)}
          disabled={isDeleting}
          aria-label="Excluir objetivo"
          title="Excluir objetivo"
          className="shrink-0 h-6 w-6 flex items-center justify-center text-[0.8rem] leading-none text-white/45 hover:text-[#ff8f8f] disabled:opacity-60"
        >
          {isDeleting ? "…" : "🗑️"}
        </button>
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
          className="w-[58%] cursor-pointer"
          style={{ accentColor: corCategoria }}
        />

        <div
          className="text-[0.62rem] font-semibold leading-none"
          style={{ color: corCategoria }}
        >
          {label}
        </div>

        <div className="text-[0.6rem] leading-none text-white/35 min-w-[44px]">
          {isSaving ? "Salvando" : ""}
        </div>
      </div>
    </article>
  );
}