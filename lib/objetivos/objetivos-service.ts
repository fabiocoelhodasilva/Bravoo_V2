import { supabase } from "@/lib/supabaseClient";
import type { Objetivo } from "@/types/objetivos";

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

  return (data ?? []) as Objetivo[];
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