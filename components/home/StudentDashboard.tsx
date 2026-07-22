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
        <div className="student-dashboard-mandala mt-5 sm:mt-8">
          <JornadaResumo
            joiasConquistadas={
              joiasConquistadasHoje
            }
          />
        </div>
      )}

      {/* =====================================================
          Ajuste exclusivo para celular:
          reduz a Mandala em 15% e também reduz o espaço
          ocupado por ela no fluxo da página.
      ===================================================== */}
      <style jsx global>{`
        @media (max-width: 639px) {
          .student-dashboard-mandala {
            display: flex;
            width: 100%;
            justify-content: center;
            align-items: flex-start;
          }

          .student-dashboard-mandala > * {
            zoom: 0.85;
          }

          @supports not (zoom: 1) {
            .student-dashboard-mandala > * {
              transform: scale(0.85);
              transform-origin: top center;
            }

            .student-dashboard-mandala {
              margin-bottom: -48px;
            }
          }
        }
      `}</style>
    </div>
  );
}