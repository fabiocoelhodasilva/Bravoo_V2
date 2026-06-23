import {
  buscarSequenciaPorUsuarioEMateria,
  upsertSequenciaPorUsuarioEMateria,
} from "@/lib/gamificacao/geral/gamificacao-service";

import { calcularAtualizacaoSequencia } from "@/lib/gamificacao/geral/gamificacao-rules";

import type {
  ProcessarGamificacaoParams,
  ResultadoProcessamentoGamificacao,
} from "@/lib/gamificacao/geral/gamificacao-types";

/**
 * Processa a gamificação após a conclusão de uma atividade válida.
 *
 * Regra atual simplificada:
 * - atualiza apenas a persistência da matéria
 * - não gera moedas
 * - não gera escudos
 * - não calcula faixa/classificação
 * - joias são tratadas em fluxo separado
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

        // Mantidos como 0 para compatibilidade com a tabela atual.
        escudosDisponiveis: 0,
        ultimoMarcoEscudoConcedido: 0,
      }
    );

    diasSeguidos = registroAtualizado.dias_seguidos;
    maiorSequencia = registroAtualizado.maior_sequencia;
    pontosConsistencia = registroAtualizado.pontos_consistencia;
    streakAtualizado = true;
  }

  return {
    streakAtualizado,
    diasSeguidos,
    maiorSequencia,
    pontosConsistencia,
    motivoStreak: resultadoSequencia.motivo,

    // Retornos neutros para não quebrar chamadas antigas.
    moedasCreditadas: false,
    moedasGanhas: 0,
    escudosDisponiveis: 0,
    escudosGanhos: 0,
    escudoConsumido: false,
  };
}
