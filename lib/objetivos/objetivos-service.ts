import { supabase } from "@/lib/supabase/client";
import type { Objetivo, ObjetivoCategoria } from "@/types/objetivos";

type CategoriaObjetivoOption = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
};

type ObjetivoCategoriaRow =
  | {
      id: string;
      nome: string;
      cor?: string | null;
    }
  | {
      id: string;
      nome: string;
      cor?: string | null;
    }[]
  | null;

type ObjetivoRow = {
  id: string;
  categoria_id: string | null;
  titulo: string;
  progresso_percentual: number | null;
  next_objetivos_categoria: ObjetivoCategoriaRow;
};

type CategoriaCompletaRow = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
  ativo?: boolean | null;
};

type CategoriaBasicaRow = {
  id: string;
  nome: string;
  descricao?: string | null;
};

function hojeISO() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function normalizarCategoria(
  categoria: ObjetivoCategoriaRow
): ObjetivoCategoria | null {
  const categoriaNormalizada = Array.isArray(categoria)
    ? categoria[0] ?? null
    : categoria ?? null;

  if (!categoriaNormalizada) return null;

  return {
    id: categoriaNormalizada.id,
    nome: categoriaNormalizada.nome,
    cor: categoriaNormalizada.cor ?? null,
  };
}

function normalizarObjetivo(item: ObjetivoRow, userId: string): Objetivo {
  return {
    id: item.id,
    usuario_id: userId,
    categoria_id: item.categoria_id,
    titulo: item.titulo,
    progresso_percentual: item.progresso_percentual ?? 0,
    objetivos_categoria: normalizarCategoria(item.next_objetivos_categoria),
  };
}

export async function fetchObjetivosByUser(userId: string): Promise<Objetivo[]> {
  const { data, error } = await supabase
    .from("next_objetivos")
    .select(`
      id,
      categoria_id,
      titulo,
      progresso_percentual,
      next_objetivos_categoria:categoria_id (
        id,
        nome,
        cor
      )
    `)
    .eq("usuario_id", userId);

  if (error) throw error;

  const objetivos = (data ?? []) as ObjetivoRow[];
  return objetivos.map((item) => normalizarObjetivo(item, userId));
}

export async function updateObjetivoProgress(params: {
  objetivoId: string;
  userId: string;
  progresso: number;
}) {
  const { error } = await supabase
    .from("next_objetivos")
    .update({ progresso_percentual: params.progresso })
    .eq("id", params.objetivoId)
    .eq("usuario_id", params.userId);

  if (error) throw error;
}

export async function deleteObjetivo(params: {
  objetivoId: string;
  userId: string;
}) {
  const { error } = await supabase
    .from("next_objetivos")
    .delete()
    .eq("id", params.objetivoId)
    .eq("usuario_id", params.userId);

  if (error) throw error;
}

export async function signOutObjetivos() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchCategoriasObjetivo(): Promise<CategoriaObjetivoOption[]> {
  const tentativaCompleta = await supabase
    .from("next_objetivos_categoria")
    .select("id, nome, descricao, ordem, cor, ativo")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (!tentativaCompleta.error) {
    const categorias = (tentativaCompleta.data ?? []) as CategoriaCompletaRow[];

    return categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao ?? "",
      ordem: c.ordem ?? 999,
      cor: c.cor ?? "",
    }));
  }

  const tentativaBasica = await supabase
    .from("next_objetivos_categoria")
    .select("id, nome, descricao")
    .order("nome", { ascending: true });

  if (tentativaBasica.error) throw tentativaBasica.error;

  const categorias = (tentativaBasica.data ?? []) as CategoriaBasicaRow[];

  return categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    descricao: c.descricao ?? "",
    ordem: 999,
    cor: "",
  }));
}

export async function createObjetivo(params: {
  userId: string;
  categoriaId: string;
  titulo: string;
  dataPrevistaConclusao: string | null;
}) {
  const payload = {
    usuario_id: params.userId,
    categoria_id: params.categoriaId,
    titulo: params.titulo,
    data_inicio: hojeISO(),
    data_prevista_conclusao: params.dataPrevistaConclusao,
    status: "nao_iniciado",
    progresso_percentual: 0,
  };

  const { error } = await supabase.from("next_objetivos").insert(payload);

  if (error) throw error;
}