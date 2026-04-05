"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { ObjetivosGrupo } from "@/types/objetivos";
import { ObjetivoItemCard } from "./ObjetivoItemCard";

type Props = {
  grupo: ObjetivosGrupo;
  savingIds: string[];
  deletingIds: string[];
  onSaveProgress: (objetivoId: string, progresso: number) => Promise<void>;
  onDelete: (objetivoId: string) => Promise<void>;
  defaultOpen?: boolean;
  expandirTudo?: boolean;
};

function ObjetivosCategoriaCardComponent({
  grupo,
  savingIds,
  deletingIds,
  onSaveProgress,
  onDelete,
  defaultOpen = false,
  expandirTudo = false,
}: Props) {
  const cor = grupo.categoria.cor;
  const [aberto, setAberto] = useState(defaultOpen);

  const savingIdsSet = useMemo(() => new Set(savingIds), [savingIds]);
  const deletingIdsSet = useMemo(() => new Set(deletingIds), [deletingIds]);

  useEffect(() => {
    if (expandirTudo) {
      setAberto(true);
    } else {
      setAberto(defaultOpen);
    }
  }, [expandirTudo, defaultOpen]);

  return (
    <section
      className="rounded-[20px] overflow-hidden border shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{
        borderColor: `${cor}35`,
        backgroundImage: `
          radial-gradient(900px 260px at 0% 0%, ${cor}14, transparent 58%),
          radial-gradient(700px 220px at 100% 100%, ${cor}10, transparent 60%),
          linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))
        `,
        backgroundColor: "#111",
      }}
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
        style={{ borderBottom: aberto ? `1px solid ${cor}30` : "none" }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className="w-[12px] h-[12px] rounded-full shrink-0"
            style={{
              background: cor,
              boxShadow: `0 0 14px ${cor}`,
            }}
          />

          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[1rem] sm:text-[1.05rem] truncate">
              {grupo.categoria.nome}
            </div>

            <div className="mt-1 text-[0.8rem] text-[#bdbdbd] font-medium sm:hidden">
              {grupo.metricas.concluidos}/{grupo.metricas.total} objetivos
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className="text-[1.1rem] sm:text-[1.35rem] leading-none font-black tracking-[-0.5px]"
            style={{ color: cor }}
          >
            {grupo.metricas.media}%
          </div>

          <span
            className={`text-[1rem] transition-transform duration-200 ${
              aberto ? "rotate-180" : ""
            }`}
            style={{ color: cor }}
          >
            ▼
          </span>
        </div>
      </button>

      <div className={`${aberto ? "block" : "hidden"} px-3 pb-3 pt-2`}>
        <div className="hidden sm:flex flex-wrap gap-[8px_12px] items-center mb-4">
          <div className="text-[#f0f0f0] font-bold text-[0.95rem]">
            concluído
          </div>

          <div className="text-[0.9rem] text-[#d8d8d8] font-bold whitespace-nowrap px-[10px] py-[6px] rounded-full bg-white/5 border border-white/10">
            {grupo.metricas.concluidos} / {grupo.metricas.total} objetivos
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {grupo.objetivos.map((objetivo) => (
            <ObjetivoItemCard
              key={objetivo.id}
              objetivo={objetivo}
              corCategoria={cor}
              isSaving={savingIdsSet.has(objetivo.id)}
              isDeleting={deletingIdsSet.has(objetivo.id)}
              onSaveProgress={onSaveProgress}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const ObjetivosCategoriaCard = memo(
  ObjetivosCategoriaCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.grupo === nextProps.grupo &&
      prevProps.savingIds === nextProps.savingIds &&
      prevProps.deletingIds === nextProps.deletingIds &&
      prevProps.onSaveProgress === nextProps.onSaveProgress &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.defaultOpen === nextProps.defaultOpen &&
      prevProps.expandirTudo === nextProps.expandirTudo
    );
  }
);

ObjetivosCategoriaCard.displayName = "ObjetivosCategoriaCard";