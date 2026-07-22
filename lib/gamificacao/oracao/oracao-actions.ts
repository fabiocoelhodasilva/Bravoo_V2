"use server";

/* =========================================================
   Imports
========================================================= */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { aplicarCrescimentoJardimAposOracao } from "@/lib/gamificacao/jardim/jardim-crescimento-actions";
import { concederJoiaMateria } from "@/lib/gamificacao/geral/joia-actions";

/* =========================================================
   Constantes fixas
========================================================= */

const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";
const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ASSUNTO_ORACAO_ID = "44444444-4444-4444-4444-444444444001";
const DETALHE_ORACAO_ID = "55555555-5555-5555-5555-555555555101";

const META_PADRAO_ORACAO_MINUTOS = 5;

const OBS_CREDITO_JARDIM_ORACAO = "credito_jardim_oracao";
const OBS_RESGATE_ITEM_JARDIM = "resgate_item_jardim";
const OBS_DEVOLUCAO_ITEM_JARDIM = "devolucao_item_jardim";

/* =========================================================
   Tipos auxiliares
========================================================= */

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

type StatusSaudeJardim = {
  estado: "critico" | "cuidados" | "crescendo" | "saudavel" | "radiante";
  titulo: string;
  descricao: string;
  percentual: number;
  cor: string;
  diasSeguidos: number;
  diasSemOracao: number;
};

/* =========================================================
   Logs técnicos somente em desenvolvimento
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function registrarInfoDev(titulo: string, dados: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;

  console.log("\n========================================");
  console.log(titulo);
  console.table(dados);
  console.log("========================================\n");
}

/* =========================================================
   Datas locais - São Paulo
========================================================= */

function obterDataSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    partes.find((parte) => parte.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function getIntervaloHojeSaoPaulo() {
  const hoje = obterDataSaoPaulo();

  return {
    inicioDoDia: `${hoje} 00:00:00`,
    fimDoDia: `${hoje} 23:59:59.999`,
  };
}

function obterDataHoraSaoPauloIso(): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    partes.find((parte) => parte.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
    "minute",
  )}:${get("second")}-03:00`;
}

/* =========================================================
   Autenticação
========================================================= */

async function getUsuarioLogado() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não identificado.");
  }

  return { supabase, user };
}

/* =========================================================
   Funções auxiliares
========================================================= */

function calcularCreditosPorMinutos(minutos: number) {
  if (!Number.isFinite(minutos) || minutos <= 0) {
    return 0;
  }

  return Math.min(10, Math.floor(minutos));
}

function adicionarDiasDataIso(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  data.setUTCDate(data.getUTCDate() + dias);

  return data.toISOString().slice(0, 10);
}

function normalizarDataExecucao(dataExecucao: string | null | undefined) {
  if (!dataExecucao) return null;

  return String(dataExecucao).slice(0, 10);
}

/* =========================================================
   Minutos de oração
========================================================= */

async function buscarMinutosOracaoHojeInterno(
  supabase: SupabaseServerClient,
  usuarioId: string,
) {
  const { inicioDoDia, fimDoDia } = getIntervaloHojeSaoPaulo();

  const { data, error } = await supabase
    .from("next_sessoes_atividade")
    .select("tempo_total_segundos")
    .eq("usuario_id", usuarioId)
    .eq("atividade_id", ATIVIDADE_ORACAO_ID)
    .gte("data_execucao", inicioDoDia)
    .lte("data_execucao", fimDoDia);

  if (error) {
    registrarErroDev("Erro ao buscar orações:", error);
    return 0;
  }

  const totalSegundos = (data ?? []).reduce((total, item) => {
    return total + Number(item.tempo_total_segundos ?? 0);
  }, 0);

  return Math.floor(totalSegundos / 60);
}

export async function buscarMinutosOracaoHoje() {
  try {
    const { supabase, user } = await getUsuarioLogado();
    return await buscarMinutosOracaoHojeInterno(supabase, user.id);
  } catch (error) {
    registrarErroDev("Erro ao identificar usuário nas orações:", error);
    return 0;
  }
}

async function usuarioJaOrouHoje(
  supabase: SupabaseServerClient,
  usuarioId: string,
) {
  const minutosHoje = await buscarMinutosOracaoHojeInterno(supabase, usuarioId);
  return minutosHoje > 0;
}

/* =========================================================
   Sequência espiritual
========================================================= */

async function atualizarSequenciaEspiritualAposOracao(
  supabase: SupabaseServerClient,
  usuarioId: string,
) {
  const hoje = obterDataSaoPaulo();

  const { data: sequenciaAtual, error: sequenciaError } = await supabase
    .from("next_sequencia_dias_usuario")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("materia_id", MATERIA_ESPIRITUAL_ID)
    .maybeSingle();

  if (sequenciaError) {
    throw new Error(
      `Erro ao buscar sequência espiritual: ${sequenciaError.message}`,
    );
  }

  const { data: sessoes, error: sessoesError } = await supabase
    .from("next_sessoes_atividade")
    .select("data_execucao")
    .eq("usuario_id", usuarioId)
    .eq("materia_id", MATERIA_ESPIRITUAL_ID)
    .eq("atividade_id", ATIVIDADE_ORACAO_ID)
    .order("data_execucao", { ascending: false });

  if (sessoesError) {
    throw new Error(
      `Erro ao buscar sessões de oração: ${sessoesError.message}`,
    );
  }

  const diasUnicos = Array.from(
    new Set(
      (sessoes ?? [])
        .map((sessao) => normalizarDataExecucao(sessao.data_execucao))
        .filter((data): data is string => Boolean(data)),
    ),
  ).sort((a, b) => b.localeCompare(a));

  if (diasUnicos.length === 0) {
    return sequenciaAtual;
  }

  const ultimaDataAtividade = diasUnicos[0];
  let diasSeguidos = 0;
  let dataEsperada = ultimaDataAtividade;

  for (const data of diasUnicos) {
    if (data !== dataEsperada) break;

    diasSeguidos += 1;
    dataEsperada = adicionarDiasDataIso(dataEsperada, -1);
  }

  if (ultimaDataAtividade === hoje) {
    diasSeguidos = Math.max(1, diasSeguidos);
  }

  const maiorSequencia = Math.max(
    Number(sequenciaAtual?.maior_sequencia ?? 0),
    diasSeguidos,
  );

  const { data: sequenciaSalva, error: upsertError } = await supabase
    .from("next_sequencia_dias_usuario")
    .upsert(
      {
        usuario_id: usuarioId,
        materia_id: MATERIA_ESPIRITUAL_ID,
        dias_seguidos: diasSeguidos,
        maior_sequencia: maiorSequencia,
        ultima_data_atividade: ultimaDataAtividade,
        pontos_consistencia: Number(sequenciaAtual?.pontos_consistencia ?? 0),
        escudos_disponiveis: Number(sequenciaAtual?.escudos_disponiveis ?? 0),
        ultimo_marco_escudo_concedido: Number(
          sequenciaAtual?.ultimo_marco_escudo_concedido ?? 0,
        ),
        updated_at: obterDataHoraSaoPauloIso(),
      },
      {
        onConflict: "usuario_id,materia_id",
      },
    )
    .select()
    .single();

  if (upsertError) {
    throw new Error(
      `Erro ao salvar sequência espiritual: ${upsertError.message}`,
    );
  }

  return sequenciaSalva;
}

/* =========================================================
   Saldo acumulado de itens do jardim
========================================================= */

async function buscarSaldoItensJardimInterno(
  supabase: SupabaseServerClient,
  usuarioId: string,
) {
  const { data, error } = await supabase
    .from("next_movimentacoes_moeda")
    .select("quantidade, tipo_movimento")
    .eq("usuario_id", usuarioId)
    .eq("atividade_id", ATIVIDADE_ORACAO_ID)
    .eq("origem", "jogo")
    .in("observacao", [
      OBS_CREDITO_JARDIM_ORACAO,
      OBS_RESGATE_ITEM_JARDIM,
      OBS_DEVOLUCAO_ITEM_JARDIM,
    ]);

  if (error) {
    registrarErroDev("Erro ao buscar saldo acumulado do jardim:", error);
    return 0;
  }

  const saldo = (data ?? []).reduce((total, item) => {
    const quantidade = Number(item.quantidade ?? 0);

    if (item.tipo_movimento === "entrada") return total + quantidade;
    if (item.tipo_movimento === "saida") return total - quantidade;

    return total;
  }, 0);

  return Math.max(0, saldo);
}

export async function buscarSaldoItensJardimHoje() {
  try {
    const { supabase, user } = await getUsuarioLogado();
    return await buscarSaldoItensJardimInterno(supabase, user.id);
  } catch (error) {
    registrarErroDev("Erro ao buscar saldo acumulado do jardim:", error);
    return 0;
  }
}

/* =========================================================
   Créditos do jardim por oração
========================================================= */

async function sincronizarCreditosJardimHojeInterno(
  supabase: SupabaseServerClient,
  usuarioId: string,
  minutosHoje: number,
) {
  const creditosPermitidosHoje = calcularCreditosPorMinutos(minutosHoje);
  const { inicioDoDia, fimDoDia } = getIntervaloHojeSaoPaulo();

  const { data, error } = await supabase
    .from("next_movimentacoes_moeda")
    .select("quantidade")
    .eq("usuario_id", usuarioId)
    .eq("atividade_id", ATIVIDADE_ORACAO_ID)
    .eq("origem", "jogo")
    .eq("tipo_movimento", "entrada")
    .eq("observacao", OBS_CREDITO_JARDIM_ORACAO)
    .gte("data_movimentacao", inicioDoDia)
    .lte("data_movimentacao", fimDoDia);

  if (error) {
    registrarErroDev("Erro ao consultar créditos já concedidos:", error);

    return {
      minutosHoje,
      creditosPermitidosHoje,
      creditosNovos: 0,
      saldoAtual: await buscarSaldoItensJardimInterno(supabase, usuarioId),
    };
  }

  const creditosJaConcedidos = (data ?? []).reduce((total, item) => {
    return total + Number(item.quantidade ?? 0);
  }, 0);

  const creditosNovos = Math.max(
    0,
    creditosPermitidosHoje - creditosJaConcedidos,
  );

  if (creditosNovos > 0) {
    const { error: insertError } = await supabase
      .from("next_movimentacoes_moeda")
      .insert({
        usuario_id: usuarioId,
        materia_id: MATERIA_ESPIRITUAL_ID,
        atividade_id: ATIVIDADE_ORACAO_ID,
        quantidade: creditosNovos,
        tipo_movimento: "entrada",
        origem: "jogo",
        observacao: OBS_CREDITO_JARDIM_ORACAO,
      });

    if (insertError) {
      registrarErroDev("Erro ao inserir crédito do jardim:", insertError);
    }
  }

  const saldoAtual = await buscarSaldoItensJardimInterno(supabase, usuarioId);

  return {
    minutosHoje,
    creditosPermitidosHoje,
    creditosNovos,
    saldoAtual,
  };
}

async function sincronizarCreditosJardimHoje() {
  const { supabase, user } = await getUsuarioLogado();
  const minutosHoje = await buscarMinutosOracaoHojeInterno(supabase, user.id);

  return await sincronizarCreditosJardimHojeInterno(
    supabase,
    user.id,
    minutosHoje,
  );
}

export async function garantirSincronizacaoJardim() {
  return await sincronizarCreditosJardimHoje();
}

/* =========================================================
   Joia espiritual
========================================================= */

async function concederJoiaEspiritualSeMetaAtingida(params: {
  supabase: SupabaseServerClient;
  usuarioId: string;
  minutosHoje: number;
}) {
  const { supabase, usuarioId, minutosHoje } = params;

  const { data: meta, error: metaError } = await supabase
    .from("next_metas_usuario")
    .select("meta_diaria")
    .eq("usuario_id", usuarioId)
    .eq("materia_id", MATERIA_ESPIRITUAL_ID)
    .maybeSingle();

  if (metaError) {
    registrarErroDev("Erro ao buscar meta espiritual:", metaError);

    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  const metaDiaria = Number(meta?.meta_diaria ?? META_PADRAO_ORACAO_MINUTOS);
  const metaAtingida = minutosHoje >= metaDiaria;

  registrarInfoDev("[JOIA ESPIRITUAL] Verificação de meta", {
    usuarioId,
    materiaId: MATERIA_ESPIRITUAL_ID,
    minutosHoje,
    metaDiaria,
    metaOrigem: meta?.meta_diaria ? "next_metas_usuario" : "fallback_codigo",
    metaAtingida,
  });

  if (!metaAtingida) {
    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  try {
    const resultadoConquista = await concederJoiaMateria({
      supabase,
      usuarioId,
      materiaId: MATERIA_ESPIRITUAL_ID,
    });

    registrarInfoDev("[JOIA ESPIRITUAL] Resultado da concessão", {
      usuarioId,
      materiaId: MATERIA_ESPIRITUAL_ID,
      joiaConquistada: resultadoConquista.joiaConquistada,
      mandalaConquistada: resultadoConquista.mandalaConquistada,
    });

    return resultadoConquista;
  } catch (error) {
    registrarErroDev(
      "Erro ao conceder joia espiritual ou verificar mandala:",
      error,
    );

    /*
     * A oração já foi registrada. Uma falha isolada na gamificação não deve
     * apagar nem invalidar esse registro. Uma nova sincronização poderá
     * tentar conceder a recompensa novamente.
     */
    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }
}

/* =========================================================
   Saúde do jardim
========================================================= */

function getStatusSaudePadrao(): StatusSaudeJardim {
  return {
    estado: "cuidados",
    titulo: "Precisa de Cuidados",
    descricao: "Seu jardim precisa de mais momentos de oração.",
    percentual: 30,
    cor: "#e9891d",
    diasSeguidos: 0,
    diasSemOracao: 0,
  };
}

function getDataLocalInicioDiaSaoPaulo(dataIso: string) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function calcularDiferencaDiasIso(
  dataMaisRecenteIso: string,
  dataMaisAntigaIso: string,
) {
  const umDiaMs = 1000 * 60 * 60 * 24;

  const recente = getDataLocalInicioDiaSaoPaulo(dataMaisRecenteIso);
  const antiga = getDataLocalInicioDiaSaoPaulo(dataMaisAntigaIso);

  return Math.round((recente.getTime() - antiga.getTime()) / umDiaMs);
}

export async function buscarStatusSaudeJardim(): Promise<StatusSaudeJardim> {
  try {
    const { supabase, user } = await getUsuarioLogado();

    const { data: sequencia, error } = await supabase
      .from("next_sequencia_dias_usuario")
      .select("dias_seguidos, ultima_data_atividade")
      .eq("usuario_id", user.id)
      .eq("materia_id", MATERIA_ESPIRITUAL_ID)
      .maybeSingle();

    if (error) {
      registrarErroDev("Erro ao buscar sequência espiritual:", error);
      return getStatusSaudePadrao();
    }

    if (!sequencia?.ultima_data_atividade) {
      return getStatusSaudePadrao();
    }

    const hoje = obterDataSaoPaulo();
    const ultimaDataAtividade = String(sequencia.ultima_data_atividade).slice(
      0,
      10,
    );

    const diasSemOracao = Math.max(
      0,
      calcularDiferencaDiasIso(hoje, ultimaDataAtividade) - 1,
    );

    const diasSeguidos = Math.max(0, Number(sequencia.dias_seguidos ?? 0));

    if (diasSemOracao >= 6) {
      return {
        estado: "critico",
        titulo: "Estado Crítico",
        descricao: "Seu jardim está precisando urgentemente de atenção.",
        percentual: 10,
        cor: "#c94a4a",
        diasSeguidos,
        diasSemOracao,
      };
    }

    if (diasSemOracao >= 1) {
      return {
        estado: "cuidados",
        titulo: "Precisa de Cuidados",
        descricao: "Seu jardim precisa de mais momentos de oração.",
        percentual: 30,
        cor: "#e9891d",
        diasSeguidos,
        diasSemOracao,
      };
    }

    if (diasSeguidos >= 11) {
      return {
        estado: "radiante",
        titulo: "Radiante",
        descricao: "Seu jardim está cheio de vida e beleza.",
        percentual: 95,
        cor: "#5dc6a1",
        diasSeguidos,
        diasSemOracao,
      };
    }

    if (diasSeguidos >= 6) {
      return {
        estado: "saudavel",
        titulo: "Saudável",
        descricao: "Seu jardim está forte e bem cuidado.",
        percentual: 75,
        cor: "#8bd448",
        diasSeguidos,
        diasSemOracao,
      };
    }

    if (diasSeguidos >= 1) {
      return {
        estado: "crescendo",
        titulo: "Crescendo",
        descricao: "Seu jardim está se desenvolvendo a cada dia.",
        percentual: 55,
        cor: "#f1c232",
        diasSeguidos,
        diasSemOracao,
      };
    }

    return getStatusSaudePadrao();
  } catch (error) {
    registrarErroDev("Erro ao calcular saúde do jardim:", error);
    return getStatusSaudePadrao();
  }
}

/* =========================================================
   Registro de oração
========================================================= */

export async function registrarMomentoOracao(minutos: number) {
  if (!Number.isFinite(minutos) || minutos <= 0 || minutos > 120) {
    throw new Error("Tempo de oração inválido.");
  }

  try {
    const { supabase, user } = await getUsuarioLogado();

    const jaTinhaOracaoHoje = await usuarioJaOrouHoje(supabase, user.id);

    const { data: sessao, error } = await supabase
      .from("next_sessoes_atividade")
      .insert({
        usuario_id: user.id,
        atividade_id: ATIVIDADE_ORACAO_ID,
        materia_id: MATERIA_ESPIRITUAL_ID,
        assunto_id: ASSUNTO_ORACAO_ID,
        detalhe_id: DETALHE_ORACAO_ID,
        pontuacao: 0,
        acertos: 1,
        total_itens: 1,
        tempo_total_segundos: Math.round(minutos * 60),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const minutosHoje = await buscarMinutosOracaoHojeInterno(supabase, user.id);

    const sequenciaEspiritual = await atualizarSequenciaEspiritualAposOracao(
      supabase,
      user.id,
    );

    if (!jaTinhaOracaoHoje) {
      await aplicarCrescimentoJardimAposOracao();
    }

    const resumoJardim = await sincronizarCreditosJardimHojeInterno(
      supabase,
      user.id,
      minutosHoje,
    );

    const resultadoConquista =
      await concederJoiaEspiritualSeMetaAtingida({
        supabase,
        usuarioId: user.id,
        minutosHoje,
      });

    registrarInfoDev("[ORAÇÃO] Registro concluído", {
      usuarioId: user.id,
      sessaoId: sessao.id,
      minutosInformados: minutos,
      minutosHoje,
      creditosNovos: resumoJardim.creditosNovos,
      saldoAtualJardim: resumoJardim.saldoAtual,
      crescimentoAplicado: !jaTinhaOracaoHoje,
      joiaEspiritualConquistada: resultadoConquista.joiaConquistada,
      mandalaConquistada: resultadoConquista.mandalaConquistada,
    });

    return {
      sessao,
      resumoJardim,
      sequenciaEspiritual,
      crescimentoAplicado: !jaTinhaOracaoHoje,

      // Mantém compatibilidade com o que você já usa hoje.
      joiaEspiritualConquistada: resultadoConquista.joiaConquistada,

      // Nomes padronizados consumidos pelo front-end.
      joiaConquistada: resultadoConquista.joiaConquistada,
      mandalaConquistada: resultadoConquista.mandalaConquistada,
    };
  } catch (error) {
    registrarErroDev("Erro ao registrar momento de oração:", error);

    if (error instanceof Error) {
      throw new Error(`FALHA_ORACAO: ${error.message}`);
    }

    throw new Error("FALHA_ORACAO: erro desconhecido.");
  }
}

/* =========================================================
   Resgate de item do jardim
========================================================= */

export async function registrarResgateItemJardim(itemTipo: string) {
  const { supabase, user } = await getUsuarioLogado();

  const saldoAtual = await buscarSaldoItensJardimInterno(supabase, user.id);

  if (saldoAtual <= 0) {
    throw new Error("Você não tem créditos disponíveis para plantar.");
  }

  const { error } = await supabase.from("next_movimentacoes_moeda").insert({
    usuario_id: user.id,
    materia_id: MATERIA_ESPIRITUAL_ID,
    atividade_id: ATIVIDADE_ORACAO_ID,
    quantidade: 1,
    tipo_movimento: "saida",
    origem: "jogo",
    observacao: OBS_RESGATE_ITEM_JARDIM,
  });

  if (error) {
    registrarErroDev("Erro ao registrar resgate do item do jardim:", error);
    throw new Error("Não foi possível registrar o resgate do item.");
  }

  return {
    ok: true,
    itemTipo,
  };
}