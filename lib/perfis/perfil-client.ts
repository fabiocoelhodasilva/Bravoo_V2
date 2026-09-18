"use client";

import { supabase } from "@/lib/supabase/client";
import type { ContextoPerfis } from "./perfis-core";

let contextoPendente: Promise<ContextoPerfis> | undefined;
export const EVENTO_PERFIL_ALTERADO = "bravoo:perfil-alterado";

/** Remove somente caches de dados da Bravoo, preservando preferências do navegador. */
export function limparCachesDePerfil() {
  contextoPendente = undefined;
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith("cache_") || chave.startsWith("bravoo_") || chave.startsWith("bravoo:")) {
        sessionStorage.removeItem(chave);
      }
    }
  } catch { /* A navegação funciona mesmo sem armazenamento local. */ }
}

export function obterContextoPerfis(forcar = false) {
  if (forcar) contextoPendente = undefined;
  if (!contextoPendente) {
    const pedido = fetch("/api/perfil", { cache: "no-store" }).then(async (response) => {
      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error ?? "Não foi possível carregar seu perfil.");
      return resultado as ContextoPerfis;
    }).catch((error) => {
      if (contextoPendente === pedido) contextoPendente = undefined;
      throw error;
    });
    contextoPendente = pedido;
  }
  return contextoPendente;
}

export async function obterPerfilAtivo() {
  const { perfilAtivo } = await obterContextoPerfis();
  if (!perfilAtivo) throw new Error("Selecione um perfil para continuar.");
  return perfilAtivo;
}

export async function obterPerfilAtivoId() { return (await obterPerfilAtivo()).id; }

/** Adaptador de leitura para as telas que já tratam resultados/erros do Supabase. */
export async function buscarPerfilAtivo() {
  try { return { data: { perfil: await obterPerfilAtivo() }, error: null }; }
  catch (error) { return { data: { perfil: null }, error }; }
}

export async function limparPerfilAtivo() {
  const response = await fetch("/api/perfil", { method: "DELETE" });
  if (!response.ok) throw new Error("Não foi possível limpar o perfil ativo.");
  limparCachesDePerfil();
}

export async function definirPerfilAtivo(perfilId: string) {
  const response = await fetch("/api/perfil", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfilId }),
  });
  if (!response.ok) throw new Error((await response.json()).error ?? "Não foi possível selecionar o perfil.");
  limparCachesDePerfil();
  // Outras abas descartam a UI do perfil anterior antes de novas atividades.
  try { localStorage.setItem(EVENTO_PERFIL_ALTERADO, String(Date.now())); } catch {}
}

/** Logout da conta: a seleção é removida antes de encerrar a sessão Supabase. */
export async function encerrarSessao() {
  await limparPerfilAtivo();
  return supabase.auth.signOut();
}
