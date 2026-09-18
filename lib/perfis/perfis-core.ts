import type { SupabaseClient } from "@supabase/supabase-js";

export const PERFIL_COOKIE = "bravoo_perfil_ativo";
export const PERFIL_COOKIE_OPTIONS = {
  httpOnly: true, sameSite: "lax" as const, path: "/",
  secure: process.env.NODE_ENV === "production",
};

export type Perfil = {
  id: string;
  conta_id: string;
  nome: string;
  email: string | null;
  data_nascimento: string | null;
  criado_em: string | null;
  ano_escolar_id: string | null;
};

export type ContextoPerfis = {
  contaId: string;
  perfis: Perfil[];
  perfilAtivo: Perfil | null;
  legado: boolean;
};

const CAMPOS = "id,conta_id,nome,email,data_nascimento,criado_em,ano_escolar_id";

/** Só permite o login legado quando não há perfis vinculados à conta. */
export async function obterPerfisDaConta(supabase: SupabaseClient, contaId: string) {
  const { data, error } = await supabase.from("usuarios_next").select(CAMPOS)
    .eq("conta_id", contaId).order("criado_em", { ascending: true });
  if (error) throw error;
  if (data?.length) return { perfis: data as Perfil[], legado: false };

  const { data: antigo, error: erroAntigo } = await supabase.from("usuarios_next")
    .select(CAMPOS).eq("id", contaId).maybeSingle();
  if (erroAntigo) throw erroAntigo;
  return { perfis: antigo ? [antigo as Perfil] : [], legado: Boolean(antigo) };
}

/** O cookie é apenas uma seleção: a autorização vem dos registros da conta. */
export function resolverPerfilAtivo(contaId: string, perfis: Perfil[], cookie?: string): Perfil | null {
  if (cookie) {
    try {
      const selecao = JSON.parse(cookie) as { contaId?: string; perfilId?: string };
      if (selecao.contaId !== contaId) return null;
      return perfis.find((perfil) => perfil.id === selecao.perfilId) ?? null;
    } catch { return null; }
  }
  return perfis.length === 1 ? perfis[0] : null;
}

export function serializarPerfil(contaId: string, perfilId: string) {
  return JSON.stringify({ contaId, perfilId });
}

export function selecionarPerfilPermitido(perfis: Perfil[], perfilId: unknown) {
  if (typeof perfilId !== "string") throw new Error("PERFIL_NAO_PERMITIDO");
  const perfil = perfis.find((item) => item.id === perfilId);
  if (!perfil) throw new Error("PERFIL_NAO_PERMITIDO");
  return perfil;
}

/** Somente a conta responsável vinculada ao perfil pode gerenciar suas metas. */
export function podeAlterarMetaAtual(contexto: ContextoPerfis) {
  return !contexto.legado && contexto.perfilAtivo?.conta_id === contexto.contaId;
}

export const META_SOMENTE_RESPONSAVEL = "Somente a conta responsável pode alterar as metas deste perfil.";
