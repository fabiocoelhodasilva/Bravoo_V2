/* =========================================================
   Tipos
========================================================= */

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

type SalvarSessaoResponse = {
  ok: boolean;
  data?: {
    sessao: SessaoAtividadeSalva;
    gamificacao?: ResultadoGamificacao;
    joiaConquistada?: boolean;
  };
  error?: string;
  details?: string;
};

/* =========================================================
   Constantes
========================================================= */

const EVENTO_JOIA_CONQUISTADA = "bravoo:joia-conquistada";

/* =========================================================
   Funções auxiliares
========================================================= */

/**
 * Resolve a URL corretamente para client e server.
 */
function getSessoesUrl() {
  if (typeof window !== "undefined") {
    return "/api/sessoes";
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/api/sessoes`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/sessoes`;
  }

  return "http://localhost:3000/api/sessoes";
}

/**
 * Registra erros técnicos somente em desenvolvimento.
 */
function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

/**
 * Notifica o dashboard de que uma joia foi conquistada.
 *
 * O dashboard escuta esse evento e recarrega a RPC de resumo,
 * evitando ficar com status antigo da mandala.
 */
function notificarDashboardSobreJoia() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(EVENTO_JOIA_CONQUISTADA));
}

/* =========================================================
   Serviço principal
========================================================= */

export async function salvarSessaoAtividade(
  params: SalvarSessaoParams
): Promise<SalvarSessaoResponse> {
  const response = await fetch(getSessoesUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const result = (await response.json()) as SalvarSessaoResponse;

  if (!response.ok) {
    registrarErroDev("Erro retornado por /api/sessoes:", result);

    throw new Error(
      result?.details || result?.error || "Não foi possível salvar a sessão."
    );
  }

  if (result.data?.joiaConquistada) {
    notificarDashboardSobreJoia();
  }

  return result;
}