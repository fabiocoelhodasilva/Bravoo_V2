import {
  buscarClassificacaoAtualPorMateria,
  buscarSequenciaPorUsuarioEMateria,
  inserirMovimentacaoEscudo,
  inserirMovimentacaoMoeda,
  upsertSequenciaPorUsuarioEMateria,
} from "@/lib/gamificacao/gamificacao-service";

import { calcularAtualizacaoSequencia } from "@/lib/gamificacao/gamificacao-rules";

import type {
  ProcessarGamificacaoParams,
  ResultadoProcessamentoGamificacao,
} from "@/lib/gamificacao/gamificacao-types";

/**
 * Processa a gamificação após a conclusão de uma atividade válida.
 *
 * Regras atuais:
 * - no mesmo dia, não conta duas vezes a mesma matéria para sequência
 * - se a última atividade foi ontem, continua a sequência
 * - se perdeu exatamente 1 dia e tem escudo, consome escudo e mantém a sequência
 * - se ficou mais tempo sem fazer, reinicia em 1
 * - pontos de consistência são autônomos e não dependem diretamente de dias_seguidos
 * - ganha 1 escudo a cada 10 dias seguidos, com limite de 2
 * - moedas acompanham a pontuação da sessão
 * - pode ganhar moedas várias vezes no mesmo dia
 */
export async function processarGamificacaoAposAtividade(
  params: ProcessarGamificacaoParams
): Promise<ResultadoProcessamentoGamificacao> {
  const registroAtual = await buscarSequenciaPorUsuarioEMateria(params.supabase, {
    usuarioId: params.usuarioId,
    materiaId: params.materiaId,
  });

  const resultadoSequencia = calcularAtualizacaoSequencia({
    registroAtual,
    dataReferencia: params.dataReferencia,
  });

  let diasSeguidos = resultadoSequencia.novoDiasSeguidos;
  let maiorSequencia = resultadoSequencia.novoMaiorSequencia;
  let pontosConsistencia = registroAtual?.pontos_consistencia ?? 0;
  let escudosDisponiveis = registroAtual?.escudos_disponiveis ?? 0;
  let streakAtualizado = false;

  if (resultadoSequencia.deveAtualizar) {
    const novosPontosConsistencia =
      (registroAtual?.pontos_consistencia ?? 0) +
      resultadoSequencia.pontosGanhos;

    const registroAtualizado = await upsertSequenciaPorUsuarioEMateria(
      params.supabase,
      {
        usuarioId: params.usuarioId,
        materiaId: params.materiaId,
        diasSeguidos: resultadoSequencia.novoDiasSeguidos,
        maiorSequencia: resultadoSequencia.novoMaiorSequencia,
        ultimaDataAtividade: resultadoSequencia.novaUltimaDataAtividade,
        pontosConsistencia: novosPontosConsistencia,
        escudosDisponiveis: resultadoSequencia.novosEscudosDisponiveis,
        ultimoMarcoEscudoConcedido:
          resultadoSequencia.novoUltimoMarcoEscudoConcedido,
      }
    );

    diasSeguidos = registroAtualizado.dias_seguidos;
    maiorSequencia = registroAtualizado.maior_sequencia;
    pontosConsistencia = registroAtualizado.pontos_consistencia;
    escudosDisponiveis = registroAtualizado.escudos_disponiveis;
    streakAtualizado = true;
  }

  if (resultadoSequencia.escudosGanhos > 0) {
    try {
      await inserirMovimentacaoEscudo(params.supabase, {
        usuario_id: params.usuarioId,
        materia_id: params.materiaId,
        atividade_id: params.atividadeId ?? null,
        sessao_atividade_id: params.sessaoAtividadeId ?? null,
        quantidade: resultadoSequencia.escudosGanhos,
        tipo_movimento: "entrada",
        origem: "sequencia_10_dias",
        observacao: `Ganho automático de escudo por marco de sequência em ${params.dataReferencia}`,
      });
    } catch (error) {
      console.error(
        "Erro ao registrar movimentação de escudo (entrada):",
        error
      );
    }
  }

  if (resultadoSequencia.escudoConsumido) {
    try {
      await inserirMovimentacaoEscudo(params.supabase, {
        usuario_id: params.usuarioId,
        materia_id: params.materiaId,
        atividade_id: params.atividadeId ?? null,
        sessao_atividade_id: params.sessaoAtividadeId ?? null,
        quantidade: 1,
        tipo_movimento: "saida",
        origem: "uso_escudo",
        observacao: `Uso automático de escudo para proteger a sequência em ${params.dataReferencia}`,
      });
    } catch (error) {
      console.error("Erro ao registrar movimentação de escudo (saída):", error);
    }
  }

  const moedasGanhas = Math.max(0, params.pontuacao);
  let moedasCreditadas = false;

  if (moedasGanhas > 0) {
    try {
      await inserirMovimentacaoMoeda(params.supabase, {
        usuario_id: params.usuarioId,
        materia_id: params.materiaId,
        atividade_id: params.atividadeId ?? null,
        sessao_atividade_id: params.sessaoAtividadeId ?? null,
        quantidade: moedasGanhas,
        tipo_movimento: "entrada",
        origem: "jogo",
        observacao: `Crédito automático por pontuação da sessão em ${params.dataReferencia}`,
      });

      moedasCreditadas = true;
    } catch (error) {
      console.error("Erro ao registrar movimentação de moeda:", error);

      if (error instanceof Error) {
        throw new Error(`FALHA_MOEDA: ${error.message}`);
      }

      throw new Error("FALHA_MOEDA: erro desconhecido ao registrar moeda.");
    }
  }

  return {
    streakAtualizado,
    moedasCreditadas,
    diasSeguidos,
    maiorSequencia,
    pontosConsistencia,
    moedasGanhas,
    escudosDisponiveis,
    escudosGanhos: resultadoSequencia.escudosGanhos,
    escudoConsumido: resultadoSequencia.escudoConsumido,
    motivoStreak: resultadoSequencia.motivo,
  };
}

export async function buscarResumoGamificacaoPorMateria(params: {
  supabase: ProcessarGamificacaoParams["supabase"];
  usuarioId: string;
  materiaId: string;
}) {
  return await buscarClassificacaoAtualPorMateria(params.supabase, {
    usuarioId: params.usuarioId,
    materiaId: params.materiaId,
  });
}