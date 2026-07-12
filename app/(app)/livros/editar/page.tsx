"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getObjetivosPageCssVars } from "@/lib/objetivos/objetivos-utils";
import {
  NovoLivroForm,
  type NovoLivroFormValues,
} from "@/components/livros/NovoLivroForm";

const CACHE_PREFIX = "bravoo_livros_usuario_";

export default function EditarLivroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const livroId = searchParams.get("id");

  const [carregandoLivro, setCarregandoLivro] = useState(true);
  const [erro, setErro] = useState("");
  const [initialValues, setInitialValues] =
    useState<NovoLivroFormValues | null>(null);

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

  useEffect(() => {
    async function carregarLivro() {
      if (loading) return;

      if (!user?.id) {
        setErro("Usuário não autenticado.");
        setCarregandoLivro(false);
        return;
      }

      if (!livroId) {
        setErro("Livro não informado.");
        setCarregandoLivro(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("next_livros_lidos")
          .select(
            "id, titulo, autor, total_paginas, classificacao, dt_inicio, dt_fim"
          )
          .eq("id", livroId)
          .eq("usuario_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setInitialValues({
          titulo: data.titulo ?? "",
          autor: data.autor ?? "",
          totalPaginas:
            data.total_paginas !== null &&
            data.total_paginas !== undefined
              ? String(data.total_paginas)
              : "",
          classificacao: data.classificacao ?? null,
          dtInicio: data.dt_inicio ?? "",
          dtFim: data.dt_fim ?? "",
        });

        setErro("");
      } catch (error) {
        console.error("Erro ao carregar livro:", error);
        setErro("Não foi possível carregar este livro.");
      } finally {
        setCarregandoLivro(false);
      }
    }

    void carregarLivro();
  }, [livroId, loading, user?.id]);

  const handleSubmit = useCallback(
    async (values: NovoLivroFormValues) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado.");
      }

      if (!livroId) {
        throw new Error("Livro não informado.");
      }

      const totalPaginas = values.totalPaginas
        ? Number(values.totalPaginas)
        : null;

      const { error } = await supabase
        .from("next_livros_lidos")
        .update({
          titulo: values.titulo,
          autor: values.autor || null,
          total_paginas: totalPaginas,
          classificacao: values.classificacao,
          dt_inicio: values.dtInicio || null,
          dt_fim: values.dtFim || null,
        })
        .eq("id", livroId)
        .eq("usuario_id", user.id);

      if (error) {
        throw error;
      }

      try {
        sessionStorage.removeItem(`${CACHE_PREFIX}${user.id}`);
      } catch {
        // Evita quebrar o fluxo caso o sessionStorage esteja indisponível.
      }

      router.push("/livros");
      router.refresh();
    },
    [livroId, router, user?.id]
  );

  if (loading || carregandoLivro) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando livro...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main
      className="min-h-screen bg-black text-white flex flex-col"
      style={getObjetivosPageCssVars()}
    >
      <header className="w-full px-5 py-3 flex justify-between items-center bg-[#050505] border-b border-[#333]">
        <div
          className="text-[1.4rem] font-bold"
          style={{
            background:
              "radial-gradient(circle,#c94a4a,#d8a44b,#3d7a99,#5dc6a1)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Bravoo
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-[var(--color-2)] text-[0.85rem] font-semibold bg-transparent border-none cursor-pointer"
        >
          Logout
        </button>
      </header>

      <div className="flex-1 max-w-[700px] w-full mx-auto mt-5 px-4 pb-10">
        <h2 className="m-0 mb-1 text-[1.6rem]">Editar Livro</h2>

        <p className="text-[0.95rem] text-[#ccc] mb-[18px]">
          Atualize as informações do livro.
        </p>

        {erro ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100">
            {erro}
          </div>
        ) : (
          initialValues && (
            <NovoLivroForm
              initialValues={initialValues}
              submitLabel="Salvar alterações"
              onSubmit={handleSubmit}
              onCancel={() => router.push("/livros")}
            />
          )
        )}
      </div>
    </main>
  );
}