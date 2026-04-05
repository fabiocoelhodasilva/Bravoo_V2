"use client";

import { useState } from "react";

type NovoLivroFormValues = {
  titulo: string;
  autor: string;
  dtInicio: string;
  dtFim: string;
};

type NovoLivroFormProps = {
  onSubmit: (values: NovoLivroFormValues) => Promise<void>;
  onCancel: () => void;
};

export function NovoLivroForm({ onSubmit, onCancel }: NovoLivroFormProps) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [dtInicio, setDtInicio] = useState("");
  const [dtFim, setDtFim] = useState("");

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tituloLimpo = titulo.trim();
    const autorLimpo = autor.trim();

    if (!tituloLimpo) {
      setErro("Informe o título do livro.");
      return;
    }

    if (!dtFim) {
      setErro("Informe a data de conclusão.");
      return;
    }

    if (dtInicio && dtInicio > dtFim) {
      setErro("A data de início não pode ser maior que a data de conclusão.");
      return;
    }

    setErro("");
    setSaving(true);

    try {
      await onSubmit({
        titulo: tituloLimpo,
        autor: autorLimpo,
        dtInicio,
        dtFim,
      });
    } catch (error) {
      console.error("Erro ao salvar livro:", error);
      setErro("Não foi possível salvar o livro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] border px-4 py-5 sm:px-5 sm:py-6"
        style={{
          background:
            "radial-gradient(700px 240px at 0% 0%, rgba(255,255,255,0.04), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), #111",
          borderColor: "rgba(255,255,255,0.10)",
          boxShadow:
            "0 10px 26px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        <div className="flex flex-col gap-4">

          <div>
            <label className="mb-2 block text-[0.86rem] font-medium text-[#dddddd]">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: O Peregrino"
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            />
          </div>

          <div>
            <label className="mb-2 block text-[0.86rem] font-medium text-[#dddddd]">
              Autor
            </label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Ex.: John Bunyan"
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.86rem] font-medium text-[#dddddd]">
                Data de início
              </label>
              <input
                type="date"
                value={dtInicio}
                onChange={(e) => setDtInicio(e.target.value)}
                className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              />
            </div>

            <div>
              <label className="mb-2 block text-[0.86rem] font-medium text-[#dddddd]">
                Data de conclusão
              </label>
              <input
                type="date"
                value={dtFim}
                onChange={(e) => setDtFim(e.target.value)}
                className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              />
            </div>
          </div>

          {erro && (
            <div
              className="mt-1 text-[0.82rem] font-medium"
              style={{ color: "#ff7a7a" }}
            >
              {erro}
            </div>
          )}

          <div className="mt-1 flex">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full px-5 py-3 text-[0.92rem] font-semibold text-black shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "var(--color-4)" }}
            >
              {saving ? "Salvando..." : "Salvar livro"}
            </button>
          </div>

        </div>
      </form>

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
