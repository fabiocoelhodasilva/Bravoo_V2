"use client";

import type { FaixaGamificacao } from "@/lib/gamificacao/gamificacao-types";

type TabelaFaixasProps = {
  faixas: FaixaGamificacao[];
  classificacaoAtualId?: string | null;
};

function formatarMetaDias(diasMinimos: number): string {
  if (diasMinimos === 1) {
    return "1 dia";
  }

  return `${diasMinimos} dias`;
}

export default function TabelaFaixas({
  faixas,
  classificacaoAtualId,
}: TabelaFaixasProps) {
  return (
    <div className="w-full rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,22,22,0.98),rgba(10,10,10,0.98))] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
      <div className="mb-2 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/72">
          Galeria da Fama da Persistência
        </div>
        <div className="mt-1 text-[10px] text-white/50">
          Persistência necessária para atingir cada classificação
        </div>
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-[12px] border border-white/6 bg-black/20">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#141414]">
            <tr className="border-b border-white/8">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Classificação
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
                Meta
              </th>
            </tr>
          </thead>

          <tbody>
            {faixas.map((faixa) => {
              const estaAtiva = faixa.id === classificacaoAtualId;

              return (
                <tr
                  key={faixa.id}
                  className={`border-b border-white/6 last:border-b-0 ${
                    estaAtiva ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <span
                      className={`text-[12px] ${
                        estaAtiva
                          ? "font-bold text-white"
                          : "font-medium text-white/78"
                      }`}
                    >
                      {faixa.nome}
                    </span>
                  </td>

                  <td
                    className={`px-3 py-2 text-right text-[12px] ${
                      estaAtiva ? "font-bold text-white" : "text-white/68"
                    }`}
                  >
                    {formatarMetaDias(faixa.diasMinimos)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}