import type {
  RegistroSequenciaMateria,
  ResultadoAtualizacaoSequencia,
} from "@/lib/gamificacao/geral/gamificacao-types";

/**
 * Converte YYYY-MM-DD para Date UTC estável.
 */
function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Diferença em dias entre duas datas YYYY-MM-DD.
 */
export function diffDays(dateA: string, dateB: string): number {
  const a = parseDateOnly(dateA);
  const b = parseDateOnly(dateB);
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Calcula a nova sequência com base no último dia registrado.
 *
 * Regras atuais simplificadas:
 * - primeira atividade começa com 1 dia seguido
 * - mesmo dia não atualiza a sequência
 * - dia seguinte continua a sequência e soma +1 ponto de consistência
 * - se pulou um ou mais dias, reinicia em 1
 * - não usa escudos
 * - não gera moedas
 * - não calcula faixas
 */
export function calcularAtualizacaoSequencia(params: {
  registroAtual: RegistroSequenciaMateria | null;
  dataReferencia: string;
}): ResultadoAtualizacaoSequencia {
  const { registroAtual, dataReferencia } = params;

  if (!registroAtual || !registroAtual.ultima_data_atividade) {
    return {
      deveAtualizar: true,
      motivo: "primeira_atividade",
      novoDiasSeguidos: 1,
      novoMaiorSequencia: 1,
      novaUltimaDataAtividade: dataReferencia,
      pontosGanhos: 0,

      // Retornos neutros mantidos por compatibilidade.
      escudoConsumido: false,
      escudosGanhos: 0,
      novosEscudosDisponiveis: 0,
      novoUltimoMarcoEscudoConcedido: 0,
    };
  }

  const ultimaData = registroAtual.ultima_data_atividade;
  const diferenca = diffDays(ultimaData, dataReferencia);

  if (diferenca === 0) {
    return {
      deveAtualizar: false,
      motivo: "mesmo_dia",
      novoDiasSeguidos: registroAtual.dias_seguidos,
      novoMaiorSequencia: registroAtual.maior_sequencia,
      novaUltimaDataAtividade: ultimaData,
      pontosGanhos: 0,

      // Retornos neutros mantidos por compatibilidade.
      escudoConsumido: false,
      escudosGanhos: 0,
      novosEscudosDisponiveis: 0,
      novoUltimoMarcoEscudoConcedido: 0,
    };
  }

  if (diferenca === 1) {
    const novoDiasSeguidos = registroAtual.dias_seguidos + 1;
    const novoMaiorSequencia = Math.max(
      registroAtual.maior_sequencia,
      novoDiasSeguidos
    );

    return {
      deveAtualizar: true,
      motivo: "sequencia_continua",
      novoDiasSeguidos,
      novoMaiorSequencia,
      novaUltimaDataAtividade: dataReferencia,
      pontosGanhos: 1,

      // Retornos neutros mantidos por compatibilidade.
      escudoConsumido: false,
      escudosGanhos: 0,
      novosEscudosDisponiveis: 0,
      novoUltimoMarcoEscudoConcedido: 0,
    };
  }

  return {
    deveAtualizar: true,
    motivo: "sequencia_reiniciada",
    novoDiasSeguidos: 1,
    novoMaiorSequencia: Math.max(registroAtual.maior_sequencia, 1),
    novaUltimaDataAtividade: dataReferencia,
    pontosGanhos: 0,

    // Retornos neutros mantidos por compatibilidade.
    escudoConsumido: false,
    escudosGanhos: 0,
    novosEscudosDisponiveis: 0,
    novoUltimoMarcoEscudoConcedido: 0,
  };
}
