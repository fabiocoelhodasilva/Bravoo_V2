"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import MatematicaResumoDashboard from "@/components/gamification/MatematicaResumoDashboard";
import { supabase } from "@/lib/supabase/client";
import { carregarJoiasSemana } from "@/lib/gamificacao/geral/carregar-joias-semana";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";
const IMAGEM_JOIA_MATEMATICA = "/imagens/joias/joia_verde.png";

const LABELS_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* =========================================================
   Funções auxiliares de data
========================================================= */

function parseIsoDateLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatIsoDateLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function addDays(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + quantidade);
  return novaData;
}

function getStartOfWeekSunday(data: Date) {
  const diaSemana = data.getDay();
  return addDays(data, -diaSemana);
}

function obterHojeLocalIso() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/* =========================================================
   Componente principal
========================================================= */

export default function MatematicaMenu() {
  const router = useRouter();

  const [dataSelecionada, setDataSelecionada] = useState(obterHojeLocalIso());
  const [joiasSemana, setJoiasSemana] = useState<Record<string, string>>({});

  const dataAtual = useMemo(
    () => parseIsoDateLocal(dataSelecionada),
    [dataSelecionada]
  );

  const inicioSemana = useMemo(
    () => getStartOfWeekSunday(dataAtual),
    [dataAtual]
  );

  const fimSemana = useMemo(() => addDays(inicioSemana, 6), [inicioSemana]);

  const diasDaSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = addDays(inicioSemana, index);

      return {
        date: data,
        iso: formatIsoDateLocal(data),
        diaNumero: data.getDate(),
        diaCurto: LABELS_DIAS_CURTOS[data.getDay()],
      };
    });
  }, [inicioSemana]);

  /* =========================================================
     Busca joias da semana
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarJoiasMatematica() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (!cancelado) {
            setJoiasSemana({});
          }

          return;
        }

        const resultado = await carregarJoiasSemana({
          supabase,
          usuarioId: user.id,
          materiaId: MATERIA_MATEMATICA_ID,
          dataInicio: formatIsoDateLocal(inicioSemana),
          dataFim: formatIsoDateLocal(fimSemana),
          imagemJoia: IMAGEM_JOIA_MATEMATICA,
        });

        if (!cancelado) {
          setJoiasSemana(resultado);
        }
      } catch (error) {
        console.error("Erro ao carregar joias da semana de Matemática:", error);

        if (!cancelado) {
          setJoiasSemana({});
        }
      }
    }

    void carregarJoiasMatematica();

    return () => {
      cancelado = true;
    };
  }, [inicioSemana, fimSemana]);

  /* =========================================================
     Navegação da semana
  ========================================================= */

  function navegarSemana(direcao: -1 | 1) {
    const novaData = addDays(dataAtual, direcao * 7);
    setDataSelecionada(formatIsoDateLocal(novaData));
  }

  /* =========================================================
     Logout
  ========================================================= */

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
    }
  }

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-3 pt-3 sm:px-4 sm:pt-10">
        <h1 className="mb-3 text-center text-[1.55rem] font-bold leading-tight gradient-text sm:mb-6 sm:text-4xl">
          Matemática
        </h1>

        <section
          className="mb-3 w-full max-w-sm rounded-[22px] px-2 py-3 sm:px-3"
          style={{
            background:
              "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
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
                boxShadow: "0 0 18px #7df2c255",
              }}
            >
              ‹
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5 sm:gap-2">
              {diasDaSemana.map((dia) => {
                const selecionado = dia.iso === dataSelecionada;
                const imagemJoiaDia = joiasSemana[dia.iso];

                return (
                  <button
                    key={dia.iso}
                    type="button"
                    onClick={() => setDataSelecionada(dia.iso)}
                    className="flex min-w-0 flex-col items-center justify-center rounded-[14px] px-0.5 py-1 transition active:scale-[0.97] sm:py-2"
                  >
                    <span
                      className={`mb-1 text-[0.58rem] font-semibold sm:mb-2 sm:text-[0.72rem] ${
                        selecionado ? "text-white" : "text-white/42"
                      }`}
                    >
                      {dia.diaCurto}
                    </span>

                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.78rem] font-bold transition sm:h-10 sm:w-10 sm:text-[0.95rem] ${
                        selecionado
                          ? "scale-[1.06] text-[var(--color-4)]"
                          : "text-white/88"
                      }`}
                      style={{
                        background: selecionado
                          ? "rgba(93,198,161,0.18)"
                          : "transparent",
                        borderColor: selecionado
                          ? "rgba(93,198,161,0.75)"
                          : "transparent",
                        boxShadow: selecionado
                          ? "0 0 18px rgba(93,198,161,0.45)"
                          : "none",
                      }}
                    >
                      {dia.diaNumero}
                    </span>

                    <span className="mt-0.5 flex h-4 items-center justify-center sm:h-5">
                      {imagemJoiaDia && (
                        <img
                          src={imagemJoiaDia}
                          alt="Esmeralda conquistada"
                          className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4"
                          draggable={false}
                        />
                      )}
                    </span>
                  </button>
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
                boxShadow: "0 0 18px #7df2c255",
              }}
            >
              ›
            </button>
          </div>
        </section>

        <div className="w-full max-w-sm">
          <MatematicaResumoDashboard />
        </div>

        <div className="mt-4 flex w-full max-w-sm animate-fade-in flex-col gap-3 sm:mt-6 sm:gap-5">
          <HomeFeatureCard
            title="Multiplicação"
            href="/matematica/multiplicacao"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />
        </div>

        <div className="mt-8 mb-6 sm:mt-12 sm:mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}