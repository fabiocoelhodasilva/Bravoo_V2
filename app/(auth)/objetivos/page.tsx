"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { calcularMetricas, calcularRankingCategorias, ordemCategoria } from "@/lib/objetivos-utils";
import { CategoriaSection } from "@/components/objetivos/CategoriaSection";
import { ResumoGeral } from "@/components/objetivos/ResumoGeral";
import type { CategoriaGrupo, Objetivo } from "@/lib/objetivos-types";

export default function ObjetivosPage() {
  const router = useRouter();
  const db = createClient();

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const ano = new Date().getFullYear();

  // Auth check
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUserId(session.user.id);
    });
  }, []);

  // Carregar objetivos
  const carregar = useCallback(async (uid: string) => {
    setLoading(true);
    setErro("");

    const { data, error } = await db
      .from("objetivos")
      .select(`
        id, titulo, progresso_percentual, usuario_id, categoria_id, created_at,
        data_prevista_conclusao,
        objetivos_categoria:categoria_id ( id, nome, ordem, ativo )
      `)
      .eq("usuario_id", uid)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) { setErro("Erro ao carregar objetivos."); return; }
    setObjetivos((data as unknown as Objetivo[]) ?? []);
  }, []);

  useEffect(() => {
    if (userId) carregar(userId);
  }, [userId, carregar]);

  // Atualizar progresso
  const handleProgressChange = useCallback(
    async (id: string, value: number) => {
      // Atualiza localmente primeiro (optimistic)
      setObjetivos((prev) =>
        prev.map((o) => (o.id === id ? { ...o, progresso_percentual: value } : o))
      );

      const { error } = await db
        .from("objetivos")
        .update({ progresso_percentual: value })
        .eq("id", id)
        .eq("usuario_id", userId!);

      if (error) console.error("Erro ao salvar progresso:", error);
    },
    [userId]
  );

  // Excluir objetivo
  const handleDelete = useCallback(
    async (id: string) => {
      const { error } = await db
        .from("objetivos")
        .delete()
        .eq("id", id)
        .eq("usuario_id", userId!);

      if (error) { alert("Erro ao excluir. Veja o console."); return; }
      setObjetivos((prev) => prev.filter((o) => o.id !== id));
    },
    [userId]
  );

  // Agrupar por categoria
  const grupos = useMemo<CategoriaGrupo[]>(() => {
    const map = new Map<string, CategoriaGrupo>();

    objetivos.forEach((o) => {
      const cat = o.objetivos_categoria ?? null;
      const catValida = !!(cat && cat.ativo !== false);
      const key = catValida && cat?.id ? cat.id : "sem_categoria";

      if (!map.has(key)) {
        map.set(key, {
          cat: catValida
            ? { id: cat!.id, nome: cat!.nome || "Categoria", ordem: cat!.ordem ?? 999 }
            : { id: null, nome: "Sem categoria", ordem: 9999 },
          items: [],
        });
      }
      map.get(key)!.items.push(o);
    });

    return Array.from(map.values()).sort((a, b) => {
      const ao = ordemCategoria(a.cat);
      const bo = ordemCategoria(b.cat);
      if (ao !== bo) return ao - bo;
      return a.cat.nome.localeCompare(b.cat.nome);
    });
  }, [objetivos]);

  const metricas = useMemo(() => calcularMetricas(objetivos), [objetivos]);
  const ranking = useMemo(() => calcularRankingCategorias(objetivos), [objetivos]);

  async function logout() {
    await db.auth.signOut();
    router.replace("/login");
  }

  return (
    <div
      style={{
        margin: 0,
        background: "#000",
        color: "#fff",
        fontFamily: "var(--font-geist-sans), 'Poppins', sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          width: "100%",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#050505",
          borderBottom: "1px solid #1e1e1e",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/index"
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            background: "radial-gradient(circle,#c94a4a,#d8a44b,#3d7a99,#5dc6a1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textDecoration: "none",
          }}
        >
          Bravoo
        </Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "#e9891d",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 16px 60px",
          boxSizing: "border-box",
        }}
      >
        {/* Título + botão novo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
              fontWeight: 800,
              color: "#f5f5f5",
            }}
          >
            Objetivos em {ano}
          </h1>

          <Link
            href="/objetivos/novo"
            style={{
              background: "#e9891d",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.88rem",
              border: "none",
              padding: "9px 18px",
              borderRadius: 999,
              cursor: "pointer",
              textDecoration: "none",
              boxShadow: "0 8px 20px rgba(233,137,29,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.04)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 28px rgba(233,137,29,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 20px rgba(233,137,29,0.3)";
            }}
          >
            + Novo objetivo
          </Link>
        </div>

        <p style={{ margin: "0 0 20px 0", fontSize: "0.88rem", color: "#999" }}>
          Arraste a barra para ajustar o progresso.
        </p>

        {/* Container */}
        <div
          style={{
            background: "#0d0d0d",
            borderRadius: 20,
            border: "1px solid #1e1e1e",
            padding: "20px 16px",
          }}
        >
          {/* Loading */}
          {loading && (
            <p style={{ textAlign: "center", color: "#aaa", fontSize: "0.9rem", padding: "40px 0" }}>
              Carregando objetivos...
            </p>
          )}

          {/* Erro */}
          {!loading && erro && (
            <p style={{ textAlign: "center", color: "#ff6b6b", fontSize: "0.9rem", padding: "40px 0" }}>
              {erro}
            </p>
          )}

          {/* Vazio */}
          {!loading && !erro && objetivos.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <p style={{ color: "#888", fontSize: "0.95rem", marginBottom: 16 }}>
                Nenhum objetivo cadastrado ainda.
              </p>
              <Link
                href="/objetivos/novo"
                style={{
                  background: "#e9891d",
                  color: "#000",
                  fontWeight: 800,
                  padding: "10px 22px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Criar primeiro objetivo
              </Link>
            </div>
          )}

          {/* Conteúdo */}
          {!loading && !erro && objetivos.length > 0 && (
            <>
              <ResumoGeral metricas={metricas} ranking={ranking} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {grupos.map((grupo) => (
                  <CategoriaSection
                    key={grupo.cat.id ?? "sem_categoria"}
                    grupo={grupo}
                    onProgressChange={handleProgressChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 32,
            color: "#e9891d",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          ← Voltar ao início
        </Link>
      </main>
    </div>
  );
}
