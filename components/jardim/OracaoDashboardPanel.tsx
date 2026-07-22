"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import { registrarMomentoOracao } from "@/lib/gamificacao/oracao/oracao-actions";
import MateriaResumoDashboardPadrao from "@/components/gamification/MateriaResumoDashboardPadrao";
import { supabase } from "@/lib/supabase/client";
import { carregarJoiasSemana } from "@/lib/gamificacao/geral/carregar-joias-semana";
import JoiaConquistadaModal from "@/components/gamification/JoiaConquistadaModal";
import MandalaConquistadaModal from "@/components/gamification/MandalaConquistadaModal";

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

const LABELS_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

function parseIsoDateLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function addDays(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + quantidade);
  return novaData;
}

function getStartOfWeekSunday(data: Date) {
  const diaSemana = data.getDay();
  return addDays(data, -diaSemana);
}

function obterHojeLocalIso() {
  return formatarDataLocal(new Date());
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

  const [dataSelecionada, setDataSelecionada] = useState(obterHojeLocalIso());
  const [joiasSemana, setJoiasSemana] = useState<Record<string, string>>({});

  const [carregando, setCarregando] = useState(
    dadosIniciaisCarregando || !dadosIniciais
  );
  const [salvando, setSalvando] = useState(false);
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [modalItensGanhosAberto, setModalItensGanhosAberto] = useState(false);
  const [modalJoiaConquistadaAberto, setModalJoiaConquistadaAberto] =
    useState(false);
  const [modalMandalaConquistadaAberto, setModalMandalaConquistadaAberto] =
    useState(false);
  const [mandalaConquistadaPendente, setMandalaConquistadaPendente] =
    useState(false);

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

  const hojeLocalIso = obterHojeLocalIso();
  const diaSelecionadoEhHoje = dataSelecionada === hojeLocalIso;

  const dataAtual = useMemo(
    () => parseIsoDateLocal(dataSelecionada),
    [dataSelecionada]
  );

  const inicioSemana = useMemo(
    () => getStartOfWeekSunday(dataAtual),
    [dataAtual]
  );

  const fimSemana = useMemo(() => addDays(inicioSemana, 6), [inicioSemana]);

  const diasDaSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = addDays(inicioSemana, index);

      return {
        date: data,
        iso: formatarDataLocal(data),
        diaNumero: data.getDate(),
        diaCurto: LABELS_DIAS_CURTOS[data.getDay()],
      };
    });
  }, [inicioSemana]);

  function mostrarAvisoDataBloqueada() {
    setMensagem("🔒 Você só pode registrar as orações de hoje.");

    window.setTimeout(() => {
      if (montadoRef.current) {
        setMensagem("");
      }
    }, 3000);
  }

  function abrirModalRegistroOracao() {
    if (!diaSelecionadoEhHoje) {
      mostrarAvisoDataBloqueada();
      return;
    }

    setModalAberto(true);
  }

  function abrirModalAlterarMeta() {
    if (!diaSelecionadoEhHoje) return;

    setModalMetaAberto(true);
  }

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

  async function carregarJoiasOracaoSemana() {
    try {
      const user = await getUsuarioAtual();

      const resultado = await carregarJoiasSemana({
        supabase,
        usuarioId: user.id,
        materiaId: MATERIA_ESPIRITUAL_ID,
        dataInicio: formatarDataLocal(inicioSemana),
        dataFim: formatarDataLocal(fimSemana),
        imagemJoia: IMAGEM_JOIA_ESPIRITUAL,
      });

      if (!montadoRef.current) return;

      setJoiasSemana(resultado);
    } catch (error) {
      registrarErroDev("Erro ao carregar joias da semana de oração:", error);

      if (montadoRef.current) {
        setJoiasSemana({});
      }
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

    if (!diaSelecionadoEhHoje) {
      setModalMetaAberto(false);
      return;
    }

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
     Joias da semana
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (!cancelado) setJoiasSemana({});
          return;
        }

        const resultado = await carregarJoiasSemana({
          supabase,
          usuarioId: user.id,
          materiaId: MATERIA_ESPIRITUAL_ID,
          dataInicio: formatarDataLocal(inicioSemana),
          dataFim: formatarDataLocal(fimSemana),
          imagemJoia: IMAGEM_JOIA_ESPIRITUAL,
        });

        if (!cancelado) {
          setJoiasSemana(resultado);
        }
      } catch (error) {
        registrarErroDev("Erro ao carregar joias da semana de oração:", error);

        if (!cancelado) {
          setJoiasSemana({});
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [inicioSemana, fimSemana]);

  function navegarSemana(direcao: -1 | 1) {
    const novaData = addDays(dataAtual, direcao * 7);
    setDataSelecionada(formatarDataLocal(novaData));
  }

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
    void carregarJoiasOracaoSemana();
  }

  async function registrarOracao(minutos: number) {
    if (salvando) return;

    if (!diaSelecionadoEhHoje) {
      setModalAberto(false);
      mostrarAvisoDataBloqueada();
      return;
    }

    const minutosAntes = minutosHoje;
    const minutosOtimista = minutosAntes + minutos;

    try {
      setSalvando(true);
      setMensagem("");
      setModalAberto(false);
      setMinutosHoje(minutosOtimista);

      const resultado = await registrarMomentoOracao(minutos);

      const joiaConquistadaAgora = Boolean(resultado?.joiaConquistada);
      const mandalaConquistadaAgora = Boolean(
        resultado?.mandalaConquistada
      );

      if (joiaConquistadaAgora) {
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

      setItensGanhos(novosItensLiberados);
      setMandalaConquistadaPendente(mandalaConquistadaAgora);

      if (joiaConquistadaAgora) {
        setModalJoiaConquistadaAberto(true);
        return;
      }

      if (mandalaConquistadaAgora) {
        setMandalaConquistadaPendente(false);
        setModalMandalaConquistadaAberto(true);
        return;
      }

      if (novosItensLiberados > 0) {
        setModalItensGanhosAberto(true);
        return;
      }

      setMensagem(`Oração registrada! +${minutos} minuto(s). 🙏`);

      window.setTimeout(() => {
        if (montadoRef.current) setMensagem("");
      }, 2500);
    } catch (error) {
      registrarErroDev("Erro ao registrar oração:", error);
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
      return;
    }

    if (itensGanhos > 0) {
      setModalItensGanhosAberto(true);
      return;
    }

    setMensagem("Oração registrada com sucesso! 🙏");

    window.setTimeout(() => {
      if (montadoRef.current) setMensagem("");
    }, 2500);
  }

  function fecharModalMandalaConquistada() {
    setModalMandalaConquistadaAberto(false);

    if (itensGanhos > 0) {
      setModalItensGanhosAberto(true);
      return;
    }

    setMensagem("Oração registrada com sucesso! 🙏");

    window.setTimeout(() => {
      if (montadoRef.current) setMensagem("");
    }, 2500);
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
     Renderização
  ========================================================= */

  return (
    <>
      <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/45 px-3 pb-[90px] pt-[16px] backdrop-blur-[2px] sm:pt-[24px]">
      <div className="relative max-h-[calc(100dvh-96px)] w-full max-w-sm overflow-y-auto rounded-[24px] border border-white/10 bg-[#101514]/95 text-white shadow-2xl sm:max-h-[calc(100dvh-110px)] sm:max-w-[480px] sm:rounded-[28px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold hover:bg-white/20 sm:h-9 sm:w-9 sm:text-lg"
        >
          ×
        </button>

        <div className="p-3 sm:p-4">
          <div className="mb-3 px-10 text-center sm:mb-4">
            <h2 className="gradient-text text-[1.55rem] font-bold leading-tight sm:text-4xl">
              Minhas Orações
            </h2>

          </div>

          <section
            className="mb-3 w-full rounded-[22px] px-2 py-3 sm:px-3"
            style={{
              background:
                "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={() => navegarSemana(-1)}
                aria-label="Semana anterior"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
                style={{
                  borderColor: "#7df2c299",
                  boxShadow: "0 0 18px #7df2c255",
                }}
              >
                ‹
              </button>

              <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5 sm:gap-2">
                {diasDaSemana.map((dia) => {
                  const selecionado = dia.iso === dataSelecionada;
                  const imagemJoiaDia = joiasSemana[dia.iso];

                  return (
                    <button
                      key={dia.iso}
                      type="button"
                      onClick={() => setDataSelecionada(dia.iso)}
                      className="flex min-w-0 flex-col items-center justify-center rounded-[14px] px-0.5 py-1 transition active:scale-[0.97] sm:py-2"
                    >
                      <span
                        className={`mb-1 text-[0.58rem] font-semibold sm:mb-2 sm:text-[0.72rem] ${
                          selecionado ? "text-white" : "text-white/42"
                        }`}
                      >
                        {dia.diaCurto}
                      </span>

                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.78rem] font-bold transition sm:h-10 sm:w-10 sm:text-[0.95rem] ${
                          selecionado
                            ? "scale-[1.06] text-[var(--color-4)]"
                            : "text-white/88"
                        }`}
                        style={{
                          background: selecionado
                            ? "rgba(93,198,161,0.18)"
                            : "transparent",
                          borderColor: selecionado
                            ? "rgba(93,198,161,0.75)"
                            : "transparent",
                          boxShadow: selecionado
                            ? "0 0 18px rgba(93,198,161,0.45)"
                            : "none",
                        }}
                      >
                        {dia.diaNumero}
                      </span>

                      <span className="mt-0.5 flex h-4 items-center justify-center sm:h-5">
                        {imagemJoiaDia && (
                          <img
                            src={imagemJoiaDia}
                            alt="Diamante conquistado"
                            className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4"
                            draggable={false}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navegarSemana(1)}
                aria-label="Próxima semana"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
                style={{
                  borderColor: "#7df2c299",
                  boxShadow: "0 0 18px #7df2c255",
                }}
              >
                ›
              </button>
            </div>
          </section>

          <div className="mx-auto mb-4 w-full max-w-[420px]">
            <MateriaResumoDashboardPadrao
              diasSeguidos={persistenciaDias}
              totalJoias={totalJoiasEspiritual ?? 0}
              nomeJoia="Diamantes"
              imagemJoia={IMAGEM_JOIA_ESPIRITUAL}
            />
          </div>

          <section
            className="mb-3 overflow-hidden rounded-[22px] border px-3 py-3 sm:mb-4 sm:rounded-3xl sm:px-4 sm:py-4"
            style={{
              background:
                "radial-gradient(280px 120px at 8% 0%, rgba(233,137,29,0.16), transparent 65%), radial-gradient(240px 110px at 100% 0%, rgba(93,198,161,0.14), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), #111111",
              borderColor: "rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <p className="text-center text-[0.62rem] font-black uppercase tracking-[0.26em] text-[#f1e6a7] sm:text-xs">
              Oração
            </p>

            <p className="mx-auto mt-1 max-w-[260px] text-center text-[0.68rem] font-bold leading-snug text-[#5dc6a1] sm:text-xs">
              🌱 Ore e ganhe até 10 itens para seu jardim por dia!
            </p>

            <div className="mt-3 grid grid-cols-3 items-end divide-x divide-white/10">
              <button
                type="button"
                onClick={abrirModalRegistroOracao}
                disabled={carregando || salvando}
                aria-disabled={!diaSelecionadoEhHoje}
                className={`flex min-h-[78px] flex-col items-center justify-end gap-1 transition active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 sm:min-h-[88px] ${
                  !diaSelecionadoEhHoje
                    ? "cursor-not-allowed opacity-45"
                    : ""
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9891d] text-3xl font-black leading-none text-black shadow-[0_0_20px_rgba(233,137,29,0.35)] sm:h-14 sm:w-14">
                  +
                </span>

                <span className="h-4 text-center text-[0.68rem] font-black leading-4 text-white sm:text-xs">
                  Registrar
                </span>
              </button>

              <div className="flex min-h-[78px] flex-col items-center justify-end gap-1 px-2 text-center sm:min-h-[88px]">
                <span className="flex h-12 items-center text-[1.8rem] font-black leading-none text-white sm:h-14 sm:text-4xl">
                  {minutosHoje}
                </span>

                <span className="h-4 text-center text-[0.68rem] font-black leading-4 text-[#5dc6a1] sm:text-xs">
                  min hoje
                </span>
              </div>

              <button
                type="button"
                onClick={abrirModalAlterarMeta}
                disabled={carregando || salvandoMeta || !diaSelecionadoEhHoje}
                aria-disabled={!diaSelecionadoEhHoje}
                className={`flex min-h-[78px] flex-col items-center justify-end gap-1 transition active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 sm:min-h-[88px] ${
                  !diaSelecionadoEhHoje
                    ? "cursor-not-allowed opacity-45"
                    : ""
                }`}
                title="Alterar meta"
              >
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/30 sm:h-16 sm:w-16">
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#5dc6a1 ${progresso}%, rgba(255,255,255,0.12) 0)`,
                    }}
                  />

                  <span className="relative flex h-11 w-11 flex-col items-center justify-center rounded-full bg-[#101514] sm:h-12 sm:w-12">
                    <span className="text-base font-black leading-none text-white sm:text-lg">
                      {metaSegura}
                    </span>
                    <span className="text-[0.48rem] font-black uppercase leading-none text-white/65">
                      min
                    </span>
                  </span>
                </span>

                <span className="flex h-4 items-center justify-center gap-1 text-center text-[0.68rem] font-black leading-4 text-white sm:text-xs">
                  Meta <span className="text-[#e9891d]">✎</span>
                </span>
              </button>
            </div>

            {!carregando && (
              <p
                className={`mt-3 text-center text-[0.72rem] font-bold leading-snug sm:text-xs ${
                  minutosHoje >= metaSegura ? "text-[#5dc6a1]" : "text-white/65"
                }`}
              >
                {minutosHoje > metaSegura
                  ? "🎉 Você superou a meta."
                  : minutosHoje === metaSegura
                  ? "🎉 Meta cumprida hoje."
                  : `Faltam ${Math.max(0, metaSegura - minutosHoje)} min para cumprir a meta.`}
              </p>
            )}
          </section>

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
    </>
  );
}