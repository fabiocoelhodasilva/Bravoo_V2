export interface Categoria {
  id: string;
  nome: string;
  ordem?: number;
  cor?: string;
  ativo?: boolean;
}

export interface Objetivo {
  id: string;
  titulo: string;
  progresso_percentual: number;
  usuario_id: string;
  categoria_id: string;
  created_at: string;
  data_prevista_conclusao?: string | null;
  objetivos_categoria?: Categoria | null;
}

export type CategoriaSlug =
  | "corpo e saude"
  | "espiritual"
  | "mente e estudos"
  | "organizacao e rotina"
  | "organizacao e rotinas"
  | "familia e relacionamentos"
  | "familia e relacionamento";

export interface CategoriaGrupo {
  cat: { id: string | null; nome: string; ordem: number };
  items: Objetivo[];
}

export interface Metricas {
  total: number;
  concluidos: number;
  media: number;
}

export interface RankingItem {
  nome: string;
  cor: string;
  media: number;
}
