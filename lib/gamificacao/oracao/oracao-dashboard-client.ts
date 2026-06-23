import { supabase } from "@/lib/supabase/client";

const MATERIA_ESPIRITUAL_ID =
  "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";

const ATIVIDADE_ORACAO_ID =
  "22222222-2222-2222-2222-222222222100";

const META_PADRAO_ORACAO = 5;

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function getIntervaloHojeLocal() {
  const hoje = new Date();
  const dataLocal = formatarDataLocal(hoje);

  return {
    inicio: `${dataLocal} 00:00:00`,
    fim: `${dataLocal} 23:59:59.999`,
  };
}

function getInicioAnoLocal() {
  const ano = new Date().getFullYear();
  return `${ano}-01-01 00:00:00`;
}

export async function buscarResumoDashboardOracao() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw error ?? new Error("Usuário não identificado.");
  }

  const { inicio, fim } = getIntervaloHojeLocal();

  const [sessoesHoje, sessoesAno, meta, persistencia, joiasEspiritual] =
    await Promise.all([
      supabase
        .from("next_sessoes_atividade")
        .select("tempo_total_segundos")
        .eq("usuario_id", user.id)
        .eq("atividade_id", ATIVIDADE_ORACAO_ID)
        .gte("data_execucao", inicio)
        .lte("data_execucao", fim),

      supabase
        .from("next_sessoes_atividade")
        .select("tempo_total_segundos")
        .eq("usuario_id", user.id)
        .eq("atividade_id", ATIVIDADE_ORACAO_ID)
        .gte("data_execucao", getInicioAnoLocal()),

      supabase
        .from("next_metas_usuario")
        .select("meta_diaria")
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID)
        .maybeSingle(),

      supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos")
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID)
        .maybeSingle(),

      supabase
        .from("next_joias_usuario")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user.id)
        .eq("materia_id", MATERIA_ESPIRITUAL_ID),
    ]);

  const minutosHoje = Math.floor(
    (sessoesHoje.data ?? []).reduce(
      (acc, item) => acc + Number(item.tempo_total_segundos ?? 0),
      0
    ) / 60
  );

  const minutosAno = Math.floor(
    (sessoesAno.data ?? []).reduce(
      (acc, item) => acc + Number(item.tempo_total_segundos ?? 0),
      0
    ) / 60
  );

  return {
    minutosHoje,
    minutosAno,
    metaDiaria: Number(meta.data?.meta_diaria) || META_PADRAO_ORACAO,
    persistenciaDias: Number(persistencia.data?.dias_seguidos) || 0,
    totalJoiasEspiritual: joiasEspiritual.count ?? 0,
  };
}