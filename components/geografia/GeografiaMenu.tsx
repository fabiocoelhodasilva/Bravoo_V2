"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import GamificationBar from "@/components/gamification/GamificationBar";
import { supabase } from "@/lib/supabase/client";
import {
  buscarClassificacaoAtualPorMateria,
  buscarFaixasClassificacao,
  buscarSaldoMoedas,
} from "@/lib/gamificacao/gamificacao-service";
import type {
  ClassificacaoAtualMateriaView,
  FaixaGamificacao,
} from "@/lib/gamificacao/gamificacao-types";

const GEOGRAFIA_MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";

export default function GeografiaMenu() {
  const router = useRouter();

  const [classificacaoAtual, setClassificacaoAtual] =
    useState<ClassificacaoAtualMateriaView | null>(null);
  const [faixas, setFaixas] = useState<FaixaGamificacao[]>([]);
  const [moedas, setMoedas] = useState(0);
  const [carregandoGamificacao, setCarregandoGamificacao] = useState(true);

  async function carregarGamificacao() {
    try {
      setCarregandoGamificacao(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setClassificacaoAtual(null);
        setFaixas([]);
        setMoedas(0);
        return;
      }

      const [classificacao, listaFaixas, saldoMoedas] = await Promise.all([
        buscarClassificacaoAtualPorMateria(supabase, {
          usuarioId: user.id,
          materiaId: GEOGRAFIA_MATERIA_ID,
        }),
        buscarFaixasClassificacao(supabase),
        buscarSaldoMoedas(supabase, user.id),
      ]);

      setClassificacaoAtual(classificacao);
      setFaixas(listaFaixas);
      setMoedas(saldoMoedas);
    } catch (error) {
      console.error("Erro ao carregar gamificação do menu de Geografia:", error);
      setClassificacaoAtual(null);
      setFaixas([]);
      setMoedas(0);
    } finally {
      setCarregandoGamificacao(false);
    }
  }

  useEffect(() => {
    void carregarGamificacao();
  }, []);

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-4 pt-10">
        <h1 className="mb-6 text-center text-4xl font-bold gradient-text">
          Geografia
        </h1>

        {!carregandoGamificacao && (
          <GamificationBar
            classificacaoAtual={classificacaoAtual}
            faixas={faixas}
            escudosDisponiveis={classificacaoAtual?.escudos_disponiveis ?? 0}
            moedas={moedas}
            diasSeguidos={classificacaoAtual?.dias_seguidos ?? 0}
          />
        )}

        <div className="mt-6 flex w-full max-w-sm animate-fade-in flex-col gap-5">
          <HomeFeatureCard
            title="América do Sul — Países"
            href="/geografia/america-do-sul/paises"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="América Central — Países"
            href="/geografia/america-central/paises"
            colorClass="bg-[var(--color-6)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="América do Norte — Países"
            href="/geografia/america-do-norte/paises"
            colorClass="bg-[var(--color-7)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Europa Ocidental — Países"
            href="/geografia/europa/europa-ocidental/paises"
            colorClass="bg-[var(--color-2)] hover:brightness-110"
          />
        </div>

        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}