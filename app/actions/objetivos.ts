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
      .from("objetivos")
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
      .from("objetivos")
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