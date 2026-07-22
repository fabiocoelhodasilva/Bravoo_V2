"use server";

/* =========================================================
   Imports
========================================================= */

import { processarGamificacaoAposAtividade } from "@/lib/gamificacao/geral/gamificacao-actions";
import {
  concederJoiaMateria,
  removerJoiaMateriaDaData,
} from "@/lib/gamificacao/geral/joia-actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MEU_DIA_ID =
  "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";

/* =========================================================
   Tipos
========================================================= */

type TarefaMeuDiaStatus = {
  tarefa_id: string;
  concluida: boolean;
};

export type ResultadoSincronizacaoJoiaMeuDia = {
  joiaConquistada: boolean;
  joiaRemovida: boolean;
  mandalaConquistada: boolean;
  metaAtingida: boolean;
  totalTarefas: number;
  tarefasConcluidas: number;
  minimoNecessario: number;
};

/* =========================================================
   Regra para concessão da joia
========================================================= */

function calcularMinimoTarefasParaJoia(
  totalTarefas: number
): number {
  if (totalTarefas <= 0) return 0;
  if (totalTarefas === 1) return 1;
  if (totalTarefas === 2) return 1;
  if (totalTarefas <= 5) {
    return Math.ceil(totalTarefas * 0.6);
  }

  if (totalTarefas <= 9) {
    return Math.ceil(totalTarefas * 0.7);
  }

  return Math.ceil(totalTarefas * 0.8);
}

/* =========================================================
   Sincronização da joia do Meu Dia
========================================================= */

export async function sincronizarJoiaMeuDiaPorConclusao(
  dataReferencia: string
): Promise<ResultadoSincronizacaoJoiaMeuDia> {
  const supabase = await getSupabaseServerClient();

  /* =======================================================
     Autenticação
  ======================================================= */

  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();

  if (erroAuth || !user) {
    throw erroAuth ?? new Error("Usuário não autenticado.");
  }

  /* =======================================================
     Busca das tarefas do dia
  ======================================================= */

  const { data, error } = await supabase.rpc(
    "fn_next_meu_dia_status",
    {
      p_usuario_id: user.id,
      p_data: dataReferencia,
    }
  );

  if (error) {
    console.error(
      "Erro ao buscar tarefas para joia Meu Dia:",
      error
    );

    return {
      joiaConquistada: false,
      joiaRemovida: false,
      mandalaConquistada: false,
      metaAtingida: false,
      totalTarefas: 0,
      tarefasConcluidas: 0,
      minimoNecessario: 0,
    };
  }

  /* =======================================================
     Cálculo da meta
  ======================================================= */

  const tarefas = (data ?? []) as TarefaMeuDiaStatus[];

  const totalTarefas = tarefas.length;

  const tarefasConcluidas = tarefas.filter(
    (tarefa) => tarefa.concluida
  ).length;

  const minimoNecessario =
    calcularMinimoTarefasParaJoia(totalTarefas);

  const metaAtingida =
    totalTarefas > 0 &&
    tarefasConcluidas >= minimoNecessario;

  /* =======================================================
     Remoção da joia quando a meta não foi atingida
  ======================================================= */

  if (!metaAtingida) {
    let joiaRemovida = false;

    try {
      joiaRemovida = await removerJoiaMateriaDaData({
        supabase,
        usuarioId: user.id,
        materiaId: MATERIA_MEU_DIA_ID,
        dataReferencia,
      });
    } catch (erroRemocao) {
      console.error(
        "Erro ao remover joia Meu Dia:",
        erroRemocao
      );
    }

    return {
      joiaConquistada: false,
      joiaRemovida,
      mandalaConquistada: false,
      metaAtingida: false,
      totalTarefas,
      tarefasConcluidas,
      minimoNecessario,
    };
  }

  /* =======================================================
     Concessão da joia e verificação da mandala
  ======================================================= */

  let joiaConquistada = false;
  let mandalaConquistada = false;

  try {
    const resultadoRecompensa =
      await concederJoiaMateria({
        supabase,
        usuarioId: user.id,
        materiaId: MATERIA_MEU_DIA_ID,
      });

    joiaConquistada =
      resultadoRecompensa.joiaConquistada;

    mandalaConquistada =
      resultadoRecompensa.mandalaConquistada;
  } catch (erroJoia) {
    console.error(
      "Erro ao conceder joia Meu Dia:",
      erroJoia
    );

    return {
      joiaConquistada: false,
      joiaRemovida: false,
      mandalaConquistada: false,
      metaAtingida: true,
      totalTarefas,
      tarefasConcluidas,
      minimoNecessario,
    };
  }

  /* =======================================================
     Atualização da consistência
  ======================================================= */

  try {
    await processarGamificacaoAposAtividade({
      supabase,
      usuarioId: user.id,
      materiaId: MATERIA_MEU_DIA_ID,
      atividadeId: null,
      sessaoAtividadeId: null,
      dataReferencia,
      pontuacao: tarefasConcluidas,
    });
  } catch (erroGamificacao) {
    console.error(
      "Joia Meu Dia sincronizada, mas houve erro ao atualizar persistência:",
      erroGamificacao
    );
  }

  /* =======================================================
     Resultado
  ======================================================= */

  return {
    joiaConquistada,
    joiaRemovida: false,
    mandalaConquistada,
    metaAtingida: true,
    totalTarefas,
    tarefasConcluidas,
    minimoNecessario,
  };
}