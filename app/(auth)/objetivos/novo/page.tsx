"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { corCategoria, hojeISO, normalizarTexto } from "@/lib/objetivos-utils";
import type { Categoria } from "@/lib/objetivos-types";

export default function NovoObjetivoPage() {
  const router = useRouter();
  const db = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tipo: "erro" | "sucesso" } | null>(null);

  // Auth
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUserId(session.user.id);
    });
  }, []);

  // Categorias
  useEffect(() => {
    async function load() {
      let res = await db
        .from("objetivos_categoria")
        .select("id,nome,descricao,ordem,cor")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (res.error) {
        res = await db.from("objetivos_categoria").select("id,nome,descricao");
      }

      if (!res.error) {
        setCategorias(
          (res.data ?? []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            ordem: c.ordem ?? 999,
            cor: c.cor || "",
          }))
        );
      }
    }
    load();
  }, []);

  const catSelecionada = categorias.find((c) => c.id === categoriaId);
  const corPreview = catSelecionada
    ? catSelecionada.cor || corCategoria(catSelecionada)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoriaId) { setMsg({ text: "Selecione uma categoria.", tipo: "erro" }); return; }
    if (!titulo.trim()) { setMsg({ text: "Informe um título.", tipo: "erro" }); return; }

    setSaving(true);
    setMsg({ text: "Salvando...", tipo: "sucesso" });

    const { error } = await db.from("objetivos").insert({
      usuario_id: userId,
      categoria_id: categoriaId,
      titulo: titulo.trim(),
      data_inicio: hojeISO(),
      data_prevista_conclusao: dataFim || null,
      status: "nao_iniciado",
      progresso_percentual: 0,
    });

    if (error) {
      console.error(error);
      setMsg({ text: "Erro ao salvar. Tente novamente.", tipo: "erro" });
      setSaving(false);
      return;
    }

    setMsg({ text: "Objetivo salvo com sucesso!", tipo: "sucesso" });
    setTimeout(() => router.push("/objetivos"), 700);
  }

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
          href="/"
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
          }}
        >
          Logout
        </button>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 680,
          margin: "0 auto",
          padding: "28px 16px 60px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: "0 0 4px 0", fontSize: "clamp(1.4rem, 4vw, 1.7rem)", fontWeight: 800 }}>
          Novo Objetivo
        </h1>
        <p style={{ margin: "0 0 24px 0", fontSize: "0.88rem", color: "#999" }}>
          Defina um novo objetivo para acompanhar seu progresso ao longo do ano.
        </p>

        {/* Card form */}
        <div
          style={{
            background: "#0d0d0d",
            borderRadius: 20,
            border: "1px solid #1e1e1e",
            padding: "20px 18px 24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <form onSubmit={handleSubmit} noValidate>

            {/* Categoria */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="categoria"
                style={{ display: "block", fontSize: "0.85rem", color: "#ccc", marginBottom: 6, fontWeight: 600 }}
              >
                Categoria *
              </label>
              <select
                id="categoria"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: categoriaId ? `1px solid ${corPreview}80` : "1px solid #333",
                  background: "#0a0a0a",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                  cursor: "pointer",
                  appearance: "auto",
                }}
              >
                <option value="">Selecione uma categoria...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              {/* Preview da cor */}
              {catSelecionada && corPreview && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                    fontSize: "0.82rem",
                    color: "#bbb",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: corPreview,
                      boxShadow: `0 0 10px ${corPreview}`,
                    }}
                  />
                  <span>{catSelecionada.nome}</span>
                </div>
              )}
            </div>

            {/* Título */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="titulo"
                style={{ display: "block", fontSize: "0.85rem", color: "#ccc", marginBottom: 6, fontWeight: 600 }}
              >
                Título do objetivo *
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={200}
                required
                placeholder="Ex: Ler 12 livros, aprender inglês, treinar 3x por semana..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#0a0a0a",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3d7a99")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
              />
            </div>

            {/* Data */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="data_fim"
                style={{ display: "block", fontSize: "0.85rem", color: "#ccc", marginBottom: 6, fontWeight: 600 }}
              >
                Data prevista de conclusão{" "}
                <span style={{ color: "#666", fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                id="data_fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#0a0a0a",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  colorScheme: "dark",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3d7a99")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#333")}
              />
            </div>

            {/* Mensagem */}
            {msg && (
              <p
                style={{
                  margin: "0 0 14px 0",
                  fontSize: "0.85rem",
                  color: msg.tipo === "erro" ? "#ff6b6b" : "#5dc6a1",
                  fontWeight: 600,
                }}
              >
                {msg.text}
              </p>
            )}

            {/* Botões */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/objetivos"
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "#ccc",
                  borderRadius: 12,
                  padding: "10px 18px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? "#3a7a60" : "#5dc6a1",
                  color: "#000",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.8 : 1,
                  fontFamily: "inherit",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 14px rgba(93,198,161,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 18px rgba(93,198,161,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(93,198,161,0.3)";
                }}
              >
                {saving ? "Salvando..." : "Salvar objetivo"}
              </button>
            </div>
          </form>
        </div>

        <Link
          href="/objetivos"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 28,
            color: "#e9891d",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.88rem",
          }}
        >
          ← Voltar aos objetivos
        </Link>
      </main>
    </div>
  );
}
