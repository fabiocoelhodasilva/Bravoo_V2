import "server-only";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/require-auth";
import { obterPerfisDaConta, resolverPerfilAtivo, PERFIL_COOKIE, podeAlterarMetaAtual, META_SOMENTE_RESPONSAVEL } from "./perfis-core";

/** Revalida a conta e o vínculo a cada operação de servidor, sem service_role. */
export async function obterContextoPerfisServidor() {
  const { supabase, user: conta } = await requireAuth({ redirectToLogin: false });
  const { perfis, legado } = await obterPerfisDaConta(supabase, conta.id);
  const cookie = (await cookies()).get(PERFIL_COOKIE)?.value;
  const perfilAtivo = resolverPerfilAtivo(conta.id, perfis, cookie);
  return { supabase, conta, contaId: conta.id, perfis, legado, perfilAtivo };
}

export async function requirePerfil() {
  const contexto = await obterContextoPerfisServidor();
  if (!contexto.perfilAtivo) throw new Error("PERFIL_NAO_SELECIONADO");
  return { ...contexto, perfil: contexto.perfilAtivo, perfilId: contexto.perfilAtivo.id };
}

export async function requireResponsavelMeta() {
  const contexto = await requirePerfil();
  if (!podeAlterarMetaAtual(contexto)) throw new Error(META_SOMENTE_RESPONSAVEL);
  return contexto;
}
