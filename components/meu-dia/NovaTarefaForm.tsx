"use client";

import { useState } from "react";

type Props = {
  onSubmit: (values: {
    titulo: string;
  }) => Promise<void>;
  onCancel: () => void;
};

type MensagemState = {
  tipo: "erro" | "sucesso";
  texto: string;
} | null;

export function NovaTarefaForm({ onSubmit, onCancel }: Props) {
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemState>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!titulo.trim()) {
      setMensagem({ tipo: "erro", texto: "Informe um título para a tarefa." });
      return;
    }

    try {
      setSaving(true);
      setMensagem({ tipo: "sucesso", texto: "Salvando tarefa..." });

      await onSubmit({
        titulo: titulo.trim(),
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
          <div className="flex flex-col mb-4 gap-2">
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