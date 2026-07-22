import type { SupabaseClient } from "@supabase/supabase-js";

import { obterIntervaloDiaBrasil } from "@/lib/utils/data-brasil";

/* =========================================================
   Tipos
========================================================= */

type CarregarJoiasSemanaParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  imagemJoia: string;
};

/* =========================================================
   Serviço
========================================================= */

/**
 * Retorna um mapa contendo as joias conquistadas na semana.
 *
 * Exemplo:
 *
 * {
 *   "2026-07-28": "/imagens/joias/joia_or.png",
 *   "2026-07-30": "/imagens/joias/joia_or.png"
 * }
 */
export async function carregarJoiasSemana({
  supabase,
  usuarioId,
  materiaId,
  dataInicio,
  dataFim,
  imagemJoia,
}: CarregarJoiasSemanaParams): Promise<Record<string, string>> {
  const intervaloPrimeiroDia = obterIntervaloDiaBrasil(dataInicio);
  const intervaloUltimoDia = obterIntervaloDiaBrasil(dataFim);

  const { data, error } = await supabase
    .from("next_joias_usuario")
    .select("data_conquista")
    .eq("usuario_id", usuarioId)
    .eq("materia_id", materiaId)
    .gte("data_conquista", intervaloPrimeiroDia.inicio)
    .lte("data_conquista", intervaloUltimoDia.fim);

  if (error) {
    console.error("Erro ao carregar joias da semana:", error);
    return {};
  }

  const resultado: Record<string, string> = {};

  for (const joia of data ?? []) {
    const dataIso = joia.data_conquista.substring(0, 10);

    resultado[dataIso] = imagemJoia;
  }

  return resultado;
}