"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useRef, useState } from "react";
import { registrarMomentoOracao } from "@/lib/gamificacao/oracao/oracao-actions";
import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Tipos
========================================================= */

type ResumoDashboardOracao = {
  minutosHoje: number;
  minutosAno: number;
  metaDiaria: number;
  persistenciaDias: number;
  totalJoiasEspiritual?: number;
};

type OracaoDashboardPanelProps = {
  onClose: () => void;
  onAbrirMeuJardim?: () => void;
  dadosIniciais?: ResumoDashboardOracao | null;
  dadosIniciaisCarregando?: boolean;
  onResumoAtualizado?: (resumo: ResumoDashboardOracao) => void;
  onOracaoRegistrada?: () => void | Promise<void>;
};

/* =========================================================
   Constantes
========================================================= */

const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";

const META_PADRAO_ORACAO = 5;
const OPCOES_META_ORACAO = [5, 10, 15];

const EVENTO_JOIA_CONQUISTADA = "bravoo:joia-conquistada";

const IMAGEM_SAUDE_RADIANTE = "/imagens/jardim/estagios/radiante.png";
const IMAGEM_JOIA_ESPIRITUAL = "/imagens/joias/joia_red.png";

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function notificarDashboardSobreJoia() {
  window.dispatchEvent(new Event(EVENTO_JOIA_CONQUISTADA));
}

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function getIntervaloHojeLocal() {
  const hoje = new Date();
  const dataLocal = formatarDataLocal(hoje);

  return {
    inicio: `${dataLocal} 00:00:00`,
    fim: `${dataLocal} 23:59:59.999`,
  };
}

function getInicioAnoLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  return `${ano}-01-01 00:00:00`;
}

function calcularPersistenciaAtualParaExibicao(params: {
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
    return diasSeguidosSalvo;
  }

  return 0;
}

/* =========================================================
   Componente principal
========================================================= */

export default function OracaoDashboardPanel({
  onClose,
  onAbrirMeuJardim,
  dadosIniciais = null,
  dadosIniciaisCarregando = false,
  onResumoAtualizado,
  onOracaoRegistrada,
}: OracaoDashboardPanelProps) {
  /* =========================================================
     Estados principais
  ========================================================= */

  const [minutosHoje, setMinutosHoje] = useState(
    dadosIniciais?.minutosHoje ?? 0
  );
  const [metaDiaria, setMetaDiaria] = useState(
    dadosIniciais?.metaDiaria ?? META_PADRAO_ORACAO
  );
  const [persistenciaDias, setPersistenciaDias] = useState(
    dadosIniciais?.persistenciaDias ?? 0
  );
  const [minutosAno, setMinutosAno] = useState(
    dadosIniciais?.minutosAno ?? 0
  );
  const [totalJoiasEspiritual, setTotalJoiasEspiritual] = useState<
    number | null
  >(dadosIniciais?.totalJoiasEspiritual ?? null);

  const [carregando, setCarregando] = useState(
    dadosIniciaisCarregando || !dadosIniciais
  );
  const [salvando, setSalvando] = useState(false);
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [modalItensGanhosAberto, setModalItensGanhosAberto] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [itensGanhos, setItensGanhos] = useState(0);
  const [mostrarOutroValorMeta, setMostrarOutroValorMeta] = useState(false);
  const [metaPersonalizadaInput, setMetaPersonalizadaInput] = useState("");

  /* =========================================================
     Refs
  ========================================================= */

  const montadoRef = useRef(true);
  const dadosIniciaisAplicadosRef = useRef(false);
  const inputMetaPersonalizadaRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     Cálculos derivados
  ========================================================= */

  const metaSegura = Math.max(1, metaDiaria || META_PADRAO_ORACAO);

  const progresso = Math.min(
    100,
    Math.round((minutosHoje / metaSegura) * 100)
  );

  /* =========================================================
     Supabase helpers
  ========================================================= */

  async function getUsuarioAtual() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw error ?? new Error("Usuário não identificado.");
    }

    return user;
  }

  async function carregarTotalJoiasEspiritual() {
    try {
      const user = await getUsuarioAtual();

      const { count, error } = await supabase
        .from("next_joias_usuario")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID);

      if (error) {
        registrarErroDev("Erro ao carregar joias espirituais:", error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      registrarErroDev(
        "Erro inesperado ao carregar joias espirituais:",
        error
      );
      return 0;
    }
  }

  async function carregarMinutosOracaoHoje() {
    try {
      const user = await getUsuarioAtual();
      const { inicio, fim } = getIntervaloHojeLocal();

      const { data, error } = await supabase
        .from("next_sessoes_atividade")
        .select("tempo_total_segundos")
        .eq("usuario_id", user.id)
        .eq("atividade_id", ATIVIDADE_ORACAO_ID)
        .gte("data_execucao", inicio)
        .lte("data_execucao", fim);

      if (error) {
        registrarErroDev("Erro ao carregar minutos de oração hoje:", error);
        return 0;
      }

      const totalSegundos = (data ?? []).reduce((total, item) => {
        return total + Number(item.tempo_total_segundos ?? 0);
      }, 0);

      return Math.floor(totalSegundos / 60);
    } catch (error) {
      registrarErroDev("Erro inesperado ao carregar minutos de hoje:", error);
      return 0;
    }
  }

  async function carregarMetaOracao() {
    try {
      const user = await getUsuarioAtual();

      const { data, error } = await supabase
        .from("next_metas_usuario")
        .select("meta_diaria")
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID)
        .maybeSingle();

      if (error) {
        registrarErroDev("Erro ao carregar meta de oração:", error);
        return META_PADRAO_ORACAO;
      }

      const metaCarregada = Number(data?.meta_diaria ?? META_PADRAO_ORACAO);

      if (!Number.isFinite(metaCarregada) || metaCarregada <= 0) {
        return META_PADRAO_ORACAO;
      }

      return metaCarregada;
    } catch (error) {
      registrarErroDev("Erro inesperado ao carregar meta de oração:", error);
      return META_PADRAO_ORACAO;
    }
  }

  async function carregarPersistenciaDias() {
    try {
      const user = await getUsuarioAtual();

      const { data, error } = await supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos, ultima_data_atividade")
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID)
        .maybeSingle();

      if (error) {
        registrarErroDev("Erro ao carregar persistência:", error);
        return 0;
      }

      return calcularPersistenciaAtualParaExibicao({
        diasSeguidosSalvo: Number(data?.dias_seguidos ?? 0),
        ultimaDataAtividade: data?.ultima_data_atividade ?? null,
      });
    } catch (error) {
      registrarErroDev("Erro inesperado ao carregar persistência:", error);
      return 0;
    }
  }

  async function carregarMinutosOracaoAno() {
    try {
      const user = await getUsuarioAtual();
      const inicioAno = getInicioAnoLocal();

      const { data, error } = await supabase
        .from("next_sessoes_atividade")
        .select("tempo_total_segundos")
        .eq("usuario_id", user.id)
        .eq("atividade_id", ATIVIDADE_ORACAO_ID)
        .gte("data_execucao", inicioAno);

      if (error) {
        registrarErroDev("Erro ao carregar minutos de oração no ano:", error);
        return 0;
      }

      const totalSegundos = (data ?? []).reduce((total, item) => {
        return total + Number(item.tempo_total_segundos ?? 0);
      }, 0);

      return Math.floor(totalSegundos / 60);
    } catch (error) {
      registrarErroDev("Erro inesperado ao carregar minutos do ano:", error);
      return 0;
    }
  }

  /* =========================================================
     Meta de oração
  ========================================================= */

  async function salvarMetaOracao(novaMeta: number) {
    if (salvandoMeta) return;

    if (!Number.isFinite(novaMeta) || novaMeta < 1 || novaMeta > 180) {
      alert("Digite uma meta entre 1 e 180 minutos.");
      return;
    }

    try {
      setSalvandoMeta(true);

      const user = await getUsuarioAtual();

      const { error } = await supabase.from("next_metas_usuario").upsert(
        {
          usuario_id: user.id,
          materia_id: MATERIA_ESPIRITUAL_ID,
          meta_diaria: novaMeta,
          meta_personalizada: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "usuario_id,materia_id",
        }
      );

      if (error) throw error;

      const metaConfirmada = await carregarMetaOracao();

      if (!montadoRef.current) return;

      setMetaDiaria(metaConfirmada);

      onResumoAtualizado?.({
        minutosHoje,
        minutosAno,
        metaDiaria: metaConfirmada,
        persistenciaDias,
        totalJoiasEspiritual: totalJoiasEspiritual ?? undefined,
      });

      setModalMetaAberto(false);
      setMostrarOutroValorMeta(false);
      setMetaPersonalizadaInput("");
      setMensagem(`Meta diária atualizada para ${metaConfirmada} minutos.`);

      setTimeout(() => {
        if (montadoRef.current) setMensagem("");
      }, 2500);
    } catch (error) {
      registrarErroDev("Erro ao salvar meta de oração:", error);
      alert("Não foi possível alterar a meta agora.");
    } finally {
      setSalvandoMeta(false);
    }
  }

  function abrirOutroValorMeta() {
    setMostrarOutroValorMeta(true);
    setMetaPersonalizadaInput(String(metaDiaria));

    setTimeout(() => {
      inputMetaPersonalizadaRef.current?.focus();
      inputMetaPersonalizadaRef.current?.select();
    }, 80);
  }

  function handleMetaPersonalizadaChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const apenasNumeros = event.target.value.replace(/\D/g, "");
    setMetaPersonalizadaInput(apenasNumeros);
  }

  async function salvarMetaPersonalizada() {
    const novaMeta = Number(metaPersonalizadaInput);
    await salvarMetaOracao(novaMeta);
  }

  /* =========================================================
     Carregamento inicial
  ========================================================= */

  useEffect(() => {
    montadoRef.current = true;

    if (dadosIniciais && !dadosIniciaisAplicadosRef.current) {
      dadosIniciaisAplicadosRef.current = true;

      setMinutosHoje(dadosIniciais.minutosHoje);
      setPersistenciaDias(dadosIniciais.persistenciaDias);
      setMinutosAno(dadosIniciais.minutosAno);
      setMetaDiaria(dadosIniciais.metaDiaria);
      setTotalJoiasEspiritual(dadosIniciais.totalJoiasEspiritual ?? null);
      setCarregando(false);
    }

    async function carregarDados() {
      try {
        if (!dadosIniciaisAplicadosRef.current) {
          setCarregando(true);
        }

        const [
          totalMinutosHoje,
          totalPersistenciaDias,
          totalMinutosAno,
          metaOracao,
          totalJoias,
        ] = await Promise.all([
          carregarMinutosOracaoHoje(),
          carregarPersistenciaDias(),
          carregarMinutosOracaoAno(),
          carregarMetaOracao(),
          carregarTotalJoiasEspiritual(),
        ]);

        if (!montadoRef.current) return;

        const resumoAtualizado = {
          minutosHoje: totalMinutosHoje,
          persistenciaDias: totalPersistenciaDias,
          minutosAno: totalMinutosAno,
          metaDiaria: metaOracao,
          totalJoiasEspiritual: totalJoias,
        };

        setMinutosHoje(resumoAtualizado.minutosHoje);
        setPersistenciaDias(resumoAtualizado.persistenciaDias);
        setMinutosAno(resumoAtualizado.minutosAno);
        setMetaDiaria(resumoAtualizado.metaDiaria);
        setTotalJoiasEspiritual(totalJoias);
        onResumoAtualizado?.(resumoAtualizado);
      } catch (error) {
        registrarErroDev("Erro ao carregar dados de oração:", error);
      } finally {
        if (montadoRef.current) setCarregando(false);
      }
    }

    void carregarDados();

    return () => {
      montadoRef.current = false;
    };
  }, []);

  /* =========================================================
     Atualização após registrar oração
  ========================================================= */

  async function atualizarResumoAposRegistro(minutosOtimista: number) {
    const [
      totalMinutosHoje,
      totalPersistenciaDias,
      totalMinutosAno,
      metaOracao,
      totalJoias,
    ] = await Promise.all([
      carregarMinutosOracaoHoje(),
      carregarPersistenciaDias(),
      carregarMinutosOracaoAno(),
      carregarMetaOracao(),
      carregarTotalJoiasEspiritual(),
    ]);

    if (!montadoRef.current) return;

    const resumoAtualizado = {
      minutosHoje: totalMinutosHoje > 0 ? totalMinutosHoje : minutosOtimista,
      persistenciaDias: totalPersistenciaDias,
      minutosAno: totalMinutosAno,
      metaDiaria: metaOracao,
      totalJoiasEspiritual: totalJoias,
    };

    setMinutosHoje(resumoAtualizado.minutosHoje);
    setPersistenciaDias(resumoAtualizado.persistenciaDias);
    setMinutosAno(resumoAtualizado.minutosAno);
    setMetaDiaria(resumoAtualizado.metaDiaria);
    setTotalJoiasEspiritual(totalJoias);
    onResumoAtualizado?.(resumoAtualizado);
  }

  async function registrarOracao(minutos: number) {
    if (salvando) return;

    const minutosAntes = minutosHoje;
    const minutosOtimista = minutosAntes + minutos;

    try {
      setSalvando(true);
      setMensagem("");
      setModalAberto(false);
      setMinutosHoje(minutosOtimista);

      const resultado = await registrarMomentoOracao(minutos);

      if (resultado?.joiaConquistada) {
        notificarDashboardSobreJoia();
      }

      await atualizarResumoAposRegistro(minutosOtimista);

      if (onOracaoRegistrada) {
        Promise.resolve(onOracaoRegistrada()).catch((callbackError) => {
          registrarErroDev(
            "Erro ao atualizar dados do jardim após oração:",
            callbackError
          );
        });
      }

      const novosItensLiberados = Number(
        resultado?.resumoJardim?.creditosNovos ?? 0
      );

      if (novosItensLiberados > 0) {
        setMensagem("");
        setItensGanhos(novosItensLiberados);
        setModalItensGanhosAberto(true);
      } else {
        setMensagem(`Oração registrada! +${minutos} minuto(s). 🙏`);

        setTimeout(() => {
          if (montadoRef.current) setMensagem("");
        }, 2500);
      }
    } catch (error) {
      registrarErroDev("Erro ao registrar oração:", error);
      setMinutosHoje(minutosAntes);
      alert("Não foi possível registrar a oração. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  /* =========================================================
     Navegação para Meu Jardim
  ========================================================= */

  function handleAbrirMeuJardim() {
    setModalItensGanhosAberto(false);
    setItensGanhos(0);

    if (onAbrirMeuJardim) {
      onAbrirMeuJardim();
      return;
    }

    onClose();
  }

  /* =========================================================
     Componentes internos
  ========================================================= */

  function CardPersistenciaOracao() {
    const textoDias = persistenciaDias === 1 ? "dia seguido" : "dias seguidos";

    return (
      <div className="relative min-h-[106px] overflow-hidden rounded-2xl border border-[#e9891d]/35 bg-gradient-to-br from-[#e9891d]/30 via-[#7a3f1d]/18 to-black/20 px-4 py-3 shadow-[0_0_18px_rgba(233,137,29,0.12)]">
        <div className="pointer-events-none absolute -right-8 -bottom-10 text-[7rem] leading-none opacity-[0.08]">
          🔥
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#e9891d]/45 bg-black/25 text-4xl shadow-[0_0_22px_rgba(233,137,29,0.25)]">
            🔥
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white">
              Persistência
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-white">
                {persistenciaDias}
              </span>

              <span className="pb-[6px] text-sm font-bold text-white/70">
                {textoDias}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function CardJoiasEspiritual() {
    const totalDiamantes = totalJoiasEspiritual ?? "...";

    return (
      <div className="relative min-h-[106px] overflow-hidden rounded-2xl border border-[#3d7a99]/35 bg-gradient-to-br from-[#3d7a99]/35 via-[#1d4f7a]/18 to-black/20 px-4 py-3 shadow-[0_0_18px_rgba(61,122,153,0.12)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#3d7a99]/25 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#3d7a99]/45 bg-black/25 shadow-[0_0_22px_rgba(61,122,153,0.25)]">
            <img
              src={IMAGEM_JOIA_ESPIRITUAL}
              alt="Diamantes"
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
                {totalDiamantes}
              </span>

              <span className="pb-[6px] text-sm font-bold text-white/70">
                Diamantes
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/45 px-3 pb-[90px] pt-[24px] backdrop-blur-[2px]">
      <div className="relative max-h-[calc(100dvh-110px)] w-full max-w-[480px] overflow-y-auto rounded-[28px] border border-white/10 bg-[#101514]/95 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold hover:bg-white/20"
        >
          ×
        </button>

        <div className="p-4">
          <div className="mb-4 pr-10">
            <h2 className="text-2xl font-black">Minhas Orações</h2>

            <p className="mt-2 text-sm text-white/65">
              Registre suas orações e acompanhe seu progresso.
            </p>
          </div>

          <div className="mb-4 rounded-3xl border border-[#5dc6a1]/25 bg-gradient-to-br from-[#5dc6a1]/20 via-[#3d7a99]/15 to-[#f1e6a7]/10 p-4">
            <div className="flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-black/30">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#5dc6a1 ${progresso}%, rgba(255,255,255,0.12) 0)`,
                  }}
                />

                <div className="relative flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-[#101514]">
                  <div className="text-2xl font-black leading-none">
                    {metaSegura}
                  </div>
                  <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/70">
                    min
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">🙏 Meta do dia</h3>

                    <p className="mt-1 text-sm text-white/65">
                      {carregando
                        ? "Carregando seus dados..."
                        : minutosHoje >= metaSegura
                        ? `Minutos totais hoje: ${minutosHoje} min.`
                        : `${minutosHoje} de ${metaSegura} minutos hoje.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalMetaAberto(true)}
                    disabled={carregando || salvandoMeta}
                    className="shrink-0 rounded-full border border-[#5dc6a1]/40 bg-black/20 px-3 py-1 text-[11px] font-bold text-[#5dc6a1] transition hover:bg-[#5dc6a1]/10 disabled:cursor-wait disabled:opacity-50"
                  >
                    Alterar Meta
                  </button>
                </div>

                {!carregando && (
                  <p
                    className={`mt-4 text-sm font-bold ${
                      minutosHoje >= metaSegura
                        ? "text-[#5dc6a1]"
                        : "text-white/70"
                    }`}
                  >
                    {minutosHoje > metaSegura
                      ? "🎉 Parabéns, você superou a meta."
                      : minutosHoje === metaSegura
                      ? "🎉 Parabéns, você cumpriu a meta hoje."
                      : `Faltam ${Math.max(
                          0,
                          metaSegura - minutosHoje
                        )} min para cumprir a meta`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-[#5dc6a1]/20 bg-[#5dc6a1]/10 px-4 py-2 text-center text-xs font-bold text-[#5dc6a1]">
            Ore e ganhe até 10 itens para seu jardim por dia!
          </div>

          <div className="mx-auto mb-4 flex w-full max-w-[420px] flex-col gap-3">
            <CardPersistenciaOracao />
            <CardJoiasEspiritual />
          </div>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            disabled={carregando || salvando}
            className="w-full rounded-2xl bg-[#5dc6a1] px-5 py-4 text-base font-black text-white shadow-lg disabled:cursor-wait disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Registrar oração"}
          </button>
        </div>

        {modalAberto && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
            <div className="w-full max-w-[340px] rounded-3xl border border-white/10 bg-[#111] p-6 text-center shadow-2xl">
              <div className="mb-2 text-5xl">🙏</div>

              <h3 className="text-lg font-bold">Oração realizada</h3>

              <p className="mb-4 text-sm text-white/60">
                Quanto tempo durou esta oração?
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[1, 3, 5, 10].map((minuto) => (
                  <button
                    key={minuto}
                    type="button"
                    onClick={() => registrarOracao(minuto)}
                    disabled={salvando}
                    className="rounded-xl bg-[#5dc6a1]/10 p-4 hover:bg-[#5dc6a1]/20 disabled:cursor-wait disabled:opacity-50"
                  >
                    <div className="text-xl font-black text-[#5dc6a1]">
                      {minuto}
                    </div>
                    <div className="text-xs text-white/60">min</div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {modalItensGanhosAberto && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[360px] rounded-[28px] border border-[#5dc6a1]/35 bg-[#101514] p-5 text-center shadow-2xl">
              <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-[#5dc6a1]/25 bg-[#5dc6a1]/10 shadow-lg">
                <img
                  src={IMAGEM_SAUDE_RADIANTE}
                  alt="Jardim radiante"
                  className="h-full w-full object-contain p-2"
                  draggable={false}
                />
              </div>

              <h3 className="text-xl font-black text-white">
                {itensGanhos === 1
                  ? "Você liberou 1 item para o jardim!"
                  : `Você liberou ${itensGanhos} itens para o jardim!`}
              </h3>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/70">
                {itensGanhos === 1
                  ? "Sua oração fortaleceu o jardim. Agora você pode plantar uma nova semente."
                  : "Suas orações fortaleceram o jardim. Agora você pode plantar novas sementes."}
              </p>

              <button
                type="button"
                onClick={handleAbrirMeuJardim}
                className="mt-5 w-full rounded-xl bg-[#5dc6a1] py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#4cb391]"
              >
                Ir para Meu Jardim
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalItensGanhosAberto(false);
                  setItensGanhos(0);
                }}
                className="mt-3 w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white/80 transition hover:bg-white/15"
              >
                Continuar aqui
              </button>
            </div>
          </div>
        )}

        {modalMetaAberto && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
            <div className="w-full max-w-[340px] rounded-3xl border border-white/10 bg-[#111] p-6 text-center shadow-2xl">
              <div className="mb-2 text-5xl">🎯</div>

              <h3 className="text-lg font-bold">Alterar meta</h3>

              <p className="mb-4 text-sm text-white/60">
                Escolha sua meta diária de oração.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {OPCOES_META_ORACAO.map((meta) => {
                  const metaSelecionada =
                    meta === metaDiaria && !mostrarOutroValorMeta;

                  return (
                    <button
                      key={meta}
                      type="button"
                      onClick={() => void salvarMetaOracao(meta)}
                      disabled={salvandoMeta}
                      className={`rounded-xl p-4 transition disabled:cursor-wait disabled:opacity-50 ${
                        metaSelecionada
                          ? "bg-[#5dc6a1] text-white"
                          : "bg-[#5dc6a1]/10 text-[#5dc6a1] hover:bg-[#5dc6a1]/20"
                      }`}
                    >
                      <div className="text-xl font-black">{meta}</div>
                      <div
                        className={`text-xs ${
                          metaSelecionada ? "text-white/80" : "text-white/60"
                        }`}
                      >
                        min por dia
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={abrirOutroValorMeta}
                  disabled={salvandoMeta}
                  className={`rounded-xl p-4 transition disabled:cursor-wait disabled:opacity-50 ${
                    mostrarOutroValorMeta
                      ? "bg-[#5dc6a1] text-white"
                      : "bg-[#5dc6a1]/10 text-[#5dc6a1] hover:bg-[#5dc6a1]/20"
                  }`}
                >
                  <div className="text-xl font-black">Outros</div>
                  <div
                    className={`text-xs ${
                      mostrarOutroValorMeta ? "text-white/80" : "text-white/60"
                    }`}
                  >
                    digitar meta
                  </div>
                </button>
              </div>

              {mostrarOutroValorMeta && (
                <div className="mt-4 rounded-2xl border border-[#5dc6a1]/25 bg-black/20 p-3 text-left">
                  <label className="mb-2 block text-xs font-bold text-white/60">
                    Digite a meta em minutos
                  </label>

                  <input
                    ref={inputMetaPersonalizadaRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={metaPersonalizadaInput}
                    onChange={handleMetaPersonalizadaChange}
                    placeholder="Ex.: 25"
                    className="w-full rounded-xl border border-white/10 bg-[#101514] px-4 py-3 text-center text-xl font-black text-white outline-none focus:border-[#5dc6a1]"
                  />

                  <button
                    type="button"
                    onClick={() => void salvarMetaPersonalizada()}
                    disabled={salvandoMeta || !metaPersonalizadaInput}
                    className="mt-3 w-full rounded-xl bg-[#5dc6a1] py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-50"
                  >
                    {salvandoMeta ? "Salvando..." : "Salvar Meta"}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setModalMetaAberto(false);
                  setMostrarOutroValorMeta(false);
                  setMetaPersonalizadaInput("");
                }}
                disabled={salvandoMeta}
                className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold"
              >
                {salvandoMeta ? "Salvando..." : "Cancelar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <div className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center px-4">
          <div className="rounded-2xl border border-[#5dc6a1]/30 bg-[#101514]/95 px-6 py-4 text-center text-sm font-bold text-[#5dc6a1] shadow-2xl backdrop-blur-md">
            {mensagem}
          </div>
        </div>
      )}
    </div>
  );
}