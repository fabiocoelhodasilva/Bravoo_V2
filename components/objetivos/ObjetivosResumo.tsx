"use client";

import type { RankingCategoria } from "@/types/objetivos";

type Props = {
  media: number;
  concluidos: number;
  total: number;
  ranking: RankingCategoria[];
};

export function ObjetivosResumo({ media, concluidos, total, ranking }: Props) {
  const percentualConcluidos =
    total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 items-stretch">
      {/* CARD PROGRESSO MÉDIO */}
      <section
        className="md:col-span-8 rounded-[22px] p-5 min-h-[220px] flex flex-col"
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
          border: "1px solid rgba(233,137,29,0.35)",
          boxShadow:
            "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        <div className="text-[1.05rem] font-extrabold text-[#f0f0f0] mb-[14px] tracking-[-0.2px]">
          Progresso Médio
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2.3fr)_minmax(180px,1fr)] gap-[14px] items-stretch flex-1">
          {/* BOX ESQUERDA */}
          <div
            className="min-h-[150px] rounded-[18px] p-4 flex flex-col justify-start"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
            }}
          >
            <div className="text-[0.98rem] font-semibold text-[#cfcfcf] leading-[1.35]">
              Média geral dos objetivos
            </div>

            <div className="mt-3 flex flex-col gap-[10px] flex-1 justify-center">
              {ranking.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center gap-3 text-[1rem] font-bold leading-[1.2]"
                  style={{ color: item.cor }}
                >
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.nome}
                  </span>
                  <span className="font-black whitespace-nowrap">
                    {item.media}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BOX DIREITA */}
          <div
            className="min-h-[150px] rounded-[18px] p-4 flex flex-col justify-between items-center text-center"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
            }}
          >
            <div className="text-[0.95rem] font-extrabold text-[#d9d9d9]">
              Média
            </div>

            <div className="flex-1 w-full flex items-center justify-center text-[clamp(3.2rem,6vw,5.1rem)] leading-[0.9] font-black text-[var(--color-2)] tracking-[-3px]">
              {media}%
            </div>
          </div>
        </div>
      </section>

      {/* CARD OBJETIVOS CONCLUÍDOS */}
      <section
        className="md:col-span-4 rounded-[22px] p-5 min-h-[220px] flex flex-col"
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
          border: "1px solid rgba(93,198,161,0.30)",
          boxShadow:
            "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        <div className="text-[1.05rem] font-extrabold text-[#f0f0f0] mb-[14px] tracking-[-0.2px]">
          Objetivos Concluídos
        </div>

        <div className="flex flex-1">
          <div
            className="w-full min-h-[150px] rounded-[18px] p-4 flex flex-col"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex flex-col gap-1">
              <div className="text-[0.95rem] font-extrabold text-[#d9d9d9]">
                Concluídos
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center text-center text-[clamp(3rem,5vw,4.4rem)] leading-[0.95] font-black tracking-[-2px] text-[var(--color-4)]">
              {concluidos}
              <span className="opacity-55">/{total}</span>
            </div>

            <div className="text-[#cfcfcf] text-[0.98rem] font-semibold leading-[1.35] text-left">
              {percentualConcluidos}% do total já concluído
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}