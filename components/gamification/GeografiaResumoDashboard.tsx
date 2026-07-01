"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import MateriaResumoDashboardPadrao from "@/components/gamification/MateriaResumoDashboardPadrao";

const GEOGRAFIA_MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";
const CACHE_DASHBOARD_GEOGRAFIA_KEY = "cache_dashboard_geografia_menu";
const CACHE_MAX_IDADE_MS = 1000 * 60 * 3;
const IMAGEM_JOIA_GEOGRAFIA = "/imagens/joias/joia_blue.png";

type DashboardGeografia = {
  diasSeguidos: number;
  totalJoias: number;
  atualizadoEm: number;
};

function salvarCacheDashboardGeografia(dados: DashboardGeografia) {
  try {
    sessionStorage.setItem(CACHE_DASHBOARD_GEOGRAFIA_KEY, JSON.stringify(dados));
  } catch {}
}

function lerCacheDashboardGeografia(): DashboardGeografia | null {
  try {
    const bruto = sessionStorage.getItem(CACHE_DASHBOARD_GEOGRAFIA_KEY);
    if (!bruto) return null;

    const cache = JSON.parse(bruto) as DashboardGeografia;

    if (!Number.isFinite(cache.diasSeguidos)) return null;
    if (!Number.isFinite(cache.totalJoias)) return null;
    if (!Number.isFinite(cache.atualizadoEm)) return null;

    if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;

    return cache;
  } catch {
    return null;
  }
}

function calcularDiasSeguidosParaExibicao(params: {
  diasSeguidosSalvo: number;
  ultimaDataAtividade: string | null | undefined;
}) {
  const { diasSeguidosSalvo, ultimaDataAtividade } = params;

  if (!ultimaDataAtividade) return 0;

  const hoje = new Date();
  const hojeLocal = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const ultimaData = new Date(`${ultimaDataAtividade}T00:00:00`);
  const ultimaLocal = new Date(
    ultimaData.getFullYear(),
    ultimaData.getMonth(),
    ultimaData.getDate()
  );

  const diferencaDias = Math.floor(
    (hojeLocal.getTime() - ultimaLocal.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias <= 1) {
    return Math.max(0, diasSeguidosSalvo);
  }

  return 0;
}

function DashboardGeografiaSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse">
      <div className="grid w-full grid-cols-2 gap-2 sm:hidden">
        <div className="h-[66px] rounded-[18px] bg-white/10" />
        <div className="h-[66px] rounded-[18px] bg-white/10" />
      </div>

      <div className="hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-4 sm:block">
        <div className="mb-4 h-4 w-32 rounded-full bg-white/10" />
        <div className="flex flex-col gap-3">
          <div className="h-[106px] rounded-2xl bg-white/10" />
          <div className="h-[106px] rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function GeografiaResumoDashboard() {
  const carregamentoEmAndamentoRef = useRef<Promise<void> | null>(null);
  const ultimoCarregamentoRef = useRef(0);

  const [diasSeguidos, setDiasSeguidos] = useState(0);
  const [totalJoias, setTotalJoias] = useState(0);
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [temDadosIniciais, setTemDadosIniciais] = useState(false);

  const aplicarDadosDashboard = useCallback(
    (dados: Omit<DashboardGeografia, "atualizadoEm">) => {
      setDiasSeguidos(dados.diasSeguidos);
      setTotalJoias(dados.totalJoias);
      setTemDadosIniciais(true);

      salvarCacheDashboardGeografia({
        ...dados,
        atualizadoEm: Date.now(),
      });
    },
    []
  );

  const carregarDashboard = useCallback(
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
            setCarregandoDashboard(true);
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            aplicarDadosDashboard({
              diasSeguidos: 0,
              totalJoias: 0,
            });

            return;
          }

          const usuarioId = session.user.id;

          const [sequenciaResult, joiasResult] = await Promise.all([
            supabase
              .from("next_sequencia_dias_usuario")
              .select("dias_seguidos, ultima_data_atividade")
              .eq("usuario_id", usuarioId)
              .eq("materia_id", GEOGRAFIA_MATERIA_ID)
              .maybeSingle(),

            supabase
              .from("next_joias_usuario")
              .select("id", { count: "exact", head: true })
              .eq("usuario_id", usuarioId)
              .eq("materia_id", GEOGRAFIA_MATERIA_ID),
          ]);

          const diasSeguidosParaExibir = calcularDiasSeguidosParaExibicao({
            diasSeguidosSalvo: Number(sequenciaResult.data?.dias_seguidos ?? 0),
            ultimaDataAtividade:
              sequenciaResult.data?.ultima_data_atividade ?? null,
          });

          aplicarDadosDashboard({
            diasSeguidos: diasSeguidosParaExibir,
            totalJoias: joiasResult.count ?? 0,
          });
        } catch (error) {
          console.error("Erro ao carregar dashboard de Geografia:", error);

          if (!temDadosIniciais) {
            aplicarDadosDashboard({
              diasSeguidos: 0,
              totalJoias: 0,
            });
          }
        } finally {
          setCarregandoDashboard(false);
          carregamentoEmAndamentoRef.current = null;
        }
      })();

      carregamentoEmAndamentoRef.current = carregamento;
      return carregamento;
    },
    [aplicarDadosDashboard, temDadosIniciais]
  );

  useEffect(() => {
    const cache = lerCacheDashboardGeografia();

    if (cache) {
      setDiasSeguidos(cache.diasSeguidos);
      setTotalJoias(cache.totalJoias);
      setTemDadosIniciais(true);
      setCarregandoDashboard(false);

      void carregarDashboard({ silencioso: true });
      return;
    }

    void carregarDashboard({ forcar: true });
  }, [carregarDashboard]);

  useEffect(() => {
    const recarregarSilenciosamente = () => {
      void carregarDashboard({ silencioso: true });
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
  }, [carregarDashboard]);

  if (carregandoDashboard && !temDadosIniciais) {
    return <DashboardGeografiaSkeleton />;
  }

  return (
    <MateriaResumoDashboardPadrao
      diasSeguidos={diasSeguidos}
      totalJoias={totalJoias}
      nomeJoia="Safiras"
      imagemJoia={IMAGEM_JOIA_GEOGRAFIA}
    />
  );
}