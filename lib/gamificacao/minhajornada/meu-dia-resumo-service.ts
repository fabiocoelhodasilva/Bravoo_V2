import type { SupabaseClient } from "@supabase/supabase-js";

export const MATERIA_MEU_DIA_ID = "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

export async function carregarTotalTopaziosMeuDia(params: {
  supabase: SupabaseClient;
  usuarioId: string;
}): Promise<number> {
  const { supabase, usuarioId } = params;

  try {
    const { count, error } = await supabase
      .from("next_joias_usuario")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuarioId)
      .eq("materia_id", MATERIA_MEU_DIA_ID);

    if (error) {
      registrarErroDev("Erro ao buscar Topázios do Meu Dia:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    registrarErroDev("Erro inesperado ao buscar Topázios:", error);
    return 0;
  }
}