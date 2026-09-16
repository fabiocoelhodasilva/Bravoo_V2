export type PassoJardim = { passo: number; x: number; y: number };
// x/y indicam o CENTRO; todas as medidas sao percentuais da arte integral.
export type AreaJardim = { x: number; y: number; width: number; height: number };
export const JARDINS = [
  { id: "deserto", nome: "Jardim no Deserto", desbloqueio: 0 },
  { id: "flores", nome: "Jardim das Flores", desbloqueio: 11 },
] as const;
export const REQUISITO_FLORES = JARDINS[1].desbloqueio;
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
export const JARDIM_DESERTO_MOBILE: AreaJardim = { x: 50, y: 82.2, width: 72, height: 26 };
export const JARDIM_DESERTO_DESKTOP: AreaJardim = { x: 49, y: 81, width: 44, height: 30 };
export const JARDIM_FLORES_MOBILE: AreaJardim = { x: 50, y: 12, width: 70, height: 22 };
export const JARDIM_FLORES_DESKTOP: AreaJardim = { x: 49.5, y: 12.5, width: 31, height: 24 };
export const CADEADO_FLORES_MOBILE = { x: 50, y: 10.5 };
export const CADEADO_FLORES_DESKTOP = { x: 49.5, y: 10.5 };
const BASE = "/imagens/jardim/cenarios/todos_jardins";
export const MAPA_JARDINS = {
  mobile: { imagem: `${BASE}/Todos_jardins_celular_v1.png`, width: 941, height: 1672,
    passos: PASSOS_DESERTO_FLORES_MOBILE, deserto: JARDIM_DESERTO_MOBILE,
    flores: JARDIM_FLORES_MOBILE, cadeado: CADEADO_FLORES_MOBILE },
  desktop: { imagem: `${BASE}/Todos_jardins_paisagem_v1.png`, width: 1672, height: 941,
    passos: PASSOS_DESERTO_FLORES_DESKTOP, deserto: JARDIM_DESERTO_DESKTOP,
    flores: JARDIM_FLORES_DESKTOP, cadeado: CADEADO_FLORES_DESKTOP },
};
export function getProgressoCaminhada(pontuacao: number) {
  return Math.min(REQUISITO_FLORES, Math.max(0, Math.floor(Number.isFinite(pontuacao) ? pontuacao : 0)));
}
