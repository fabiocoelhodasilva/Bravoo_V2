"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NovoObjetivoForm } from "@/components/objetivos/NovoObjetivoForm";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCategoriasObjetivo,
  signOutObjetivos,
  createObjetivo,
} from "@/lib/objetivos/objetivos-service";
import { getObjetivosPageCssVars } from "@/lib/objetivos/objetivos-utils";

type CategoriaOption = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
};

export default function NovoObjetivoPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  useEffect(() => {
    if (loading || !user?.id) return;

    async function initializePage() {
      try {
        const categoriasData = await fetchCategoriasObjetivo();
        setCategorias(categoriasData);
      } catch (error) {
        console.error("Erro ao carregar página de novo objetivo:", error);
      } finally {
        setLoadingCategorias(false);
      }
    }

    void initializePage();
  }, [loading, user?.id]);

  async function handleLogout() {
    try {
      await signOutObjetivos();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function handleSubmit(values: {
    categoriaId: string;
    titulo: string;
    dataPrevistaConclusao: string;
  }) {
    if (!user?.id) {
      throw new Error("Usuário não autenticado.");
    }

    await createObjetivo({
      userId: user.id,
      categoriaId: values.categoriaId,
      titulo: values.titulo,
      dataPrevistaConclusao: values.dataPrevistaConclusao || null,
    });

    router.push("/objetivos");
    router.refresh();
  }

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
        <h2 className="m-0 mb-1 text-[1.6rem]">Novo Objetivo</h2>

        <p className="text-[0.95rem] text-[#ccc] mb-[18px]">
          Defina um novo objetivo para acompanhar seu progresso ao longo do ano.
        </p>

        <NovoObjetivoForm
          categorias={categorias}
          loadingCategorias={loadingCategorias}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/objetivos")}
        />
      </div>
    </main>
  );
}