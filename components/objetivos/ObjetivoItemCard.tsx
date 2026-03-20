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

  const label =
    valor === 0 ? "0%" : valor >= 100 ? "100% ✓" : `${valor}%`;

  return (
    <article className="border-b border-white/10 py-2">
      {/* LINHA PRINCIPAL */}
      <div className="flex items-center gap-2">
        {/* TÍTULO */}
        <div className="flex-1 min-w-0 text-[0.78rem] font-medium text-white truncate">
          {objetivo.titulo || "Sem título"}
        </div>

        {/* % */}
        <div
          className="text-[0.7rem] font-bold px-2 py-[2px] rounded-full"
          style={{
            color: corCategoria,
            background: `${corCategoria}12`,
          }}
        >
          {label}
        </div>

        {/* LIXEIRA */}
        <button
          type="button"
          onClick={() => onDelete(objetivo.id)}
          disabled={isDeleting}
          className="text-[0.9rem] text-white/50 hover:text-[#ff8f8f]"
        >
          {isDeleting ? "…" : "🗑️"}
        </button>
      </div>

      {/* SLIDER */}
      <div className="mt-1">
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
          className="w-[70%] cursor-pointer"
          style={{ accentColor: corCategoria }}
        />
      </div>

      {/* STATUS */}
      <div className="text-[0.65rem] text-white/40 h-[10px]">
        {isSaving ? "Salvando..." : ""}
      </div>
    </article>
  );
}