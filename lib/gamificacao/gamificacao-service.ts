import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClassificacaoAtualMateriaView,
  FaixaGamificacao,
  MovimentoEscudo,
  MovimentoMoeda,
  RegistroSequenciaMateria,
} from "@/lib/gamificacao/gamificacao-types";

function obterDataHoraSaoPauloIso(): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    partes.find((parte) => parte.type === type)?.value ?? "";

  const ano = get("year");
  const mes = get("month");
  const dia = get("day");
  const hora = get("hour");
  const minuto = get("minute");
  const segundo = get("second");

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;
}

export async function buscarSequenciaPorUsuarioEMateria(
  supabase: SupabaseClient,
  params: {
    usuarioId: string;
    materiaId: string;
  }
): Promise<RegistroSequenciaMateria | null> {
  const { data, error } = await supabase
    .from("next_sequencia_dias_usuario")
    .select("*")
    .eq("usuario_id", params.usuarioId)
    .eq("materia_id", params.materiaId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao buscar sequência por usuário e matéria: ${error.message}`
    );
  }

  return data as RegistroSequenciaMateria | null;
}

export async function upsertSequenciaPorUsuarioEMateria(
  supabase: SupabaseClient,
  params: {
    usuarioId: string;
    materiaId: string;
    diasSeguidos: number;
    maiorSequencia: number;
    ultimaDataAtividade: string;
    pontosConsistencia: number;
    escudosDisponiveis: number;
    ultimoMarcoEscudoConcedido: number;
  }
): Promise<RegistroSequenciaMateria> {
  const payload = {
    usuario_id: params.usuarioId,
    materia_id: params.materiaId,
    dias_seguidos: params.diasSeguidos,
    maior_sequencia: params.maiorSequencia,
    ultima_data_atividade: params.ultimaDataAtividade,
    pontos_consistencia: params.pontosConsistencia,
    escudos_disponiveis: params.escudosDisponiveis,
    ultimo_marco_escudo_concedido: params.ultimoMarcoEscudoConcedido,
    updated_at: obterDataHoraSaoPauloIso(),
  };

  const { data, error } = await supabase
    .from("next_sequencia_dias_usuario")
    .upsert(payload, {
      onConflict: "usuario_id,materia_id",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao salvar sequência: ${error.message}`);
  }

  return data as RegistroSequenciaMateria;
}

export async function inserirMovimentacaoMoeda(
  supabase: SupabaseClient,
  movimento: MovimentoMoeda
): Promise<void> {
  const payload = {
    usuario_id: movimento.usuario_id,
    materia_id: movimento.materia_id ?? null,
    atividade_id: movimento.atividade_id ?? null,
    sessao_atividade_id: movimento.sessao_atividade_id ?? null,
    quantidade: movimento.quantidade,
    tipo_movimento: movimento.tipo_movimento,
    origem: movimento.origem,
    observacao: movimento.observacao ?? null,
    data_movimentacao:
      movimento.data_movimentacao ?? obterDataHoraSaoPauloIso(),
  };

  const { error } = await supabase
    .from("next_movimentacoes_moeda")
    .insert(payload);

  if (error) {
    throw new Error(`Erro ao inserir movimentação de moeda: ${error.message}`);
  }
}

export async function inserirMovimentacaoEscudo(
  supabase: SupabaseClient,
  movimento: MovimentoEscudo
): Promise<void> {
  const payload = {
    usuario_id: movimento.usuario_id,
    materia_id: movimento.materia_id,
    atividade_id: movimento.atividade_id ?? null,
    sessao_atividade_id: movimento.sessao_atividade_id ?? null,
    quantidade: movimento.quantidade,
    tipo_movimento: movimento.tipo_movimento,
    origem: movimento.origem,
    observacao: movimento.observacao ?? null,
    data_movimentacao:
      movimento.data_movimentacao ?? obterDataHoraSaoPauloIso(),
  };

  const { error } = await supabase
    .from("next_movimentacoes_escudo")
    .insert(payload);

  if (error) {
    throw new Error(`Erro ao inserir movimentação de escudo: ${error.message}`);
  }
}

export async function buscarSaldoMoedas(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("vw_next_saldo_moedas_geral")
    .select("saldo_moedas")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar saldo de moedas: ${error.message}`);
  }

  return Number(data?.saldo_moedas ?? 0);
}

export async function buscarClassificacaoAtualPorMateria(
  supabase: SupabaseClient,
  params: {
    usuarioId: string;
    materiaId: string;
  }
): Promise<ClassificacaoAtualMateriaView | null> {
  const { data, error } = await supabase
    .from("vw_next_resumo_gamificacao_por_materia")
    .select(
      `
      usuario_id,
      materia_id,
      dias_seguidos,
      maior_sequencia,
      ultima_data_atividade,
      pontos_consistencia,
      escudos_disponiveis,
      ultimo_marco_escudo_concedido,
      created_at,
      updated_at,
      classificacao_id,
      classificacao_nome,
      classificacao_ordem,
      classificacao_cor,
      classificacao_dias_minimos,
      classificacao_dias_maximos,
      percentual_progresso_classificacao
      `
    )
    .eq("usuario_id", params.usuarioId)
    .eq("materia_id", params.materiaId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao buscar classificação atual por matéria: ${error.message}`
    );
  }

  return data as ClassificacaoAtualMateriaView | null;
}

export async function buscarFaixasClassificacao(
  supabase: SupabaseClient
): Promise<FaixaGamificacao[]> {
  const { data, error } = await supabase
    .from("next_faixas_classificacao")
    .select("id, nome, ordem, cor, dias_minimos, dias_maximos")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar faixas de classificação: ${error.message}`);
  }

  return (data ?? []).map((faixa) => ({
    id: faixa.id,
    nome: faixa.nome,
    ordem: faixa.ordem,
    cor: faixa.cor ?? "#FFFFFF",
    diasMinimos: faixa.dias_minimos,
    diasMaximos: faixa.dias_maximos,
  }));
}