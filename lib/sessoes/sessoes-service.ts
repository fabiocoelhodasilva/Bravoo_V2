type SalvarSessaoParams = {
  atividade_id: string;
  materia_id: string;
  assunto_id: string;
  detalhe_id: string;
  pontuacao: number;
  acertos: number;
  total_itens: number;
  tempo_total_segundos: number;
};

type SalvarSessaoResponse = {
  ok: boolean;
  error?: string;
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

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || "Não foi possível salvar a sessão.");
  }

  return result;
}