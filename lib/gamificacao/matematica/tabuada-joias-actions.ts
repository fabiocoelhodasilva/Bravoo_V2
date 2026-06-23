import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

/* =========================================================
   Concessão de joia de Tabuada
========================================================= */

/**
 * Concede a joia diária de Tabuada.
 *
 * A regra principal fica na função SQL:
 * fn_conceder_joia_tabuada_diaria
 *
 * Esta função apenas:
 * 1. Confere se a matéria recebida é Matemática.
 * 2. Chama a RPC responsável pela concessão.
 * 3. Retorna true se uma nova joia foi conquistada.
 *
 * Regra atual da RPC:
 * - Pelo menos 6 tabuadas diferentes no dia.
 * - Cada tabuada precisa ter pelo menos 6 acertos de 9 questões.
 * - A joia só é concedida uma vez por dia para Matemática.
 */
export async function concederJoiaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  materiaId: string;
}): Promise<boolean> {
  const { supabase, usuarioId, materiaId } = params;

  if (!usuarioId) {
    return false;
  }

  if (materiaId !== MATERIA_MATEMATICA_ID) {
    return false;
  }

  const { data, error } = await supabase.rpc(
    "fn_conceder_joia_tabuada_diaria",
    {
      p_usuario_id: usuarioId,
    }
  );

  if (error) {
    registrarErroDev("Erro ao conceder joia de Tabuada:", error);
    return false;
  }

  return data === true;
}