"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import BrandLogo from "@/components/ui/BrandLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await logar();
  }

  async function buscarNomeUsuario(usuarioId: string) {
    const usuarioNextResp = await supabase
      .from("usuarios_next")
      .select("nome")
      .eq("id", usuarioId)
      .maybeSingle();

    if (usuarioNextResp.data?.nome) {
      return usuarioNextResp.data.nome;
    }

    const usuarioResp = await supabase
      .from("usuarios")
      .select("nome")
      .eq("id", usuarioId)
      .maybeSingle();

    return usuarioResp.data?.nome || "";
  }

  async function logar() {
    const em = email.trim();
    const pw = senha || "";

    setMensagem("");

    if (!em || !pw) {
      setMensagem("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: em,
        password: pw,
      });

      if (error) {
        console.error("Erro ao logar:", error);
        setMensagem("Erro: " + (error.message || "Não foi possível fazer login."));
        return;
      }

      const usuarioId = data?.user?.id;
      if (!usuarioId) {
        setMensagem("Não foi possível identificar o usuário.");
        return;
      }

      const nome = await buscarNomeUsuario(usuarioId);

      const profResp = await supabase
        .from("professores")
        .select("aprovado")
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      const prof = profResp.data;

      if (prof && prof.aprovado === true) {
        setMensagem("Login realizado com sucesso! Redirecionando…");
        setTimeout(() => router.replace("/professor"), 900);
        return;
      }

      if (prof && prof.aprovado !== true) {
        const msg = `Bem-vindo ${nome}, seu pedido de cadastro como professor está em análise.`;
        try {
          sessionStorage.setItem("mensagem_professor", msg);
        } catch {}
        setMensagem(msg);
        setTimeout(() => router.replace("/aluno"), 1500);
        return;
      }

      setMensagem("Login realizado com sucesso! Redirecionando…");
      setTimeout(() => router.replace("/aluno"), 900);
    } catch (e) {
      console.error("Erro inesperado ao fazer login:", e);
      setMensagem("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <BrandLogo />

      <form
        className="form"
        aria-label="Formulário de login Bravoo"
        onSubmit={onSubmit}
        noValidate
      >
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          className="input"
          type="email"
          id="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="label" htmlFor="senha">
          Senha
        </label>
        <input
          className="input"
          type="password"
          id="senha"
          placeholder="Sua senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="links">
        <Link className="link" href="/cadastro">
          Não tem conta? Cadastre-se
        </Link>
      </div>

      <div className="mensagem" id="mensagem" aria-live="polite">
        {mensagem}
      </div>
    </>
  );
}