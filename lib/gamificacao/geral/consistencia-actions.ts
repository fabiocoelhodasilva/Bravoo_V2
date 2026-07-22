import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buscarSequenciaPorUsuarioEMateria,
  upsertSequenciaPorUsuarioEMateria,
} from "@/lib/gamificacao/geral/gamificacao-service";

import { calcularAtualizacaoSequencia } from "@/lib/gamificacao/geral/gamificacao-rules";

import type {
  MotivoAtualizacaoSequencia,
  RegistroSequenciaMateria,
} from "@/lib/gamificacao/geral/gamificacao-types";

/* =========================================================
   Tipos
========================================================= */

type ProcessarConsistenciaParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
  dataReferencia: string;
};

export type ResultadoProcessamentoConsistencia = {
  atualizado: boolean;
  diasSeguidos: number;
  maiorSequencia: number;
  pontosConsistencia: number;
  motivo: MotivoAtualizacaoSequencia;
};

/* =========================================================
   Processamento da consistência
========================================================= */

export async function processarConsistenciaAposAtividade({
  supabase,
  usuarioId,
  materiaId,
  dataReferencia,
}: ProcessarConsistenciaParams): Promise<ResultadoProcessamentoConsistencia> {
  const registroAtual = await buscarSequenciaPorUsuarioEMateria(supabase, {
    usuarioId,
    materiaId,
  });

  const resultadoSequencia = calcularAtualizacaoSequencia({
    registroAtual,
    dataReferencia,
  });

  if (!resultadoSequencia.deveAtualizar) {
    return criarResultadoSemAtualizacao(
      registroAtual,
      resultadoSequencia.motivo
    );
  }

  const novosPontosConsistencia =
    (registroAtual?.pontos_consistencia ?? 0) +
    resultadoSequencia.pontosGanhos;

  const registroAtualizado =
    await upsertSequenciaPorUsuarioEMateria(supabase, {
      usuarioId,
      materiaId,
      diasSeguidos: resultadoSequencia.novoDiasSeguidos,
      maiorSequencia: resultadoSequencia.novoMaiorSequencia,
      ultimaDataAtividade: resultadoSequencia.novaUltimaDataAtividade,
      pontosConsistencia: novosPontosConsistencia,

      // Mantidos como zero por compatibilidade com a tabela atual.
      escudosDisponiveis: 0,
      ultimoMarcoEscudoConcedido: 0,
    });

  return {
    atualizado: true,
    diasSeguidos: registroAtualizado.dias_seguidos,
    maiorSequencia: registroAtualizado.maior_sequencia,
    pontosConsistencia: registroAtualizado.pontos_consistencia,
    motivo: resultadoSequencia.motivo,
  };
}

/* =========================================================
   Resultado quando a atividade ocorreu no mesmo dia
========================================================= */

function criarResultadoSemAtualizacao(
  registroAtual: RegistroSequenciaMateria | null,
  motivo: MotivoAtualizacaoSequencia
): ResultadoProcessamentoConsistencia {
  return {
    atualizado: false,
    diasSeguidos: registroAtual?.dias_seguidos ?? 0,
    maiorSequencia: registroAtual?.maior_sequencia ?? 0,
    pontosConsistencia: registroAtual?.pontos_consistencia ?? 0,
    motivo,
  };
}