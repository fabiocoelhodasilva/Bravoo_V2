import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegistroSequenciaMateria } from "@/lib/gamificacao/geral/gamificacao-types";

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
    escudosDisponiveis?: number;
    ultimoMarcoEscudoConcedido?: number;
  }
): Promise<RegistroSequenciaMateria> {
  const payload = {
    usuario_id: params.usuarioId,
    materia_id: params.materiaId,
    dias_seguidos: params.diasSeguidos,
    maior_sequencia: params.maiorSequencia,
    ultima_data_atividade: params.ultimaDataAtividade,
    pontos_consistencia: params.pontosConsistencia,

    // Mantidos por compatibilidade com a estrutura atual da tabela.
    escudos_disponiveis: params.escudosDisponiveis ?? 0,
    ultimo_marco_escudo_concedido: params.ultimoMarcoEscudoConcedido ?? 0,

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
