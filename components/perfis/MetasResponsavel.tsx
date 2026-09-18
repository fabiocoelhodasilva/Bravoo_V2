"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { alterarMetaOracao } from "@/lib/gamificacao/oracao/oracao-actions";
import { alterarMetaTabuada } from "@/lib/gamificacao/matematica/tabuada-joias-actions";

export default function MetasResponsavel({ perfilId, nome }: { perfilId: string; nome: string }) {
  const [minutos, setMinutos] = useState("");
  const [tabuadas, setTabuadas] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function salvar(tipo: "oracao" | "tabuada") {
    if (salvando) return;
    setSalvando(true);
    setMensagem("");
    try {
      if (tipo === "oracao") await alterarMetaOracao(Number(minutos), perfilId);
      else await alterarMetaTabuada({ supabase, usuarioId: perfilId, tabuadas });
      setMensagem(`Meta de ${tipo === "oracao" ? "oração" : "tabuada"} de ${nome} atualizada.`);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a meta.");
    } finally { setSalvando(false); }
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-6 py-12 text-white">
      <div className="mx-auto max-w-xl space-y-8">
        <a href="/perfis" className="text-sm text-white/60 underline">Voltar aos perfis</a>
        <header>
          <p className="text-sm text-[#efa344]">Área do responsável</p>
          <h1 className="mt-2 text-3xl font-semibold">Metas de {nome}</h1>
          <p className="mt-3 text-white/60">Defina as metas diárias deste perfil. As alterações passam a valer hoje.</p>
        </header>
        <form className="space-y-4 rounded-2xl border border-white/15 p-6" onSubmit={(event) => { event.preventDefault(); void salvar("oracao"); }}>
          <h2 className="text-xl font-semibold">Oração</h2>
          <label htmlFor="minutos-meta" className="block">Nova meta em minutos (1 a 180)</label>
          <input id="minutos-meta" type="number" min={1} max={180} step={1} required disabled={salvando}
            value={minutos} onChange={(event) => setMinutos(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black p-3" />
          <button disabled={salvando} className="rounded-lg bg-[#efa344] px-4 py-3 font-semibold text-black disabled:opacity-50">Salvar meta de oração</button>
        </form>
        <form className="space-y-4 rounded-2xl border border-white/15 p-6" onSubmit={(event) => { event.preventDefault(); void salvar("tabuada"); }}>
          <h2 className="text-xl font-semibold">Tabuada</h2>
          <fieldset disabled={salvando}>
            <legend className="mb-3">Selecione todas as tabuadas da nova meta</legend>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 8 }, (_, i) => i + 2).map((numero) => (
                <label key={numero} className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
                  <input type="checkbox" checked={tabuadas.includes(numero)} onChange={(event) => setTabuadas((atuais) => event.target.checked ? [...atuais, numero].sort((a, b) => a - b) : atuais.filter((valor) => valor !== numero))} />
                  {numero}×
                </label>
              ))}
            </div>
          </fieldset>
          <button disabled={salvando || tabuadas.length === 0} className="rounded-lg bg-[#efa344] px-4 py-3 font-semibold text-black disabled:opacity-50">Salvar meta de tabuada</button>
        </form>
        <p role="status" aria-live="polite">{salvando ? "Salvando..." : mensagem}</p>
      </div>
    </main>
  );
}
