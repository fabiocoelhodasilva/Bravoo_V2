"use client";

/* =========================================================
   Imports
========================================================= */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

import Header from "../ui/Header";
import HomeFeatureCard from "../ui/HomeFeatureCard";
import StudentDashboard_Resumo from "../gamification/StudentDashboard_Resumo";
import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Carregamento leve da mandala/resumo
========================================================= */

const JornadaResumo = dynamic(
  () => import("../gamification/JornadaResumo"),
  {
    ssr: false,
    loading: () => null,
  }
);

/* =========================================================
   IDs fixos das matérias
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

const LABELS_DIAS_CURTOS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

/* =========================================================
   Eventos internos
========================================================= */

const EVENTO_JOIA_CONQUISTADA =
  "bravoo:joia-conquistada";

const DEZ_DIAS_EM_MS =
  10 * 24 * 60 * 60 * 1000;

/* =========================================================
   Tipos
========================================================= */

type DashboardResumo = {
  primeiro_nome: string | null;
  tem_joia_meu_dia: boolean;
  tem_joia_espiritual: boolean;
  tem_joia_geografia: boolean;
  tem_joia_matematica: boolean;
  tem_joia_virtudes: boolean;
};

type DashboardState = {
  nomeUsuario: string;
  temJoiaMeuDiaHoje: boolean;
  temJoiaEspiritualHoje: boolean;
  temJoiaGeografiaHoje: boolean;
  temJoiaMatematicaHoje: boolean;
  temJoiaVirtudesHoje: boolean;
};

type JoiaSemanaRegistro = {
  materia_id: string;
  data_conquista: string;
};

/* =========================================================
   Funções auxiliares
========================================================= */

function obterDataLocalHoje() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(
    2,
    "0"
  );
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function parseIsoDateLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);

  return new Date(ano, mes - 1, dia);
}

function formatIsoDateLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(
    2,
    "0"
  );
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function addDays(data: Date, quantidade: number) {
  const novaData = new Date(data);

  novaData.setDate(
    novaData.getDate() + quantidade
  );

  return novaData;
}

function getStartOfWeekSunday(data: Date) {
  return addDays(data, -data.getDay());
}

function usuarioTemAteDezDias(
  dataCadastro: string | undefined
) {
  if (!dataCadastro) {
    return false;
  }

  const dataCadastroEmMs = new Date(
    dataCadastro
  ).getTime();

  if (Number.isNaN(dataCadastroEmMs)) {
    return false;
  }

  const tempoDesdeCadastro =
    Date.now() - dataCadastroEmMs;

  return tempoDesdeCadastro <= DEZ_DIAS_EM_MS;
}

/* =========================================================
   Componente principal
========================================================= */

export default function StudentDashboard() {
  const componenteAtivoRef = useRef(true);
  const carregandoDashboardRef = useRef(false);

  const [dashboard, setDashboard] =
    useState<DashboardState>({
      nomeUsuario: "",
      temJoiaMeuDiaHoje: false,
      temJoiaEspiritualHoje: false,
      temJoiaGeografiaHoje: false,
      temJoiaMatematicaHoje: false,
      temJoiaVirtudesHoje: false,
    });

  const [carregarResumo, setCarregarResumo] =
    useState(false);

  const [mostrarPopup, setMostrarPopup] =
    useState(false);

  const [dataSemana, setDataSemana] =
    useState(obterDataLocalHoje());

  const [mandalasSemana, setMandalasSemana] =
    useState<Record<string, string>>({});

  const dataAtualSemana = useMemo(
    () => parseIsoDateLocal(dataSemana),
    [dataSemana]
  );

  const inicioSemana = useMemo(
    () => getStartOfWeekSunday(dataAtualSemana),
    [dataAtualSemana]
  );

  const fimSemana = useMemo(
    () => addDays(inicioSemana, 6),
    [inicioSemana]
  );

  const diasDaSemana = useMemo(() => {
    return Array.from(
      { length: 7 },
      (_, index) => {
        const data = addDays(
          inicioSemana,
          index
        );

        return {
          iso: formatIsoDateLocal(data),
          diaNumero: data.getDate(),
          diaCurto:
            LABELS_DIAS_CURTOS[data.getDay()],
        };
      }
    );
  }, [inicioSemana]);

  const hojeIso = useMemo(
    () => obterDataLocalHoje(),
    []
  );

  const {
    nomeUsuario,
    temJoiaMeuDiaHoje,
    temJoiaEspiritualHoje,
    temJoiaGeografiaHoje,
    temJoiaMatematicaHoje,
    temJoiaVirtudesHoje,
  } = dashboard;

  /* =========================================================
     Carrega dados mínimos do dashboard via RPC
  ========================================================= */

  const carregarDashboard = useCallback(async () => {
    if (carregandoDashboardRef.current) {
      return;
    }

    carregandoDashboardRef.current = true;

    try {
      const { data, error } = await supabase.rpc(
        "get_student_dashboard_resumo"
      );

      if (error) {
        if (
          process.env.NODE_ENV === "development"
        ) {
          console.error(
            "Erro ao carregar dashboard:",
            error
          );
        }

        return;
      }

      if (!componenteAtivoRef.current) {
        return;
      }

      const resumo = data?.[0] as
        | DashboardResumo
        | undefined;

      if (!resumo) {
        return;
      }

      setDashboard({
        nomeUsuario: resumo.primeiro_nome ?? "",

        temJoiaMeuDiaHoje: Boolean(
          resumo.tem_joia_meu_dia
        ),

        temJoiaEspiritualHoje: Boolean(
          resumo.tem_joia_espiritual
        ),

        temJoiaGeografiaHoje: Boolean(
          resumo.tem_joia_geografia
        ),

        temJoiaMatematicaHoje: Boolean(
          resumo.tem_joia_matematica
        ),

        temJoiaVirtudesHoje: Boolean(
          resumo.tem_joia_virtudes
        ),
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        if (
          process.env.NODE_ENV === "development"
        ) {
          console.error(
            "Erro ao consultar usuário autenticado:",
            userError
          );
        }

        setMostrarPopup(false);
        return;
      }

      const contaTemAteDezDias =
        usuarioTemAteDezDias(user?.created_at);

      if (!contaTemAteDezDias) {
        setMostrarPopup(false);
        return;
      }

      const hoje = obterDataLocalHoje();

      const chavePopup =
        "student_dashboard_popup_mandala_data";

      const ultimaDataPopup =
        localStorage.getItem(chavePopup);

      if (ultimaDataPopup !== hoje) {
        setMostrarPopup(true);
        localStorage.setItem(chavePopup, hoje);
      } else {
        setMostrarPopup(false);
      }
    } finally {
      carregandoDashboardRef.current = false;
    }
  }, []);

  /* =========================================================
     Carregamento inicial e atualização ao voltar para a tela
  ========================================================= */

  useEffect(() => {
    componenteAtivoRef.current = true;

    void carregarDashboard();

    function atualizarAoGanharFoco() {
      void carregarDashboard();
    }

    function atualizarAoMostrarPagina() {
      void carregarDashboard();
    }

    function atualizarAoConquistarJoia() {
      void carregarDashboard();
    }

    window.addEventListener(
      "focus",
      atualizarAoGanharFoco
    );

    window.addEventListener(
      "pageshow",
      atualizarAoMostrarPagina
    );

    window.addEventListener(
      EVENTO_JOIA_CONQUISTADA,
      atualizarAoConquistarJoia
    );

    return () => {
      componenteAtivoRef.current = false;

      window.removeEventListener(
        "focus",
        atualizarAoGanharFoco
      );

      window.removeEventListener(
        "pageshow",
        atualizarAoMostrarPagina
      );

      window.removeEventListener(
        EVENTO_JOIA_CONQUISTADA,
        atualizarAoConquistarJoia
      );
    };
  }, [carregarDashboard]);

  /* =========================================================
     Busca as Mandalas conquistadas na semana
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarMandalasSemana() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (erroUsuario || !user) {
          if (!cancelado) {
            setMandalasSemana({});
          }

          return;
        }

        const dataInicio =
          formatIsoDateLocal(inicioSemana);

        const dataFim =
          formatIsoDateLocal(fimSemana);

        const { data, error } = await supabase
          .from("next_joias_usuario")
          .select("materia_id, data_conquista")
          .eq("usuario_id", user.id)
          .in(
            "materia_id",
            [...MATERIAS_MANDALA]
          )
          .gte(
            "data_conquista",
            `${dataInicio} 00:00:00`
          )
          .lte(
            "data_conquista",
            `${dataFim} 23:59:59.999`
          );

        if (error) {
          throw error;
        }

        const materiasPorData =
          new Map<string, Set<string>>();

        for (
          const registro of
          (data ?? []) as JoiaSemanaRegistro[]
        ) {
          const dataIso =
            registro.data_conquista.slice(0, 10);

          if (!materiasPorData.has(dataIso)) {
            materiasPorData.set(
              dataIso,
              new Set()
            );
          }

          materiasPorData
            .get(dataIso)
            ?.add(registro.materia_id);
        }

        const resultado:
          Record<string, string> = {};

        for (
          const [
            dataIso,
            materiasConquistadas,
          ] of materiasPorData.entries()
        ) {
          const completouMandala =
            MATERIAS_MANDALA.every(
              (materiaId) =>
                materiasConquistadas.has(
                  materiaId
                )
            );

          if (completouMandala) {
            resultado[dataIso] =
              "/imagens/joias/mandala_5.png";
          }
        }

        if (!cancelado) {
          setMandalasSemana(resultado);
        }
      } catch (error) {
        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.error(
            "Erro ao carregar Mandalas da semana:",
            error
          );
        }

        if (!cancelado) {
          setMandalasSemana({});
        }
      }
    }

    void carregarMandalasSemana();

    return () => {
      cancelado = true;
    };
  }, [
    inicioSemana,
    fimSemana,
    temJoiaMeuDiaHoje,
    temJoiaEspiritualHoje,
    temJoiaGeografiaHoje,
    temJoiaMatematicaHoje,
    temJoiaVirtudesHoje,
  ]);

  /* =========================================================
     Navegação entre as semanas
  ========================================================= */

  function navegarSemana(direcao: -1 | 1) {
    const novaData = addDays(
      dataAtualSemana,
      direcao * 7
    );

    setDataSemana(
      formatIsoDateLocal(novaData)
    );
  }

  /* =========================================================
     Atrasa o carregamento do resumo para aliviar a primeira tela
  ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCarregarResumo(true);
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* =========================================================
     Lista de joias enviada para JornadaResumo
  ========================================================= */

  const joiasConquistadasHoje = useMemo(() => {
    return [
      ...(temJoiaMeuDiaHoje
        ? [MATERIA_MEU_DIA_ID]
        : []),

      ...(temJoiaEspiritualHoje
        ? [MATERIA_ESPIRITUAL_ID]
        : []),

      ...(temJoiaGeografiaHoje
        ? [MATERIA_GEOGRAFIA_ID]
        : []),

      ...(temJoiaMatematicaHoje
        ? [MATERIA_MATEMATICA_ID]
        : []),

      ...(temJoiaVirtudesHoje
        ? [MATERIA_VIRTUDES_ID]
        : []),
    ];
  }, [
    temJoiaMeuDiaHoje,
    temJoiaEspiritualHoje,
    temJoiaGeografiaHoje,
    temJoiaMatematicaHoje,
    temJoiaVirtudesHoje,
  ]);

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center font-sans pb-8">
      <Header />

      {mostrarPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111] px-6 py-8 text-center shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setMostrarPopup(false)
              }
              className="absolute right-4 top-4 text-2xl font-bold text-white/70 hover:text-white"
              aria-label="Fechar mensagem da mandala"
            >
              ×
            </button>

            <h2 className="bg-gradient-to-r from-[var(--color-4)] via-[var(--color-2)] to-[var(--color-5)] bg-clip-text text-3xl font-extrabold leading-tight text-transparent">
              Faça as atividades por matéria para
              conquistar as joias!
            </h2>

            <p className="mt-5 text-lg font-semibold leading-relaxed text-white/90">
              Conquiste as joias e complete sua
              mandala de hoje.
            </p>
          </div>
        </div>
      )}

      <h1 className="mb-6 mt-2 text-center text-3xl font-extrabold leading-tight sm:text-4xl">
        <span className="bg-gradient-to-r from-[var(--color-2)] via-[#ffb347] to-[var(--color-2)] bg-clip-text text-transparent">
          Olá
        </span>

        {nomeUsuario && (
          <>
            {" "}
            <span className="bg-gradient-to-r from-[var(--color-5)] via-[#4fc3ff] to-[var(--color-4)] bg-clip-text text-transparent">
              {nomeUsuario}
            </span>
          </>
        )}

        <span className="bg-gradient-to-r from-[var(--color-2)] via-[#ffb347] to-[var(--color-2)] bg-clip-text text-transparent">
          !
        </span>
      </h1>

      {/* =====================================================
          Calendário semanal de Mandalas
      ===================================================== */}

      <div className="mb-6 w-full max-w-sm px-4">
        <section
          className="w-full rounded-[22px] px-2 py-3 sm:px-3"
          style={{
            background:
              "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
            border:
              "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
          }}
        >
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => navegarSemana(-1)}
              aria-label="Semana anterior"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
              style={{
                borderColor: "#7df2c299",
                boxShadow:
                  "0 0 18px #7df2c255",
              }}
            >
              ‹
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5 sm:gap-2">
              {diasDaSemana.map((dia) => {
                const ehHoje =
                  dia.iso === hojeIso;

                const imagemMandalaDia =
                  mandalasSemana[dia.iso];

                return (
                  <div
                    key={dia.iso}
                    className="flex min-w-0 flex-col items-center justify-center rounded-[14px] px-0.5 py-1 sm:py-2"
                  >
                    <span
                      className={`mb-1 text-[0.58rem] font-semibold sm:mb-2 sm:text-[0.72rem] ${
                        ehHoje
                          ? "text-[var(--color-2)]"
                          : "text-white/42"
                      }`}
                    >
                      {dia.diaCurto}
                    </span>

                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.78rem] font-bold transition sm:h-10 sm:w-10 sm:text-[0.95rem] ${
                        ehHoje
                          ? "scale-[1.06] text-[var(--color-2)]"
                          : "text-white/88"
                      }`}
                      style={{
                        background: ehHoje
                          ? "rgba(233,137,29,0.18)"
                          : "transparent",
                        borderColor: ehHoje
                          ? "rgba(233,137,29,0.82)"
                          : "transparent",
                        boxShadow: ehHoje
                          ? "0 0 18px rgba(233,137,29,0.45)"
                          : "none",
                      }}
                    >
                      {dia.diaNumero}
                    </span>

                    <span className="mt-0.5 flex h-5 items-center justify-center sm:h-6">
                      {imagemMandalaDia && (
                        <img
                          src="/imagens/joias/mandala_5.png"
                          alt="Mandala conquistada"
                          className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                          draggable={false}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navegarSemana(1)}
              aria-label="Próxima semana"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
              style={{
                borderColor: "#7df2c299",
                boxShadow:
                  "0 0 18px #7df2c255",
              }}
            >
              ›
            </button>
          </div>
        </section>
      </div>

      {/* =====================================================
          Painel geral de Persistência e Mandalas
      ===================================================== */}

      <div className="mb-6 w-full max-w-sm px-4">
        <StudentDashboard_Resumo />
      </div>

      <div className="flex flex-col gap-5 w-full max-w-sm px-4">
        <HomeFeatureCard
          title="Minha Jornada"
          href="/meu-dia"
          prefetch={false}
          colorClass="bg-[var(--color-2)] hover:brightness-110"
          joiaCor={
            temJoiaMeuDiaHoje
              ? "laranja"
              : undefined
          }
        />

        <HomeFeatureCard
          title="Espiritual"
          href="/jardim"
          prefetch={false}
          colorClass="bg-[var(--color-1)] hover:brightness-110"
          joiaCor={
            temJoiaEspiritualHoje
              ? "vermelha"
              : undefined
          }
        />

        <HomeFeatureCard
          title="Geografia"
          href="/geografia"
          prefetch={false}
          colorClass="bg-[var(--color-5)] hover:brightness-110"
          joiaCor={
            temJoiaGeografiaHoje
              ? "azul"
              : undefined
          }
        />

        <HomeFeatureCard
          title="Matemática"
          href="/matematica"
          prefetch={false}
          colorClass="bg-[var(--color-4)] hover:brightness-110"
          joiaCor={
            temJoiaMatematicaHoje
              ? "verde"
              : undefined
          }
        />

        <HomeFeatureCard
          title="Virtudes"
          href="/virtudes"
          prefetch={false}
          colorClass="bg-[var(--color-6)] hover:brightness-110"
          joiaCor={
            temJoiaVirtudesHoje
              ? "roxa"
              : undefined
          }
        />
      </div>

      {carregarResumo && (
        <div className="mt-6 flex w-full justify-center px-4 sm:mt-8">
          <JornadaResumo
            joiasConquistadas={joiasConquistadasHoje}
          />
        </div>
      )}
    </div>
  );
}