/* =========================================================
   Regras da meta diária de Tabuada
========================================================= */

export const TABUADA_TOTAL_QUESTOES = 9;
export const TABUADA_MINIMO_ACERTOS = 6;

/*
 * Mantido apenas como compatibilidade para usuários que ainda
 * não possuem uma meta personalizada cadastrada no banco.
 */
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

/**
 * Regra nova: todas as tabuadas escolhidas para a meta precisam
 * ter sido concluídas com o mínimo de acertos exigido.
 */
export function todasTabuadasDaMetaConcluidas(params: {
  tabuadasMeta: number[];
  tabuadasConcluidas: number[];
}) {
  const meta = Array.from(new Set(params.tabuadasMeta));
  const concluidas = new Set(params.tabuadasConcluidas);

  return meta.length > 0 && meta.every((tabuada) => concluidas.has(tabuada));
}

/**
 * Compatibilidade com a regra antiga enquanto existirem usuários
 * sem configuração personalizada.
 */
export function atingiuMetaDiariaTabuada(quantidadeTabuadasValidas: number) {
  return quantidadeTabuadasValidas >= TABUADA_MINIMO_TABUADAS_VALIDAS;
}
