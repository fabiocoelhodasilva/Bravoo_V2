"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
const CACHE_GAMIFICACAO_GEOGRAFIA_KEY = "cache_gamificacao_geografia_menu";
const CACHE_MAX_IDADE_MS = 1000 * 60 * 3;

type CacheGamificacaoGeografia = {
  classificacaoAtual: ClassificacaoAtualMateriaView | null;
  faixas: FaixaGamificacao[];
  moedas: number;
  atualizadoEm: number;
};

function salvarCacheGamificacaoGeografia(
  classificacaoAtual: ClassificacaoAtualMateriaView | null,
  faixas: FaixaGamificacao[],
  moedas: number
) {
  try {
    const cache: CacheGamificacaoGeografia = {
      classificacaoAtual,
      faixas,
      moedas,
      atualizadoEm: Date.now(),
    };

    sessionStorage.setItem(
      CACHE_GAMIFICACAO_GEOGRAFIA_KEY,
      JSON.stringify(cache)
    );
  } catch {}
}

function lerCacheGamificacaoGeografia(): CacheGamificacaoGeografia | null {
  try {
    const bruto = sessionStorage.getItem(CACHE_GAMIFICACAO_GEOGRAFIA_KEY);

    if (!bruto) return null;

    const cache = JSON.parse(bruto) as CacheGamificacaoGeografia;

    if (!Array.isArray(cache.faixas)) return null;
    if (!Number.isFinite(cache.moedas)) return null;
    if (!Number.isFinite(cache.atualizadoEm)) return null;

    const cacheAindaUtil = Date.now() - cache.atualizadoEm <= CACHE_MAX_IDADE_MS;

    if (!cacheAindaUtil) return null;

    return cache;
  } catch {
    return null;
  }
}

export default function GeografiaMenu() {
  const router = useRouter();
  const carregamentoEmAndamentoRef = useRef<Promise<void> | null>(null);
  const ultimoCarregamentoRef = useRef(0);

  const [classificacaoAtual, setClassificacaoAtual] =
    useState<ClassificacaoAtualMateriaView | null>(null);
  const [faixas, setFaixas] = useState<FaixaGamificacao[]>([]);
  const [moedas, setMoedas] = useState(0);
  const [carregandoGamificacao, setCarregandoGamificacao] = useState(true);
  const [temDadosIniciais, setTemDadosIniciais] = useState(false);

  const aplicarDadosGamificacao = useCallback(
    (
      classificacao: ClassificacaoAtualMateriaView | null,
      listaFaixas: FaixaGamificacao[],
      saldoMoedas: number,
      usuarioId: string
    ) => {
      const listaFaixasOrdenada = [...listaFaixas].sort(
        (a, b) => a.ordem - b.ordem
      );

      let classificacaoFinal = classificacao;

      if (!classificacaoFinal && listaFaixasOrdenada.length > 0) {
        const faixaInicial = listaFaixasOrdenada[0];

        classificacaoFinal = {
          usuario_id: usuarioId,
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
      }

      setFaixas(listaFaixasOrdenada);
      setMoedas(saldoMoedas);
      setClassificacaoAtual(classificacaoFinal);
      setTemDadosIniciais(true);
      salvarCacheGamificacaoGeografia(
        classificacaoFinal,
        listaFaixasOrdenada,
        saldoMoedas
      );
    },
    []
  );

  const carregarGamificacao = useCallback(
    async (options?: { silencioso?: boolean; forcar?: boolean }) => {
      const silencioso = options?.silencioso ?? false;
      const forcar = options?.forcar ?? false;
      const agora = Date.now();

      if (!forcar && agora - ultimoCarregamentoRef.current < 2500) {
        return carregamentoEmAndamentoRef.current ?? Promise.resolve();
      }

      if (carregamentoEmAndamentoRef.current) {
        return carregamentoEmAndamentoRef.current;
      }

      const carregamento = (async () => {
        try {
          ultimoCarregamentoRef.current = Date.now();

          if (!silencioso && !temDadosIniciais) {
            setCarregandoGamificacao(true);
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            setClassificacaoAtual(null);
            setFaixas([]);
            setMoedas(0);
            setTemDadosIniciais(true);
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

          aplicarDadosGamificacao(
            classificacao,
            listaFaixas,
            saldoMoedas,
            session.user.id
          );
        } catch (error) {
          console.error("Erro ao carregar gamificação do menu de Geografia:", error);

          if (!temDadosIniciais) {
            setClassificacaoAtual(null);
            setFaixas([]);
            setMoedas(0);
            setTemDadosIniciais(true);
          }
        } finally {
          setCarregandoGamificacao(false);
          carregamentoEmAndamentoRef.current = null;
        }
      })();

      carregamentoEmAndamentoRef.current = carregamento;
      return carregamento;
    },
    [aplicarDadosGamificacao, temDadosIniciais]
  );

  useEffect(() => {
    const cache = lerCacheGamificacaoGeografia();

    if (cache) {
      setClassificacaoAtual(cache.classificacaoAtual);
      setFaixas(cache.faixas);
      setMoedas(cache.moedas);
      setTemDadosIniciais(true);
      setCarregandoGamificacao(false);
      void carregarGamificacao({ silencioso: true });
      return;
    }

    void carregarGamificacao({ forcar: true });
  }, [carregarGamificacao]);

  useEffect(() => {
    const recarregarSilenciosamente = () => {
      void carregarGamificacao({ silencioso: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recarregarSilenciosamente();
      }
    };

    window.addEventListener("focus", recarregarSilenciosamente);
    window.addEventListener("pageshow", recarregarSilenciosamente);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", recarregarSilenciosamente);
      window.removeEventListener("pageshow", recarregarSilenciosamente);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

        {carregandoGamificacao && !temDadosIniciais ? (
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
            title="Europa — Países"
            href="/geografia/europa"
            colorClass="bg-[var(--color-2)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Brasil"
            href="/geografia/brasil"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />
        </div>

        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}
