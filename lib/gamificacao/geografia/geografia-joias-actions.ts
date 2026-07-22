import type { SupabaseClient } from "@supabase/supabase-js";
import {
  concederJoiaMateria,
  type ResultadoConcessaoJoia,
} from "@/lib/gamificacao/geral/joia-actions";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_GEOGRAFIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function resultadoSemConquista(): ResultadoConcessaoJoia {
  return {
    joiaConquistada: false,
    mandalaConquistada: false,
  };
}

/* =========================================================
   Concessão de joia de Geografia
========================================================= */

/**
 * Concede a Safira diária da matéria Geografia e, quando a
 * conquista é nova, verifica se ela completou a Mandala diária.
 */
export async function concederJoiaGeografia(params: {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
}): Promise<ResultadoConcessaoJoia> {
  const { supabase, usuarioId, materiaId } = params;

  if (materiaId !== MATERIA_GEOGRAFIA_ID) {
    return resultadoSemConquista();
  }

  try {
    return await concederJoiaMateria({
      supabase,
      usuarioId,
      materiaId: MATERIA_GEOGRAFIA_ID,
    });
  } catch (error) {
    registrarErroDev(
      "Erro ao conceder a Safira ou verificar a Mandala:",
      error
    );

    return resultadoSemConquista();
  }
}