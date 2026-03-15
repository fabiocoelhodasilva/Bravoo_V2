import type {
  Objetivo,
  ObjetivosGrupo,
  ObjetivosMetricas,
  RankingCategoria,
} from "@/types/objetivos";
import {
  BRAVOO_COLORS,
  CATEGORY_COLOR_FALLBACK,
  CATEGORY_ORDER_FALLBACK,
} from "./objetivos.constants";

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function clampProgress(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function getCategoriaOrder(nome?: string | null, ordem?: number | null) {
  if (typeof ordem === "number") return ordem;

  const normalized = normalizeText(nome);
  return CATEGORY_ORDER_FALLBACK[normalized] ?? 999;
}

export function getCategoriaColor(nome?: string | null, cor?: string | null) {
  if (cor) return cor;

  const normalized = normalizeText(nome);
  return CATEGORY_COLOR_FALLBACK[normalized] ?? "#7a7a7a";
}

export function calcularMetricas(objetivos: Objetivo[]): ObjetivosMetricas {
  const total = objetivos.length;

  if (total === 0) {
    return { total: 0, concluidos: 0, media: 0 };
  }

  const soma = objetivos.reduce(
    (acc, item) => acc + clampProgress(item.progresso_percentual),
    0
  );

  const concluidos = objetivos.filter(
    (item) => clampProgress(item.progresso_percentual) >= 100
  ).length;

  return {
    total,
    concluidos,
    media: Math.round(soma / total),
  };
}

export function calcularRankingCategorias(objetivos: Objetivo[]): RankingCategoria[] {
  const map = new Map<
    string,
    {
      id: string;
      nome: string;
      cor: string;
      ordem: number;
      objetivos: Objetivo[];
    }
  >();

  for (const objetivo of objetivos) {
    const categoria = objetivo.objetivos_categoria;
    const id = categoria?.id ?? "sem-categoria";
    const nome = categoria?.nome ?? "Sem categoria";
    const cor = getCategoriaColor(categoria?.nome, categoria?.cor);
    const ordem = getCategoriaOrder(categoria?.nome, categoria?.ordem);

    if (!map.has(id)) {
      map.set(id, { id, nome, cor, ordem, objetivos: [] });
    }

    map.get(id)!.objetivos.push(objetivo);
  }

  return Array.from(map.values())
    .map((item) => ({
      id: item.id,
      nome: item.nome,
      cor: item.cor,
      ordem: item.ordem,
      media: calcularMetricas(item.objetivos).media,
    }))
    .sort((a, b) => {
      if (b.media !== a.media) return b.media - a.media;
      if (a.ordem !== b.ordem) return a.ordem - b.ordem;
      return a.nome.localeCompare(b.nome);
    });
}

export function agruparObjetivosPorCategoria(objetivos: Objetivo[]): ObjetivosGrupo[] {
  const map = new Map<ObjetivosGrupo["key"], ObjetivosGrupo>();

  for (const objetivo of objetivos) {
    const categoria = objetivo.objetivos_categoria;
    const key = categoria?.id ?? "sem-categoria";
    const nome = categoria?.nome ?? "Sem categoria";
    const cor = getCategoriaColor(categoria?.nome, categoria?.cor);
    const ordem = getCategoriaOrder(categoria?.nome, categoria?.ordem);

    if (!map.has(key)) {
      map.set(key, {
        key,
        categoria: {
          id: categoria?.id ?? null,
          nome,
          cor,
          ordem,
        },
        objetivos: [],
        metricas: { total: 0, concluidos: 0, media: 0 },
      });
    }

    map.get(key)!.objetivos.push(objetivo);
  }

  const grupos = Array.from(map.values()).map((grupo) => ({
    ...grupo,
    metricas: calcularMetricas(grupo.objetivos),
  }));

  grupos.sort((a, b) => {
    if (a.categoria.ordem !== b.categoria.ordem) {
      return a.categoria.ordem - b.categoria.ordem;
    }
    return a.categoria.nome.localeCompare(b.categoria.nome);
  });

  return grupos;
}

export function getObjetivosPageCssVars() {
  return {
    "--color-1": BRAVOO_COLORS.color1,
    "--color-2": BRAVOO_COLORS.color2,
    "--color-3": BRAVOO_COLORS.color3,
    "--color-4": BRAVOO_COLORS.color4,
    "--color-5": BRAVOO_COLORS.color5,
    "--color-6": BRAVOO_COLORS.color6,
    "--color-7": BRAVOO_COLORS.color7,
  } as React.CSSProperties;
}