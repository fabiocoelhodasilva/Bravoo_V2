import type { SupabaseClient } from "@supabase/supabase-js";

// =========================
// Movimentações de moedas
// =========================

export type TipoMovimentoMoeda = "entrada" | "saida";

export type OrigemMovimentoMoeda =
  | "jogo"
  | "bonus"
  | "sequencia_dias"
  | "ajuste"
  | "resgate";

// =========================
// Movimentações de escudos
// =========================

export type TipoMovimentoEscudo = "entrada" | "saida";

export type OrigemMovimentoEscudo =
  | "sequencia_10_dias"
  | "uso_escudo"
  | "bonus"
  | "ajuste";

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
  escudos_disponiveis: number;
  ultimo_marco_escudo_concedido: number;
  created_at?: string;
  updated_at?: string;
};

export type MovimentoMoeda = {
  id?: string;
  usuario_id: string;
  materia_id?: string | null;
  atividade_id?: string | null;
  sessao_atividade_id?: string | null;
  quantidade: number;
  tipo_movimento: TipoMovimentoMoeda;
  origem: OrigemMovimentoMoeda;
  observacao?: string | null;
  data_movimentacao?: string;
  created_at?: string;
};

export type MovimentoEscudo = {
  id?: string;
  usuario_id: string;
  materia_id: string;
  atividade_id?: string | null;
  sessao_atividade_id?: string | null;
  quantidade: number;
  tipo_movimento: TipoMovimentoEscudo;
  origem: OrigemMovimentoEscudo;
  observacao?: string | null;
  data_movimentacao?: string;
  created_at?: string;
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
  escudoConsumido: boolean;
  escudosGanhos: number;
  novosEscudosDisponiveis: number;
  novoUltimoMarcoEscudoConcedido: number;
};

export type ResultadoProcessamentoGamificacao = {
  streakAtualizado: boolean;
  moedasCreditadas: boolean;
  diasSeguidos: number;
  maiorSequencia: number;
  pontosConsistencia: number;
  moedasGanhas: number;
  escudosDisponiveis: number;
  escudosGanhos: number;
  escudoConsumido: boolean;
  motivoStreak: MotivoAtualizacaoSequencia;
};

export type ProcessarGamificacaoParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
  atividadeId?: string | null;
  sessaoAtividadeId?: string | null;
  dataReferencia: string; // YYYY-MM-DD
  pontuacao: number;
};

// =========================
// Classificação visual (faixas)
// =========================

export type FaixaGamificacao = {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  diasMinimos: number;
  diasMaximos: number | null;
};

export type ProgressoFaixa = {
  faixaAtual: FaixaGamificacao;
  proximaFaixa: FaixaGamificacao | null;
  valorAtual: number;
  valorMinimoFaixa: number;
  valorMaximoFaixa: number | null;
  percentualProgresso: number;
  textoIntervalo: string;
};

export type ResumoGamificacaoMateria = {
  diasSeguidos: number;
  maiorSequencia: number;
  pontosConsistencia: number;
  escudosDisponiveis: number;
  moedas: number;
  progressoFaixa: ProgressoFaixa;
};

// =========================
// View consolidada da classificação
// vw_next_resumo_gamificacao_por_materia
// =========================

export type ClassificacaoAtualMateriaView = {
  usuario_id: string;
  materia_id: string;

  dias_seguidos: number;
  maior_sequencia: number;
  ultima_data_atividade: string | null;

  pontos_consistencia: number;
  escudos_disponiveis: number;
  ultimo_marco_escudo_concedido: number;

  created_at: string;
  updated_at: string;

  classificacao_id: string;
  classificacao_nome: string;
  classificacao_ordem: number;
  classificacao_cor: string | null;

  classificacao_dias_minimos: number;
  classificacao_dias_maximos: number | null;

  percentual_progresso_classificacao: number;
};