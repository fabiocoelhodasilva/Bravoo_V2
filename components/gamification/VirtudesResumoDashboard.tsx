"use client";

/* =========================================================
   Imports
========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import MateriaResumoDashboardPadrao from "@/components/gamification/MateriaResumoDashboardPadrao";

/* =========================================================
   Configurações da matéria
========================================================= */

const VIRTUDES_MATERIA_ID = "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";

const CACHE_DASHBOARD_VIRTUDES_KEY =
  "cache_dashboard_virtudes_menu";

const CACHE_MAX_IDADE_MS = 1000 * 60 * 3;

const IMAGEM_JOIA_VIRTUDES =
  "/imagens/joias/joia_purple.png";

/* =========================================================
   Tipos
========================================================= */

type DashboardVirtudes = {
  diasSeguidos: number;
  totalJoias: number;
  atualizadoEm: number;
};

/* =========================================================
   Funções de cache
========================================================= */

function salvarCacheDashboardVirtudes(dados: DashboardVirtudes) {
  try {
    sessionStorage.setItem(
      CACHE_DASHBOARD_VIRTUDES_KEY,
      JSON.stringify(dados)
    );
  } catch {
    // O dashboard continua funcionando mesmo sem sessionStorage.
  }
}

function lerCacheDashboardVirtudes(): DashboardVirtudes | null {
  try {
    const bruto = sessionStorage.getItem(
      CACHE_DASHBOARD_VIRTUDES_KEY
    );

    if (!bruto) {
      return null;
    }

    const cache = JSON.parse(bruto) as DashboardVirtudes;

    if (!Number.isFinite(cache.diasSeguidos)) {
      return null;
    }

    if (!Number.isFinite(cache.totalJoias)) {
      return null;
    }

    if (!Number.isFinite(cache.atualizadoEm)) {
      return null;
    }

    const cacheExpirou =
      Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS;

    if (cacheExpirou) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

/* =========================================================
   Cálculo da persistência
========================================================= */

function calcularDiasSeguidosParaExibicao(params: {
  diasSeguidosSalvo: number;
  ultimaDataAtividade: string | null | undefined;
}) {
  const { diasSeguidosSalvo, ultimaDataAtividade } = params;

  if (!ultimaDataAtividade) {
    return 0;
  }

  const hoje = new Date();

  const hojeLocal = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const ultimaData = new Date(
    `${ultimaDataAtividade}T00:00:00`
  );

  const ultimaDataLocal = new Date(
    ultimaData.getFullYear(),
    ultimaData.getMonth(),
    ultimaData.getDate()
  );

  const diferencaDias = Math.floor(
    (hojeLocal.getTime() - ultimaDataLocal.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  /*
    A sequência permanece visível caso a última atividade
    tenha sido realizada hoje ou ontem.
  */
  if (diferencaDias <= 1) {
    return Math.max(0, diasSeguidosSalvo);
  }

  return 0;
}

/* =========================================================
   Skeleton de carregamento
========================================================= */

function DashboardVirtudesSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      {/* Versão para celular */}
      <div className="grid w-full grid-cols-2 gap-2 sm:hidden">
        <div className="h-[66px] rounded-[18px] bg-white/10" />
        <div className="h-[66px] rounded-[18px] bg-white/10" />
      </div>

      {/* Versão para telas maiores */}
      <div className="hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-4 sm:block">
        <div className="mb-4 h-4 w-32 rounded-full bg-white/10" />

        <div className="flex flex-col gap-3">
          <div className="h-[106px] rounded-2xl bg-white/10" />
          <div className="h-[106px] rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Componente principal
========================================================= */

export default function VirtudesResumoDashboard() {
  const carregamentoEmAndamentoRef =
    useRef<Promise<void> | null>(null);

  const ultimoCarregamentoRef = useRef(0);

  const [diasSeguidos, setDiasSeguidos] = useState(0);
  const [totalJoias, setTotalJoias] = useState(0);

  const [carregandoDashboard, setCarregandoDashboard] =
    useState(true);

  const [temDadosIniciais, setTemDadosIniciais] =
    useState(false);

  /* =========================================================
     Aplica os dados e atualiza o cache
  ========================================================= */

  const aplicarDadosDashboard = useCallback(
    (
      dados: Omit<
        DashboardVirtudes,
        "atualizadoEm"
      >
    ) => {
      setDiasSeguidos(dados.diasSeguidos);
      setTotalJoias(dados.totalJoias);
      setTemDadosIniciais(true);

      salvarCacheDashboardVirtudes({
        ...dados,
        atualizadoEm: Date.now(),
      });
    },
    []
  );

  /* =========================================================
     Busca persistência e quantidade de ametistas
  ========================================================= */

  const carregarDashboard = useCallback(
    async (options?: {
      silencioso?: boolean;
      forcar?: boolean;
    }) => {
      const silencioso = options?.silencioso ?? false;
      const forcar = options?.forcar ?? false;
      const agora = Date.now();

      /*
        Evita várias consultas simultâneas quando os eventos
        focus, pageshow e visibilitychange acontecem juntos.
      */
      if (
        !forcar &&
        agora - ultimoCarregamentoRef.current < 2500
      ) {
        return (
          carregamentoEmAndamentoRef.current ??
          Promise.resolve()
        );
      }

      if (carregamentoEmAndamentoRef.current) {
        return carregamentoEmAndamentoRef.current;
      }

      const carregamento = (async () => {
        try {
          ultimoCarregamentoRef.current = Date.now();

          if (!silencioso && !temDadosIniciais) {
            setCarregandoDashboard(true);
          }

          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (!session?.user) {
            aplicarDadosDashboard({
              diasSeguidos: 0,
              totalJoias: 0,
            });

            return;
          }

          const usuarioId = session.user.id;

          const [sequenciaResult, joiasResult] =
            await Promise.all([
              supabase
                .from("next_sequencia_dias_usuario")
                .select(
                  "dias_seguidos, ultima_data_atividade"
                )
                .eq("usuario_id", usuarioId)
                .eq(
                  "materia_id",
                  VIRTUDES_MATERIA_ID
                )
                .maybeSingle(),

              supabase
                .from("next_joias_usuario")
                .select("id", {
                  count: "exact",
                  head: true,
                })
                .eq("usuario_id", usuarioId)
                .eq(
                  "materia_id",
                  VIRTUDES_MATERIA_ID
                ),
            ]);

          if (sequenciaResult.error) {
            throw sequenciaResult.error;
          }

          if (joiasResult.error) {
            throw joiasResult.error;
          }

          const diasSeguidosParaExibir =
            calcularDiasSeguidosParaExibicao({
              diasSeguidosSalvo: Number(
                sequenciaResult.data?.dias_seguidos ?? 0
              ),
              ultimaDataAtividade:
                sequenciaResult.data
                  ?.ultima_data_atividade ?? null,
            });

          aplicarDadosDashboard({
            diasSeguidos: diasSeguidosParaExibir,
            totalJoias: joiasResult.count ?? 0,
          });
        } catch (error) {
          console.error(
            "Erro ao carregar dashboard de Virtudes:",
            error
          );

          if (!temDadosIniciais) {
            aplicarDadosDashboard({
              diasSeguidos: 0,
              totalJoias: 0,
            });
          }
        } finally {
          setCarregandoDashboard(false);
          carregamentoEmAndamentoRef.current = null;
        }
      })();

      carregamentoEmAndamentoRef.current = carregamento;

      return carregamento;
    },
    [aplicarDadosDashboard, temDadosIniciais]
  );

  /* =========================================================
     Carregamento inicial
  ========================================================= */

  useEffect(() => {
    const cache = lerCacheDashboardVirtudes();

    if (cache) {
      setDiasSeguidos(cache.diasSeguidos);
      setTotalJoias(cache.totalJoias);
      setTemDadosIniciais(true);
      setCarregandoDashboard(false);

      /*
        Mostra o cache imediatamente e atualiza os dados
        em segundo plano.
      */
      void carregarDashboard({
        silencioso: true,
      });

      return;
    }

    void carregarDashboard({
      forcar: true,
    });
  }, [carregarDashboard]);

  /* =========================================================
     Atualização ao retornar para a página
  ========================================================= */

  useEffect(() => {
    const recarregarSilenciosamente = () => {
      void carregarDashboard({
        silencioso: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recarregarSilenciosamente();
      }
    };

    window.addEventListener(
      "focus",
      recarregarSilenciosamente
    );

    window.addEventListener(
      "pageshow",
      recarregarSilenciosamente
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        recarregarSilenciosamente
      );

      window.removeEventListener(
        "pageshow",
        recarregarSilenciosamente
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [carregarDashboard]);

  /* =========================================================
     Renderização
  ========================================================= */

  if (carregandoDashboard && !temDadosIniciais) {
    return <DashboardVirtudesSkeleton />;
  }

  return (
    <MateriaResumoDashboardPadrao
      diasSeguidos={diasSeguidos}
      totalJoias={totalJoias}
      nomeJoia="Ametistas"
      imagemJoia={IMAGEM_JOIA_VIRTUDES}
    />
  );
}