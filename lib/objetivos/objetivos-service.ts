import { supabase } from "@/lib/supabaseClient";
import type { Objetivo } from "@/types/objetivos";

type CategoriaObjetivoOption = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
};

type ObjetivoRow = {
  id: string;
  categoria_id: string | null;
  titulo: string;
  progresso_percentual: number | null;
  objetivos_categoria:
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

function normalizarObjetivo(item: ObjetivoRow, userId: string): Objetivo {
  const categoria = Array.isArray(item.objetivos_categoria)
    ? item.objetivos_categoria[0] ?? null
    : item.objetivos_categoria ?? null;

  return {
    ...item,
    usuario_id: userId,
    objetivos_categoria: categoria,
  } as Objetivo;
}

export async function fetchObjetivosByUser(userId: string): Promise<Objetivo[]> {
  const { data, error } = await supabase
    .from("objetivos")
    .select(`
      id,
      categoria_id,
      titulo,
      progresso_percentual,
      objetivos_categoria:categoria_id (
        id,
        nome,
        cor
      )
    `)
    .eq("usuario_id", userId);

  if (error) throw error;

  return (data ?? []).map((item) =>
    normalizarObjetivo(item as ObjetivoRow, userId)
  );
}

export async function updateObjetivoProgress(params: {
  objetivoId: string;
  userId: string;
  progresso: number;
}) {
  const { error } = await supabase
    .from("objetivos")
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
    .from("objetivos")
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
    .from("objetivos_categoria")
    .select("id, nome, descricao, ordem, cor, ativo")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (!tentativaCompleta.error) {
    return (tentativaCompleta.data as CategoriaCompletaRow[] | null ?? []).map(
      (c) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao ?? "",
        ordem: c.ordem ?? 999,
        cor: c.cor ?? "",
      })
    );
  }

  const tentativaBasica = await supabase
    .from("objetivos_categoria")
    .select("id, nome, descricao")
    .order("nome", { ascending: true });

  if (tentativaBasica.error) throw tentativaBasica.error;

  return (tentativaBasica.data as CategoriaBasicaRow[] | null ?? []).map(
    (c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao ?? "",
      ordem: 999,
      cor: "",
    })
  );
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

  const { error } = await supabase.from("objetivos").insert(payload);

  if (error) throw error;
}