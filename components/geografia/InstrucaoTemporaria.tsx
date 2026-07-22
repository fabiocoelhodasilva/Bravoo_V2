"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AnimacaoGestoGlobo from "./AnimacaoGestoGlobo";

type Props = {
  texto: string;
  duracaoMs?: number;
  visivel?: boolean;
  mostrarGesto?: boolean;
  className?: string;
  onFinalizar?: () => void;

  /**
   * Define por quantos dias, após o cadastro, a instrução pode aparecer.
   * Use null para desativar a limitação por tempo de cadastro.
   */
  limiteDiasCadastro?: number | null;
};

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export default function InstrucaoTemporaria({
  texto,
  duracaoMs = 5000,
  visivel = true,
  mostrarGesto = true,
  className = "",
  onFinalizar,
  limiteDiasCadastro = 20,
}: Props) {
  const [usuarioPodeVer, setUsuarioPodeVer] = useState(false);
  const [verificandoCadastro, setVerificandoCadastro] = useState(true);
  const [renderizar, setRenderizar] = useState(false);
  const [ativo, setAtivo] = useState(false);

  /* =========================================================
     Verificação da idade da conta do usuário
  ========================================================= */

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarTempoDeCadastro() {
      if (limiteDiasCadastro === null) {
        if (componenteAtivo) {
          setUsuarioPodeVer(true);
          setVerificandoCadastro(false);
        }

        return;
      }

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!componenteAtivo) return;

        if (error || !user?.created_at) {
          setUsuarioPodeVer(false);
          return;
        }

        const dataCadastroEmMs = new Date(user.created_at).getTime();

        if (Number.isNaN(dataCadastroEmMs)) {
          setUsuarioPodeVer(false);
          return;
        }

        const tempoDeCadastroEmMs = Math.max(
          0,
          Date.now() - dataCadastroEmMs
        );

        const limiteEmMs = limiteDiasCadastro * UM_DIA_EM_MS;

        setUsuarioPodeVer(tempoDeCadastroEmMs <= limiteEmMs);
      } catch (error) {
        console.error(
          "Erro ao verificar o tempo de cadastro do usuário:",
          error
        );

        if (componenteAtivo) {
          setUsuarioPodeVer(false);
        }
      } finally {
        if (componenteAtivo) {
          setVerificandoCadastro(false);
        }
      }
    }

    void verificarTempoDeCadastro();

    return () => {
      componenteAtivo = false;
    };
  }, [limiteDiasCadastro]);

  const deveExibir =
    visivel && !verificandoCadastro && usuarioPodeVer;

  /* =========================================================
     Entrada, permanência e saída da instrução
  ========================================================= */

  useEffect(() => {
    let timerRemover: ReturnType<typeof setTimeout> | null = null;

    if (!deveExibir) {
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

      timerRemover = setTimeout(() => {
        setRenderizar(false);
        onFinalizar?.();
      }, 350);
    }, duracaoMs);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);

      if (timerRemover) {
        clearTimeout(timerRemover);
      }
    };
  }, [deveExibir, duracaoMs, onFinalizar]);

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