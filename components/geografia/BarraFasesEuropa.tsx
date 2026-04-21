"use client";

type FaseItem = {
  id: string;
  label: string;
  status: "ativa" | "concluida" | "bloqueada";
};

type Props = {
  fases: FaseItem[];
  onSelecionarFase: (id: string) => void;
};

export default function BarraFasesEuropa({
  fases,
  onSelecionarFase,
}: Props) {

  return (
    <div className="w-full mt-0 px-2 pb-0 md:mt-2">
      <div className="relative mx-auto max-w-[1100px]">
        <div className="relative">
          <div className="relative flex gap-2 md:gap-3 overflow-x-auto md:overflow-visible px-2 pb-0 md:justify-center">

            {fases.map((fase) => {
              const ativa = fase.status === "ativa";
              const concluida = fase.status === "concluida";

              const baseCard =
                "relative z-10 flex h-[62px] min-w-[72px] flex-col items-center justify-center border text-center transition-all duration-300 select-none cursor-pointer";

              const formatoEscudo = {
                clipPath:
                  "polygon(10% 0%, 90% 0%, 100% 14%, 100% 78%, 50% 100%, 0% 78%, 0% 14%)",
              };

              const estiloCard = ativa
                ? "border-[#7fffd4] bg-[linear-gradient(180deg,rgba(80,255,220,0.32)_0%,rgba(20,60,70,0.92)_100%)] text-[#d9fff7] shadow-[0_0_16px_rgba(90,255,230,0.5),inset_0_0_10px_rgba(120,255,240,0.16)] scale-[1.02]"
                : concluida
                ? "border-[#ffcf4d] bg-[linear-gradient(180deg,rgba(255,193,7,0.28)_0%,rgba(58,40,0,0.92)_100%)] text-[#fff1a6] shadow-[0_0_14px_rgba(255,191,0,0.35),inset_0_0_8px_rgba(255,220,120,0.1)] hover:scale-[1.02]"
                : "border-[#22345e] bg-[linear-gradient(180deg,rgba(18,31,62,0.92)_0%,rgba(7,14,32,0.98)_100%)] text-[#8ea3cf] shadow-[0_0_8px_rgba(35,70,140,0.14),inset_0_0_8px_rgba(100,140,220,0.04)] opacity-80 hover:scale-[1.02]";

              const brilhoTopo = ativa
                ? "from-[#c7fff6] via-[#7fffd4] to-transparent"
                : concluida
                ? "from-[#fff1ad] via-[#ffd54a] to-transparent"
                : "from-[#5f77a8] via-[#34476d] to-transparent";

              return (
                <button
                  key={fase.id}
                  type="button"
                  onClick={() => onSelecionarFase(fase.id)}
                  className={`${baseCard} ${estiloCard}`}
                  style={formatoEscudo}
                >
                  <div
                    className={`pointer-events-none absolute left-[12%] right-[12%] top-[6px] h-[1px] bg-gradient-to-r ${brilhoTopo} opacity-95`}
                  />

                  <div className="relative z-10 text-[0.72rem] font-bold tracking-wide">
                    {fase.label}
                  </div>

                  <div className="relative z-10 mt-1 text-[1rem] leading-none">
                    {ativa && (
                      <span className="drop-shadow-[0_0_5px_rgba(127,255,212,0.75)]">
                        ★★★
                      </span>
                    )}

                    {concluida && (
                      <span className="drop-shadow-[0_0_5px_rgba(255,210,80,0.75)]">
                        ★★★
                      </span>
                    )}

                    {!ativa && !concluida && (
                      <span className="drop-shadow-[0_0_5px_rgba(120,150,220,0.4)]">
                        ★★★
                      </span>
                    )}
                  </div>

                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-[6px] mx-auto h-[5px] w-[54%] rounded-full blur-md opacity-75"
                    style={{
                      background: ativa
                        ? "rgba(127,255,212,0.35)"
                        : concluida
                        ? "rgba(255,204,51,0.24)"
                        : "rgba(80,120,220,0.1)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}