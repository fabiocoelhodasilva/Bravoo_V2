"use server";

import { salvarSessaoAtividade } from "@/lib/sessoes/sessoes-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * IDs fixos da estrutura
 */
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";
const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ASSUNTO_ORACAO_ID = "44444444-4444-4444-4444-444444444001";
const DETALHE_ORACAO_ID = "55555555-5555-5555-5555-555555555101";

/**
 * REGISTRAR ORAÇÃO
 */
export async function registrarMomentoOracao(minutos: number) {
  if (!Number.isFinite(minutos) || minutos <= 0 || minutos > 120) {
    throw new Error("Tempo de oração inválido.");
  }

  try {
    return await salvarSessaoAtividade({
      atividade_id: ATIVIDADE_ORACAO_ID,
      materia_id: MATERIA_ESPIRITUAL_ID,
      assunto_id: ASSUNTO_ORACAO_ID,
      detalhe_id: DETALHE_ORACAO_ID,
      pontuacao: 0,
      acertos: 1,
      total_itens: 1,
      tempo_total_segundos: Math.round(minutos * 60),
    });
  } catch (error) {
    console.error("Erro ao registrar momento de oração:", error);

    if (error instanceof Error) {
      throw new Error(`FALHA_ORACAO: ${error.message}`);
    }

    throw new Error("FALHA_ORACAO: erro desconhecido.");
  }
}

/**
 * BUSCAR MINUTOS DO DIA
 */
export async function buscarMinutosOracaoHoje() {
  const supabase = await getSupabaseServerClient(); // 🔥 CORREÇÃO PRINCIPAL

  const agora = new Date();

  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);

  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("next_sessoes_atividade")
    .select("tempo_total_segundos")
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

  return Math.round(totalSegundos / 60);
}