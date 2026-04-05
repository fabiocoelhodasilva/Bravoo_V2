"use client";

import { useEffect, useRef, useState } from "react";

type RegrasGamificacaoProps = {
  className?: string;
};

function IconeMoeda() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="#e9891d"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#e9891d" />
      <circle cx="12" cy="12" r="6" fill="#f1a94c" />
    </svg>
  );
}

export default function RegrasGamificacao({
  className = "",
}: RegrasGamificacaoProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  function alternarAbertura() {
    setAberto((prev) => !prev);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={alternarAbertura}
        className="flex h-[34px] min-w-[72px] items-center justify-center rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[12px] font-bold text-white/78 transition hover:bg-white/[0.07] hover:text-white"
      >
        Regras
      </button>

      <div
        className={`absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[92vw] transition-all ${
          aberto
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,22,22,0.98),rgba(10,10,10,0.98))] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
          <div className="mb-3 text-center text-[12px] font-extrabold uppercase tracking-[0.12em] text-orange-300">
            Regras da Gamificação
          </div>

          <div className="space-y-3 text-[12px] text-white/88">
            <div className="rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
              <div className="font-bold text-white">🛡️ Escudos</div>
              <div className="mt-1 text-white/75">
                Ganhe um escudo a cada 10 dias seguidos de atividade concluída.
                Você pode ter no máximo 2 escudos.
                <br />
                <br />
                Se você ficar um dia sem jogar, um escudo será usado
                automaticamente para proteger sua sequência.
              </div>
            </div>

            <div className="rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-1 font-bold text-white">
                <IconeMoeda /> Moedas
              </div>
              <div className="mt-1 text-white/75">
                Você ganha moedas se terminar as atividades com pontuação
                positiva.
                <br />
                <br />
                1 ponto = 1 moeda.
              </div>
            </div>

            <div className="rounded-[12px] border border-orange-400/15 bg-orange-400/5 px-3 py-2">
              <div className="font-bold text-orange-300">🔥 Persistência</div>
              <div className="mt-1 text-white/75">
                Quanto mais dias seguidos de atividade, melhor será sua
                classificação na Galeria da Persistência.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}