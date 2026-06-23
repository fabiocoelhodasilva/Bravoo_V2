import type { SupabaseClient } from "@supabase/supabase-js";

// =========================
// Registros principais
// =========================

export type RegistroSequenciaMateria = {
  usuario_id: string;
  materia_id: string;
  dias_seguidos: number;
  maior_sequencia: number;
  ultima_data_atividade: string | null; // YYYY-MM-DD
  pontos_consistencia: number;

  // Mantidos temporariamente por compatibilidade com a tabela atual.
  escudos_disponiveis: number;
  ultimo_marco_escudo_concedido: number;

  created_at?: string;
  updated_at?: string;
};

// =========================
// Resultados de regra/processamento
// =========================

export type MotivoAtualizacaoSequencia =
  | "primeira_atividade"
  | "mesmo_dia"
  | "sequencia_continua"
  | "sequencia_reiniciada";

export type ResultadoAtualizacaoSequencia = {
  deveAtualizar: boolean;
  motivo: MotivoAtualizacaoSequencia;
  novoDiasSeguidos: number;
  novoMaiorSequencia: number;
  novaUltimaDataAtividade: string;
  pontosGanhos: number;

  // Retornos neutros mantidos temporariamente para compatibilidade.
  escudoConsumido: false;
  escudosGanhos: 0;
  novosEscudosDisponiveis: 0;
  novoUltimoMarcoEscudoConcedido: 0;
};

export type ResultadoProcessamentoGamificacao = {
  streakAtualizado: boolean;
  diasSeguidos: number;
  maiorSequencia: number;
  pontosConsistencia: number;
  motivoStreak: MotivoAtualizacaoSequencia;

  // Retornos neutros mantidos temporariamente para não quebrar chamadas antigas.
  moedasCreditadas: false;
  moedasGanhas: 0;
  escudosDisponiveis: 0;
  escudosGanhos: 0;
  escudoConsumido: false;
};

export type ProcessarGamificacaoParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
  atividadeId?: string | null;
  sessaoAtividadeId?: string | null;
  dataReferencia: string; // YYYY-MM-DD

  // Mantido temporariamente para compatibilidade com chamadas antigas.
  pontuacao?: number;
};
