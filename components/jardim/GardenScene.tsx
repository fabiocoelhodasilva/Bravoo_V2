"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BottomNavJardim from "./BottomNavJardim";
import OracaoDashboardPanel from "./OracaoDashboardPanel";

import { supabase } from "@/lib/supabase/client";
import { buscarResumoDashboardOracao } from "@/lib/gamificacao/oracao/oracao-dashboard-client";
import { buscarPontuacaoJardim } from "@/lib/gamificacao/jardim/jardim-pontuacao-actions";
import { getImagensJardim } from "@/lib/gamificacao/jardim/jardim-assets";

type ResumoDashboardOracao = {
  minutosHoje: number;
  minutosAno: number;
  metaDiaria: number;
  persistenciaDias: number;
};

const MATERIA_ESPIRITUAL_ID =
  "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";

const RESUMO_PADRAO: ResumoDashboardOracao = {
  minutosHoje: 0,
  minutosAno: 0,
  metaDiaria: 5,
  persistenciaDias: 0,
};

function formatarPersistencia(dias: number) {
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export default function GardenScene() {
  const router = useRouter();

  const [resumoOracao, setResumoOracao] =
    useState<ResumoDashboardOracao>(RESUMO_PADRAO);
  const [pontuacaoJardim, setPontuacaoJardim] = useState(0);
  const [totalJoias, setTotalJoias] = useState(0);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [oracaoDashboardOpen, setOracaoDashboardOpen] = useState(false);

  /** Conta somente as joias espirituais do usuário. */
  const carregarTotalJoias = useCallback(async () => {
    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !user) return 0;

      const { count, error } = await supabase
        .from("next_joias_usuario")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID);

      if (error) {
        console.error("Erro ao carregar joias espirituais:", error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      console.error("Erro inesperado ao carregar joias:", error);
      return 0;
    }
  }, []);

  /** Carrega os dados da Home do Jardim em paralelo. */
  const carregarHomeJardim = useCallback(async () => {
    try {
      setCarregandoResumo(true);

      const [resumoResultado, pontuacaoResultado, joiasResultado] =
        await Promise.allSettled([
          buscarResumoDashboardOracao(),
          buscarPontuacaoJardim(),
          carregarTotalJoias(),
        ]);

      if (resumoResultado.status === "fulfilled" && resumoResultado.value) {
        setResumoOracao(resumoResultado.value);
      }

      if (pontuacaoResultado.status === "fulfilled") {
        setPontuacaoJardim(pontuacaoResultado.value.pontuacao);
      } else {
        console.error(
          "Erro ao carregar pontuação do jardim:",
          pontuacaoResultado.reason,
        );
      }

      if (joiasResultado.status === "fulfilled") {
        setTotalJoias(joiasResultado.value);
      }
    } catch (error) {
      console.error("Erro ao carregar a Home do Jardim:", error);
    } finally {
      setCarregandoResumo(false);
    }
  }, [carregarTotalJoias]);

  useEffect(() => {
    void carregarHomeJardim();
  }, [carregarHomeJardim]);

  /**
   * A pontuação é ilimitada.
   * O jardim-assets limita somente a imagem disponível (0 a 10 no Deserto).
   */
  const imagensJardim = useMemo(() => {
    return getImagensJardim("deserto", pontuacaoJardim);
  }, [pontuacaoJardim]);

  const oracaoConcluidaHoje =
    resumoOracao.minutosHoje >= Math.max(1, resumoOracao.metaDiaria);

  /** Recalcula tudo imediatamente depois de oração ou mudança de meta. */
  async function atualizarAposOracaoRegistrada() {
    await carregarHomeJardim();
  }

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/* CENÁRIO RESPONSIVO: imagens 0 a 10 */}
      <picture className="absolute inset-0 block h-full w-full">
        <source media="(max-width: 767px)" srcSet={imagensJardim.mobile} />

        <img
          src={imagensJardim.desktop}
          alt="Jardim do Deserto"
          className="h-full w-full select-none object-cover object-center"
          draggable={false}
        />
      </picture>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[125px] bg-gradient-to-b from-black/28 via-black/8 to-transparent" />

      {/* CARDS SUPERIORES - compactos */}
      <div
        className="absolute inset-x-0 z-20 flex justify-center px-3"
        style={{ top: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="grid w-full max-w-[370px] grid-cols-2 gap-2">
          <div className="flex h-[54px] items-center rounded-[18px] border border-white/20 bg-[#2b211f]/70 px-3 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-lg">
            <div className="mr-2.5 text-[1.45rem] leading-none">🔥</div>

            <div className="min-w-0">
              <div className="text-[0.96rem] font-semibold leading-none text-white">
                {carregandoResumo
                  ? "..."
                  : formatarPersistencia(resumoOracao.persistenciaDias)}
              </div>

              <div className="mt-1 text-[0.62rem] font-medium text-white/60">
                Persistência
              </div>
            </div>
          </div>

          <div className="flex h-[54px] items-center rounded-[18px] border border-white/20 bg-[#2b211f]/70 px-3 shadow-[0_8px_22px_rgba(0,0,0,0.24)] backdrop-blur-lg">
            <div className="mr-2.5 text-[1.45rem] leading-none">💎</div>

            <div className="min-w-0">
              <div className="text-[0.96rem] font-semibold leading-none text-white">
                {carregandoResumo ? "..." : totalJoias}
              </div>

              <div className="mt-1 text-[0.62rem] font-medium text-white/60">
                Joias
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavJardim
        oracaoConcluidaHoje={oracaoConcluidaHoje}
        onVoltar={() => router.back()}
        onOracao={() => setOracaoDashboardOpen(true)}
      />

      {oracaoDashboardOpen && (
        <OracaoDashboardPanel
          onClose={() => setOracaoDashboardOpen(false)}
          dadosIniciais={resumoOracao}
          dadosIniciaisCarregando={carregandoResumo}
          onResumoAtualizado={setResumoOracao}
          onOracaoRegistrada={atualizarAposOracaoRegistrada}
        />
      )}
    </section>
  );
}
