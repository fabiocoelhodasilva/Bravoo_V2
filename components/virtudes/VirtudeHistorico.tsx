"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Tipos
========================================================= */

type VirtudeHistoricoProps = {
  virtudeId: string;
  atualizarChave?: number;
};

type ConclusaoVirtude = {
  id: string;
  concluido_em: string;
  tipo_resposta: string | null;
  resposta_texto: string | null;
};

/* =========================================================
   Funções auxiliares
========================================================= */

function formatarDataConclusao(dataIso: string) {
  const data = new Date(dataIso);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

/* =========================================================
   Componente
========================================================= */

export default function VirtudeHistorico({
  virtudeId,
  atualizarChave = 0,
}: VirtudeHistoricoProps) {
  const [conclusoes, setConclusoes] = useState<ConclusaoVirtude[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  /* =========================================================
     Busca o histórico da virtude
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarHistorico() {
      setCarregando(true);
      setErro("");

      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (erroUsuario) {
          throw erroUsuario;
        }

        if (!user) {
          if (!cancelado) {
            setConclusoes([]);
            setErro("Sua sessão não foi encontrada.");
          }

          return;
        }

        const { data, error } = await supabase
          .from("next_virtudes_respostas")
          .select("id, concluido_em, tipo_resposta, resposta_texto")
          .eq("usuario_id", user.id)
          .eq("virtude_id", virtudeId)
          .not("concluido_em", "is", null)
          .order("concluido_em", { ascending: false });

        if (error) {
          throw error;
        }

        if (!cancelado) {
          setConclusoes((data ?? []) as ConclusaoVirtude[]);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico da virtude:", error);

        if (!cancelado) {
          setConclusoes([]);
          setErro("Não foi possível carregar sua jornada.");
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarHistorico();

    return () => {
      cancelado = true;
    };
  }, [virtudeId, atualizarChave]);

  /* =========================================================
     Carregamento
  ========================================================= */

  if (carregando) {
    return (
      <section className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">
          Sua Jornada
        </h2>

        <p className="mt-3 text-sm text-white/45">
          Carregando conclusões...
        </p>
      </section>
    );
  }

  /* =========================================================
     Erro
  ========================================================= */

  if (erro) {
    return (
      <section className="mt-6 rounded-[22px] border border-red-400/20 bg-red-500/[0.07] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">
          Sua Jornada
        </h2>

        <p className="mt-3 text-sm text-red-100/80">
          {erro}
        </p>
      </section>
    );
  }

  /* =========================================================
     Nenhuma conclusão
  ========================================================= */

  if (conclusoes.length === 0) {
    return (
      <section className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">
          Sua Jornada
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-white/45">
          Você ainda não concluiu esta reflexão.
        </p>
      </section>
    );
  }

  /* =========================================================
     Histórico
  ========================================================= */

  return (
    <section className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white">
          Sua Jornada
        </h2>

        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/55">
          {conclusoes.length}{" "}
          {conclusoes.length === 1 ? "conclusão" : "conclusões"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {conclusoes.map((conclusao) => {
          const respostaTexto = conclusao.resposta_texto?.trim();

          return (
            <article
              key={conclusao.id}
              className="rounded-[16px] border border-amber-300/15 bg-amber-300/[0.045] px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-lg"
                  aria-hidden="true"
                >
                  🏅
                </span>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Concluído em
                  </p>

                  <p className="mt-0.5 text-sm text-white/55">
                    {formatarDataConclusao(conclusao.concluido_em)}
                  </p>
                </div>
              </div>

              {respostaTexto && (
                <blockquote className="mt-4 border-l-2 border-[var(--color-6)]/45 pl-4 text-sm leading-relaxed text-white/75">
                  “{respostaTexto}”
                </blockquote>
              )}

              {!respostaTexto && (
                <p className="mt-4 text-sm italic text-white/35">
                  Reflexão concluída sem texto registrado.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}