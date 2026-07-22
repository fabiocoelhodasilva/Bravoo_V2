import { processarConsistenciaAposAtividade } from "@/lib/gamificacao/geral/consistencia-actions";

import type {
  ProcessarGamificacaoParams,
  ResultadoProcessamentoGamificacao,
} from "@/lib/gamificacao/geral/gamificacao-types";

/**
 * Coordena os processos gerais de gamificação após uma atividade válida.
 *
 * As regras específicas de concessão de joias continuam nos módulos
 * de cada matéria.
 */
export async function processarGamificacaoAposAtividade(
  params: ProcessarGamificacaoParams
): Promise<ResultadoProcessamentoGamificacao> {
  const consistencia = await processarConsistenciaAposAtividade({
    supabase: params.supabase,
    usuarioId: params.usuarioId,
    materiaId: params.materiaId,
    dataReferencia: params.dataReferencia,
  });

  return {
    streakAtualizado: consistencia.atualizado,
    diasSeguidos: consistencia.diasSeguidos,
    maiorSequencia: consistencia.maiorSequencia,
    pontosConsistencia: consistencia.pontosConsistencia,
    motivoStreak: consistencia.motivo,

    // Retornos neutros mantidos para não quebrar chamadas antigas.
    moedasCreditadas: false,
    moedasGanhas: 0,
    escudosDisponiveis: 0,
    escudosGanhos: 0,
    escudoConsumido: false,
  };
}