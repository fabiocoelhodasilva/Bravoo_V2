"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ================================
 * IDS FIXOS DA ATIVIDADE
 * ================================
 */
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";
const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ASSUNTO_ORACAO_ID = "44444444-4444-4444-4444-444444444001";
const DETALHE_ORACAO_ID = "55555555-5555-5555-5555-555555555101";

/**
 * ================================
 * CONSTANTES DE OBSERVAÇÃO
 * ================================
 */
const OBS_CREDITO_JARDIM_ORACAO = "credito_jardim_oracao";
const OBS_RESGATE_ITEM_JARDIM = "resgate_item_jardim";
const OBS_DEVOLUCAO_ITEM_JARDIM = "devolucao_item_jardim";

/**
 * ================================
 * INTERVALO DO DIA ATUAL
 * ================================
 */
function getIntervaloHoje() {
  const agora = new Date();

  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);

  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);

  return { inicioDoDia, fimDoDia };
}

/**
 * ================================
 * REGRA DE CRÉDITOS POR MINUTOS
 * ================================
 */
function calcularCreditosPorMinutos(minutos: number) {
  if (minutos >= 10) return 3;
  if (minutos >= 5) return 2;
  if (minutos >= 1) return 1;
  return 0;
}

/**
 * ================================
 * USUÁRIO LOGADO
 * ================================
 */
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

/**
 * ================================
 * MINUTOS DE ORAÇÃO HOJE
 * ================================
 */
export async function buscarMinutosOracaoHoje() {
  try {
    const { supabase, user } = await getUsuarioLogado();
    const { inicioDoDia, fimDoDia } = getIntervaloHoje();

    const { data, error } = await supabase
      .from("next_sessoes_atividade")
      .select("tempo_total_segundos")
      .eq("usuario_id", user.id)
      .eq("atividade_id", ATIVIDADE_ORACAO_ID)
      .gte("data_execucao", inicioDoDia.toISOString())
      .lte("data_execucao", fimDoDia.toISOString());

    if (error) {
      console.error("Erro ao buscar orações:", error);
      return 0;
    }

    const totalSegundos = (data ?? []).reduce((total, item) => {
      return total + Number(item.tempo_total_segundos ?? 0);
    }, 0);

    return Math.floor(totalSegundos / 60);
  } catch (error) {
    console.error("Erro ao identificar usuário nas orações:", error);
    return 0;
  }
}

/**
 * ================================
 * SALDO DE ITENS DISPONÍVEIS HOJE
 * ================================
 */
export async function buscarSaldoItensJardimHoje() {
  try {
    const { supabase, user } = await getUsuarioLogado();
    const { inicioDoDia, fimDoDia } = getIntervaloHoje();

    const { data, error } = await supabase
      .from("next_movimentacoes_moeda")
      .select("quantidade, tipo_movimento")
      .eq("usuario_id", user.id)
      .eq("atividade_id", ATIVIDADE_ORACAO_ID)
      .eq("origem", "jogo")
      .in("observacao", [
        OBS_CREDITO_JARDIM_ORACAO,
        OBS_RESGATE_ITEM_JARDIM,
        OBS_DEVOLUCAO_ITEM_JARDIM,
      ])
      .gte("data_movimentacao", inicioDoDia.toISOString())
      .lte("data_movimentacao", fimDoDia.toISOString());

    if (error) {
      console.error("Erro ao buscar saldo do jardim:", error);
      return 0;
    }

    const saldo = (data ?? []).reduce((total, item) => {
      const quantidade = Number(item.quantidade ?? 0);

      if (item.tipo_movimento === "entrada") return total + quantidade;
      if (item.tipo_movimento === "saida") return total - quantidade;

      return total;
    }, 0);

    return Math.max(0, saldo);
  } catch (error) {
    console.error("Erro ao buscar saldo do jardim:", error);
    return 0;
  }
}

/**
 * ================================
 * SINCRONIZAÇÃO DE CRÉDITOS DO DIA
 * ================================
 */
async function sincronizarCreditosJardimHoje() {
  const { supabase } = await getUsuarioLogado();

  const minutosHoje = await buscarMinutosOracaoHoje();
  const creditosPermitidosHoje = calcularCreditosPorMinutos(minutosHoje);
  const { inicioDoDia, fimDoDia } = getIntervaloHoje();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não identificado.");
  }

  const { data, error } = await supabase
    .from("next_movimentacoes_moeda")
    .select("quantidade")
    .eq("usuario_id", user.id)
    .eq("atividade_id", ATIVIDADE_ORACAO_ID)
    .eq("origem", "jogo")
    .eq("tipo_movimento", "entrada")
    .eq("observacao", OBS_CREDITO_JARDIM_ORACAO)
    .gte("data_movimentacao", inicioDoDia.toISOString())
    .lte("data_movimentacao", fimDoDia.toISOString());

  if (error) {
    console.error("Erro ao consultar créditos já concedidos:", error);

    return {
      minutosHoje,
      creditosPermitidosHoje,
      creditosNovos: 0,
      saldoAtual: await buscarSaldoItensJardimHoje(),
    };
  }

  const creditosJaConcedidos = (data ?? []).reduce((total, item) => {
    return total + Number(item.quantidade ?? 0);
  }, 0);

  const creditosNovos = Math.max(
    0,
    creditosPermitidosHoje - creditosJaConcedidos
  );

  if (creditosNovos > 0) {
    const { error: insertError } = await supabase
      .from("next_movimentacoes_moeda")
      .insert({
        usuario_id: user.id,
        materia_id: MATERIA_ESPIRITUAL_ID,
        atividade_id: ATIVIDADE_ORACAO_ID,
        quantidade: creditosNovos,
        tipo_movimento: "entrada",
        origem: "jogo",
        observacao: OBS_CREDITO_JARDIM_ORACAO,
      });

    if (insertError) {
      console.error("Erro ao inserir crédito do jardim:", insertError);
    }
  }

  const saldoAtual = await buscarSaldoItensJardimHoje();

  return {
    minutosHoje,
    creditosPermitidosHoje,
    creditosNovos,
    saldoAtual,
  };
}

/**
 * ================================
 * EXPORT PRINCIPAL PARA O FRONT
 * ================================
 */
export async function garantirSincronizacaoJardim() {
  return await sincronizarCreditosJardimHoje();
}

/**
 * ================================
 * REGISTRAR ORAÇÃO
 * ================================
 */
export async function registrarMomentoOracao(minutos: number) {
  if (!Number.isFinite(minutos) || minutos <= 0 || minutos > 120) {
    throw new Error("Tempo de oração inválido.");
  }

  try {
    const { supabase, user } = await getUsuarioLogado();

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

    const resumoJardim = await sincronizarCreditosJardimHoje();

    return {
      sessao,
      resumoJardim,
    };
  } catch (error) {
    console.error("Erro ao registrar momento de oração:", error);

    if (error instanceof Error) {
      throw new Error(`FALHA_ORACAO: ${error.message}`);
    }

    throw new Error("FALHA_ORACAO: erro desconhecido.");
  }
}

/**
 * ================================
 * RESGATAR ITEM (CONSUME CRÉDITO)
 * ================================
 */
export async function registrarResgateItemJardim(itemTipo: string) {
  const { supabase, user } = await getUsuarioLogado();

  const saldoAtual = await buscarSaldoItensJardimHoje();

  if (saldoAtual <= 0) {
    throw new Error("Você não tem créditos disponíveis para plantar hoje.");
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
    console.error("Erro ao registrar resgate do item do jardim:", error);
    throw new Error("Não foi possível registrar o resgate do item.");
  }

  return {
    ok: true,
    itemTipo,
  };
}