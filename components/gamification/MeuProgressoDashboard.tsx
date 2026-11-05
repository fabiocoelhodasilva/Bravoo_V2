"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { obterPerfilAtivo } from "@/lib/perfis/perfil-client";
import { supabase } from "@/lib/supabase/client";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import CalendarioMandalasPanel from "@/components/gamification/CalendarioMandalasPanel";

type AreaProgresso = {
  id: string;
  nome: string;
  cor: string;
  joias: number;
};

type RegistroJoia = {
  materia_id: string;
  data_conquista: string;
};

const IMAGEM_MANDALA = "/imagens/joias/mandala_5.png";

type PeriodoProgresso = "mes" | "ano";

const AREAS = [
  {
    id: "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001",
    nome: "Minha Jornada",
    cor: "#f39a28",
  },
  {
    id: "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111",
    nome: "Espiritual",
    cor: "#ed4e59",
  },
  {
    id: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    nome: "Geografia",
    cor: "#28a9e0",
  },
  {
    id: "24b7c418-81b4-47c2-b96f-f051786fa187",
    nome: "Matemática",
    cor: "#2bd1a0",
  },
  {
    id: "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11",
    nome: "Virtudes",
    cor: "#bd66ed",
  },
] as const;

function obterDataSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function deslocarDataIso(dataIso: string, dias: number) {
  const data = new Date(`${dataIso}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function inicioDiaUtcSaoPaulo(dataIso: string) {
  // O início do dia em São Paulo corresponde a 03:00 UTC.
  return new Date(`${dataIso}T03:00:00.000Z`).toISOString();
}

function obterDatasComMandala(registros: RegistroJoia[]) {
  const materiasPorData = new Map<string, Set<string>>();

  for (const registro of registros) {
    const dataIso = registro.data_conquista.slice(0, 10);
    if (!materiasPorData.has(dataIso)) {
      materiasPorData.set(dataIso, new Set<string>());
    }
    materiasPorData.get(dataIso)?.add(registro.materia_id);
  }

  return Array.from(materiasPorData.entries())
    .filter(([, materias]) => AREAS.every((area) => materias.has(area.id)))
    .map(([dataIso]) => dataIso)
    .sort((dataA, dataB) => dataA.localeCompare(dataB));
}

function GraficoBarras({
  areas,
  maximoJoias,
  periodo,
}: {
  areas: AreaProgresso[];
  maximoJoias: number;
  periodo: PeriodoProgresso;
}) {
  const alturaMaximaBarra = 88;
  const nomePeriodo = periodo === "mes" ? "mês atual" : "ano atual";

  return (
    <div
      role="img"
      aria-label={`Gráfico de barras com as joias conquistadas nas cinco áreas no ${nomePeriodo}. ${areas
        .map((area) => `${area.nome}: ${area.joias}`)
        .join(", ")}.`}
      className="mx-auto w-full max-w-[900px] px-1 pt-5 sm:px-3 sm:pt-7"
    >
      {/* Área do gráfico: as linhas de referência ajudam a comparar as alturas. */}
      <div className="relative h-[220px] sm:h-[252px]">
        {[0, 25, 50, 75, 100].map((posicao) => (
          <div
            key={posicao}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 border-t border-white/[0.08]"
            style={{ bottom: `${posicao}%` }}
          />
        ))}

        <div className="relative z-10 grid h-full grid-cols-5 gap-1 sm:gap-3">
          {AREAS.map((configuracao) => {
            const area = areas.find((item) => item.id === configuracao.id);
            const quantidade = area?.joias ?? 0;
            const alturaBarra =
              (Math.min(quantidade, maximoJoias) / Math.max(1, maximoJoias)) *
              alturaMaximaBarra;

            return (
              <div key={configuracao.id} className="relative h-full min-w-0">
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 z-20 -translate-x-1/2 text-sm font-extrabold leading-none text-white sm:text-base"
                  style={{ bottom: `calc(${alturaBarra}% + 9px)` }}
                >
                  {quantidade}
                </span>
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 w-7 -translate-x-1/2 rounded-t-lg shadow-[0_0_18px_rgba(255,255,255,0.08)] sm:w-10 xl:w-12"
                  style={{
                    height: `${alturaBarra}%`,
                    background: `linear-gradient(180deg, ${configuracao.cor}, ${configuracao.cor}cc)`,
                    boxShadow: `0 0 18px ${configuracao.cor}35`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Rótulos em cinco colunas; no celular, nomes longos quebram em duas linhas. */}
      <div className="mt-3 grid grid-cols-5 gap-1 sm:gap-3">
        {AREAS.map((area) => (
          <div
            key={area.id}
            className="min-w-0 break-words text-center text-[0.62rem] font-bold leading-tight text-white/90 sm:text-sm"
          >
            {area.nome}
          </div>
        ))}
      </div>

    </div>
  );
}

export default function MeuProgressoDashboard() {
  const [hojeIso] = useState(() => obterDataSaoPaulo(new Date()));
  const [periodo, setPeriodo] = useState<PeriodoProgresso>("ano");
  const inicioIso = useMemo(() => {
    if (periodo === "ano") {
      return `${hojeIso.slice(0, 4)}-01-01`;
    }

    return `${hojeIso.slice(0, 7)}-01`;
  }, [hojeIso, periodo]);
  const fimExclusivoIso = useMemo(() => deslocarDataIso(hojeIso, 1), [hojeIso]);
  const [registros, setRegistros] = useState<RegistroJoia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [mostrarModalPremium, setMostrarModalPremium] = useState(false);
  const [mostrarCalendarioMandalas, setMostrarCalendarioMandalas] = useState(false);
  const [datasComMandala, setDatasComMandala] = useState<string[]>([]);
  const [carregandoCalendario, setCarregandoCalendario] = useState(false);
  const [erroCalendario, setErroCalendario] = useState("");

  const abrirCalendarioMandalas = useCallback(async () => {
    if (carregandoCalendario) return;

    setCarregandoCalendario(true);
    setErroCalendario("");

    try {
      const perfil = await obterPerfilAtivo();
      if (!perfil) {
        setDatasComMandala([]);
        setMostrarCalendarioMandalas(true);
        return;
      }

      const { data, error: erroConsulta } = await supabase
        .from("next_joias_usuario")
        .select("materia_id, data_conquista")
        .eq("usuario_id", perfil.id)
        .in("materia_id", AREAS.map((area) => area.id))
        .order("data_conquista", { ascending: true });

      if (erroConsulta) throw erroConsulta;

      setDatasComMandala(obterDatasComMandala((data ?? []) as RegistroJoia[]));
      setMostrarCalendarioMandalas(true);
    } catch (error) {
      console.error("Erro ao carregar calendário de Mandalas:", error);
      setErroCalendario("Não foi possível abrir o calendário agora. Tente novamente.");
    } finally {
      setCarregandoCalendario(false);
    }
  }, [carregandoCalendario]);

  const carregarProgresso = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setRegistros([]);

    try {
      const perfil = await obterPerfilAtivo();
      if (!perfil) {
        setRegistros([]);
        return;
      }

      const resultadoJoiasPeriodo = await supabase
        .from("next_joias_usuario")
        .select("materia_id, data_conquista")
        .eq("usuario_id", perfil.id)
        .in("materia_id", AREAS.map((area) => area.id))
        .gte("data_conquista", inicioDiaUtcSaoPaulo(inicioIso))
        .lt("data_conquista", inicioDiaUtcSaoPaulo(fimExclusivoIso));

      if (resultadoJoiasPeriodo.error) throw resultadoJoiasPeriodo.error;
      setRegistros((resultadoJoiasPeriodo.data ?? []) as RegistroJoia[]);
    } catch (error) {
      console.error("Erro ao carregar Meu Progresso:", error);
      setErro("Não foi possível carregar seu progresso agora.");
    } finally {
      setCarregando(false);
    }
  }, [fimExclusivoIso, inicioIso]);

  useEffect(() => {
    void carregarProgresso();
  }, [carregarProgresso, tentativa]);

  const progresso = useMemo(() => {
    const areas: AreaProgresso[] = AREAS.map((area) => ({
      ...area,
      joias: registros.filter((registro) => registro.materia_id === area.id).length,
    }));

    // Uma Mandala por data, seguindo a mesma regra do painel principal,
    // mas limitada ao período selecionado.
    const materiasPorData = new Map<string, Set<string>>();

    for (const registro of registros) {
      const dataIso = registro.data_conquista.slice(0, 10);
      if (!materiasPorData.has(dataIso)) {
        materiasPorData.set(dataIso, new Set());
      }
      materiasPorData.get(dataIso)?.add(registro.materia_id);
    }

    const totalMandalas = Array.from(materiasPorData.values()).filter((materias) =>
      AREAS.every((area) => materias.has(area.id)),
    ).length;

    return { areas, totalMandalas };
  }, [registros]);

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-black px-4 pb-8 pt-12 font-sans text-white sm:px-6 sm:pb-3 xl:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-[var(--color-2)] via-[#ffb347] to-[var(--color-2)] bg-clip-text text-transparent">
                Meu Progresso
              </span>
            </h1>
          </div>
          <div
            className="grid w-full max-w-[210px] grid-cols-2 gap-1 rounded-[16px] border border-white/10 bg-black/20 p-1 sm:w-[190px]"
            role="group"
            aria-label="Período do gráfico"
          >
            <AbaPeriodo ativa={periodo === "mes"} onClick={() => setPeriodo("mes")}>
              Mês
            </AbaPeriodo>
            <AbaPeriodo ativa={periodo === "ano"} onClick={() => setPeriodo("ano")}>
              Ano
            </AbaPeriodo>
          </div>
        </header>

        {erro && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <p role="alert">{erro}</p>
            <button
              type="button"
              onClick={() => setTentativa((valor) => valor + 1)}
              className="font-bold underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="mb-5">
          <button
            type="button"
            onClick={() => void abrirCalendarioMandalas()}
            disabled={carregandoCalendario}
            aria-label="Abrir calendário de Mandalas"
            aria-busy={carregandoCalendario}
            className="flex min-h-[104px] w-full items-center gap-4 rounded-2xl border border-[#27758b]/45 bg-[linear-gradient(135deg,#10232d_0%,#0d171d_58%,#0b1115_100%)] p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.32)] transition hover:border-[#3ba2bb]/70 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ba2bb] disabled:cursor-wait sm:gap-5 sm:p-5"
          >
            <img
              src={IMAGEM_MANDALA}
              alt="Mandala"
              className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(255,196,46,0.55)] sm:h-[76px] sm:w-[76px]"
              draggable={false}
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-white/90">MANDALAS</p>
              <div className="mt-1 flex items-baseline gap-2">
                <strong className="text-4xl font-black leading-none text-white">{carregando || erro ? "—" : progresso.totalMandalas}</strong>
              </div>
              {carregandoCalendario && <span className="mt-1 block text-xs text-white/55">Abrindo calendário…</span>}
            </div>
          </button>
          {erroCalendario && <p className="mt-2 px-1 text-sm text-red-300" role="alert">{erroCalendario}</p>}
        </section>

        <section className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#131719]/95 via-[#0d1113]/95 to-[#15120d]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.38)] sm:p-5 xl:p-6">
          <div className="mb-2 flex items-center justify-between gap-3 px-1 sm:px-2">
            <div>
              <h2 className="text-base font-extrabold sm:text-lg">Joias conquistadas por área de desenvolvimento</h2>
            </div>
            {carregando && <span className="text-xs text-white/50">Atualizando…</span>}
          </div>

          {carregando && registros.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center text-sm text-white/55">Carregando seu progresso…</div>
          ) : (
            <GraficoBarras
              areas={progresso.areas}
              maximoJoias={Math.max(1, ...progresso.areas.map((area) => area.joias))}
              periodo={periodo}
            />
          )}
        </section>

        {/* Chamada para a análise detalhada Premium. */}
        <section className="mx-auto mt-4 w-full max-w-[900px]">
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between sm:gap-4">
            <p className="max-w-xl text-center text-sm leading-relaxed text-white/70 sm:text-left">
              Descubra tendências, pontos fortes e oportunidades de desenvolvimento.
            </p>
            <button
              type="button"
              onClick={() => setMostrarModalPremium(true)}
              className="inline-flex w-full max-w-[300px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e9891d] to-[#e6b73f] px-4 py-3 text-sm font-extrabold text-[#21170b] shadow-[0_6px_18px_rgba(230,183,63,0.16)] transition hover:brightness-110 active:scale-[0.98] sm:w-auto sm:max-w-none"
            >
              <span>Raio X Bravoo (Premium)</span>
              <span aria-hidden="true" className="text-base leading-none">→</span>
            </button>
          </div>
        </section>

        <BotaoVoltar />
      </div>

      {mostrarModalPremium && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMostrarModalPremium(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-raio-x-premium"
            className="w-full max-w-md rounded-3xl border border-[#e6b73f]/35 bg-gradient-to-br from-[#152027] to-[#11100c] p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
          >
            <span className="inline-flex rounded-full border border-[#e6b73f]/30 bg-[#e6b73f]/10 px-3 py-1 text-xs font-black tracking-[0.12em] text-[#f5d77b]">
              BRAVOO PREMIUM
            </span>
            <h2 id="titulo-raio-x-premium" className="mt-4 text-2xl font-extrabold text-white">
              Raio X Bravoo
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              A análise detalhada da sua evolução será uma experiência Premium do Bravoo.
            </p>
            <button
              type="button"
              onClick={() => setMostrarModalPremium(false)}
              className="mt-6 rounded-xl bg-[#e6b73f] px-6 py-3 text-sm font-black text-[#241a0c] transition hover:brightness-110 active:scale-[0.98]"
            >
              Entendi
            </button>
          </section>
        </div>
      )}

      {mostrarCalendarioMandalas && (
        <CalendarioMandalasPanel
          datasComMandala={datasComMandala}
          onClose={() => setMostrarCalendarioMandalas(false)}
        />
      )}
    </main>
  );
}

function AbaPeriodo({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativa}
      className={`rounded-[12px] px-2 py-2 text-[0.68rem] font-black transition ${
        ativa
          ? "bg-[#e6b73f] text-[#241a0c] shadow-[0_5px_14px_rgba(230,183,63,0.2)]"
          : "text-white/55 hover:bg-white/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}
