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
        className="rounded-[24px] border border-white/10 bg-[#111] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
      >
        <div className="flex flex-col gap-4">

          <div>
            <label className="mb-2 block text-[0.92rem] font-medium text-[#f3f3f3]">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: O Peregrino"
              className="w-full rounded-[16px] border border-white/10 bg-black px-4 py-3 text-[0.95rem] text-white outline-none transition placeholder:text-white/30 focus:border-[var(--color-2)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-[0.92rem] font-medium text-[#f3f3f3]">
              Autor
            </label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Ex.: John Bunyan"
              className="w-full rounded-[16px] border border-white/10 bg-black px-4 py-3 text-[0.95rem] text-white outline-none transition placeholder:text-white/30 focus:border-[var(--color-2)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-[#f3f3f3]">
                Data de início
              </label>
              <input
                type="date"
                value={dtInicio}
                onChange={(e) => setDtInicio(e.target.value)}
                className="w-full rounded-[16px] border border-white/10 bg-black px-4 py-3 text-[0.95rem] text-white outline-none transition focus:border-[var(--color-2)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-[#f3f3f3]">
                Data de conclusão
              </label>
              <input
                type="date"
                value={dtFim}
                onChange={(e) => setDtFim(e.target.value)}
                className="w-full rounded-[16px] border border-white/10 bg-black px-4 py-3 text-[0.95rem] text-white outline-none transition focus:border-[var(--color-2)]"
              />
            </div>
          </div>

          {erro && (
            <div className="rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-[0.88rem] text-red-100">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-full bg-[var(--color-4)] px-5 py-3 text-[0.92rem] font-semibold text-black shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar livro"}
          </button>

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