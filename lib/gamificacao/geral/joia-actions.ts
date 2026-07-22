import type { SupabaseClient } from "@supabase/supabase-js";

import { concederMandalaDiaria } from "@/lib/gamificacao/geral/mandala-actions";

/* =========================================================
   Tipos
========================================================= */

type ConcederJoiaMateriaParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
};

type RemoverJoiaMateriaParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
  dataReferencia: string;
};

export type ResultadoConcessaoJoia = {
  joiaConquistada: boolean;
  mandalaConquistada: boolean;
};

/* =========================================================
   Concede joia e verifica mandala
========================================================= */

export async function concederJoiaMateria({
  supabase,
  usuarioId,
  materiaId,
}: ConcederJoiaMateriaParams): Promise<ResultadoConcessaoJoia> {
  const { data: joiaConquistada, error: erroJoia } = await supabase.rpc(
    "fn_conceder_joia_materia",
    {
      p_usuario_id: usuarioId,
      p_materia_id: materiaId,
    }
  );

  if (erroJoia) {
    throw new Error(`Erro ao conceder joia: ${erroJoia.message}`);
  }

  const foiConquistadaAgora = joiaConquistada === true;

  if (!foiConquistadaAgora) {
    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  const mandalaConquistada = await concederMandalaDiaria({
    supabase,
    usuarioId,
  });

  return {
    joiaConquistada: true,
    mandalaConquistada,
  };
}

/* =========================================================
   Remove joia de uma matéria em determinada data
========================================================= */

export async function removerJoiaMateriaDaData({
  supabase,
  usuarioId,
  materiaId,
  dataReferencia,
}: RemoverJoiaMateriaParams): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "fn_remover_joia_materia_data",
    {
      p_usuario_id: usuarioId,
      p_materia_id: materiaId,
      p_data: dataReferencia,
    }
  );

  if (error) {
    throw new Error(`Erro ao remover joia: ${error.message}`);
  }

  return data === true;
}