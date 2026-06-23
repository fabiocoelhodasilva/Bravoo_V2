import type { SupabaseClient } from "@supabase/supabase-js";

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

/* =========================================================
   Concessão de joia de Geografia
========================================================= */

/**
 * Concede a joia diária da matéria Geografia.
 *
 * A regra principal fica na função SQL:
 * fn_conceder_joia_materia
 *
 * Esta função apenas:
 * 1. Confere se a matéria recebida é Geografia.
 * 2. Chama a RPC responsável pela concessão.
 * 3. Retorna true se uma nova joia foi conquistada.
 */
export async function concederJoiaGeografia(params: {
  supabase: SupabaseClient;
  usuarioId: string;
  materiaId: string;
}): Promise<boolean> {
  const { supabase, usuarioId, materiaId } = params;

  if (materiaId !== MATERIA_GEOGRAFIA_ID) {
    return false;
  }

  const { data, error } = await supabase.rpc("fn_conceder_joia_materia", {
    p_usuario_id: usuarioId,
    p_materia_id: materiaId,
  });

  if (error) {
    registrarErroDev("Erro ao conceder joia de Geografia:", error);
    return false;
  }

  return Boolean(data);
}