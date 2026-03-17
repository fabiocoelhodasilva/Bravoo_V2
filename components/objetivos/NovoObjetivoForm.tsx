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
      setMensagem({ tipo: "erro", texto: "Informe um título para o objetivo." });
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
      setMensagem({ tipo: "erro", texto: "Erro ao salvar. Tente novamente." });
      setSaving(false);
    }
  }

  return (
    <>
      <section
        className="bg-[#111] rounded-[18px] border border-[#333] px-4 pt-[18px] pb-5"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,.35)" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col mb-[14px] gap-[6px]">
            <label htmlFor="categoria_id" className="text-[0.9rem] text-[#ddd]">
              Categoria *
            </label>

            <select
              id="categoria_id"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full px-[10px] py-2 rounded-[10px] border border-[#444] bg-black text-white text-[0.9rem] font-['Poppins'] focus:outline-none"
              style={{ boxShadow: "none" }}
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
              <div className="flex items-center gap-2 mt-[6px] text-[0.85rem] text-[#bbb]">
                <span
                  className="w-[10px] h-[10px] rounded-full border border-[#333]"
                  style={{ background: categoriaSelecionada.cor || "#666" }}
                />
                <span>
                  {categoriaSelecionada.descricao || categoriaSelecionada.nome}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col mb-[14px] gap-[6px]">
            <label htmlFor="titulo" className="text-[0.9rem] text-[#ddd]">
              Título do objetivo *
            </label>

            <input
              id="titulo"
              type="text"
              maxLength={200}
              required
              placeholder="Ex: Ler 12 livros, aprender inglês, treinar 3x por semana..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-[10px] py-2 rounded-[10px] border border-[#444] bg-black text-white text-[0.9rem] font-['Poppins'] focus:outline-none"
            />
          </div>

          <div className="flex flex-col mb-[14px] gap-[6px]">
            <label
              htmlFor="data_prevista_conclusao"
              className="text-[0.9rem] text-[#ddd]"
            >
              Data prevista de conclusão (opcional)
            </label>

            <input
              id="data_prevista_conclusao"
              type="date"
              value={dataPrevistaConclusao}
              onChange={(e) => setDataPrevistaConclusao(e.target.value)}
              className="w-full px-[10px] py-2 rounded-[10px] border border-[#444] bg-black text-white text-[0.9rem] font-['Poppins'] focus:outline-none"
            />
          </div>

          {mensagem && (
            <div
              className="mt-[10px] text-[0.85rem]"
              style={{
                color: mensagem.tipo === "erro" ? "#ff6b6b" : "#5dc6a1",
              }}
            >
              {mensagem.texto}
            </div>
          )}

          <div className="mt-[18px] flex justify-end gap-[10px] flex-wrap">
            <button
              type="button"
              onClick={onCancel}
              className="border border-[#555] text-[#ccc] bg-transparent rounded-[12px] px-[18px] py-[10px] text-[0.9rem] font-semibold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[12px] px-[18px] py-[10px] text-[0.9rem] font-semibold cursor-pointer border-none text-black"
              style={{
                background: "var(--color-4)",
                opacity: saving ? 0.7 : 1,
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
        className="block text-center mx-auto mt-[30px] text-[var(--color-2)] bg-transparent border-none font-semibold text-[18px] cursor-pointer"
      >
        ← Voltar
      </button>
    </>
  );
}