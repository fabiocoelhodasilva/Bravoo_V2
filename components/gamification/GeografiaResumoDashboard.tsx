"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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


/* =========================================================
   Regras de exibição da persistência
========================================================= */

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
    <div className="w-full max-w-sm animate-pulse rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 h-4 w-32 rounded-full bg-white/10" />
      <div className="flex flex-col gap-3">
        <div className="h-[106px] rounded-2xl bg-white/10" />
        <div className="h-[106px] rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

function DashboardGeografiaCard({
  diasSeguidos,
  totalJoias,
}: {
  diasSeguidos: number;
  totalJoias: number;
}) {
  return (
    <section className="w-full max-w-sm rounded-[26px] border border-white/10 bg-[#101010] p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)]">
      <p className="mb-4 text-[12px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
        Meu progresso
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex min-h-[106px] items-center gap-4 rounded-2xl border border-[#e9891d]/20 bg-[#e9891d]/10 px-4 py-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#e9891d]/25 bg-black/25 text-4xl shadow-[0_0_18px_rgba(233,137,29,0.18)]">
            🔥
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white">
              Persistência
            </p>

            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-black leading-none text-white">
                {diasSeguidos}
              </span>

              <span className="pb-[6px] text-sm font-bold text-white/70">
                dias seguidos
              </span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[106px] overflow-hidden rounded-2xl border border-[#3d7a99]/35 bg-gradient-to-br from-[#3d7a99]/35 via-[#1d4f7a]/18 to-black/20 px-4 py-3">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#3d7a99]/25 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#3d7a99]/45 bg-black/25 shadow-[0_0_22px_rgba(61,122,153,0.25)]">
              <img
                src={IMAGEM_JOIA_GEOGRAFIA}
                alt="Safira"
                className="h-14 w-14 object-contain"
                draggable={false}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wide text-white">
                Joias
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black leading-none text-white">
                  {totalJoias}
                </span>

                <span className="pb-[6px] text-sm font-bold text-white/70">
                  Safiras
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
    <DashboardGeografiaCard
      diasSeguidos={diasSeguidos}
      totalJoias={totalJoias}
    />
  );
}