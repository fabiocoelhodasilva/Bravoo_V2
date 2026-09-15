"use client";

import { useEffect, useRef, useState } from "react";
import {
  alterarMetaOracao,
  registrarMomentoOracao,
} from "@/lib/gamificacao/oracao/oracao-actions";
import { supabase } from "@/lib/supabase/client";
import JoiaConquistadaModal from "@/components/gamification/JoiaConquistadaModal";
import MandalaConquistadaModal from "@/components/gamification/MandalaConquistadaModal";

type ResumoDashboardOracao = {
  minutosHoje: number;
  minutosAno: number;
  metaDiaria: number;
  persistenciaDias: number;
};

type OracaoDashboardPanelProps = {
  onClose: () => void;
  onAbrirMeuJardim?: () => void;
  dadosIniciais?: ResumoDashboardOracao | null;
  dadosIniciaisCarregando?: boolean;
  onResumoAtualizado?: (resumo: ResumoDashboardOracao) => void;
  onOracaoRegistrada?: () => void | Promise<void>;
};

const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";
const META_PADRAO_ORACAO = 5;
const OPCOES_META_ORACAO = [5, 10, 15];
const EVENTO_JOIA_CONQUISTADA = "bravoo:joia-conquistada";
const IMAGEM_JOIA_ESPIRITUAL = "/imagens/joias/joia_red.png";

function notificarDashboardSobreJoia() {
  if (typeof window === "undefined") return;
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

export default function OracaoDashboardPanel({
  onClose,
  dadosIniciais = null,
  dadosIniciaisCarregando = false,
  onResumoAtualizado,
  onOracaoRegistrada,
}: OracaoDashboardPanelProps) {
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
  const [carregando, setCarregando] = useState(
    dadosIniciaisCarregando || !dadosIniciais
  );
  const [salvando, setSalvando] = useState(false);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [modalJoiaConquistadaAberto, setModalJoiaConquistadaAberto] =
    useState(false);
  const [modalMandalaConquistadaAberto, setModalMandalaConquistadaAberto] =
    useState(false);
  const [mandalaConquistadaPendente, setMandalaConquistadaPendente] =
    useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mostrarOutroValorMeta, setMostrarOutroValorMeta] = useState(false);
  const [metaPersonalizadaInput, setMetaPersonalizadaInput] = useState("");

  const montadoRef = useRef(true);
  const dadosIniciaisAplicadosRef = useRef(false);
  const inputMetaPersonalizadaRef = useRef<HTMLInputElement>(null);

  const metaSegura = Math.max(1, metaDiaria || META_PADRAO_ORACAO);
  const progresso = Math.min(
    100,
    Math.round((minutosHoje / metaSegura) * 100)
  );


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
        console.error("Erro ao carregar minutos de oração hoje:", error);
        return 0;
      }

      const totalSegundos = (data ?? []).reduce((total, item) => {
        return total + Number(item.tempo_total_segundos ?? 0);
      }, 0);

      return Math.floor(totalSegundos / 60);
    } catch (error) {
      console.error("Erro inesperado ao carregar minutos de hoje:", error);
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
        console.error("Erro ao carregar meta de oração:", error);
        return META_PADRAO_ORACAO;
      }

      const metaCarregada = Number(data?.meta_diaria ?? META_PADRAO_ORACAO);

      if (!Number.isFinite(metaCarregada) || metaCarregada <= 0) {
        return META_PADRAO_ORACAO;
      }

      return metaCarregada;
    } catch (error) {
      console.error("Erro inesperado ao carregar meta de oração:", error);
      return META_PADRAO_ORACAO;
    }
  }

  async function salvarMetaOracao(novaMeta: number) {
    if (salvandoMeta) return;

    if (!Number.isFinite(novaMeta) || novaMeta < 1 || novaMeta > 180) {
      alert("Digite uma meta entre 1 e 180 minutos.");
      return;
    }

    try {
      setSalvandoMeta(true);

      // Usa a action central porque ela também sincroniza a joia espiritual
      // e a Mandala caso a nova meta altere o resultado do dia atual.
      const resultado = await alterarMetaOracao(novaMeta);

      if (!montadoRef.current) return;

      const metaConfirmada = Number(resultado.metaDiaria ?? novaMeta);
      const minutosHojeConfirmados = Number(resultado.minutosHoje ?? minutosHoje);

      setMetaDiaria(metaConfirmada);
      setMinutosHoje(minutosHojeConfirmados);

      onResumoAtualizado?.({
        minutosHoje: minutosHojeConfirmados,
        minutosAno,
        metaDiaria: metaConfirmada,
        persistenciaDias,
      });

      setModalMetaAberto(false);
      setMostrarOutroValorMeta(false);
      setMetaPersonalizadaInput("");

      const joiaConquistadaAgora = resultado.joiaConquistada === true;
      const mandalaConquistadaAgora = resultado.mandalaConquistada === true;
      mostrarConquista(joiaConquistadaAgora, mandalaConquistadaAgora);

      // Atualizar o jardim nao bloqueia a comemoracao ja confirmada.
      void atualizarJardimAposConquista();
      if (joiaConquistadaAgora || mandalaConquistadaAgora) return;

      setMensagem(`Meta diária atualizada para ${metaConfirmada} minutos.`);

      setTimeout(() => {
        if (montadoRef.current) setMensagem("");
      }, 2500);
    } catch (error) {
      console.error("Erro ao salvar meta de oração:", error);
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

  async function carregarPersistenciaDias() {
    try {
      const user = await getUsuarioAtual();

      const { data, error } = await supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos")
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar persistência:", error);
        return 0;
      }

      return Number(data?.dias_seguidos ?? 0);
    } catch (error) {
      console.error("Erro inesperado ao carregar persistência:", error);
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
        console.error("Erro ao carregar minutos de oração no ano:", error);
        return 0;
      }

      const totalSegundos = (data ?? []).reduce((total, item) => {
        return total + Number(item.tempo_total_segundos ?? 0);
      }, 0);

      return Math.floor(totalSegundos / 60);
    } catch (error) {
      console.error("Erro inesperado ao carregar minutos do ano:", error);
      return 0;
    }
  }

  useEffect(() => {
    montadoRef.current = true;

    if (dadosIniciais && !dadosIniciaisAplicadosRef.current) {
      dadosIniciaisAplicadosRef.current = true;

      setMinutosHoje(dadosIniciais.minutosHoje);
      setPersistenciaDias(dadosIniciais.persistenciaDias);
      setMinutosAno(dadosIniciais.minutosAno);
      setMetaDiaria(dadosIniciais.metaDiaria);
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
        ] = await Promise.all([
          carregarMinutosOracaoHoje(),
          carregarPersistenciaDias(),
          carregarMinutosOracaoAno(),
          carregarMetaOracao(),
        ]);

        if (!montadoRef.current) return;

        const resumoAtualizado = {
          minutosHoje: totalMinutosHoje,
          persistenciaDias: totalPersistenciaDias,
          minutosAno: totalMinutosAno,
          metaDiaria: metaOracao,
        };

        setMinutosHoje(resumoAtualizado.minutosHoje);
        setPersistenciaDias(resumoAtualizado.persistenciaDias);
        setMinutosAno(resumoAtualizado.minutosAno);
        setMetaDiaria(resumoAtualizado.metaDiaria);
        onResumoAtualizado?.(resumoAtualizado);
      } catch (error) {
        console.error("Erro ao carregar dados de oração:", error);
      } finally {
        if (montadoRef.current) setCarregando(false);
      }
    }

    void carregarDados();

    return () => {
      montadoRef.current = false;
    };
  }, []);

  async function atualizarResumoAposRegistro(minutosOtimista: number) {
    const [totalMinutosHoje, totalPersistenciaDias, totalMinutosAno, metaOracao] =
      await Promise.all([
        carregarMinutosOracaoHoje(),
        carregarPersistenciaDias(),
        carregarMinutosOracaoAno(),
        carregarMetaOracao(),
      ]);

    if (!montadoRef.current) return;

    const resumoAtualizado = {
      minutosHoje: totalMinutosHoje > 0 ? totalMinutosHoje : minutosOtimista,
      persistenciaDias: totalPersistenciaDias,
      minutosAno: totalMinutosAno,
      metaDiaria: metaOracao,
    };

    setMinutosHoje(resumoAtualizado.minutosHoje);
    setPersistenciaDias(resumoAtualizado.persistenciaDias);
    setMinutosAno(resumoAtualizado.minutosAno);
    setMetaDiaria(resumoAtualizado.metaDiaria);
    onResumoAtualizado?.(resumoAtualizado);
  }

  function mostrarConquista(joia: boolean, mandala: boolean) {
    if (joia) {
      setMensagem("");
      setMandalaConquistadaPendente(mandala);
      setModalJoiaConquistadaAberto(true);
      notificarDashboardSobreJoia();
    } else if (mandala) {
      setMensagem("");
      setModalMandalaConquistadaAberto(true);
    }
  }

  async function atualizarJardimAposConquista() {
    try {
      await onOracaoRegistrada?.();
    } catch (error) {
      console.error("Erro ao atualizar jardim apos registro salvo:", error);
    }
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

      if (!montadoRef.current) return;

      const joiaConquistadaAgora = resultado.joiaConquistada === true;
      const mandalaConquistadaAgora = resultado.mandalaConquistada === true;
      mostrarConquista(joiaConquistadaAgora, mandalaConquistadaAgora);

      // Falhas de leitura apos salvar nao desfazem a oracao nem a conquista.
      void atualizarResumoAposRegistro(minutosOtimista).catch((error) => {
        console.error("Erro ao atualizar resumo apos oracao salva:", error);
      });
      void atualizarJardimAposConquista();
      if (joiaConquistadaAgora || mandalaConquistadaAgora) return;

      setMensagem(`Oração registrada! +${minutos} minuto(s). 🙏`);

      setTimeout(() => {
        if (montadoRef.current) setMensagem("");
      }, 2500);
    } catch (error) {
      console.error("Erro ao registrar oração:", error);
      setMinutosHoje(minutosAntes);
      alert("Não foi possível registrar a oração. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function fecharModalJoiaConquistada() {
    setModalJoiaConquistadaAberto(false);

    if (mandalaConquistadaPendente) {
      setMandalaConquistadaPendente(false);
      setModalMandalaConquistadaAberto(true);
    }
  }

  function fecharModalMandalaConquistada() {
    setModalMandalaConquistadaAberto(false);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/5 px-3 pb-[104px] pt-20 backdrop-blur-[1px] sm:items-center sm:pb-6 sm:pt-6">
      {/* Painel principal: compacto e translúcido para manter o Jardim visível */}
      <div className="relative w-full max-w-[370px] overflow-hidden rounded-[26px] border border-[#f1d27a]/25 bg-gradient-to-br from-[#2d2415]/65 via-[#181711]/58 to-[#172018]/58 text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de oração"
          className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/15 text-base font-bold text-white/85 transition hover:bg-white/10"
        >
          ×
        </button>

        <div className="p-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f1d27a]/25 bg-[#f1d27a]/10 text-xl shadow-[0_0_22px_rgba(241,210,122,0.12)]">
              🎯
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#f1d27a]/80">
                Meta de oração do dia
              </div>

              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="text-[1.35rem] font-black leading-none text-white">
                  {metaSegura} min
                </div>

                <div className="text-right text-xs font-bold text-white/70">
                  {carregando ? "..." : `${minutosHoje} min hoje`}
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#f1d27a] transition-[width] duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>

              {!carregando && (
                <p
                  className={`mt-2 text-[11px] font-semibold leading-snug ${
                    minutosHoje >= metaSegura
                      ? "text-[#8ee2bf]"
                      : "text-white/65"
                  }`}
                >
                  {minutosHoje >= metaSegura
                    ? "✨ Meta cumprida hoje."
                    : `Faltam ${Math.max(
                        0,
                        metaSegura - minutosHoje,
                      )} min para cumprir a meta.`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setModalMetaAberto(true)}
              disabled={carregando || salvandoMeta}
              className="rounded-full border border-[#f1d27a]/30 bg-black/10 px-4 py-1.5 text-[11px] font-bold text-[#f1d27a] transition hover:bg-[#f1d27a]/10 disabled:cursor-wait disabled:opacity-50"
            >
              ⚙ Alterar meta
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            disabled={carregando || salvando}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5dc6a1]/35 bg-[#5dc6a1]/85 px-5 py-3.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(93,198,161,0.20)] backdrop-blur-md transition hover:bg-[#5dc6a1] disabled:cursor-wait disabled:opacity-50"
          >
            <span aria-hidden="true">🙏</span>
            {salvando ? "Salvando..." : "Registrar oração"}
          </button>
        </div>
      </div>

      {/* Modal para registrar o tempo da oração */}
      {modalAberto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] rounded-3xl border border-white/15 bg-[#151712]/90 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
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

      {/* Modal para alterar a meta diária */}
      {modalMetaAberto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] rounded-3xl border border-white/15 bg-[#151712]/90 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
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

      {mensagem && (
        <div className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center px-4">
          <div className="rounded-2xl border border-[#5dc6a1]/30 bg-[#101514]/90 px-6 py-4 text-center text-sm font-bold text-[#5dc6a1] shadow-2xl backdrop-blur-md">
            {mensagem}
          </div>
        </div>
      )}

      <JoiaConquistadaModal
        aberto={modalJoiaConquistadaAberto}
        nomeJoia="Diamante"
        nomeMateria="Espiritual"
        imagemJoia={IMAGEM_JOIA_ESPIRITUAL}
        cor="vermelha"
        mensagem="Parabéns! Você cumpriu sua meta de oração e conquistou o Diamante da área Espiritual."
        onFechar={fecharModalJoiaConquistada}
      />

      <MandalaConquistadaModal
        aberto={modalMandalaConquistadaAberto}
        onFechar={fecharModalMandalaConquistada}
      />
    </div>
  );
}
