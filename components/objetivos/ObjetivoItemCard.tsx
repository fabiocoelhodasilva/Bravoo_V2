"use client";

import { useEffect, useRef, useState } from "react";
import type { Objetivo } from "@/types/objetivos";
import { clampProgress } from "@/lib/objetivos/objetivos.utils";

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
    <article className="bg-black/30 border border-white/10 rounded-[16px] p-[14px] shadow-[0_10px_22px_rgba(0,0,0,0.22)]">
      <div className="mb-[10px] font-extrabold text-[0.95rem]">
        {objetivo.titulo || "Sem título"}
      </div>

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

      <div className="mt-2 text-[0.82rem] font-black text-white text-center">
        {label}
      </div>

      <div className="mt-3 flex justify-between items-center gap-3">
        <div className="text-[0.78rem] text-white/55">
          {isSaving ? "Salvando..." : ""}
        </div>

        <button
          type="button"
          onClick={() => onDelete(objetivo.id)}
          disabled={isDeleting}
          className="bg-transparent rounded-full px-3 py-[6px] cursor-pointer text-[0.78rem] font-extrabold border text-[#ff7c7c]"
          style={{ borderColor: "rgba(201,74,74,0.75)" }}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </article>
  );
}