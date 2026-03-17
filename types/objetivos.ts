export type ObjetivoCategoria = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
  ativo?: boolean | null;
};

export type Objetivo = {
  id: string;
  usuario_id: string;
  categoria_id: string | null;
  titulo: string;
  data_inicio?: string | null;
  data_prevista_conclusao?: string | null;
  status?: string | null;
  progresso_percentual: number | null;
  created_at?: string | null;
  objetivos_categoria?: ObjetivoCategoria | null;
};

export type ObjetivosMetricas = {
  total: number;
  concluidos: number;
  media: number;
};

export type RankingCategoria = {
  id: string;
  nome: string;
  cor: string;
  media: number;
  ordem: number;
};

export type ObjetivosGrupo = {
  key: string;
  categoria: {
    id: string | null;
    nome: string;
    cor: string;
    ordem: number;
  };
  objetivos: Objetivo[];
  metricas: ObjetivosMetricas;
};