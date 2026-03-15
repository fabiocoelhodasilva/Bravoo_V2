"use client";

import type { ObjetivosGrupo } from "@/types/objetivos";
import { ObjetivoItemCard } from "./ObjetivoItemCard";

type Props = {
  grupo: ObjetivosGrupo;
  savingIds: string[];
  deletingIds: string[];
  onSaveProgress: (objetivoId: string, progresso: number) => Promise<void>;
  onDelete: (objetivoId: string) => Promise<void>;
};

export function ObjetivosCategoriaCard({
  grupo,
  savingIds,
  deletingIds,
  onSaveProgress,
  onDelete,
}: Props) {
  const cor = grupo.categoria.cor;

  return (
    <section
      className="relative rounded-[20px] overflow-hidden border shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{
        borderColor: `${cor}55`,
        backgroundImage: `
          radial-gradient(900px 260px at 0% 0%, ${cor}22, transparent 58%),
          radial-gradient(700px 220px at 100% 100%, ${cor}14, transparent 60%),
          linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))
        `,
        backgroundColor: "#111",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[10px]"
        style={{ background: cor }}
      />

      <div
        className="flex items-start justify-between gap-3 py-[15px] pr-4 pl-[22px] border-b"
        style={{ borderColor: `${cor}40` }}
      >
        <div className="flex items-start gap-[10px] min-w-0 flex-1">
          <span
            className="w-[14px] h-[14px] rounded-full mt-1"
            style={{
              background: cor,
              boxShadow: `0 0 18px ${cor}`,
            }}
          />

          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[1.05rem] truncate mb-2">
              {grupo.categoria.nome}
            </div>

            <div className="flex flex-wrap gap-[8px_12px] items-center">
              <div
                className="text-[1.7rem] leading-none font-black tracking-[-1px]"
                style={{ color: cor }}
              >
                {grupo.metricas.media}%
              </div>

              <div className="text-[#f0f0f0] font-bold text-[0.95rem]">
                concluído
              </div>

              <div className="text-[0.9rem] text-[#d8d8d8] font-bold whitespace-nowrap px-[10px] py-[6px] rounded-full bg-white/5 border border-white/10">
                {grupo.metricas.concluidos} / {grupo.metricas.total} objetivos
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-[14px] pr-4 pb-[18px] pl-[22px]">
        <div className="grid grid-cols-1 md:grid-cols-[420px] gap-3 justify-start">
          {grupo.objetivos.map((objetivo) => (
            <ObjetivoItemCard
              key={objetivo.id}
              objetivo={objetivo}
              corCategoria={cor}
              isSaving={savingIds.includes(objetivo.id)}
              isDeleting={deletingIds.includes(objetivo.id)}
              onSaveProgress={onSaveProgress}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </section>
  );
}