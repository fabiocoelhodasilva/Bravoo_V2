import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";

export const META_TABUADA_PADRAO = [2, 3, 4, 5, 6, 7];

/* =========================================================
   Tipos
========================================================= */

export type ResultadoConcessaoJoiaTabuada = {
  joiaConquistada: boolean;
  mandalaConquistada: boolean;
};

export type ResultadoSincronizacaoJoiaTabuada = {
  metaConfigurada: boolean;
  tabuadasMeta: number[];
  tabuadasValidas: number[];
  metaAtingida: boolean;
  joiaAtiva: boolean;
  joiaConquistada: boolean;
  joiaRemovida: boolean;
  mandalaConquistada: boolean;
  mandalaRemovida: boolean;
};

export type MetaTabuadaAtual = {
  configurada: boolean;
  tabuadas: number[];
};

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function normalizarListaTabuadas(valor: unknown): number[] {
  if (!Array.isArray(valor)) return [];

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (numero) =>
            Number.isInteger(numero) &&
            numero >= 2 &&
            numero <= 9
        )
    )
  ).sort((a, b) => a - b);
}

function primeiraLinhaRpc<T>(data: T | T[] | null | undefined): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

async function sincronizarMandalaDiaria(params: {
  supabase: SupabaseClient;
  usuarioId: string;
}) {
  const { supabase, usuarioId } = params;

  const { data, error } = await supabase.rpc(
    "fn_sincronizar_mandala_diaria",
    {
      p_usuario_id: usuarioId,
    }
  );

  if (error) {
    throw new Error(`Erro ao sincronizar Mandala: ${error.message}`);
  }

  const registro = primeiraLinhaRpc<any>(data);

  return {
    mandalaConquistada: registro?.mandala_criada === true,
    mandalaRemovida: registro?.mandala_removida === true,
  };
}

/* =========================================================
   Leitura da meta atual
========================================================= */

export async function buscarMetaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
}): Promise<MetaTabuadaAtual> {
  const { supabase, usuarioId } = params;

  if (!usuarioId) {
    return {
      configurada: false,
      tabuadas: [...META_TABUADA_PADRAO],
    };
  }

  const { data, error } = await supabase
    .from("next_metas_usuario")
    .select("configuracao")
    .eq("usuario_id", usuarioId)
    .eq("materia_id", MATERIA_MATEMATICA_ID)
    .maybeSingle();

  if (error) {
    registrarErroDev("Erro ao buscar meta da Tabuada:", error);

    return {
      configurada: false,
      tabuadas: [...META_TABUADA_PADRAO],
    };
  }

  const configuracao = data?.configuracao as
    | { tabuada?: { numeros?: unknown } }
    | null
    | undefined;

  const tabuadas = normalizarListaTabuadas(
    configuracao?.tabuada?.numeros
  );

  if (tabuadas.length === 0) {
    return {
      configurada: false,
      tabuadas: [...META_TABUADA_PADRAO],
    };
  }

  return {
    configurada: true,
    tabuadas,
  };
}

/* =========================================================
   Sincronização da Esmeralda de Tabuada
========================================================= */

export async function sincronizarJoiaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  materiaId: string;
}): Promise<ResultadoSincronizacaoJoiaTabuada> {
  const { supabase, usuarioId, materiaId } = params;

  if (!usuarioId || materiaId !== MATERIA_MATEMATICA_ID) {
    return {
      metaConfigurada: false,
      tabuadasMeta: [],
      tabuadasValidas: [],
      metaAtingida: false,
      joiaAtiva: false,
      joiaConquistada: false,
      joiaRemovida: false,
      mandalaConquistada: false,
      mandalaRemovida: false,
    };
  }

  const { data, error } = await supabase.rpc(
    "fn_sincronizar_joia_tabuada_diaria",
    {
      p_usuario_id: usuarioId,
    }
  );

  if (error) {
    registrarErroDev("Erro ao sincronizar Esmeralda da Tabuada:", error);

    return {
      metaConfigurada: false,
      tabuadasMeta: [],
      tabuadasValidas: [],
      metaAtingida: false,
      joiaAtiva: false,
      joiaConquistada: false,
      joiaRemovida: false,
      mandalaConquistada: false,
      mandalaRemovida: false,
    };
  }

  const registro = primeiraLinhaRpc<any>(data);

  const metaConfigurada = registro?.meta_configurada === true;
  const tabuadasMeta = normalizarListaTabuadas(registro?.tabuadas_meta);
  const tabuadasValidas = normalizarListaTabuadas(registro?.tabuadas_validas);
  const metaAtingida = registro?.meta_atingida === true;
  const joiaAtiva = registro?.joia_ativa === true;
  const joiaConquistada = registro?.joia_criada === true;
  const joiaRemovida = registro?.joia_removida === true;

  try {
    const mandala = await sincronizarMandalaDiaria({
      supabase,
      usuarioId,
    });

    return {
      metaConfigurada,
      tabuadasMeta,
      tabuadasValidas,
      metaAtingida,
      joiaAtiva,
      joiaConquistada,
      joiaRemovida,
      mandalaConquistada: mandala.mandalaConquistada,
      mandalaRemovida: mandala.mandalaRemovida,
    };
  } catch (error) {
    registrarErroDev(
      "Esmeralda sincronizada, mas houve erro ao sincronizar a Mandala:",
      error
    );

    return {
      metaConfigurada,
      tabuadasMeta,
      tabuadasValidas,
      metaAtingida,
      joiaAtiva,
      joiaConquistada,
      joiaRemovida,
      mandalaConquistada: false,
      mandalaRemovida: false,
    };
  }
}

/* =========================================================
   Compatibilidade com o fluxo central de sessões
========================================================= */

/**
 * Mantém o mesmo contrato usado pelo serviço central de sessões.
 * Agora, em vez da regra fixa de 6 tabuadas, a função sincroniza
 * a Esmeralda com a meta personalizada do usuário.
 */
export async function concederJoiaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  materiaId: string;
}): Promise<ResultadoConcessaoJoiaTabuada> {
  const resultado = await sincronizarJoiaTabuada(params);

  return {
    joiaConquistada: resultado.joiaConquistada,
    mandalaConquistada: resultado.mandalaConquistada,
  };
}

/* =========================================================
   Alteração imediata da meta da Tabuada
========================================================= */

export async function alterarMetaTabuada(params: {
  supabase: SupabaseClient;
  usuarioId: string | null | undefined;
  tabuadas: number[];
}): Promise<ResultadoSincronizacaoJoiaTabuada> {
  const { supabase, usuarioId } = params;
  const tabuadas = normalizarListaTabuadas(params.tabuadas);

  if (!usuarioId) {
    throw new Error("Usuário não identificado.");
  }

  if (tabuadas.length === 0) {
    throw new Error("Selecione pelo menos uma tabuada.");
  }

  const { data, error } = await supabase.rpc(
    "fn_alterar_meta_tabuada",
    {
      p_tabuadas: tabuadas,
    }
  );

  if (error) {
    throw new Error(`Erro ao alterar meta da Tabuada: ${error.message}`);
  }

  const alteracao = primeiraLinhaRpc<any>(data);
  const tabuadasSalvas = normalizarListaTabuadas(alteracao?.tabuadas);

  const sincronizacao = await sincronizarJoiaTabuada({
    supabase,
    usuarioId,
    materiaId: MATERIA_MATEMATICA_ID,
  });

  return {
    ...sincronizacao,
    metaConfigurada: true,
    tabuadasMeta:
      tabuadasSalvas.length > 0 ? tabuadasSalvas : tabuadas,
  };
}
