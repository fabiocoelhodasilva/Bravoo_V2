import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_VIRTUDES_ID =
  "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

/* =========================================================
   Concessão de joia de Virtudes
========================================================= */

/**
 * Concede a joia diária de Virtudes.
 *
 * A regra principal fica na função SQL:
 * fn_conceder_joia_virtude_diaria
 *
 * Esta função apenas:
 * 1. Confere se existe um usuário autenticado.
 * 2. Confere se a matéria recebida é Virtudes.
 * 3. Chama a RPC responsável pela concessão.
 * 4. Retorna true se uma nova joia foi conquistada.
 *
 * Regra atual:
 * - O usuário precisa concluir uma Virtude.
 * - Apenas uma joia de Virtudes pode ser concedida por dia.
 * - A unicidade também é protegida pelo índice do banco.
 */
export async function concederJoiaVirtudeDiaria(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  materiaId: string;
}): Promise<boolean> {
  const { supabase, usuarioId, materiaId } = params;

  if (!usuarioId) {
    return false;
  }

  if (materiaId !== MATERIA_VIRTUDES_ID) {
    return false;
  }

  const { data, error } = await supabase.rpc(
    "fn_conceder_joia_virtude_diaria",
    {
      p_usuario_id: usuarioId,
    },
  );

  if (error) {
    registrarErroDev(
      "Erro ao conceder joia diária de Virtudes:",
      error,
    );

    return false;
  }

  return data === true;
}