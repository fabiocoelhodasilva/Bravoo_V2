"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const MATERIA_ESPIRITUAL_ID =
  "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";

/**
 * Início oficial da nova mecânica do Jardim.
 * Nenhum dia anterior a esta data participa do cálculo.
 */
const DATA_INICIO_NOVA_REGRA_JARDIM = "2026-09-14";

/**
 * Quantidade máxima de dias COMPLETOS anteriores a hoje
 * considerados no histórico do Jardim.
 */
const DIAS_JANELA_JARDIM = 11;

export type DiaHistoricoJardim = {
  data: string;
  metaCumprida: boolean;
  variacao: 1 | -1;
  pontuacaoAposDia: number;
};

export type ResumoPontuacaoJardim = {
  /** Pontuação final usada para escolher a imagem do Jardim. */
  pontuacao: number;

  /** Pontuação calculada apenas com os dias completos anteriores a hoje. */
  pontuacaoHistorica: number;

  /** Hoje nunca perde ponto. Se houver joia hoje, soma +1. */
  metaCumpridaHoje: boolean;
  bonusHoje: 0 | 1;

  /** Início efetivo da janela histórica. Mantido também por compatibilidade. */
  dataInicio: string;

  /** Último dia completo analisado. É sempre ontem quando houver histórico. */
  dataFimHistorico: string | null;

  /** Data de hoje em America/Sao_Paulo. */
  hoje: string;

  /**
   * Diagnóstico do que o algoritmo enxergou em cada dia completo.
   * No máximo 11 dias e nunca inclui hoje.
   */
  diasHistoricos: DiaHistoricoJardim[];
};

function obterDataSaoPaulo(data: Date): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const get = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function adicionarDiasDataIso(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  data.setUTCDate(data.getUTCDate() + dias);

  return data.toISOString().slice(0, 10);
}

function maiorDataIso(...datas: string[]) {
  return datas.reduce((maior, atual) => (atual > maior ? atual : maior));
}

/**
 * Calcula a pontuação atual do Jardim.
 *
 * Fonte de verdade: a joia espiritual diária.
 * Ela representa que a meta de oração daquele dia foi cumprida.
 *
 * REGRAS DO HISTÓRICO
 * - considera no máximo os 11 dias completos anteriores a hoje;
 * - nunca considera datas anteriores a 14/09/2026;
 * - nunca considera datas anteriores ao cadastro do usuário;
 * - dia completo com joia espiritual: +1;
 * - dia completo sem joia espiritual: -1;
 * - a pontuação nunca fica abaixo de 0;
 * - a ordem dos dias importa porque o piso zero é aplicado dia a dia.
 *
 * REGRA DE HOJE
 * - hoje não faz parte dos 11 dias históricos;
 * - se ainda não ganhou a joia hoje: +0 e nenhuma punição;
 * - se ganhou a joia hoje: +1 imediatamente.
 *
 * Assim, amanhã o dia de hoje deixa de ser "bônus de hoje" e passa
 * naturalmente a fazer parte da janela de dias completos.
 */
export async function buscarPontuacaoJardim(): Promise<ResumoPontuacaoJardim> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    throw new Error("Usuário não identificado.");
  }

  const hoje = obterDataSaoPaulo(new Date());
  const ontem = adicionarDiasDataIso(hoje, -1);
  const inicioJanelaMovel = adicionarDiasDataIso(hoje, -DIAS_JANELA_JARDIM);
  const dataCadastro = obterDataSaoPaulo(new Date(user.created_at));

  /**
   * A janela começa na data MAIS RECENTE entre:
   * - hoje - 11 dias;
   * - 14/09/2026;
   * - data de cadastro do usuário.
   */
  const dataInicio = maiorDataIso(
    inicioJanelaMovel,
    DATA_INICIO_NOVA_REGRA_JARDIM,
    dataCadastro,
  );

  /**
   * Se a mecânica ainda não começou para este usuário, não há histórico
   * nem bônus de hoje a calcular.
   */
  if (dataInicio > hoje) {
    return {
      pontuacao: 0,
      pontuacaoHistorica: 0,
      metaCumpridaHoje: false,
      bonusHoje: 0,
      dataInicio,
      dataFimHistorico: null,
      hoje,
      diasHistoricos: [],
    };
  }

  /**
   * Consultamos desde o início efetivo até o fim de hoje.
   * Amanhã fica como limite exclusivo para evitar trazer registros futuros.
   */
  const inicioConsulta = `${dataInicio}T00:00:00-03:00`;
  const amanha = adicionarDiasDataIso(hoje, 1);
  const fimConsultaExclusivo = `${amanha}T00:00:00-03:00`;

  const { data: joias, error } = await supabase
    .from("next_joias_usuario")
    .select("data_conquista")
    .eq("usuario_id", user.id)
    .eq("materia_id", MATERIA_ESPIRITUAL_ID)
    .gte("data_conquista", inicioConsulta)
    .lt("data_conquista", fimConsultaExclusivo)
    .order("data_conquista", { ascending: true });

  if (error) {
    console.error("Erro ao calcular pontuação do jardim:", error);
    throw new Error("Não foi possível calcular a pontuação do jardim.");
  }

  const diasComMetaCumprida = new Set<string>();

  for (const joia of joias ?? []) {
    if (!joia.data_conquista) continue;

    const dataLocal = obterDataSaoPaulo(new Date(joia.data_conquista));

    if (dataLocal >= dataInicio && dataLocal <= hoje) {
      diasComMetaCumprida.add(dataLocal);
    }
  }

  let pontuacaoHistorica = 0;
  const diasHistoricos: DiaHistoricoJardim[] = [];

  /**
   * Histórico: somente dias já encerrados.
   * Se dataInicio === hoje, o laço não executa e o histórico fica vazio.
   */
  let cursor = dataInicio;

  while (cursor <= ontem && cursor < hoje) {
    const metaCumprida = diasComMetaCumprida.has(cursor);
    const variacao: 1 | -1 = metaCumprida ? 1 : -1;

    if (metaCumprida) {
      pontuacaoHistorica += 1;
    } else {
      pontuacaoHistorica = Math.max(0, pontuacaoHistorica - 1);
    }

    diasHistoricos.push({
      data: cursor,
      metaCumprida,
      variacao,
      pontuacaoAposDia: pontuacaoHistorica,
    });

    cursor = adicionarDiasDataIso(cursor, 1);
  }

  /**
   * Hoje é tratado separadamente.
   * Sem joia hoje = pendente, não perdido.
   */
  const metaCumpridaHoje = diasComMetaCumprida.has(hoje);
  const bonusHoje: 0 | 1 = metaCumpridaHoje ? 1 : 0;
  const pontuacao = pontuacaoHistorica + bonusHoje;

  return {
    pontuacao,
    pontuacaoHistorica,
    metaCumpridaHoje,
    bonusHoje,
    dataInicio,
    dataFimHistorico: diasHistoricos.length > 0 ? ontem : null,
    hoje,
    diasHistoricos,
  };
}
