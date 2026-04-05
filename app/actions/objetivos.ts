"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

function normalizarProgresso(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.max(0, Math.min(100, Math.round(valor)));
}

function hojeISO() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export async function createObjetivoAction(params: {
  categoriaId: string;
  titulo: string;
  dataPrevistaConclusao: string | null;
}): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Usuário não autenticado." };
    }

    const tituloNormalizado = params.titulo?.trim();

    if (!tituloNormalizado) {
      return { ok: false, message: "Título obrigatório." };
    }

    if (!params.categoriaId?.trim()) {
      return { ok: false, message: "Categoria inválida." };
    }

    const payload = {
      usuario_id: user.id,
      categoria_id: params.categoriaId,
      titulo: tituloNormalizado,
      data_inicio: hojeISO(),
      data_prevista_conclusao: params.dataPrevistaConclusao,
      status: "nao_iniciado",
      progresso_percentual: 0,
    };

    const { error } = await supabase.from("next_objetivos").insert(payload);

    if (error) {
      return { ok: false, message: "Não foi possível criar o objetivo." };
    }

    revalidatePath("/objetivos");
    return { ok: true };
  } catch {
    return { ok: false, message: "Erro inesperado ao criar objetivo." };
  }
}

export async function updateObjetivoProgressAction(params: {
  objetivoId: string;
  progresso: number;
}): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Usuário não autenticado." };
    }

    if (!params.objetivoId?.trim()) {
      return { ok: false, message: "Objetivo inválido." };
    }

    const progressoNormalizado = normalizarProgresso(params.progresso);

    const { error } = await supabase
      .from("next_objetivos")
      .update({ progresso_percentual: progressoNormalizado })
      .eq("id", params.objetivoId)
      .eq("usuario_id", user.id);

    if (error) {
      return { ok: false, message: "Não foi possível salvar o progresso." };
    }

    revalidatePath("/objetivos");
    return { ok: true };
  } catch {
    return { ok: false, message: "Erro inesperado ao salvar progresso." };
  }
}

export async function deleteObjetivoAction(params: {
  objetivoId: string;
}): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Usuário não autenticado." };
    }

    if (!params.objetivoId?.trim()) {
      return { ok: false, message: "Objetivo inválido." };
    }

    const { error } = await supabase
      .from("next_objetivos")
      .delete()
      .eq("id", params.objetivoId)
      .eq("usuario_id", user.id);

    if (error) {
      return { ok: false, message: "Não foi possível excluir o objetivo." };
    }

    revalidatePath("/objetivos");
    return { ok: true };
  } catch {
    return { ok: false, message: "Erro inesperado ao excluir objetivo." };
  }
}