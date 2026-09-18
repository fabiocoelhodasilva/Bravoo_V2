"use server";

import { obterContextoPerfisServidor } from "@/lib/perfis/perfil-server";

export async function criarPerfil(dados: { nome: string; dataNascimento?: string }) {
  const { supabase, contaId, legado } = await obterContextoPerfisServidor();
  if (legado) throw new Error("Entre com a conta responsável para adicionar perfis.");
  const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
  if (!nome || nome.length > 120) throw new Error("Informe um nome com até 120 caracteres.");
  const nascimento = dados.dataNascimento || null;
  if (nascimento) {
    const data = new Date(`${nascimento}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || !Number.isFinite(data.getTime()) ||
        data.toISOString().slice(0, 10) !== nascimento || data.getTime() > Date.now()) {
      throw new Error("Informe uma data de nascimento válida, que não esteja no futuro.");
    }
  }
  // O banco gera o UUID; a conta vem exclusivamente da sessão autenticada.
  const { data, error } = await supabase.from("usuarios_next")
    .insert({ nome, data_nascimento: nascimento, conta_id: contaId })
    .select("id").single();
  if (error || !data?.id) throw new Error("Não foi possível criar o perfil. Tente novamente.");
  return { perfilId: data.id as string };
}
