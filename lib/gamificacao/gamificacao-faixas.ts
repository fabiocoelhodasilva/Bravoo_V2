import type { FaixaGamificacao, ProgressoFaixa } from "./gamificacao-types";

/**
 * Tabela oficial de classificação por faixa.
 * Base atual: dias seguidos na matéria.
 *
 * Ajuste aqui caso você queira mudar os intervalos no futuro.
 */
export const FAIXAS_GAMIFICACAO: FaixaGamificacao[] = [
  {
    id: "faixa-branca",
    nome: "Faixa Branca",
    ordem: 1,
    cor: "#f5f5f5",
    diasMinimos: 0,
    diasMaximos: 6,
  },
  {
    id: "faixa-cinza",
    nome: "Faixa Cinza",
    ordem: 2,
    cor: "#9e9e9e",
    diasMinimos: 7,
    diasMaximos: 13,
  },
  {
    id: "faixa-amarela",
    nome: "Faixa Amarela",
    ordem: 3,
    cor: "#f1c40f",
    diasMinimos: 14,
    diasMaximos: 29,
  },
  {
    id: "faixa-laranja",
    nome: "Faixa Laranja",
    ordem: 4,
    cor: "#e67e22",
    diasMinimos: 30,
    diasMaximos: 59,
  },
  {
    id: "faixa-verde",
    nome: "Faixa Verde",
    ordem: 5,
    cor: "#27ae60",
    diasMinimos: 60,
    diasMaximos: 89,
  },
  {
    id: "faixa-azul",
    nome: "Faixa Azul",
    ordem: 6,
    cor: "#2980b9",
    diasMinimos: 90,
    diasMaximos: 119,
  },
  {
    id: "faixa-roxa",
    nome: "Faixa Roxa",
    ordem: 7,
    cor: "#8e44ad",
    diasMinimos: 120,
    diasMaximos: 179,
  },
  {
    id: "faixa-marrom",
    nome: "Faixa Marrom",
    ordem: 8,
    cor: "#6e3b1e",
    diasMinimos: 180,
    diasMaximos: 239,
  },
  {
    id: "faixa-preta",
    nome: "Faixa Preta",
    ordem: 9,
    cor: "#111111",
    diasMinimos: 240,
    diasMaximos: null,
  },
];

/**
 * Garante que o valor nunca seja negativo e remove decimais.
 */
function normalizarValor(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.max(0, Math.floor(valor));
}

/**
 * Retorna todas as faixas ordenadas.
 */
export function listarFaixas(): FaixaGamificacao[] {
  return [...FAIXAS_GAMIFICACAO].sort((a, b) => a.ordem - b.ordem);
}

/**
 * Monta o texto do intervalo da faixa.
 */
export function obterTextoIntervaloFaixa(faixa: FaixaGamificacao): string {
  if (faixa.diasMaximos === null) {
    return `${faixa.diasMinimos}+ dias`;
  }

  if (faixa.diasMinimos === faixa.diasMaximos) {
    return `${faixa.diasMinimos} dia`;
  }

  return `${faixa.diasMinimos} a ${faixa.diasMaximos} dias`;
}

/**
 * Retorna a faixa correspondente ao valor atual de dias.
 */
export function obterFaixaAtual(diasSeguidos: number): FaixaGamificacao {
  const valor = normalizarValor(diasSeguidos);
  const faixas = listarFaixas();

  for (const faixa of faixas) {
    const atingiuMinimo = valor >= faixa.diasMinimos;
    const dentroDoMaximo =
      faixa.diasMaximos === null || valor <= faixa.diasMaximos;

    if (atingiuMinimo && dentroDoMaximo) {
      return faixa;
    }
  }

  return faixas[0];
}

/**
 * Retorna a próxima faixa, se existir.
 * Para faixa preta, retorna null.
 */
export function obterProximaFaixa(
  diasSeguidos: number
): FaixaGamificacao | null {
  const faixaAtual = obterFaixaAtual(diasSeguidos);
  const faixas = listarFaixas();

  const indiceAtual = faixas.findIndex((faixa) => faixa.id === faixaAtual.id);

  if (indiceAtual < 0 || indiceAtual === faixas.length - 1) {
    return null;
  }

  return faixas[indiceAtual + 1];
}

/**
 * Calcula o percentual de progresso dentro da faixa atual.
 *
 * Exemplo:
 * Faixa Branca = 0 a 6
 * Se o usuário está com 3 dias, ele está no meio da faixa.
 *
 * Para a última faixa (sem máximo), retorna 100.
 */
export function calcularPercentualProgressoFaixa(
  diasSeguidos: number
): number {
  const valor = normalizarValor(diasSeguidos);
  const faixaAtual = obterFaixaAtual(valor);

  if (faixaAtual.diasMaximos === null) {
    return 100;
  }

  const inicio = faixaAtual.diasMinimos;
  const fim = faixaAtual.diasMaximos;
  const tamanhoDaFaixa = fim - inicio + 1;

  if (tamanhoDaFaixa <= 0) {
    return 0;
  }

  const posicaoDentroDaFaixa = valor - inicio + 1;
  const percentual = (posicaoDentroDaFaixa / tamanhoDaFaixa) * 100;

  return Math.max(0, Math.min(100, Math.round(percentual)));
}

/**
 * Retorna o valor mínimo visível da faixa atual.
 */
export function obterValorMinimoFaixaAtual(diasSeguidos: number): number {
  return obterFaixaAtual(diasSeguidos).diasMinimos;
}

/**
 * Retorna o valor máximo visível da faixa atual.
 * Para a última faixa, retorna null.
 */
export function obterValorMaximoFaixaAtual(
  diasSeguidos: number
): number | null {
  return obterFaixaAtual(diasSeguidos).diasMaximos;
}

/**
 * Retorna o texto curto do intervalo da faixa atual.
 *
 * Exemplo:
 * "0 a 6 dias"
 * "240+ dias"
 */
export function obterTextoIntervaloFaixaAtual(diasSeguidos: number): string {
  const faixaAtual = obterFaixaAtual(diasSeguidos);
  return obterTextoIntervaloFaixa(faixaAtual);
}

/**
 * Calcula quantos dias faltam para a próxima faixa.
 * Se já estiver na última faixa, retorna 0.
 */
export function obterDiasParaProximaFaixa(diasSeguidos: number): number {
  const valor = normalizarValor(diasSeguidos);
  const proximaFaixa = obterProximaFaixa(valor);

  if (!proximaFaixa) {
    return 0;
  }

  return Math.max(0, proximaFaixa.diasMinimos - valor);
}

/**
 * Monta um objeto completo de progresso da faixa,
 * pronto para alimentar a interface.
 */
export function calcularProgressoFaixa(
  diasSeguidos: number
): ProgressoFaixa {
  const valorAtual = normalizarValor(diasSeguidos);
  const faixaAtual = obterFaixaAtual(valorAtual);
  const proximaFaixa = obterProximaFaixa(valorAtual);
  const percentualProgresso = calcularPercentualProgressoFaixa(valorAtual);

  return {
    faixaAtual,
    proximaFaixa,
    valorAtual,
    valorMinimoFaixa: faixaAtual.diasMinimos,
    valorMaximoFaixa: faixaAtual.diasMaximos,
    percentualProgresso,
    textoIntervalo: obterTextoIntervaloFaixa(faixaAtual),
  };
}

/**
 * Retorna a classe/tom de faixa em formato simples
 * para ajudar na UI, caso você queira mapear depois.
 */
export function obterCorFaixaAtual(diasSeguidos: number): string {
  return obterFaixaAtual(diasSeguidos).cor;
}