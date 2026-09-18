"use client";

import { useRef, useState } from "react";
import { criarPerfil } from "./actions";
import { definirPerfilAtivo } from "@/lib/perfis/perfil-client";

export default function NovoPerfilPage() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [perfilCriado, setPerfilCriado] = useState<string | null>(null);
  const emAndamento = useRef(false);

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emAndamento.current) return;
    emAndamento.current = true;
    setSalvando(true);
    setErro("");
    try {
      const perfilId = perfilCriado ?? (await criarPerfil({ nome, dataNascimento })).perfilId;
      setPerfilCriado(perfilId);
      // Em caso de falha na seleção, a próxima tentativa reutiliza o perfil criado.
      await definirPerfilAtivo(perfilId);
      window.location.replace("/aluno");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível continuar. Tente novamente.");
    } finally { emAndamento.current = false; setSalvando(false); }
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-6 py-12 text-white">
      <form onSubmit={salvar} className="mx-auto max-w-md space-y-6">
        <a href="/perfis" className="text-sm text-white/60 underline">Voltar aos perfis</a>
        <h1 className="text-3xl font-semibold">Criar perfil</h1>
        <fieldset disabled={salvando || Boolean(perfilCriado)} className="space-y-4">
          <label className="block">Nome
            <input required maxLength={120} value={nome} onChange={(event) => setNome(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-black p-3" />
          </label>
          <label className="block">Data de nascimento (opcional)
            <input type="date" value={dataNascimento} onChange={(event) => setDataNascimento(event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-black p-3" />
          </label>
        </fieldset>
        {perfilCriado && <p>Perfil criado. Falta concluir a seleção para entrar.</p>}
        {erro && <p role="alert" className="text-amber-200">{erro}</p>}
        <button disabled={salvando} className="rounded-lg bg-[#efa344] px-5 py-3 font-semibold text-black disabled:opacity-50">
          {salvando ? "Aguarde..." : perfilCriado ? "Entrar no perfil criado" : "Criar e entrar"}
        </button>
      </form>
    </main>
  );
}
