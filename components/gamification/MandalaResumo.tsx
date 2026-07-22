type MandalaResumoProps = {
  joiasConquistadas: string[];
};

const MATERIA_MEU_DIA_ID = "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";
const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const MATERIA_GEOGRAFIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";
const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";
const MATERIA_VIRTUDES_ID = "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";

const joias = [
  {
    nome: "Laranja",
    materiaId: MATERIA_MEU_DIA_ID,
    src: "/imagens/joias/joia_or.png",
    cor: "249,115,22",
    sombra: "drop-shadow-[0_0_24px_rgba(249,115,22,1)]",
  },
  {
    nome: "Vermelha",
    materiaId: MATERIA_ESPIRITUAL_ID,
    src: "/imagens/joias/joia_red.png",
    cor: "239,68,68",
    sombra: "drop-shadow-[0_0_24px_rgba(239,68,68,1)]",
  },
  {
    nome: "Safira",
    materiaId: MATERIA_GEOGRAFIA_ID,
    src: "/imagens/joias/joia_blue.png",
    cor: "37,99,235",
    sombra: "drop-shadow-[0_0_24px_rgba(37,99,235,1)]",
  },
  {
    nome: "Verde",
    materiaId: MATERIA_MATEMATICA_ID,
    src: "/imagens/joias/joia_verde.png",
    cor: "16,185,129",
    sombra: "drop-shadow-[0_0_24px_rgba(16,185,129,1)]",
  },
  {
    nome: "Ametista",
    materiaId: MATERIA_VIRTUDES_ID,
     src: "/imagens/joias/joia_purple.png",
     cor: "168,85,247",
     sombra: "drop-shadow-[0_0_24px_rgba(168,85,247,1)]",
},
];

export default function MandalaResumo({
  joiasConquistadas,
}: MandalaResumoProps) {
  const total = joias.length;

  const quantidadeConquistada = joias.filter(
    (joia) => joia.materiaId && joiasConquistadas.includes(joia.materiaId)
  ).length;

  const percentualVisual = Math.round((quantidadeConquistada / total) * 100);

  const raio = 92;
  const circunferencia = 2 * Math.PI * raio;

  const progressoCircular =
    circunferencia - (percentualVisual / 100) * circunferencia;

  return (
    <div className="w-full px-0 py-2">
      <div className="flex w-full flex-col items-center">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-yellow-400/10 blur-2xl" />

          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 220 220"
          >
            <circle
              cx="110"
              cy="110"
              r={raio}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="5"
            />

            <circle
              cx="110"
              cy="110"
              r={raio}
              fill="none"
              stroke="#facc15"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={progressoCircular}
              style={{
                filter: "drop-shadow(0 0 7px rgba(255,210,0,0.55))",
              }}
            />
          </svg>

          <img
            src="/imagens/joias/mandala_5.png"
            alt="Mandala"
            className="relative z-10 h-[11.5rem] w-[11.5rem] object-contain drop-shadow-[0_0_24px_rgba(255,210,0,.75)]"
          />
        </div>

        <p className="mt-1 text-[2rem] font-bold leading-none text-yellow-300 drop-shadow-[0_0_5px_rgba(250,204,21,.45)]">
          {percentualVisual}%
        </p>

        <div className="mt-4 flex w-full items-center justify-center gap-3">
          {joias.map((joia) => {
            const conquistada =
              !!joia.materiaId && joiasConquistadas.includes(joia.materiaId);

            return (
              <div
                key={joia.nome}
                className="relative flex h-10 w-10 items-center justify-center"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath:
                      "polygon(50% 0%,92% 25%,92% 75%,50% 100%,8% 75%,8% 25%)",
                    background: `
                      linear-gradient(
                        135deg,
                        rgba(${joia.cor},0.95) 0%,
                        rgba(${joia.cor},0.35) 35%,
                        rgba(0,0,0,0.95) 50%,
                        rgba(${joia.cor},0.35) 65%,
                        rgba(${joia.cor},0.95) 100%
                      )
                    `,
                    boxShadow: `
                      0 0 10px rgba(${joia.cor},0.65),
                      0 0 18px rgba(${joia.cor},0.30)
                    `,
                  }}
                />

                <div
                  className="absolute inset-[3px] bg-black/95"
                  style={{
                    clipPath:
                      "polygon(50% 0%,92% 25%,92% 75%,50% 100%,8% 75%,8% 25%)",
                  }}
                />

                {conquistada && (
                  <img
                    src={joia.src}
                    alt={joia.nome}
                    className={`relative z-10 h-7 w-7 object-contain scale-105 ${joia.sombra}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}