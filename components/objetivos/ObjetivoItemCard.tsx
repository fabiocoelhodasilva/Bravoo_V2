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
    valor === 0 ? "0%" : valor >= 100 ? "Concluído ✅" : `${valor}%`;

  return (
    <article className="rounded-[18px] border border-white/10 bg-black/25 px-4 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[0.95rem] leading-[1.25] text-white break-words">
            {objetivo.titulo || "Sem título"}
          </div>
        </div>

        <div
          className="shrink-0 text-[0.82rem] font-black px-2.5 py-1 rounded-full border"
          style={{
            color: corCategoria,
            borderColor: `${corCategoria}55`,
            background: `${corCategoria}12`,
          }}
        >
          {label}
        </div>
      </div>

      <div className="mb-3">
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
          className="w-full cursor-pointer"
          style={{ accentColor: corCategoria }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 min-h-[24px]">
        <div className="text-[0.75rem] text-white/50 font-medium">
          {isSaving ? "Salvando..." : ""}
        </div>

        <button
          type="button"
          onClick={() => onDelete(objetivo.id)}
          disabled={isDeleting}
          className="bg-transparent rounded-full px-2.5 py-1.5 cursor-pointer text-[0.75rem] font-bold border text-[#ff8f8f] transition-opacity disabled:opacity-60"
          style={{ borderColor: "rgba(201,74,74,0.45)" }}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </article>
  );
}