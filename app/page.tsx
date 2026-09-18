import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { obterPerfisDaConta, resolverPerfilAtivo, PERFIL_COOKIE } from "@/lib/perfis/perfis-core";
import { cookies } from "next/headers";

export default async function AppIndex() {
  const { supabase, user: conta } = await requireAuth();
  const { data: professor } = await supabase.from("professores").select("aprovado")
    .eq("usuario_id", conta.id).maybeSingle();
  if (professor?.aprovado) redirect("/professor");
  let destino = "/perfis";
  try {
    const { perfis } = await obterPerfisDaConta(supabase, conta.id);
    const perfil = resolverPerfilAtivo(conta.id, perfis, (await cookies()).get(PERFIL_COOKIE)?.value);
    if (perfil) destino = "/aluno";
  } catch { /* A seleção apresenta erro recuperável sem conceder acesso indevido. */ }
  redirect(destino);
}
