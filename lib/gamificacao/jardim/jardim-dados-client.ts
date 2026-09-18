import { supabase } from "@/lib/supabase/client";
import { obterPerfilAtivoId } from "@/lib/perfis/perfil-client";
import { buscarResumoDashboardOracao } from "@/lib/gamificacao/oracao/oracao-dashboard-client";
import { buscarPontuacaoJardim } from "./jardim-pontuacao-actions";

const MATERIA_ESPIRITUAL_ID = "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111";
const ATIVIDADE_ORACAO_ID = "22222222-2222-2222-2222-222222222100";

export type ResumoOracao = Awaited<ReturnType<typeof buscarResumoDashboardOracao>>;
export type ProgressoPeriodo = { diasComDiamante: Set<string>; minutos: number };
export type CarregadorJardim = ReturnType<typeof criarCarregadorJardim>;

function dataSaoPaulo(data: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(data);
}

/** Uma instância por GardenScene: nada é compartilhado entre usuários ou visitas. */
export function criarCarregadorJardim() {
  let usuarioPendente: Promise<string> | undefined;
  let resumoPendente: Promise<ResumoOracao> | undefined;
  let pontuacaoPendente: ReturnType<typeof buscarPontuacaoJardim> | undefined;
  const periodos = new Map<string, Promise<ProgressoPeriodo>>();

  function usuario() {
    if (!usuarioPendente) {
      usuarioPendente = obterPerfilAtivoId().catch((error) => {
        usuarioPendente = undefined;
        throw error;
      });
    }
    return usuarioPendente;
  }

  // A mesma promise atende o preload e o clique antes de terminar a consulta.
  function resumo() {
    if (!resumoPendente) {
      const pedido = usuario().then(buscarResumoDashboardOracao).catch((error) => {
        if (resumoPendente === pedido) resumoPendente = undefined;
        throw error;
      });
      resumoPendente = pedido;
    }
    return resumoPendente;
  }

  function pontuacao() {
    if (!pontuacaoPendente) {
      const pedido = buscarPontuacaoJardim().catch((error) => {
        if (pontuacaoPendente === pedido) pontuacaoPendente = undefined;
        throw error;
      });
      pontuacaoPendente = pedido;
    }
    return pontuacaoPendente;
  }

  /** Mantém os limites de São Paulo e os cálculos já usados pelo Progresso. */
  function progresso(inicio: string, fimExclusivo: string): Promise<ProgressoPeriodo> {
    const chave = `${inicio}:${fimExclusivo}`;
    const existente = periodos.get(chave);
    if (existente) return existente;

    const pedido = usuario().then(async (usuarioId) => {
      const [sessoes, joias] = await Promise.all([
        supabase.from("next_sessoes_atividade").select("tempo_total_segundos")
          .eq("usuario_id", usuarioId).eq("atividade_id", ATIVIDADE_ORACAO_ID)
          .gte("data_execucao", `${inicio}T00:00:00-03:00`)
          .lt("data_execucao", `${fimExclusivo}T00:00:00-03:00`),
        supabase.from("next_joias_usuario").select("data_conquista")
          .eq("usuario_id", usuarioId).eq("materia_id", MATERIA_ESPIRITUAL_ID)
          .gte("data_conquista", `${inicio}T00:00:00-03:00`)
          .lt("data_conquista", `${fimExclusivo}T00:00:00-03:00`)
          .order("data_conquista", { ascending: true }),
      ]);
      if (sessoes.error) throw sessoes.error;
      if (joias.error) throw joias.error;

      const diasComDiamante = new Set<string>();
      for (const joia of joias.data ?? []) {
        if (joia.data_conquista) diasComDiamante.add(dataSaoPaulo(new Date(joia.data_conquista)));
      }
      return {
        diasComDiamante,
        minutos: Math.floor((sessoes.data ?? []).reduce(
          (total, item) => total + Number(item.tempo_total_segundos ?? 0), 0,
        ) / 60),
      };
    }).catch((error) => {
      // Falhas não ficam no cache: abrir o painel permite tentar novamente.
      if (periodos.get(chave) === pedido) periodos.delete(chave);
      throw error;
    });
    periodos.set(chave, pedido);
    return pedido;
  }

  function preloadProgresso() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const inicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
    const fim = mes === 11 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 2).padStart(2, "0")}-01`;
    return Promise.allSettled([
      progresso(inicio, fim),
      progresso(`${ano}-01-01`, `${ano + 1}-01-01`),
    ]);
  }

  // Após oração/meta, leituras antigas não podem reaparecer nos painéis.
  function invalidar() {
    resumoPendente = undefined;
    pontuacaoPendente = undefined;
    periodos.clear();
  }

  return { usuario, resumo, pontuacao, progresso, preloadProgresso, invalidar };
}
