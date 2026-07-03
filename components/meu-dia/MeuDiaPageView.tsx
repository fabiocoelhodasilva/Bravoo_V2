"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BottomNav from "../ui/BottomNav";
import HeaderInterno from "../ui/HeaderInterno";
import DeleteButton from "../ui/DeleteButton";
import MeuDiaResumoDashboard from "../gamification/MeuDiaResumoDashboard";

type Tarefa = {
  id: string;
  titulo: string;
  concluida: boolean;
};

type Props = {
  onLogout: () => Promise<void>;
  tarefasIniciais?: Tarefa[];
  onToggleTarefa?: (id: string) => Promise<void> | void;
  onDeleteTarefa?: (id: string) => Promise<void>;
  salvandoIds?: string[];
  deletingIds?: string[];
  dataSelecionada: string;
  onSelecionarData: (data: string) => void;
  totalTopazios?: number;
  diasSeguidos?: number;
};

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

const LABELS_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MeuDiaPageView({
  onLogout,
  tarefasIniciais = [],
  onToggleTarefa,
  onDeleteTarefa,
  salvandoIds = [],
  deletingIds = [],
  dataSelecionada,
  onSelecionarData,
  totalTopazios = 0,
  diasSeguidos = 0,
}: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<Tarefa | null>(null);
  const [feedbackErro, setFeedbackErro] = useState("");

  useEffect(() => {
    setTarefas(tarefasIniciais);
  }, [tarefasIniciais]);

  useEffect(() => {
    if (!feedbackErro) return;

    const timer = window.setTimeout(() => {
      setFeedbackErro("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [feedbackErro]);

  async function toggleTarefa(id: string) {
    if (salvandoIds.includes(id) || deletingIds.includes(id)) return;

    const tarefaAtual = tarefas.find((tarefa) => tarefa.id === id);
    if (!tarefaAtual) return;

    const novoStatus = !tarefaAtual.concluida;

    setTarefas((prev) =>
      prev.map((tarefa) =>
        tarefa.id === id ? { ...tarefa, concluida: novoStatus } : tarefa
      )
    );

    try {
      await onToggleTarefa?.(id);
    } catch (error) {
      console.error("Erro ao alternar tarefa:", error);

      setTarefas((prev) =>
        prev.map((tarefa) =>
          tarefa.id === id
            ? { ...tarefa, concluida: tarefaAtual.concluida }
            : tarefa
        )
      );
    }
  }

  async function confirmarDeleteTarefa() {
    if (!tarefaParaExcluir || !onDeleteTarefa) return;

    try {
      await onDeleteTarefa(tarefaParaExcluir.id);
      setTarefaParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      setFeedbackErro("Não foi possível excluir a tarefa.");
    }
  }

  const dataAtual = useMemo(
    () => parseIsoDateLocal(dataSelecionada),
    [dataSelecionada]
  );

  const inicioSemana = useMemo(
    () => getStartOfWeekSunday(dataAtual),
    [dataAtual]
  );

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


  const hojeIso = useMemo(() => obterHojeLocalIso(), []);
  const podeExcluirNoDiaSelecionado = dataSelecionada >= hojeIso;

  function navegarSemana(direcao: -1 | 1) {
    const novaData = addDays(dataAtual, direcao * 7);
    onSelecionarData(formatIsoDateLocal(novaData));
  }

  const pendentes = tarefas.filter((tarefa) => !tarefa.concluida).length;
  const feitas = tarefas.filter((tarefa) => tarefa.concluida).length;

  return (
    <>
      <main className="min-h-screen bg-black text-white flex flex-col">
        <HeaderInterno onLogout={onLogout} />

        <div className="flex-1 w-full max-w-[1100px] mx-auto px-3 pt-[50px] pb-[110px] sm:px-4 sm:pt-[60px] sm:pb-[120px]">
          <div className="mb-2 flex flex-col items-center sm:mb-5">
            <div className="relative w-full">
              <h1 className="mb-2 text-center text-[1.55rem] font-bold leading-tight gradient-text sm:mb-6 sm:text-4xl">
                Meu Dia
              </h1>
            </div>
          </div>

          <section
            className="mb-3 rounded-[22px] px-2 py-3 sm:px-3"
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

                  return (
                    <button
                      key={dia.iso}
                      type="button"
                      onClick={() => onSelecionarData(dia.iso)}
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
                          selecionado ? "scale-[1.06] text-[var(--color-2)]" : "text-white/88"
                        }`}
                        style={{
                          background: selecionado ? "rgba(233,137,29,0.18)" : "transparent",
                          borderColor: selecionado ? "rgba(233,137,29,0.75)" : "transparent",
                          boxShadow: selecionado ? "0 0 18px rgba(233,137,29,0.45)" : "none",
                        }}
                      >
                        {dia.diaNumero}
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

          <div className="mb-3 w-full sm:mb-5">
            <MeuDiaResumoDashboard
              diasSeguidos={diasSeguidos}
              totalJoias={totalTopazios}
            />
          </div>

          <section
            className="mb-3 rounded-[20px] px-3 py-[6px] sm:rounded-[22px] sm:px-4 sm:py-4"
            style={{
              background:
                "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <p className="mb-0.5 text-center text-[10px] sm:text-[12px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
              Atividades
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 sm:gap-3">
              <div className="flex min-h-[34px] sm:min-h-[52px] flex-col items-center justify-center text-center">
                <Link
                  href="/meu-dia/novo"
                  aria-label="Adicionar tarefa"
                  title="Adicionar tarefa"
                  className="flex h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-[var(--color-2)] text-[1.3rem] sm:text-[1.5rem] font-black text-black shadow-[0_0_18px_rgba(233,137,29,0.35)] transition active:scale-[0.95]"
                >
                  +
                </Link>

                <div className="mt-0.5 text-[0.78rem] sm:text-[0.9rem] text-[#bdbdbd] font-medium">
                  Adicionar
                </div>
              </div>

              <div className="w-px h-12 bg-white/10" />

              <div className="flex min-h-[34px] sm:min-h-[52px] flex-col items-center justify-center text-center">
                <div className="text-[1.7rem] sm:text-[2rem] leading-none font-black text-[var(--color-2)]">
                  {pendentes}
                </div>
                <div className="mt-0.5 text-[0.78rem] sm:text-[0.9rem] text-[#bdbdbd] font-medium">
                  Pendentes
                </div>
              </div>

              <div className="w-px h-12 bg-white/10" />

              <div className="flex min-h-[34px] sm:min-h-[52px] flex-col items-center justify-center text-center">
                <div className="text-[1.7rem] sm:text-[2rem] leading-none font-black text-[var(--color-4)]">
                  {feitas}
                </div>
                <div className="mt-0.5 text-[0.78rem] sm:text-[0.9rem] text-[#bdbdbd] font-medium">
                  Feitas
                </div>
              </div>
            </div>
          </section>

          {tarefas.length === 0 ? (
            <section className="mt-20 flex flex-col items-center justify-center text-center">
              <div className="mb-2 text-[1.15rem] text-white/90">
                Nada planejado ainda 🗓️
              </div>
              <p className="max-w-[260px] text-[0.9rem] text-white/50">
                Toque no botão + para adicionar tarefas do seu dia.
              </p>
            </section>
          ) : (
            <div className="flex flex-col gap-1 sm:gap-2">
              {tarefas.map((tarefa) => {
                const salvando = salvandoIds.includes(tarefa.id);
                const deletando = deletingIds.includes(tarefa.id);

                return (
                  <div
                    key={tarefa.id}
                    className={`flex items-center gap-2 rounded-[16px] border border-white/8 bg-[#0a0a0a] px-3 py-[5px] sm:py-2 transition hover:border-white/15 hover:bg-[#0d0d0d] ${
                      salvando || deletando ? "opacity-70" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void toggleTarefa(tarefa.id)}
                      disabled={salvando || deletando}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={`h-[18px] w-[18px] sm:h-5 sm:w-5 shrink-0 rounded-full border flex items-center justify-center text-[0.7rem] ${
                          tarefa.concluida
                            ? "bg-[var(--color-4)] text-black border-[var(--color-4)]"
                            : "border-white/30 text-transparent"
                        }`}
                      >
                        ✓
                      </div>

                      <span
                        className={`flex-1 text-[0.87rem] sm:text-[0.95rem] ${
                          tarefa.concluida
                            ? "line-through text-white/40"
                            : "text-white"
                        }`}
                      >
                        {tarefa.titulo}
                      </span>

                      {salvando && (
                        <span className="shrink-0 text-[0.72rem] text-white/45">
                          salvando...
                        </span>
                      )}
                    </button>

                    {podeExcluirNoDiaSelecionado && (
                      <DeleteButton
                        onClick={() => setTarefaParaExcluir(tarefa)}
                        disabled={deletando || salvando}
                        ariaLabel={`Excluir tarefa ${tarefa.titulo}`}
                        title="Excluir tarefa"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          
        </div>

        <BottomNav active="meu-dia" />
      </main>

      {feedbackErro && (
        <div className="fixed top-4 left-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2">
          <div className="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100 shadow-lg">
            {feedbackErro}
          </div>
        </div>
      )}

      {tarefaParaExcluir && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-5 text-center shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Excluir tarefa
            </h2>

            <p className="mb-5 text-sm text-white/75">
              Deseja excluir a tarefa{" "}
              <span className="font-semibold text-white">
                {tarefaParaExcluir.titulo}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTarefaParaExcluir(null)}
                className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void confirmarDeleteTarefa()}
                className="flex-1 rounded-2xl bg-[var(--color-1,#c94a4a)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}