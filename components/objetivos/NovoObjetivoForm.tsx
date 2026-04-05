"use client";

import { useMemo, useState } from "react";

type CategoriaOption = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
};

type Props = {
  categorias: CategoriaOption[];
  loadingCategorias: boolean;
  onSubmit: (values: {
    categoriaId: string;
    titulo: string;
    dataPrevistaConclusao: string;
  }) => Promise<void>;
  onCancel: () => void;
};

type MensagemState = {
  tipo: "erro" | "sucesso";
  texto: string;
} | null;

export function NovoObjetivoForm({
  categorias,
  loadingCategorias,
  onSubmit,
  onCancel,
}: Props) {
  const [categoriaId, setCategoriaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [dataPrevistaConclusao, setDataPrevistaConclusao] = useState("");
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemState>(null);

  const categoriaSelecionada = useMemo(
    () => categorias.find((c) => c.id === categoriaId) || null,
    [categorias, categoriaId]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!categoriaId) {
      setMensagem({ tipo: "erro", texto: "Selecione uma categoria." });
      return;
    }

    if (!titulo.trim()) {
      setMensagem({
        tipo: "erro",
        texto: "Informe um título para o objetivo.",
      });
      return;
    }

    try {
      setSaving(true);
      setMensagem({ tipo: "sucesso", texto: "Salvando objetivo..." });

      await onSubmit({
        categoriaId,
        titulo: titulo.trim(),
        dataPrevistaConclusao,
      });
    } catch (error) {
      console.error("Erro ao salvar objetivo:", error);
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar. Tente novamente.",
      });
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
              htmlFor="categoria_id"
              className="text-[0.86rem] font-medium text-[#dddddd]"
            >
              Categoria *
            </label>

            <select
              id="categoria_id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white focus:outline-none"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              {loadingCategorias ? (
                <option value="">Carregando categorias...</option>
              ) : (
                <>
                  <option value="">Selecione...</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </>
              )}
            </select>

            {categoriaSelecionada && (
              <div className="mt-1 flex items-center gap-2 text-[0.8rem] text-[#bcbcbc]">
                <span
                  className="h-[10px] w-[10px] rounded-full border border-[#333]"
                  style={{
                    background: categoriaSelecionada.cor || "#666",
                  }}
                />

                <span>
                  {categoriaSelecionada.descricao ||
                    categoriaSelecionada.nome}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col mb-4 gap-2">
            <label
              htmlFor="titulo"
              className="text-[0.86rem] font-medium text-[#dddddd]"
            >
              Título do objetivo *
            </label>

            <input
              id="titulo"
              type="text"
              maxLength={200}
              required
              placeholder="Ex: Treinar 3x por semana"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
              }}
            />
          </div>

          <div className="flex flex-col mb-4 gap-2">
            <label
              htmlFor="data_prevista_conclusao"
              className="text-[0.86rem] font-medium text-[#dddddd]"
            >
              Data prevista de conclusão
            </label>

            <input
              id="data_prevista_conclusao"
              type="date"
              value={dataPrevistaConclusao}
              onChange={(e) => setDataPrevistaConclusao(e.target.value)}
              className="w-full rounded-[12px] border bg-black px-3 py-[10px] text-[0.9rem] text-white focus:outline-none"
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

          <div className="mt-5 flex">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full px-5 py-3 text-[0.92rem] font-semibold text-black shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--color-4)",
              }}
            >
              {saving ? "Salvando..." : "Salvar objetivo"}
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