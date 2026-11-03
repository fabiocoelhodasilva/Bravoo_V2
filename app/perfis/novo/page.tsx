"use client";

import { useRef, useState } from "react";
import { criarPerfil } from "./actions";
import { definirPerfilAtivo } from "@/lib/perfis/perfil-client";

function formatarDataNascimento(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

function converterDataNascimentoParaISO(valor: string) {
  if (!valor.trim()) return "";

  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!partes) {
    throw new Error("Digite a data no formato DD/MM/AAAA.");
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(0);
  data.setUTCHours(0, 0, 0, 0);
  data.setUTCFullYear(ano, mes - 1, dia);

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    throw new Error("Digite uma data de nascimento válida.");
  }

  const hoje = new Date();
  const hojeUTC = new Date(0);
  hojeUTC.setUTCHours(0, 0, 0, 0);
  hojeUTC.setUTCFullYear(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (data > hojeUTC) {
    throw new Error("A data de nascimento não pode estar no futuro.");
  }

  return `${partes[3]}-${partes[2]}-${partes[1]}`;
}

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
      const nascimentoISO = converterDataNascimentoParaISO(dataNascimento);
      const perfilId = perfilCriado ?? (await criarPerfil({ nome, dataNascimento: nascimentoISO })).perfilId;
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
            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              value={dataNascimento}
              onChange={(event) => setDataNascimento(formatarDataNascimento(event.target.value))}
              className="mt-2 w-full rounded-lg border border-white/20 bg-black p-3"
            />
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
