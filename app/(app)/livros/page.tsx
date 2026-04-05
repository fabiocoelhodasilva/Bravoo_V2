"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import BottomNav from "@/components/ui/BottomNav";
import DeleteButton from "@/components/ui/DeleteButton";

type LivroLido = {
  id: string;
  titulo: string;
  autor: string | null;
  dt_inicio: string | null;
  dt_fim: string;
  criado_em: string | null;
};

type GrupoAno = {
  ano: number;
  livros: LivroLido[];
};

const CARD_BORDER_COLORS = [
  "var(--color-1, #c94a4a)",
  "var(--color-2, #e9891d)",
  "var(--color-3, #f1e6a7)",
  "var(--color-4, #5dc6a1)",
  "var(--color-5, #3d7a99)",
  "var(--color-6, #a35bdc)",
  "var(--color-7, #ff8c42)",
];

function formatarData(dataIso: string | null) {
  if (!dataIso) return "";

  const data = new Date(`${dataIso}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function getCssVars() {
  return {
    ["--color-1" as string]: "#c94a4a",
    ["--color-2" as string]: "#e9891d",
    ["--color-3" as string]: "#f1e6a7",
    ["--color-4" as string]: "#5dc6a1",
    ["--color-5" as string]: "#3d7a99",
    ["--color-6" as string]: "#a35bdc",
    ["--color-7" as string]: "#ff8c42",
  } as React.CSSProperties;
}

export default function LivrosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [livros, setLivros] = useState<LivroLido[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Carregando livros...");
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"error" | "success">("error");

  const [livroParaExcluir, setLivroParaExcluir] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const carregarLivros = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("next_livros_lidos")
        .select("id, titulo, autor, dt_inicio, dt_fim, criado_em")
        .eq("usuario_id", user.id)
        .order("dt_fim", { ascending: false })
        .order("criado_em", { ascending: false });

      if (error) {
        throw error;
      }

      const livrosData = (data ?? []) as LivroLido[];

      setLivros(livrosData);
      setLoadingMessage(
        livrosData.length === 0 ? "Você ainda não registrou nenhum livro." : ""
      );
    } catch (error) {
      console.error("Erro ao carregar livros:", error);
      setLivros([]);
      setLoadingMessage("Não foi possível carregar seus livros.");
    }
  }, [user?.id]);

  useEffect(() => {
    if (loading || !user?.id) return;
    void carregarLivros();
  }, [loading, user?.id, carregarLivros]);

  useEffect(() => {
    if (!feedbackMessage) return;

    const timer = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const handleDelete = useCallback((livroId: string) => {
    setLivroParaExcluir(livroId);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setLivroParaExcluir(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    const livroId = livroParaExcluir;
    if (!livroId) return;

    setDeletingIds((prev) => (prev.includes(livroId) ? prev : [...prev, livroId]));

    try {
      const { error } = await supabase
        .from("next_livros_lidos")
        .delete()
        .eq("id", livroId)
        .eq("usuario_id", user?.id);

      if (error) {
        throw error;
      }

      setLivros((prev) => {
        const nextLivros = prev.filter((item) => item.id !== livroId);
        setLoadingMessage(
          nextLivros.length === 0 ? "Você ainda não registrou nenhum livro." : ""
        );
        return nextLivros;
      });

      setFeedbackType("success");
      setFeedbackMessage("Livro excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir livro:", error);
      setFeedbackType("error");
      setFeedbackMessage("Não foi possível excluir o livro.");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== livroId));
      closeDeleteModal();
    }
  }, [closeDeleteModal, livroParaExcluir, user?.id]);

  const gruposPorAno = useMemo<GrupoAno[]>(() => {
    const mapa = new Map<number, LivroLido[]>();

    for (const livro of livros) {
      const ano = new Date(`${livro.dt_fim}T00:00:00`).getFullYear();

      if (!mapa.has(ano)) {
        mapa.set(ano, []);
      }

      mapa.get(ano)!.push(livro);
    }

    return Array.from(mapa.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([ano, livrosDoAno]) => ({
        ano,
        livros: livrosDoAno.sort((a, b) => {
          const dataA = new Date(`${a.dt_fim}T00:00:00`).getTime();
          const dataB = new Date(`${b.dt_fim}T00:00:00`).getTime();
          return dataB - dataA;
        }),
      }));
  }, [livros]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando livros...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <main
        className="min-h-screen bg-black text-white flex flex-col"
        style={getCssVars()}
      >
        <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-5 h-[48px] flex items-center justify-between bg-[#050505]/95 backdrop-blur border-b border-white/5">
          <div className="gradient-text text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90">
            Bravoo
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[var(--color-2)] text-[0.8rem] font-semibold"
          >
            Logout
          </button>
        </header>

        <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 pt-[60px] pb-[90px]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-[1.2rem] sm:text-[1.5rem] font-semibold tracking-[-0.2px] text-[#f8f8f8]">
              Meus Livros
            </h2>

            <Link
              href="/livros/novo"
              aria-label="Cadastrar novo livro"
              title="Cadastrar novo livro"
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--color-2)] text-[1.3rem] font-bold text-black shadow-md transition active:scale-[0.95]"
            >
              +
            </Link>
          </div>

          {loadingMessage && (
            <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-[0.85rem] text-[#b9b9b9]">
              {loadingMessage}
            </div>
          )}

          {!loadingMessage && gruposPorAno.length > 0 && (
            <div className="flex flex-col gap-4">
              {gruposPorAno.map((grupo, index) => {
                const borderColor =
                  CARD_BORDER_COLORS[index % CARD_BORDER_COLORS.length];

                return (
                  <section
                    key={grupo.ano}
                    className="rounded-[20px] border px-4 py-4"
                    style={{
                      borderColor,
                      background: `radial-gradient(900px 260px at 0% 0%, ${borderColor}10, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), #0d0d0d`,
                      boxShadow: `0 10px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.02) inset`,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3
                          className="text-[1.05rem] sm:text-[1.12rem] font-semibold"
                          style={{ color: borderColor }}
                        >
                          {grupo.ano}
                        </h3>

                        <p className="mt-1 text-[0.8rem] text-white/55">
                          {grupo.livros.length}{" "}
                          {grupo.livros.length === 1 ? "livro" : "livros"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {grupo.livros.map((livro, livroIndex) => {
                        const deleting = deletingIds.includes(livro.id);

                        return (
                          <article
                            key={livro.id}
                            className="rounded-[16px] border border-white/8 bg-[#0a0a0a] px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition hover:border-white/15 hover:bg-[#0d0d0d]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <div
                                  className="mt-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.82rem] font-bold text-black shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                                  style={{
                                    backgroundColor: borderColor,
                                    boxShadow: `0 0 14px ${borderColor}35`,
                                  }}
                                >
                                  {livroIndex + 1}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[0.96rem] sm:text-[1rem] font-semibold text-[#f3f3f3] leading-6 transition hover:text-white">
                                    {livro.titulo}
                                  </h4>

                                  {livro.autor && (
                                    <p className="mt-0.5 text-[0.84rem] text-white/70">
                                      {livro.autor}
                                    </p>
                                  )}

                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-white/50">
                                    {livro.dt_inicio && (
                                      <span>
                                        Início: {formatarData(livro.dt_inicio)}
                                      </span>
                                    )}
                                    <span>
                                      Conclusão: {formatarData(livro.dt_fim)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <DeleteButton
                                onClick={() => handleDelete(livro.id)}
                                disabled={deleting}
                                ariaLabel={`Excluir ${livro.titulo}`}
                                title="Excluir livro"
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav active="livros" />
      </main>

      {feedbackMessage && (
        <div className="fixed top-4 left-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
              feedbackType === "error"
                ? "border-red-400/30 bg-red-500/15 text-red-100"
                : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
            }`}
          >
            {feedbackMessage}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-5 text-center shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Excluir livro
            </h2>

            <p className="mb-5 text-sm text-white/75">
              Tem certeza que deseja excluir este livro?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
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