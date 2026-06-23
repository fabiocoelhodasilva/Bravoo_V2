"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getUsuarioLogado() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não identificado.");
  }

  return { supabase, user };
}

export async function aplicarCrescimentoJardimAposOracao() {
  const { supabase, user } = await getUsuarioLogado();

  const { error } = await supabase.rpc("crescer_itens_jardim_usuario", {
    p_usuario_id: user.id,
  });

  if (error) {
    console.error("Erro ao aplicar crescimento do jardim:", error);
    throw new Error("Não foi possível aplicar o crescimento do jardim.");
  }

  return {
    ok: true,
  };
}