import type { Categoria, CategoriaSlug, Metricas, Objetivo, RankingItem } from "./objetivos-types";

export function normalizarTexto(str: string | null | undefined): string {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function corCategoria(cat: Categoria | null | undefined): string {
  const nome = normalizarTexto(cat?.nome) as CategoriaSlug;
  if (nome === "corpo e saude") return "#c94a4a";
  if (nome === "espiritual") return "#5dc6a1";
  if (nome === "mente e estudos") return "#ff8c42";
  if (nome === "organizacao e rotina" || nome === "organizacao e rotinas") return "#3d7a99";
  if (nome === "familia e relacionamentos" || nome === "familia e relacionamento") return "#a35bdc";
  return "#bdbdbd";
}

export function classeCategoria(cat: Categoria | null | undefined): string {
  const nome = normalizarTexto(cat?.nome);
  if (nome === "corpo e saude") return "cat-corpo-saude";
  if (nome === "espiritual") return "cat-espiritual";
  if (nome === "mente e estudos") return "cat-mente-estudos";
  if (nome === "organizacao e rotina" || nome === "organizacao e rotinas") return "cat-organizacao-rotinas";
  if (nome === "familia e relacionamentos" || nome === "familia e relacionamento") return "cat-familia-relacionamentos";
  return "cat-default";
}

export function ordemCategoria(cat: { nome: string } | null | undefined): number {
  const nome = normalizarTexto(cat?.nome);
  if (nome === "espiritual") return 1;
  if (nome === "familia e relacionamentos" || nome === "familia e relacionamento") return 2;
  if (nome === "corpo e saude") return 3;
  if (nome === "mente e estudos") return 4;
  if (nome === "organizacao e rotina" || nome === "organizacao e rotinas") return 5;
  return 999;
}

export function calcularMetricas(items: Objetivo[]): Metricas {
  const total = items.length;
  if (total === 0) return { total: 0, concluidos: 0, media: 0 };
  const soma = items.reduce((acc, o) => acc + (Number(o.progresso_percentual) || 0), 0);
  const concluidos = items.filter((o) => (Number(o.progresso_percentual) || 0) >= 100).length;
  return { total, concluidos, media: Math.round(soma / total) };
}

export function calcularRankingCategorias(objetivos: Objetivo[]): RankingItem[] {
  const map = new Map<string, { nome: string; cor: string; items: Objetivo[] }>();
  objetivos.forEach((o) => {
    const cat = o.objetivos_categoria ?? null;
    const nome = cat?.nome ?? "Sem categoria";
    const key = cat?.id ?? "sem_categoria";
    if (!map.has(key)) map.set(key, { nome, cor: corCategoria(cat), items: [] });
    map.get(key)!.items.push(o);
  });
  return Array.from(map.values())
    .map((g) => ({ nome: g.nome, cor: g.cor, media: calcularMetricas(g.items).media }))
    .sort((a, b) => b.media - a.media || a.nome.localeCompare(b.nome));
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
