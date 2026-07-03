"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { processarGamificacaoAposAtividade } from "@/lib/gamificacao/geral/gamificacao-actions";

const MATERIA_MEU_DIA_ID = "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";

function calcularMinimoTarefasParaJoia(totalTarefas: number) {
  if (totalTarefas <= 0) return 0;
  if (totalTarefas === 1) return 1;
  if (totalTarefas === 2) return 1;
  if (totalTarefas <= 5) return Math.ceil(totalTarefas * 0.6);
  if (totalTarefas <= 9) return Math.ceil(totalTarefas * 0.7);

  return Math.ceil(totalTarefas * 0.8);
}

function getIntervaloDataReferencia(dataReferencia: string) {
  return {
    inicio: `${dataReferencia} 00:00:00`,
    fim: `${dataReferencia} 23:59:59.999`,
  };
}

async function removerJoiaMeuDiaDaData(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  usuarioId: string,
  dataReferencia: string
) {
  const { inicio, fim } = getIntervaloDataReferencia(dataReferencia);

  const { error } = await supabase
    .from("next_joias_usuario")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("materia_id", MATERIA_MEU_DIA_ID)
    .gte("data_conquista", inicio)
    .lte("data_conquista", fim);

  if (error) {
    console.error("Erro ao remover joia Meu Dia:", error);
  }
}

export async function sincronizarJoiaMeuDiaPorConclusao(dataReferencia: string) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();

  if (erroAuth || !user) {
    throw erroAuth ?? new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabase.rpc("fn_next_meu_dia_status", {
    p_usuario_id: user.id,
    p_data: dataReferencia,
  });

  if (error) {
    console.error("Erro ao buscar tarefas para joia Meu Dia:", error);

    return {
      joiaConquistada: false,
      joiaRemovida: false,
      metaAtingida: false,
      totalTarefas: 0,
      tarefasConcluidas: 0,
      minimoNecessario: 0,
    };
  }

  const tarefas = (data ?? []) as Array<{
    tarefa_id: string;
    concluida: boolean;
  }>;

  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((tarefa) => tarefa.concluida).length;
  const minimoNecessario = calcularMinimoTarefasParaJoia(totalTarefas);

  const metaAtingida =
    totalTarefas > 0 && tarefasConcluidas >= minimoNecessario;

  if (!metaAtingida) {
    await removerJoiaMeuDiaDaData(supabase, user.id, dataReferencia);

    return {
      joiaConquistada: false,
      joiaRemovida: true,
      metaAtingida: false,
      totalTarefas,
      tarefasConcluidas,
      minimoNecessario,
    };
  }

  const { data: joiaConquistada, error: erroJoia } = await supabase.rpc(
    "fn_conceder_joia_materia",
    {
      p_usuario_id: user.id,
      p_materia_id: MATERIA_MEU_DIA_ID,
    }
  );

  if (erroJoia) {
    console.error("Erro ao conceder joia Meu Dia:", erroJoia);

    return {
      joiaConquistada: false,
      joiaRemovida: false,
      metaAtingida: true,
      totalTarefas,
      tarefasConcluidas,
      minimoNecessario,
    };
  }

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

  return {
    joiaConquistada: Boolean(joiaConquistada),
    joiaRemovida: false,
    metaAtingida: true,
    totalTarefas,
    tarefasConcluidas,
    minimoNecessario,
  };
}