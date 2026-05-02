import { salvarSessaoAtividade } from "@/lib/sessoes/sessoes-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * IDs fixos da estrutura
 */
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";
const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ASSUNTO_ORACAO_ID = "44444444-4444-4444-4444-444444444001";
const DETALHE_ORACAO_ID = "55555555-5555-5555-5555-555555555101";

const OBS_CREDITO_JARDIM_ORACAO = "credito_jardim_oracao";
const OBS_RESGATE_ITEM_JARDIM = "resgate_item_jardim";

function getIntervaloHoje() {
  const agora = new Date();

  const inicioDoDia = new Date(agora);
  inicioDoDia.setHours(0, 0, 0, 0);

  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);

  return {
    inicioDoDia,
    fimDoDia,
  };
}

function calcularCreditosPorMinutos(minutos: number) {
  if (minutos >= 10) return 3;
  if (minutos >= 5) return 2;
  if (minutos >= 1) return 1;
  return 0;
}

async function getUsuarioLogado() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não identificado.");
  }

  return {
    supabase,
    user,
  };
}