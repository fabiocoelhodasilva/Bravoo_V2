"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import BrandLogo from "@/components/ui/BrandLogo";

const MAX_TENTATIVAS = 3;
const BLOQUEIO_MS = 3 * 60 * 1000;

function traduzirErroLogin(message?: string) {
  const msg = (message || "").toLowerCase();

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("user not found") ||
    msg.includes("invalid email or password")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (msg.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (msg.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }

  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch")
  ) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  return "Não foi possível fazer login. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [agora, setAgora] = useState(Date.now());

  const bloqueado = useMemo(() => {
    return bloqueadoAte !== null && agora < bloqueadoAte;
  }, [bloqueadoAte, agora]);

  const segundosRestantes = useMemo(() => {
    if (!bloqueadoAte || agora >= bloqueadoAte) return 0;
    return Math.ceil((bloqueadoAte - agora) / 1000);
  }, [bloqueadoAte, agora]);

  useEffect(() => {
    if (!bloqueado) return;

    const intervalo = window.setInterval(() => {
      setAgora(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [bloqueado]);

  useEffect(() => {
    if (!bloqueadoAte) return;
    if (Date.now() < bloqueadoAte) return;

    setBloqueadoAte(null);
    setTentativas(0);
    setMensagem("");
    setAgora(Date.now());
  }, [agora, bloqueadoAte]);

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

    if (loading) return;

    if (bloqueado) {
      setMensagem(
        `Muitas tentativas. Aguarde ${segundosRestantes} segundo(s) para tentar novamente.`
      );
      return;
    }

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

        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        if (novasTentativas >= MAX_TENTATIVAS) {
          const fimBloqueio = Date.now() + BLOQUEIO_MS;
          setBloqueadoAte(fimBloqueio);
          setAgora(Date.now());
          setMensagem("Muitas tentativas. Aguarde 3 minutos para tentar novamente.");
        } else {
          setMensagem(traduzirErroLogin(error.message));
        }

        return;
      }

      setTentativas(0);
      setBloqueadoAte(null);

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
        setMensagem(msg);
        setTimeout(() => router.replace("/aluno"), 1500);
        return;
      }

      setMensagem("Login realizado com sucesso! Redirecionando…");
      setTimeout(() => router.replace("/aluno"), 900);
    } catch (e) {
      console.error("Erro inesperado ao fazer login:", e);
      setMensagem("Não foi possível fazer login. Tente novamente.");
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
          disabled={loading || bloqueado}
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
          disabled={loading || bloqueado}
        />

        <button className="button" type="submit" disabled={loading || bloqueado}>
          {loading
            ? "Entrando..."
            : bloqueado
            ? `Aguarde ${segundosRestantes}s`
            : "Entrar"}
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