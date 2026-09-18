import { requireResponsavelMeta } from "@/lib/perfis/perfil-server";
import MetasResponsavel from "@/components/perfis/MetasResponsavel";

export default async function MetasResponsavelPage() {
  const contexto = await requireResponsavelMeta().catch(() => null);
  if (!contexto) return (
    <main className="min-h-screen bg-[#080b12] p-8 text-white">
      <h1 className="text-2xl font-bold">Gestão de metas do responsável</h1>
      <p className="my-6">Entre com a conta responsável e selecione um perfil para gerenciar suas metas.</p>
      <a href="/perfis" className="underline">Voltar à seleção de perfis</a>
    </main>
  );
  return <MetasResponsavel perfilId={contexto.perfilId} nome={contexto.perfil.nome} />;
}
