import { supabase } from "@/lib/supabaseClient";
import type { Objetivo } from "@/types/objetivos";

type CategoriaObjetivoOption = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number | null;
  cor?: string | null;
};

export async function getCurrentSessionOrThrow() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!data.session) throw new Error("NO_SESSION");

  return data.session;
}

export async function fetchObjetivosByUser(userId: string): Promise<Objetivo[]> {
  const { data, error } = await supabase
    .from("objetivos")
    .select(`
      id,
      usuario_id,
      categoria_id,
      titulo,
      data_inicio,
      data_prevista_conclusao,
      status,
      progresso_percentual,
      created_at,
      objetivos_categoria:categoria_id (
        id,
        nome,
        descricao,
        ordem,
        cor,
        ativo
      )
    `)
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item: any) => ({
    ...item,
    objetivos_categoria: Array.isArray(item.objetivos_categoria)
      ? item.objetivos_categoria[0] ?? null
      : item.objetivos_categoria ?? null,
  })) as Objetivo[];
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

function hojeISO() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export async function fetchCategoriasObjetivo(): Promise<CategoriaObjetivoOption[]> {
  const tentativaCompleta = await supabase
    .from("objetivos_categoria")
    .select("id, nome, descricao, ordem, cor, ativo")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (!tentativaCompleta.error) {
    return (tentativaCompleta.data ?? []).map((c: any) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao ?? "",
      ordem: c.ordem ?? 999,
      cor: c.cor ?? "",
    }));
  }

  const tentativaBasica = await supabase
    .from("objetivos_categoria")
    .select("id, nome, descricao")
    .order("nome", { ascending: true });

  if (tentativaBasica.error) throw tentativaBasica.error;

  return (tentativaBasica.data ?? []).map((c: any) => ({
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

  const { error } = await supabase.from("objetivos").insert(payload);

  if (error) throw error;
}