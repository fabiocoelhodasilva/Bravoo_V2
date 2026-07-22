import type { SupabaseClient } from "@supabase/supabase-js";

type ConcederMandalaDiariaParams = {
  supabase: SupabaseClient;
  usuarioId: string;
};

export async function concederMandalaDiaria({
  supabase,
  usuarioId,
}: ConcederMandalaDiariaParams): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "fn_conceder_mandala_diaria",
    {
      p_usuario_id: usuarioId,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao verificar a mandala diária: ${error.message}`
    );
  }

  return data === true;
}