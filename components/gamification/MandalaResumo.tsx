type MandalaResumoProps = {
  joiasConquistadas: string[];
};

/* =========================================================
   IDs fixos das cinco áreas da Mandala
========================================================= */

const MATERIA_MEU_DIA_ID =
  "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";

const MATERIA_ESPIRITUAL_ID =
  "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";

const MATERIA_GEOGRAFIA_ID =
  "d366c6de-2345-4bb2-ac1f-a88747a2248d";

const MATERIA_MATEMATICA_ID =
  "24b7c418-81b4-47c2-b96f-f051786fa187";

const MATERIA_VIRTUDES_ID =
  "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";

const MATERIAS_MANDALA = [
  MATERIA_MEU_DIA_ID,
  MATERIA_ESPIRITUAL_ID,
  MATERIA_GEOGRAFIA_ID,
  MATERIA_MATEMATICA_ID,
  MATERIA_VIRTUDES_ID,
] as const;

/* =========================================================
   Componente
========================================================= */

export default function MandalaResumo({
  joiasConquistadas,
}: MandalaResumoProps) {
  const total = MATERIAS_MANDALA.length;

  const materiasConquistadas =
    new Set(joiasConquistadas);

  const quantidadeConquistada =
    MATERIAS_MANDALA.filter((materiaId) =>
      materiasConquistadas.has(materiaId)
    ).length;

  /*
   * O percentual continua existindo somente para calcular
   * o preenchimento da barra circular. Ele não é mais exibido.
   */
  const percentualVisual = Math.round(
    (quantidadeConquistada / total) * 100
  );

  const mandalaConquistada =
    quantidadeConquistada === total;

  const raio = 92;
  const circunferencia = 2 * Math.PI * raio;

  const progressoCircular =
    circunferencia -
    (percentualVisual / 100) * circunferencia;

  return (
    <div className="w-full px-0 py-2">
      <div className="flex w-full flex-col items-center">
        <div
          className={`relative flex h-52 w-52 items-center justify-center ${
            mandalaConquistada
              ? "mandala-conquistada"
              : ""
          }`}
        >
          {/* =================================================
              Brilho suave padrão
          ================================================= */}

          <div
            className={`absolute inset-0 rounded-full blur-2xl ${
              mandalaConquistada
                ? "bg-yellow-300/18"
                : "bg-yellow-400/10"
            }`}
          />

          {/* =================================================
              Brilho pulsante em forma de estrela
              Só aparece quando a Mandala foi conquistada
          ================================================= */}

          {mandalaConquistada && (
            <>
              <div
                className="mandala-estrela-pulso pointer-events-none absolute inset-[-28px]"
                aria-hidden="true"
              />

              <div
                className="mandala-aurora-pulso pointer-events-none absolute inset-[-18px] rounded-full"
                aria-hidden="true"
              />
            </>
          )}

          {/* =================================================
              Barra circular de progresso
          ================================================= */}

          <svg
            className="absolute inset-0 z-[2] h-full w-full -rotate-90"
            viewBox="0 0 220 220"
            aria-hidden="true"
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
              className={
                mandalaConquistada
                  ? "mandala-anel-conquistado"
                  : ""
              }
              style={{
                filter:
                  "drop-shadow(0 0 7px rgba(255,210,0,0.55))",
                transition:
                  "stroke-dashoffset 500ms ease",
              }}
            />
          </svg>

          {/* =================================================
              Imagem PNG original da Mandala
          ================================================= */}

          <img
            src="/imagens/joias/mandala_5.png"
            alt={
              mandalaConquistada
                ? "Mandala conquistada"
                : "Progresso da Mandala"
            }
            className={`relative z-10 h-[11.5rem] w-[11.5rem] object-contain ${
              mandalaConquistada
                ? "mandala-imagem-conquistada"
                : "drop-shadow-[0_0_24px_rgba(255,210,0,0.75)]"
            }`}
            draggable={false}
          />
        </div>
      </div>

      {/* =====================================================
          Animações exclusivas da Mandala conquistada
      ===================================================== */}

      <style jsx>{`
        .mandala-estrela-pulso {
          z-index: 0;
          opacity: 0.48;
          background:
            repeating-conic-gradient(
              from 0deg,
              rgba(255, 235, 125, 0.95) 0deg,
              rgba(255, 205, 32, 0.72) 1.4deg,
              transparent 2.8deg,
              transparent 22.5deg
            );
          -webkit-mask:
            radial-gradient(
              circle,
              transparent 0%,
              transparent 42%,
              #000 54%,
              rgba(0, 0, 0, 0.82) 63%,
              transparent 78%
            );
          mask:
            radial-gradient(
              circle,
              transparent 0%,
              transparent 42%,
              #000 54%,
              rgba(0, 0, 0, 0.82) 63%,
              transparent 78%
            );
          filter:
            blur(1.8px)
            drop-shadow(
              0 0 12px rgba(255, 211, 40, 0.88)
            );
          animation:
            brilhoEstrelaMandala 2.6s ease-in-out
            infinite;
        }

        .mandala-aurora-pulso {
          z-index: 1;
          border: 2px solid
            rgba(255, 224, 91, 0.3);
          box-shadow:
            0 0 20px rgba(255, 207, 32, 0.52),
            0 0 42px rgba(255, 193, 7, 0.3),
            inset 0 0 18px rgba(255, 231, 126, 0.18);
          animation:
            auroraMandala 2.6s ease-in-out
            infinite;
        }

        .mandala-anel-conquistado {
          animation:
            anelMandalaConquistada 2.6s ease-in-out
            infinite;
        }

        .mandala-imagem-conquistada {
          filter:
            drop-shadow(
              0 0 18px rgba(255, 215, 55, 0.92)
            )
            drop-shadow(
              0 0 34px rgba(255, 186, 0, 0.58)
            );
          animation:
            imagemMandalaConquistada 2.6s
            ease-in-out infinite;
        }

        @keyframes brilhoEstrelaMandala {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(0.9) rotate(0deg);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.1) rotate(4deg);
          }
        }

        @keyframes auroraMandala {
          0%,
          100% {
            opacity: 0.38;
            transform: scale(0.94);
          }

          50% {
            opacity: 0.95;
            transform: scale(1.08);
          }
        }

        @keyframes anelMandalaConquistada {
          0%,
          100% {
            filter:
              drop-shadow(
                0 0 6px rgba(255, 210, 0, 0.5)
              );
          }

          50% {
            filter:
              drop-shadow(
                0 0 14px rgba(255, 225, 95, 1)
              );
          }
        }

        @keyframes imagemMandalaConquistada {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.025);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mandala-estrela-pulso,
          .mandala-aurora-pulso,
          .mandala-anel-conquistado,
          .mandala-imagem-conquistada {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}