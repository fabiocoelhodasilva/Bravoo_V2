"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const MATERIA_ESPIRITUAL_ID =
  "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";

/**
 * Início oficial da nova mecânica do Jardim.
 * Tudo que aconteceu antes desta data é ignorado pelo novo sistema.
 */
const DATA_INICIO_NOVA_REGRA_JARDIM = "2026-09-14";

export type ResumoPontuacaoJardim = {
  pontuacao: number;
  metaCumpridaHoje: boolean;
  dataInicio: string;
  hoje: string;
};

function obterDataSaoPaulo(data: Date): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const get = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function adicionarDiasDataIso(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  data.setUTCDate(data.getUTCDate() + dias);

  return data.toISOString().slice(0, 10);
}

function maiorDataIso(a: string, b: string) {
  return a >= b ? a : b;
}

/**
 * Calcula a pontuação atual do jardim.
 *
 * Fonte de verdade: a joia espiritual diária.
 * Ela já representa que a meta de oração daquele dia foi cumprida.
 * Assim, uma futura alteração da meta não reescreve o passado do jardim.
 *
 * Regras:
 * - começa em 0;
 * - dia anterior com meta cumprida: +1;
 * - dia anterior sem meta cumprida: -1;
 * - nunca fica abaixo de 0;
 * - não existe teto máximo;
 * - hoje, se a meta foi cumprida: +1 imediatamente;
 * - hoje, se ainda não cumpriu: não perde ponto enquanto o dia não acabou.
 *
 * A ordem dos dias importa porque o piso zero é aplicado dia a dia.
 */
export async function buscarPontuacaoJardim(): Promise<ResumoPontuacaoJardim> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    throw new Error("Usuário não identificado.");
  }

  const hoje = obterDataSaoPaulo(new Date());
  const dataCadastro = obterDataSaoPaulo(new Date(user.created_at));
  const dataInicio = maiorDataIso(DATA_INICIO_NOVA_REGRA_JARDIM, dataCadastro);

  if (dataInicio > hoje) {
    return {
      pontuacao: 0,
      metaCumpridaHoje: false,
      dataInicio,
      hoje,
    };
  }

  const inicioConsulta = `${dataInicio}T00:00:00-03:00`;

  const { data: joias, error } = await supabase
    .from("next_joias_usuario")
    .select("data_conquista")
    .eq("usuario_id", user.id)
    .eq("materia_id", MATERIA_ESPIRITUAL_ID)
    .gte("data_conquista", inicioConsulta)
    .order("data_conquista", { ascending: true });

  if (error) {
    console.error("Erro ao calcular pontuação do jardim:", error);
    throw new Error("Não foi possível calcular a pontuação do jardim.");
  }

  const diasComMetaCumprida = new Set<string>();

  for (const joia of joias ?? []) {
    if (!joia.data_conquista) continue;

    const dataLocal = obterDataSaoPaulo(new Date(joia.data_conquista));

    if (dataLocal >= dataInicio && dataLocal <= hoje) {
      diasComMetaCumprida.add(dataLocal);
    }
  }

  let pontuacao = 0;
  let cursor = dataInicio;

  // Processa somente dias já encerrados.
  while (cursor < hoje) {
    if (diasComMetaCumprida.has(cursor)) {
      pontuacao += 1;
    } else {
      pontuacao = Math.max(0, pontuacao - 1);
    }

    cursor = adicionarDiasDataIso(cursor, 1);
  }

  const metaCumpridaHoje = diasComMetaCumprida.has(hoje);

  // Hoje pode somar, mas nunca subtrai antes de terminar.
  if (metaCumpridaHoje) {
    pontuacao += 1;
  }

  return {
    pontuacao,
    metaCumpridaHoje,
    dataInicio,
    hoje,
  };
}
