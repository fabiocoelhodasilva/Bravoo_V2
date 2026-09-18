"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Perfil } from "@/lib/perfis/perfis-core";
import { obterContextoPerfis, limparCachesDePerfil, EVENTO_PERFIL_ALTERADO } from "@/lib/perfis/perfil-client";

type AuthContextType = {
  session: Session | null;
  user: User | null; // Compatibilidade: user continua sendo a CONTA, nunca o jogador.
  contaId: string | null;
  perfilAtivo: Perfil | null;
  perfilAtivoId: string | null;
  erroPerfil: string | null;
  loading: boolean;
  isAuthenticated: boolean;
};
const AuthContext = createContext<AuthContextType>({
  session: null, user: null, contaId: null, perfilAtivo: null, perfilAtivoId: null,
  erroPerfil: null, loading: true, isAuthenticated: false,
});

export function AuthProvider({ children, exigirPerfil = true }: { children: ReactNode; exigirPerfil?: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfilAtivo, setPerfilAtivo] = useState<Perfil | null>(null);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let contaAtualId: string | null | undefined;
    let versao = 0;

    async function aplicarSessao(nextSession: Session | null) {
      if (!mounted) return;
      const contaId = nextSession?.user.id ?? null;
      setSession(nextSession);
      if (contaAtualId === contaId) return;
      contaAtualId = contaId;
      const pedido = ++versao;
      limparCachesDePerfil();
      setPerfilAtivo(null);
      setErroPerfil(null);
      setLoading(true);
      try {
        if (!nextSession) {
          await fetch("/api/perfil", { method: "DELETE" });
        } else if (exigirPerfil) {
          const contexto = await obterContextoPerfis(true);
          if (mounted && pedido === versao) setPerfilAtivo(contexto.perfilAtivo);
        }
      } catch (error) {
        if (mounted && pedido === versao) setErroPerfil(error instanceof Error ? error.message : "Erro ao carregar perfil.");
      } finally {
        if (mounted && pedido === versao) setLoading(false);
      }
    }

    // O callback de Auth não aguarda outras chamadas Supabase (evita deadlock de sessão).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void aplicarSessao(nextSession);
    });
    void supabase.auth.getSession().then(({ data }) => aplicarSessao(data.session)).catch(() => aplicarSessao(null));

    function trocarEmOutraAba(event: StorageEvent) {
      if (exigirPerfil && event.key === EVENTO_PERFIL_ALTERADO) {
        limparCachesDePerfil();
        window.location.replace("/aluno");
      }
    }
    function verificarAoVoltar() {
      if (document.visibilityState !== "visible" || !exigirPerfil || !contaAtualId) return;
      void obterContextoPerfis(true).then((contexto) => {
        if (!mounted) return;
        setPerfilAtivo((anterior) => {
          if (anterior?.id !== contexto.perfilAtivo?.id) window.location.replace("/aluno");
          return anterior;
        });
      }).catch(() => { if (mounted) window.location.replace("/"); });
    }
    window.addEventListener("storage", trocarEmOutraAba);
    document.addEventListener("visibilitychange", verificarAoVoltar);
    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", trocarEmOutraAba);
      document.removeEventListener("visibilitychange", verificarAoVoltar);
    };
  }, [exigirPerfil]);

  const value = useMemo(() => ({
    session, user: session?.user ?? null, contaId: session?.user.id ?? null,
    perfilAtivo, perfilAtivoId: perfilAtivo?.id ?? null, erroPerfil, loading,
    isAuthenticated: Boolean(session?.user.id),
  }), [session, perfilAtivo, erroPerfil, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
