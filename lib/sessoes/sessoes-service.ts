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
    gamificacao: ResultadoGamificacao;
  };
  error?: string;
  details?: string;
};

export async function salvarSessaoAtividade(
  params: SalvarSessaoParams
): Promise<SalvarSessaoResponse> {
  const response = await fetch("/api/sessoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
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