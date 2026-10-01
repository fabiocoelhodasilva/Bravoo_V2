export type PassoJardim = {
  passo: number;
  x: number;
  y: number;
};

// x/y indicam o CENTRO; todas as medidas são percentuais da arte integral.
export type AreaJardim = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type JardimAtualId = "deserto" | "flores";

/* =========================================================
   CONFIGURAÇÃO DOS JARDINS
   ========================================================= */

export const JARDINS = [
  {
    id: "deserto",
    nome: "Jardim no Deserto",
    inicio: 0,
    totalPassos: 11,
  },
  {
    id: "flores",
    nome: "Jardim das Flores",
    inicio: 12,
    totalPassos: 8,
  },
] as const;

/**
 * O Jardim das Flores começa SOMENTE depois que o usuário
 * completar os 11 passos do Jardim do Deserto.
 *
 * Portanto:
 * 11 pontos = Deserto 11/11
 * 12 pontos = Flores 1/8
 */
export const INICIO_JARDIM_FLORES = 12;

/**
 * Mantido por compatibilidade com o componente do mapa.
 *
 * Representa quantos passos existem no Jardim do Deserto.
 */
export const REQUISITO_FLORES = 11;

/* =========================================================
   CAMINHO ENTRE DESERTO E FLORES
   ========================================================= */

export const PASSOS_DESERTO_FLORES_MOBILE: PassoJardim[] = [
  { passo: 1, x: 47.0, y: 66.7 },
  { passo: 2, x: 53.2, y: 62.4 },
  { passo: 3, x: 49.4, y: 57.7 },
  { passo: 4, x: 55.7, y: 52.9 },
  { passo: 5, x: 50.0, y: 48.7 },
  { passo: 6, x: 57.1, y: 45.1 },
  { passo: 7, x: 54.2, y: 41.6 },
  { passo: 8, x: 48.4, y: 37.7 },
  { passo: 9, x: 54.9, y: 33.2 },
  { passo: 10, x: 49.8, y: 29.9 },
  { passo: 11, x: 56.2, y: 26.2 },
];

export const PASSOS_DESERTO_FLORES_DESKTOP: PassoJardim[] = [
  { passo: 1, x: 48.4, y: 62.6 },
  { passo: 2, x: 52.2, y: 58.3 },
  { passo: 3, x: 49.4, y: 54.5 },
  { passo: 4, x: 53.1, y: 49.1 },
  { passo: 5, x: 51.8, y: 46.5 },
  { passo: 6, x: 48.4, y: 42.1 },
  { passo: 7, x: 50.6, y: 37.0 },
  { passo: 8, x: 48.9, y: 33.3 },
  { passo: 9, x: 51.4, y: 29.3 },
  { passo: 10, x: 50.5, y: 27.1 },
  { passo: 11, x: 49.0, y: 25.4 },
];

/* =========================================================
   ÁREAS DOS JARDINS NO MAPA
   ========================================================= */

export const JARDIM_DESERTO_MOBILE: AreaJardim = {
  x: 50,
  y: 82.2,
  width: 72,
  height: 26,
};

export const JARDIM_DESERTO_DESKTOP: AreaJardim = {
  x: 49,
  y: 81,
  width: 44,
  height: 30,
};

/**
 * Coordenadas-base do Jardim das Flores.
 *
 * O ajuste fino do halo ainda será feito no JardinsMapaPanel,
 * porque vimos pela imagem que ele está alto demais.
 */
export const JARDIM_FLORES_MOBILE: AreaJardim = {
  x: 50,
  y: 12,
  width: 70,
  height: 22,
};

export const JARDIM_FLORES_DESKTOP: AreaJardim = {
  x: 49.5,
  y: 12.5,
  width: 31,
  height: 24,
};

export const CADEADO_FLORES_MOBILE = {
  x: 50,
  y: 10.5,
};

export const CADEADO_FLORES_DESKTOP = {
  x: 49.5,
  y: 10.5,
};

/* =========================================================
   IMAGEM DO MAPA
   ========================================================= */

const BASE = "/imagens/jardim/cenarios/todos_jardins";

export const MAPA_JARDINS = {
  mobile: {
    imagem: `${BASE}/Todos_jardins_celular_v1.png`,
    width: 941,
    height: 1672,
    passos: PASSOS_DESERTO_FLORES_MOBILE,
    deserto: JARDIM_DESERTO_MOBILE,
    flores: JARDIM_FLORES_MOBILE,
    cadeado: CADEADO_FLORES_MOBILE,
  },

  desktop: {
    imagem: `${BASE}/Todos_jardins_paisagem_v1.png`,
    width: 1672,
    height: 941,
    passos: PASSOS_DESERTO_FLORES_DESKTOP,
    deserto: JARDIM_DESERTO_DESKTOP,
    flores: JARDIM_FLORES_DESKTOP,
    cadeado: CADEADO_FLORES_DESKTOP,
  },
};

/* =========================================================
   PROGRESSÃO DA JORNADA
   ========================================================= */

/**
 * Retorna a pontuação inteira e segura.
 *
 * Não limita mais em 11.
 * A pontuação real pode continuar crescendo indefinidamente.
 */
export function getPontuacaoSegura(pontuacao: number) {
  if (!Number.isFinite(pontuacao)) return 0;

  return Math.max(0, Math.floor(pontuacao));
}

/**
 * Mantida por compatibilidade com o mapa.
 *
 * Representa o progresso do caminho Deserto -> Flores.
 * Somente essa visualização continua limitada em 11.
 */
export function getProgressoCaminhada(pontuacao: number) {
  return Math.min(
    REQUISITO_FLORES,
    getPontuacaoSegura(pontuacao),
  );
}

/**
 * Descobre em qual jardim o usuário está atualmente.
 *
 * 0..11  -> Jardim do Deserto
 * 12+    -> Jardim das Flores
 *
 * Enquanto o Jardim 3 não existir, o usuário permanece
 * no Jardim das Flores independentemente da pontuação.
 */
export function getJardimAtual(
  pontuacao: number,
): JardimAtualId {
  const pontos = getPontuacaoSegura(pontuacao);

  return pontos <= REQUISITO_FLORES
    ? "deserto"
    : "flores";
}

/**
 * Retorna o progresso DENTRO do jardim atual.
 *
 * Exemplos:
 *
 * 0  -> Deserto 0/11
 * 5  -> Deserto 5/11
 * 11 -> Deserto 11/11
 *
 * 12 -> Flores 1/8
 * 13 -> Flores 2/8
 * 19 -> Flores 8/8
 * 20 -> Flores 9/8
 * 21 -> Flores 10/8
 */
export function getProgressoNoJardim(
  pontuacao: number,
) {
  const pontos = getPontuacaoSegura(pontuacao);

  if (pontos <= REQUISITO_FLORES) {
    return pontos;
  }

  return pontos - REQUISITO_FLORES;
}

/**
 * Retorna o total oficial de passos do jardim atual.
 *
 * Mesmo quando o usuário ultrapassa esse valor,
 * o total continua sendo exibido:
 *
 * Flores:
 * 8/8
 * 9/8
 * 10/8
 * ...
 */
export function getTotalPassosJardim(
  jardimId: JardimAtualId,
) {
  return jardimId === "deserto"
    ? 11
    : 8;
}

/**
 * Estado completo da jornada.
 *
 * Centralizamos aqui para que GardenScene e mapa não
 * criem regras diferentes entre si.
 */
export function getEstadoJornadaJardim(
  pontuacao: number,
) {
  const pontos = getPontuacaoSegura(pontuacao);
  const jardimAtual = getJardimAtual(pontos);
  const progressoNoJardim =
    getProgressoNoJardim(pontos);
  const totalPassos =
    getTotalPassosJardim(jardimAtual);

  return {
    pontuacaoTotal: pontos,
    jardimAtual,
    progressoNoJardim,
    totalPassos,
  };
}