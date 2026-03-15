"use client";

import type { RankingCategoria } from "@/types/objetivos";

type Props = {
  media: number;
  concluidos: number;
  total: number;
  ranking: RankingCategoria[];
};

export function ObjetivosResumo({ media, concluidos, total, ranking }: Props) {
  const percentualConcluidos = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <section className="bg-[#0d0d0d] border border-white/10 rounded-[20px] p-[18px] shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
        <div className="text-[0.95rem] font-bold text-[#d5d5d5] mb-3">
          Progresso Médio
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 items-stretch">
          <div className="min-h-[180px] rounded-[16px] border border-white/10 bg-white/[0.02] p-[14px]">
            <div className="text-[#bdbdbd] text-[0.9rem] font-semibold">
              Média geral dos objetivos
            </div>

            <div className="mt-[10px] flex flex-col gap-[6px]">
              {ranking.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center gap-[10px] text-[0.9rem] font-semibold"
                  style={{ color: item.cor }}
                >
                  <span className="truncate">{item.nome}</span>
                  <span className="font-extrabold whitespace-nowrap">
                    {item.media}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[180px] rounded-[16px] border border-white/10 bg-white/[0.02] p-[14px] flex flex-col">
            <div className="text-[0.95rem] font-bold text-[#d5d5d5]">Média</div>

            <div className="flex-1 w-full flex items-center justify-center text-[5rem] leading-none font-black text-[var(--color-2)] tracking-[-3px]">
              {media}%
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0d] border border-white/10 rounded-[20px] p-[18px] shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
        <div className="text-[0.95rem] font-bold text-[#d5d5d5] mb-3">
          Objetivos Concluídos
        </div>

        <div className="text-[2.4rem] leading-none font-black tracking-[-1px] mb-2 text-[var(--color-4)]">
          {concluidos} / {total}
        </div>

        <div className="text-[#bdbdbd] text-[0.9rem] font-semibold">
          {percentualConcluidos}% concluídos
        </div>
      </section>
    </div>
  );
}