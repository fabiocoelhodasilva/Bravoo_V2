import { cookies } from "next/headers";

/**
 * PARAMETROS PARA SALVAR SESSÃO
 */
type SalvarSessaoParams = {
  atividade_id: string;
  materia_id: string;
  assunto_id?: string | null;
  detalhe_id?: string | null;
  pontuacao: number;
  acertos: number;
  total_itens: number;
  tempo_total_segundos: number;
};

/**
 * SESSÃO SALVA
 */
type SessaoAtividadeSalva = {
  id: string;
  usuario_id: string;
  atividade_id: string;
  materia_id: string;
  assunto_id: string | null;
  detalhe_id: string | null;
  pontuacao: number | null;
  acertos: number | null;
  total_itens: number | null;
  tempo_total_segundos: number | null;
  data_execucao: string;
};

/**
 * RESULTADO DE GAMIFICAÇÃO
 */
type ResultadoGamificacao = {
  streakAtualizado: boolean;
  moedasCreditadas: boolean;
  diasSeguidos: number;
  maiorSequencia: number;
  pontosConsistencia: number;
  moedasGanhas: number;
  motivoStreak:
    | "primeira_atividade"
    | "mesmo_dia"
    | "sequencia_continua"
    | "sequencia_reiniciada";
};

/**
 * RESPOSTA DA API
 */
type SalvarSessaoResponse = {
  ok: boolean;
  data?: {
    sessao: SessaoAtividadeSalva;
    gamificacao: ResultadoGamificacao;
  };
  error?: string;
  details?: string;
};

/**
 * Resolve a URL corretamente para client e server
 */
function getSessoesUrl() {
  // 👉 CLIENTE (browser)
  if (typeof window !== "undefined") {
    return "/api/sessoes";
  }

  // 👉 SERVER (produção)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/api/sessoes`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/sessoes`;
  }

  // 👉 LOCAL fallback
  return "http://localhost:3000/api/sessoes";
}

/**
 * 🔥 CAPTURA OS COOKIES DO USUÁRIO NO SERVER
 */
async function getCookieHeader() {
  // 👉 no client não precisa
  if (typeof window !== "undefined") {
    return "";
  }

  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/**
 * 🔥 SALVAR SESSÃO DE ATIVIDADE
 */
export async function salvarSessaoAtividade(
  params: SalvarSessaoParams
): Promise<SalvarSessaoResponse> {
  const cookieHeader = await getCookieHeader();

  const response = await fetch(getSessoesUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      // 🔥 ESSA LINHA RESOLVE SEU BUG
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const result = (await response.json()) as SalvarSessaoResponse;

  if (!response.ok) {
    console.error("Erro retornado por /api/sessoes:", result);

    throw new Error(
      result?.details || result?.error || "Não foi possível salvar a sessão."
    );
  }

  return result;
}