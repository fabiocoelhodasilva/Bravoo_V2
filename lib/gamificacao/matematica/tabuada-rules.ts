/* =========================================================
   Regras da meta diária de Tabuada
========================================================= */

export const TABUADA_TOTAL_QUESTOES = 9;
export const TABUADA_MINIMO_ACERTOS = 6;
export const TABUADA_MINIMO_TABUADAS_VALIDAS = 6;

export function tabuadaAtingiuPercentualMinimo(params: {
  acertos: number | null;
  totalItens: number | null;
}) {
  const acertos = params.acertos ?? 0;
  const totalItens = params.totalItens ?? 0;

  return (
    totalItens >= TABUADA_TOTAL_QUESTOES &&
    acertos >= TABUADA_MINIMO_ACERTOS
  );
}

export function atingiuMetaDiariaTabuada(quantidadeTabuadasValidas: number) {
  return quantidadeTabuadasValidas >= TABUADA_MINIMO_TABUADAS_VALIDAS;
}