"use client";

import { useEffect, useRef, useState } from "react";
import {
  alterarMetaOracao,
  registrarMomentoOracao,
} from "@/lib/gamificacao/oracao/oracao-actions";
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
  erroCarregamento?: boolean;
  onTentarNovamente?: () => void;
  onResumoAtualizado?: (resumo: ResumoDashboardOracao) => void;
  onOracaoRegistrada?: () => void | Promise<void>;
};

const META_PADRAO_ORACAO = 5;
const OPCOES_META_ORACAO = [5, 10, 15];
const EVENTO_JOIA_CONQUISTADA = "bravoo:joia-conquistada";
const IMAGEM_JOIA_ESPIRITUAL = "/imagens/joias/joia_red.png";

function notificarDashboardSobreJoia() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_JOIA_CONQUISTADA));
}

export default function OracaoDashboardPanel({
  onClose,
  dadosIniciais = null,
  dadosIniciaisCarregando = false,
  erroCarregamento = false,
  onTentarNovamente,
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
  const carregando = dadosIniciaisCarregando || !dadosIniciais || erroCarregamento;
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
  const inputMetaPersonalizadaRef = useRef<HTMLInputElement>(null);

  const metaSegura = Math.max(1, metaDiaria || META_PADRAO_ORACAO);
  const progresso = Math.min(
    100,
    Math.round((minutosHoje / metaSegura) * 100)
  );


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

      // Atualiza também se o usuário trocou de painel durante a gravação.
      void atualizarJardimAposConquista();

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

  // O pai carrega e atualiza o resumo; abrir este painel não repete consultas.
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  useEffect(() => {
    if (!dadosIniciais) return;
    setMinutosHoje(dadosIniciais.minutosHoje);
    setPersistenciaDias(dadosIniciais.persistenciaDias);
    setMinutosAno(dadosIniciais.minutosAno);
    setMetaDiaria(dadosIniciais.metaDiaria);
  }, [dadosIniciais]);

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

      // A leitura em background não bloqueia a conquista nem depende do painel aberto.
      void atualizarJardimAposConquista();

      if (!montadoRef.current) return;

      const joiaConquistadaAgora = resultado.joiaConquistada === true;
      const mandalaConquistadaAgora = resultado.mandalaConquistada === true;
      mostrarConquista(joiaConquistadaAgora, mandalaConquistadaAgora);

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
      {erroCarregamento && (
        <button type="button" onClick={onTentarNovamente}
          className="absolute top-4 rounded-xl bg-[#302719] px-4 py-2 text-sm" role="alert">
          Não foi possível carregar sua oração. Tentar novamente
        </button>
      )}
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

        <div className="p-4">
          {/* Título + Alterar meta na mesma linha */}
          <div className="flex items-center justify-between gap-3 pr-9">
            <div className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#f1d27a]/80">
              Meta de oração do dia
            </div>

            <button
              type="button"
              onClick={() => setModalMetaAberto(true)}
              disabled={carregando || salvandoMeta}
              className="shrink-0 rounded-full border border-[#f1d27a]/30 bg-black/10 px-3 py-1 text-[10px] font-bold text-[#f1d27a] transition hover:bg-[#f1d27a]/10 disabled:cursor-wait disabled:opacity-50"
            >
              ⚙ Alterar meta
            </button>
          </div>

          {/* Ícone um pouco mais baixo; o título começa alinhado à esquerda dele */}
          <div className="mt-2 flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f1d27a]/25 bg-[#f1d27a]/10 text-xl shadow-[0_0_22px_rgba(241,210,122,0.12)]">
              🎯
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-end justify-between gap-3">
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
                    ? "✨ Meta alcançada hoje."
                    : `Faltam ${Math.max(
                        0,
                        metaSegura - minutosHoje,
                      )} min para alcançar a meta.`}
                </p>
              )}
            </div>
          </div>

          {/* Botão principal centralizado horizontalmente */}
          <div className="mt-3 flex w-full justify-center">
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              disabled={carregando || salvando}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#5dc6a1]/35 bg-[#5dc6a1]/85 px-5 py-3.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(93,198,161,0.20)] backdrop-blur-md transition hover:bg-[#5dc6a1] disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true">🙏</span>
              {salvando ? "Salvando..." : "Registrar oração"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal para registrar o tempo da oração */}
      {modalAberto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/22 px-4 backdrop-blur-[2px]">
          <div
            className="
              w-full max-w-[340px]
              rounded-[26px]
              border border-[#f1d27a]/25
              bg-gradient-to-br
              from-[#2d2415]/92
              via-[#1b1711]/90
              to-[#172018]/90
              p-5 text-center text-white
              shadow-[0_20px_55px_rgba(0,0,0,0.40)]
              backdrop-blur-xl
            "
          >
            <div
              className="
                mx-auto mb-3
                flex h-14 w-14 items-center justify-center
                rounded-full
                border border-[#f1d27a]/25
                bg-[#f1d27a]/10
                text-3xl
                shadow-[0_0_24px_rgba(241,210,122,0.10)]
              "
            >
              🙏
            </div>

            <h3 className="text-[1.05rem] font-black text-white">
              Oração realizada
            </h3>

            <p className="mb-4 mt-1 text-[0.78rem] font-medium text-white/58">
              Quanto tempo durou esta oração?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[1, 3, 5, 10].map((minuto) => (
                <button
                  key={minuto}
                  type="button"
                  onClick={() => registrarOracao(minuto)}
                  disabled={salvando}
                  className="
                    rounded-[16px]
                    border border-[#f1d27a]/18
                    bg-[#f1d27a]/[0.07]
                    px-4 py-3
                    transition
                    hover:border-[#5dc6a1]/30
                    hover:bg-[#5dc6a1]/12
                    disabled:cursor-wait
                    disabled:opacity-50
                  "
                >
                  <div className="text-[1.15rem] font-black leading-none text-[#f1d27a]">
                    {minuto}
                  </div>

                  <div className="mt-1 text-[0.68rem] font-semibold text-white/48">
                    min
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalAberto(false)}
              disabled={salvando}
              className="
                mt-3 w-full
                rounded-[14px]
                border border-white/10
                bg-black/18
                py-2.5
                text-[0.78rem] font-bold text-white/65
                transition
                hover:bg-white/[0.06]
                disabled:cursor-wait
                disabled:opacity-50
              "
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
        mensagem="Parabéns! Você alcançou sua meta de oração e conquistou o Diamante da área Espiritual."
        onFechar={fecharModalJoiaConquistada}
      />

      <MandalaConquistadaModal
        aberto={modalMandalaConquistadaAberto}
        onFechar={fecharModalMandalaConquistada}
      />
    </div>
  );
}
