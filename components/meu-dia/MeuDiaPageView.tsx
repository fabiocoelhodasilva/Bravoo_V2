"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BottomNav from "../ui/BottomNav";
import HeaderInterno from "../ui/HeaderInterno";
import BotaoVoltar from "../ui/BotaoVoltar";

type Tarefa = {
  id: string;
  titulo: string;
  concluida: boolean;
};

type Props = {
  onLogout: () => Promise<void>;
  tarefasIniciais?: Tarefa[];
};

export function MeuDiaPageView({
  onLogout,
  tarefasIniciais = [],
}: Props) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais);

  function toggleTarefa(id: string) {
    setTarefas((prev) =>
      prev.map((tarefa) =>
        tarefa.id === id
          ? { ...tarefa, concluida: !tarefa.concluida }
          : tarefa
      )
    );
  }

  const hojeFormatado = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(new Date());
  }, []);

  const pendentes = tarefas.filter((t) => !t.concluida).length;
  const feitas = tarefas.filter((t) => t.concluida).length;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <HeaderInterno onLogout={onLogout} />

      <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 pt-[60px] pb-[90px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.2rem] sm:text-[1.5rem] font-semibold tracking-[-0.2px] text-[#f8f8f8]">
            Meu dia
          </h2>

          <Link
            href="/meu-dia/nova"
            aria-label="Adicionar tarefa"
            title="Adicionar tarefa"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--color-2)] text-[1.3rem] font-bold text-black shadow-md transition active:scale-[0.95]"
          >
            +
          </Link>
        </div>

        <div className="mb-4 text-center text-[0.85rem] text-white/60 capitalize">
          {hojeFormatado}
        </div>

        <section
          className="mb-3 rounded-[22px] px-4 py-4"
          style={{
            background:
              "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
          }}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex min-h-[52px] flex-col items-center justify-center text-center">
              <div className="text-[2rem] leading-none font-black text-[var(--color-2)]">
                {pendentes}
              </div>
              <div className="mt-1 text-[0.9rem] text-[#bdbdbd] font-medium">
                Pendentes
              </div>
            </div>

            <div className="w-px h-12 bg-white/10" />

            <div className="flex min-h-[52px] flex-col items-center justify-center text-center">
              <div className="text-[2rem] leading-none font-black text-[var(--color-4)]">
                {feitas}
              </div>
              <div className="mt-1 text-[0.9rem] text-[#bdbdbd] font-medium">
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
          <div className="flex flex-col gap-2">
            {tarefas.map((tarefa) => (
              <button
                key={tarefa.id}
                type="button"
                onClick={() => toggleTarefa(tarefa.id)}
                className="flex items-center gap-3 border-b border-white/10 py-2 text-left"
              >
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center text-[0.7rem] ${
                    tarefa.concluida
                      ? "bg-[var(--color-4)] text-black border-[var(--color-4)]"
                      : "border-white/30 text-transparent"
                  }`}
                >
                  ✓
                </div>

                <span
                  className={`text-[0.95rem] ${
                    tarefa.concluida
                      ? "line-through text-white/40"
                      : "text-white"
                  }`}
                >
                  {tarefa.titulo}
                </span>
              </button>
            ))}
          </div>
        )}

        <BotaoVoltar />
      </div>

      <BottomNav active="meu-dia" />
    </main>
  );
}