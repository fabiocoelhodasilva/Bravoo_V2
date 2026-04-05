"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { getObjetivosPageCssVars } from "@/lib/objetivos/objetivos-utils";
import { NovoLivroForm } from "@/components/livros/NovoLivroForm";

export default function NovoLivroPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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

  const handleSubmit = useCallback(
    async (values: {
      titulo: string;
      autor: string;
      dtInicio: string;
      dtFim: string;
    }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado.");
      }

      const { error } = await supabase.from("next_livros_lidos").insert({
        usuario_id: user.id,
        titulo: values.titulo,
        autor: values.autor || null,
        dt_inicio: values.dtInicio || null,
        dt_fim: values.dtFim,
      });

      if (error) {
        throw error;
      }

      router.push("/livros");
      router.refresh();
    },
    [router, user?.id]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando…</div>
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

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[var(--color-2)] text-[0.85rem] font-semibold bg-transparent border-none cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[700px] w-full mx-auto mt-5 px-4 pb-10">
        <h2 className="m-0 mb-1 text-[1.6rem]">Novo Livro</h2>

        <p className="text-[0.95rem] text-[#ccc] mb-[18px]">
          Registre um novo livro concluído para acompanhar sua jornada de
          leitura.
        </p>

        <NovoLivroForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/livros")}
        />
      </div>
    </main>
  );
}