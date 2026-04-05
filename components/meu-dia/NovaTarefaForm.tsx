"use client";

import { useState } from "react";

export type NovaTarefaFormValues = {
  titulo: string;
  descricao: string;
  recorrente: boolean;
  frequencia: "diaria" | "semanal" | null;
  diasSemana: number[];
};

type Props = {
  onSubmit: (values: NovaTarefaFormValues) => Promise<void>;
  onCancel: () => void;
};

type MensagemState = {
  tipo: "erro" | "sucesso";
  texto: string;
} | null;

const DIAS_SEMANA_OPCOES = [
  { valor: 0, label: "Dom" },
  { valor: 1, label: "Seg" },
  { valor: 2, label: "Ter" },
  { valor: 3, label: "Qua" },
  { valor: 4, label: "Qui" },
  { valor: 5, label: "Sex" },
  { valor: 6, label: "Sáb" },
];

export function NovaTarefaForm({ onSubmit, onCancel }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState<"diaria" | "semanal" | null>(
    null
  );
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemState>(null);

  function alternarDiaSemana(valor: number) {
    setDiasSemana((prev) =>
      prev.includes(valor)
        ? prev.filter((dia) => dia !== valor)
        : [...prev, valor].sort((a, b) => a - b)
    );
  }

  function handleChangeRecorrente(valor: boolean) {
    setRecorrente(valor);

    if (!valor) {
      setFrequencia(null);
      setDiasSemana([]);
    }
  }

  function handleChangeFrequencia(valor: "diaria" | "semanal") {
    setFrequencia(valor);

    if (valor === "diaria") {
      setDiasSemana([]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();

    if (!tituloLimpo) {
      setMensagem({ tipo: "erro", texto: "Informe um título para a tarefa." });
      return;
    }

    if (recorrente && !frequencia) {
      setMensagem({
        tipo: "erro",
        texto: "Escolha se a tarefa recorrente é diária ou semanal.",
      });
      return;
    }

    if (recorrente && frequencia === "semanal" && diasSemana.length === 0) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione pelo menos um dia da semana.",
      });
      return;
    }

    try {
      setSaving(true);
      setMensagem({ tipo: "sucesso", texto: "Salvando tarefa..." });

      await onSubmit({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        recorrente,
        frequencia,
        diasSemana,
      });
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      setMensagem({ tipo: "erro", texto: "Erro ao salvar. Tente novamente." });
      setSaving(false);
    }
  }

  return (
    <>
      <section
        className="rounded-[20px] border px-4 py-5 sm:px-5 sm:py-6"
        style={{
          background:
            "radial-gradient(700px 240px at 0% 0%, rgba(255,255,255,0.04), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), #111",
          borderColor: "rgba(255,255,255,0.10)",
          boxShadow:
            "0 10px 26px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col gap-2">
            <label
              htmlFor="titulo"
              className="text-[0.86rem] font-medium text-[#dddddd]"
            >
              Tarefa do dia *
            </label>

            <input
              id="titulo"
              type="text"
              maxLength={200}
              required
              placeholder="Ex: Ler 10 páginas"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
              }}
            />
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <label
              htmlFor="descricao"
              className="text-[0.86rem] font-medium text-[#dddddd]"
            >
              Descrição
            </label>

            <textarea
              id="descricao"
              maxLength={500}
              rows={3}
              placeholder="Opcional"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full resize-none rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
              }}
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[0.86rem] font-medium text-[#dddddd]">
              Repetição
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleChangeRecorrente(false)}
                className={`rounded-[12px] border px-3 py-2 text-left text-[0.9rem] transition ${
                  !recorrente ? "text-black" : "text-white"
                }`}
                style={{
                  background: !recorrente ? "var(--color-4)" : "transparent",
                  borderColor: !recorrente
                    ? "var(--color-4)"
                    : "rgba(255,255,255,0.12)",
                }}
              >
                Não repetir
              </button>

              <button
                type="button"
                onClick={() => handleChangeRecorrente(true)}
                className={`rounded-[12px] border px-3 py-2 text-left text-[0.9rem] transition ${
                  recorrente ? "text-black" : "text-white"
                }`}
                style={{
                  background: recorrente ? "var(--color-4)" : "transparent",
                  borderColor: recorrente
                    ? "var(--color-4)"
                    : "rgba(255,255,255,0.12)",
                }}
              >
                Repetir
              </button>
            </div>
          </div>

          {recorrente && (
            <>
              <div className="mb-4">
                <div className="mb-2 text-[0.86rem] font-medium text-[#dddddd]">
                  Frequência
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangeFrequencia("diaria")}
                    className={`rounded-[12px] border px-3 py-2 text-[0.9rem] transition ${
                      frequencia === "diaria" ? "text-black" : "text-white"
                    }`}
                    style={{
                      background:
                        frequencia === "diaria"
                          ? "var(--color-4)"
                          : "transparent",
                      borderColor:
                        frequencia === "diaria"
                          ? "var(--color-4)"
                          : "rgba(255,255,255,0.12)",
                    }}
                  >
                    Todo dia
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeFrequencia("semanal")}
                    className={`rounded-[12px] border px-3 py-2 text-[0.9rem] transition ${
                      frequencia === "semanal" ? "text-black" : "text-white"
                    }`}
                    style={{
                      background:
                        frequencia === "semanal"
                          ? "var(--color-4)"
                          : "transparent",
                      borderColor:
                        frequencia === "semanal"
                          ? "var(--color-4)"
                          : "rgba(255,255,255,0.12)",
                    }}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              {frequencia === "semanal" && (
                <div className="mb-4">
                  <div className="mb-2 text-[0.86rem] font-medium text-[#dddddd]">
                    Dias da semana
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {DIAS_SEMANA_OPCOES.map((dia) => {
                      const selecionado = diasSemana.includes(dia.valor);
                      const titleDias = [
                        "Domingo",
                        "Segunda",
                        "Terça",
                        "Quarta",
                        "Quinta",
                        "Sexta",
                        "Sábado",
                      ];

                      return (
                        <button
                          key={dia.valor}
                          type="button"
                          title={titleDias[dia.valor]}
                          onClick={() => alternarDiaSemana(dia.valor)}
                          className={`flex h-10 min-w-[56px] items-center justify-center rounded-full border px-3 text-[0.82rem] font-semibold tracking-[0.01em] transition-all duration-200 active:scale-[0.97] ${
                            selecionado ? "text-black shadow-md" : "text-white"
                          }`}
                          style={{
                            background: selecionado
                              ? "var(--color-4)"
                              : "rgba(255,255,255,0.02)",
                            borderColor: selecionado
                              ? "var(--color-4)"
                              : "rgba(255,255,255,0.14)",
                            boxShadow: selecionado
                              ? "0 6px 18px rgba(93,198,161,0.35)"
                              : "none",
                          }}
                        >
                          {dia.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {mensagem && (
            <div
              className="mt-1 text-[0.82rem] font-medium"
              style={{
                color: mensagem.tipo === "erro" ? "#ff7a7a" : "#5dc6a1",
              }}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-[10px] text-[0.88rem] font-bold text-black transition active:scale-[0.98] disabled:opacity-70"
              style={{
                background: "var(--color-4)",
              }}
            >
              {saving ? "Salvando..." : "Salvar tarefa"}
            </button>
          </div>
        </form>
      </section>

      <button
        type="button"
        onClick={onCancel}
        className="mx-auto mt-7 block cursor-pointer border-none bg-transparent text-center text-[var(--color-2)] text-[0.95rem] font-semibold"
      >
        ← Voltar
      </button>
    </>
  );
}