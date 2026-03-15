"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import {
  calcularMetricas,
  calcularRankingCategorias,
  ordemCategoria
} from "@/lib/objetivos-utils";

import { CategoriaSection } from "@/components/objetivos/CategoriaSection";
import { ResumoGeral } from "@/components/objetivos/ResumoGeral";

export default function ObjetivosPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    carregarPagina();
  }, []);

  async function carregarPagina() {
    try {

      /* -------------------------
      Verificar sessão
      ------------------------- */

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      const user = data.session.user;

      /* -------------------------
      Buscar objetivos
      ------------------------- */

      const { data: objetivosData, error: objetivosErro } = await supabase
        .from("objetivos")
        .select("*")
        .eq("usuario_id", user.id);

      if (objetivosErro) {
        console.error("Erro ao buscar objetivos:", objetivosErro);
        return;
      }

      const lista = objetivosData || [];

      setObjetivos(lista);

      /* -------------------------
      Calcular métricas
      ------------------------- */

      const m = calcularMetricas(lista);
      const r = calcularRankingCategorias(lista);

      setMetricas(m);
      setRanking(r);

    } catch (erro) {
      console.error("Erro ao carregar página de objetivos:", erro);
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando objetivos…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4">

      {/* Header */}

      <header className="w-full max-w-5xl flex justify-end gap-5 py-4 text-xs font-semibold">

        <Link
          href="/aluno"
          className="text-[var(--color-2)]"
        >
          Voltar
        </Link>

      </header>

      {/* Título */}

      <h1
        className="text-4xl font-semibold mt-4 mb-8"
        style={{
          background:
            "radial-gradient(circle,var(--color-1),var(--color-2),var(--color-5))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Objetivos
      </h1>

      {/* Resumo geral */}

      {metricas && (
        <ResumoGeral
          metricas={metricas}
          ranking={ranking}
        />
      )}

      {/* Lista de categorias */}

      <div className="w-full max-w-5xl mt-10 space-y-10">

        {ordemCategoria.map((categoria) => {

          const itens = objetivos.filter(
            (o) => o.categoria === categoria
          );

          return (
            <CategoriaSection
              key={categoria}
              categoria={categoria}
              objetivos={itens}
              onAtualizar={carregarPagina}
            />
          );

        })}

      </div>

    </main>
  );
}