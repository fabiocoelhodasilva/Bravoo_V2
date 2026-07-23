"use client";

/* =========================================================
   Imports
========================================================= */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";
import MateriaResumoDashboardPadrao from "@/components/gamification/MateriaResumoDashboardPadrao";

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
   Configuração
========================================================= */

const IMAGEM_MANDALA =
  "/imagens/joias/mandala_5.png";

const CACHE_DASHBOARD_MANDALA_KEY =
  "cache_dashboard_mandala_principal";

const CACHE_MAX_IDADE_MS =
  1000 * 60 * 3;

const EVENTO_JOIA_CONQUISTADA =
  "bravoo:joia-conquistada";

/* =========================================================
   Tipos
========================================================= */

type RegistroJoia = {
  materia_id: string;
  data_conquista: string;
};

type DashboardMandala = {
  diasSeguidos: number;
  totalMandalas: number;
  atualizadoEm: number;
};

/* =========================================================
   Cache
========================================================= */

function salvarCacheDashboardMandala(
  dados: DashboardMandala
) {
  try {
    sessionStorage.setItem(
      CACHE_DASHBOARD_MANDALA_KEY,
      JSON.stringify(dados)
    );
  } catch {
    // O painel continua funcionando sem cache.
  }
}

function lerCacheDashboardMandala():
  DashboardMandala | null {
  try {
    const bruto = sessionStorage.getItem(
      CACHE_DASHBOARD_MANDALA_KEY
    );

    if (!bruto) {
      return null;
    }

    const cache =
      JSON.parse(bruto) as DashboardMandala;

    if (
      !Number.isFinite(cache.diasSeguidos) ||
      !Number.isFinite(cache.totalMandalas) ||
      !Number.isFinite(cache.atualizadoEm)
    ) {
      return null;
    }

    if (
      Date.now() - cache.atualizadoEm >
      CACHE_MAX_IDADE_MS
    ) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

/* =========================================================
   Funções auxiliares de data
========================================================= */

function obterDataHojeSaoPaulo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dataIsoParaUtc(dataIso: string) {
  const [ano, mes, dia] =
    dataIso.slice(0, 10).split("-").map(Number);

  return Date.UTC(ano, mes - 1, dia);
}

function diferencaDiasIso(
  dataMaisRecente: string,
  dataMaisAntiga: string
) {
  const UM_DIA_EM_MS =
    1000 * 60 * 60 * 24;

  return Math.round(
    (
      dataIsoParaUtc(dataMaisRecente) -
      dataIsoParaUtc(dataMaisAntiga)
    ) / UM_DIA_EM_MS
  );
}

/* =========================================================
   Calcula as datas em que as cinco joias foram conquistadas
========================================================= */

function obterDatasComMandala(
  registros: RegistroJoia[]
) {
  const materiasPorData =
    new Map<string, Set<string>>();

  for (const registro of registros) {
    const dataIso =
      registro.data_conquista.slice(0, 10);

    if (!materiasPorData.has(dataIso)) {
      materiasPorData.set(
        dataIso,
        new Set<string>()
      );
    }

    materiasPorData
      .get(dataIso)
      ?.add(registro.materia_id);
  }

  return Array.from(
    materiasPorData.entries()
  )
    .filter(([, materiasConquistadas]) => {
      return MATERIAS_MANDALA.every(
        (materiaId) =>
          materiasConquistadas.has(materiaId)
      );
    })
    .map(([dataIso]) => dataIso)
    .sort((dataA, dataB) =>
      dataA.localeCompare(dataB)
    );
}

/* =========================================================
   Calcula a sequência atual de Mandalas
========================================================= */

function calcularPersistenciaMandala(
  datasComMandala: string[]
) {
  if (datasComMandala.length === 0) {
    return 0;
  }

  const hoje = obterDataHojeSaoPaulo();

  const ultimaData =
    datasComMandala[
      datasComMandala.length - 1
    ];

  /*
   * A sequência continua válida quando a última Mandala
   * foi conquistada hoje ou ontem. O dia atual ainda não
   * concluído não quebra a persistência.
   */
  const distanciaAteHoje =
    diferencaDiasIso(hoje, ultimaData);

  if (
    distanciaAteHoje < 0 ||
    distanciaAteHoje > 1
  ) {
    return 0;
  }

  let diasSeguidos = 1;

  for (
    let indice =
      datasComMandala.length - 1;
    indice > 0;
    indice -= 1
  ) {
    const dataAtual =
      datasComMandala[indice];

    const dataAnterior =
      datasComMandala[indice - 1];

    const diferenca =
      diferencaDiasIso(
        dataAtual,
        dataAnterior
      );

    if (diferenca !== 1) {
      break;
    }

    diasSeguidos += 1;
  }

  return diasSeguidos;
}

/* =========================================================
   Skeleton
========================================================= */

function DashboardMandalaSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      <div className="grid w-full grid-cols-2 gap-2 sm:hidden">
        <div className="h-[66px] rounded-[18px] bg-white/10" />
        <div className="h-[66px] rounded-[18px] bg-white/10" />
      </div>

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

export default function StudentDashboard_Resumo() {
  const carregamentoEmAndamentoRef =
    useRef<Promise<void> | null>(null);

  const ultimoCarregamentoRef =
    useRef(0);

  const [diasSeguidos, setDiasSeguidos] =
    useState(0);

  const [totalMandalas, setTotalMandalas] =
    useState(0);

  const [
    carregandoDashboard,
    setCarregandoDashboard,
  ] = useState(true);

  const [
    temDadosIniciais,
    setTemDadosIniciais,
  ] = useState(false);

  const aplicarDadosDashboard =
    useCallback(
      (
        dados: Omit<
          DashboardMandala,
          "atualizadoEm"
        >
      ) => {
        setDiasSeguidos(
          dados.diasSeguidos
        );

        setTotalMandalas(
          dados.totalMandalas
        );

        setTemDadosIniciais(true);

        salvarCacheDashboardMandala({
          ...dados,
          atualizadoEm: Date.now(),
        });
      },
      []
    );

  const carregarDashboard =
    useCallback(
      async (options?: {
        silencioso?: boolean;
        forcar?: boolean;
      }) => {
        const silencioso =
          options?.silencioso ?? false;

        const forcar =
          options?.forcar ?? false;

        const agora = Date.now();

        if (
          !forcar &&
          agora -
            ultimoCarregamentoRef.current <
            2500
        ) {
          return (
            carregamentoEmAndamentoRef.current ??
            Promise.resolve()
          );
        }

        if (
          carregamentoEmAndamentoRef.current
        ) {
          return (
            carregamentoEmAndamentoRef.current
          );
        }

        const carregamento = (async () => {
          try {
            ultimoCarregamentoRef.current =
              Date.now();

            if (
              !silencioso &&
              !temDadosIniciais
            ) {
              setCarregandoDashboard(true);
            }

            const {
              data: { session },
            } =
              await supabase.auth.getSession();

            if (!session?.user) {
              aplicarDadosDashboard({
                diasSeguidos: 0,
                totalMandalas: 0,
              });

              return;
            }

            const { data, error } =
              await supabase
                .from(
                  "next_joias_usuario"
                )
                .select(
                  "materia_id, data_conquista"
                )
                .eq(
                  "usuario_id",
                  session.user.id
                )
                .in(
                  "materia_id",
                  [...MATERIAS_MANDALA]
                )
                .order(
                  "data_conquista",
                  { ascending: true }
                );

            if (error) {
              throw error;
            }

            const datasComMandala =
              obterDatasComMandala(
                (data ?? []) as RegistroJoia[]
              );

            aplicarDadosDashboard({
              diasSeguidos:
                calcularPersistenciaMandala(
                  datasComMandala
                ),

              totalMandalas:
                datasComMandala.length,
            });
          } catch (error) {
            if (
              process.env.NODE_ENV ===
              "development"
            ) {
              console.error(
                "Erro ao carregar painel de Mandalas:",
                error
              );
            }

            if (!temDadosIniciais) {
              aplicarDadosDashboard({
                diasSeguidos: 0,
                totalMandalas: 0,
              });
            }
          } finally {
            setCarregandoDashboard(false);

            carregamentoEmAndamentoRef.current =
              null;
          }
        })();

        carregamentoEmAndamentoRef.current =
          carregamento;

        return carregamento;
      },
      [
        aplicarDadosDashboard,
        temDadosIniciais,
      ]
    );

  /* =========================================================
     Carregamento inicial
  ========================================================= */

  useEffect(() => {
    const cache =
      lerCacheDashboardMandala();

    if (cache) {
      setDiasSeguidos(
        cache.diasSeguidos
      );

      setTotalMandalas(
        cache.totalMandalas
      );

      setTemDadosIniciais(true);
      setCarregandoDashboard(false);

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
     Atualizações silenciosas
  ========================================================= */

  useEffect(() => {
    const recarregarSilenciosamente =
      () => {
        void carregarDashboard({
          silencioso: true,
          forcar: true,
        });
      };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
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

    window.addEventListener(
      EVENTO_JOIA_CONQUISTADA,
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

      window.removeEventListener(
        EVENTO_JOIA_CONQUISTADA,
        recarregarSilenciosamente
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [carregarDashboard]);

  if (
    carregandoDashboard &&
    !temDadosIniciais
  ) {
    return <DashboardMandalaSkeleton />;
  }

  return (
    <MateriaResumoDashboardPadrao
      diasSeguidos={diasSeguidos}
      totalJoias={totalMandalas}
      nomeJoia="Mandalas"
      imagemJoia={IMAGEM_MANDALA}
    />
  );
}