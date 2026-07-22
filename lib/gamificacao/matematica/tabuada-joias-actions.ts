import type { SupabaseClient } from "@supabase/supabase-js";

import { concederMandalaDiaria } from "@/lib/gamificacao/geral/mandala-actions";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";

/* =========================================================
   Tipos
========================================================= */

export type ResultadoConcessaoJoiaTabuada = {
  joiaConquistada: boolean;
  mandalaConquistada: boolean;
};

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
 * Regra atual da RPC:
 * - Pelo menos 6 tabuadas diferentes no dia.
 * - Cada tabuada precisa ter pelo menos 6 acertos de 9 questões.
 * - A joia só é concedida uma vez por dia para Matemática.
 *
 * Quando uma nova Esmeralda é concedida, também verifica
 * se ela completou a Mandala diária.
 */
export async function concederJoiaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  materiaId: string;
}): Promise<ResultadoConcessaoJoiaTabuada> {
  const { supabase, usuarioId, materiaId } = params;

  if (!usuarioId || materiaId !== MATERIA_MATEMATICA_ID) {
    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  const { data: joiaConquistada, error } = await supabase.rpc(
    "fn_conceder_joia_tabuada_diaria",
    {
      p_usuario_id: usuarioId,
    }
  );

  if (error) {
    registrarErroDev("Erro ao conceder joia de Tabuada:", error);

    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  const foiConquistadaAgora = joiaConquistada === true;

  if (!foiConquistadaAgora) {
    return {
      joiaConquistada: false,
      mandalaConquistada: false,
    };
  }

  try {
    const mandalaConquistada = await concederMandalaDiaria({
      supabase,
      usuarioId,
    });

    return {
      joiaConquistada: true,
      mandalaConquistada,
    };
  } catch (error) {
    registrarErroDev("Esmeralda concedida, mas houve erro ao verificar a Mandala:", error);

    return {
      joiaConquistada: true,
      mandalaConquistada: false,
    };
  }
}