"use client";

import { useEffect, useState } from "react";
import AnimacaoGestoGlobo from "./AnimacaoGestoGlobo";

type Props = {
  texto: string;
  duracaoMs?: number;
  visivel?: boolean;
  mostrarGesto?: boolean;
  className?: string;
  onFinalizar?: () => void;
};

export default function InstrucaoTemporaria({
  texto,
  duracaoMs = 5000,
  visivel = true,
  mostrarGesto = true,
  className = "",
  onFinalizar,
}: Props) {
  const [renderizar, setRenderizar] = useState(visivel);
  const [ativo, setAtivo] = useState(visivel);

  useEffect(() => {
    if (!visivel) {
      setAtivo(false);

      const timerSaida = setTimeout(() => {
        setRenderizar(false);
      }, 350);

      return () => clearTimeout(timerSaida);
    }

    setRenderizar(true);

    const frame = requestAnimationFrame(() => {
      setAtivo(true);
    });

    const timer = setTimeout(() => {
      setAtivo(false);

      const timerRemover = setTimeout(() => {
        setRenderizar(false);
        onFinalizar?.();
      }, 350);

      return () => clearTimeout(timerRemover);
    }, duracaoMs);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [visivel, duracaoMs, onFinalizar]);

  if (!renderizar) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6 ${className}`}
      aria-hidden="true"
    >
      <div
        className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-black/35 px-6 py-5 text-center backdrop-blur-sm transition-all duration-300 ${
          ativo ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <p className="max-w-[320px] text-base font-bold leading-snug text-white md:max-w-[420px] md:text-xl">
          {texto}
        </p>

        {mostrarGesto && <AnimacaoGestoGlobo />}
      </div>
    </div>
  );
}