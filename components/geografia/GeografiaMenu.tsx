"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import GamificationBar, {
  GamificationBarSkeleton,
} from "@/components/gamification/GamificationBar";
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

  const carregarGamificacao = useCallback(async () => {
    try {
      setCarregandoGamificacao(true);

      // ANTES: supabase.auth.getUser() — fazia chamada de rede (~200-400ms) para
      // verificar o JWT no servidor antes de disparar as 3 queries abaixo.
      // AGORA: getSession() lê direto do localStorage (sem rede), eliminando essa
      // espera. RLS do Supabase continua protegendo os dados normalmente.
      // PARA REVERTER: trocar getSession() por getUser() e user.id por session.user.id.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setClassificacaoAtual(null);
        setFaixas([]);
        setMoedas(0);
        return;
      }

      const [classificacao, listaFaixas, saldoMoedas] = await Promise.all([
        buscarClassificacaoAtualPorMateria(supabase, {
          usuarioId: session.user.id,
          materiaId: GEOGRAFIA_MATERIA_ID,
        }),
        buscarFaixasClassificacao(supabase),
        buscarSaldoMoedas(supabase, session.user.id),
      ]);

      const listaFaixasOrdenada = [...listaFaixas].sort(
        (a, b) => a.ordem - b.ordem
      );

      setFaixas(listaFaixasOrdenada);
      setMoedas(saldoMoedas);

      if (!classificacao && listaFaixasOrdenada.length > 0) {
        const faixaInicial = listaFaixasOrdenada[0];

        const classificacaoInicial: ClassificacaoAtualMateriaView = {
          usuario_id: session.user.id,
          materia_id: GEOGRAFIA_MATERIA_ID,

          dias_seguidos: 0,
          maior_sequencia: 0,
          ultima_data_atividade: null,

          pontos_consistencia: 0,
          escudos_disponiveis: 0,
          ultimo_marco_escudo_concedido: 0,

          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),

          classificacao_id: faixaInicial.id,
          classificacao_nome: faixaInicial.nome,
          classificacao_ordem: faixaInicial.ordem,
          classificacao_cor: faixaInicial.cor ?? null,

          classificacao_dias_minimos: faixaInicial.diasMinimos,
          classificacao_dias_maximos: faixaInicial.diasMaximos,

          percentual_progresso_classificacao: 0,
        };

        setClassificacaoAtual(classificacaoInicial);
      } else {
        setClassificacaoAtual(classificacao);
      }
    } catch (error) {
      console.error("Erro ao carregar gamificação do menu de Geografia:", error);
      setClassificacaoAtual(null);
      setFaixas([]);
      setMoedas(0);
    } finally {
      setCarregandoGamificacao(false);
    }
  }, []);

  useEffect(() => {
    void carregarGamificacao();
  }, [carregarGamificacao]);

  useEffect(() => {
    let timeoutId1: ReturnType<typeof setTimeout> | null = null;
    let timeoutId2: ReturnType<typeof setTimeout> | null = null;

    const recarregarComRefresco = () => {
      void carregarGamificacao();

      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);

      timeoutId1 = setTimeout(() => {
        void carregarGamificacao();
      }, 600);

      timeoutId2 = setTimeout(() => {
        void carregarGamificacao();
      }, 1500);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recarregarComRefresco();
      }
    };

    window.addEventListener("focus", recarregarComRefresco);
    window.addEventListener("pageshow", recarregarComRefresco);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", recarregarComRefresco);
      window.removeEventListener("pageshow", recarregarComRefresco);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);
    };
  }, [carregarGamificacao]);

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

        {carregandoGamificacao ? (
          <GamificationBarSkeleton />
        ) : (
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