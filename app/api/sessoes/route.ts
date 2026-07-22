import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { processarGamificacaoAposAtividade } from "@/lib/gamificacao/geral/gamificacao-actions";
import { concederJoiaGeografia } from "@/lib/gamificacao/geografia/geografia-joias-actions";
import { concederJoiaTabuada } from "@/lib/gamificacao/matematica/tabuada-joias-actions";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_GEOGRAFIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";
const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";

/* =========================================================
   Tipos
========================================================= */

type BodyType = {
  atividade_id?: string;
  materia_id?: string;
  assunto_id?: string;
  detalhe_id?: string;
  pontuacao?: number;
  acertos?: number;
  total_itens?: number;
  tempo_total_segundos?: number;
};

type SessaoPayload = {
  usuario_id: string;
  atividade_id: string;
  materia_id: string;
  assunto_id: string | null;
  detalhe_id: string | null;
  pontuacao: number;
  acertos: number;
  total_itens: number;
  tempo_total_segundos: number;
  data_execucao: string;
};

type ResultadoConquista = {
  joiaConquistada: boolean;
  mandalaConquistada: boolean;
};

/* =========================================================
   Formatadores de data
========================================================= */

const formatadorDataSaoPaulo = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatadorDataHoraSaoPaulo = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/* =========================================================
   Funções auxiliares
========================================================= */

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function obterDataReferenciaSaoPaulo(): string {
  return formatadorDataSaoPaulo.format(new Date());
}

function obterDataHoraExecucaoSaoPaulo(): string {
  const partes = formatadorDataHoraSaoPaulo.formatToParts(new Date());

  const get = (type: string) =>
    partes.find((parte) => parte.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get(
    "minute"
  )}:${get("second")}`;
}

function erroJson(error: string, status: number, details?: string) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status }
  );
}

function validarNumeroInteiroNaoNegativo(valor: number, nomeCampo: string) {
  if (!Number.isInteger(valor) || valor < 0) {
    return `${nomeCampo} inválido.`;
  }

  return null;
}

async function processarConquistaJoia(params: {
  supabase: Parameters<typeof concederJoiaGeografia>[0]["supabase"];
  usuarioId: string;
  materiaId: string;
}): Promise<ResultadoConquista> {
  const { supabase, usuarioId, materiaId } = params;

  if (materiaId === MATERIA_GEOGRAFIA_ID) {
    return concederJoiaGeografia({
      supabase,
      usuarioId,
      materiaId,
    });
  }

  if (materiaId === MATERIA_MATEMATICA_ID) {
    return concederJoiaTabuada({
      supabase,
      usuarioId,
      materiaId,
    });
  }

  return {
    joiaConquistada: false,
    mandalaConquistada: false,
  };
}

/* =========================================================
   POST /api/sessoes
========================================================= */

export async function POST(request: Request) {
  try {
    /* ---------------------------------------------------------
       Autenticação e leitura do corpo
    --------------------------------------------------------- */

    const { supabase, user } = await requireAuth({ redirectToLogin: false });
    const body = (await request.json()) as BodyType;

    const atividade_id = body.atividade_id?.trim();
    const materia_id = body.materia_id?.trim();
    const assunto_id = body.assunto_id?.trim() || null;
    const detalhe_id = body.detalhe_id?.trim() || null;

    const pontuacao = Number(body.pontuacao ?? 0);
    const acertos = Number(body.acertos ?? 0);
    const total_itens = Number(body.total_itens ?? 0);
    const tempo_total_segundos = Number(body.tempo_total_segundos ?? 0);

    /* ---------------------------------------------------------
       Validações básicas
    --------------------------------------------------------- */

    if (!atividade_id) {
      return erroJson("atividade_id é obrigatório.", 400);
    }

    if (!materia_id) {
      return erroJson("materia_id é obrigatório.", 400);
    }

    const erroPontuacao = validarNumeroInteiroNaoNegativo(
      pontuacao,
      "pontuacao"
    );

    if (erroPontuacao) {
      return erroJson(erroPontuacao, 400);
    }

    const erroAcertos = validarNumeroInteiroNaoNegativo(acertos, "acertos");

    if (erroAcertos) {
      return erroJson(erroAcertos, 400);
    }

    const erroTotalItens = validarNumeroInteiroNaoNegativo(
      total_itens,
      "total_itens"
    );

    if (erroTotalItens) {
      return erroJson(erroTotalItens, 400);
    }

    if (acertos > total_itens) {
      return erroJson("acertos não pode ser maior que total_itens.", 400);
    }

    const erroTempo = validarNumeroInteiroNaoNegativo(
      tempo_total_segundos,
      "tempo_total_segundos"
    );

    if (erroTempo) {
      return erroJson(erroTempo, 400);
    }

    /* ---------------------------------------------------------
       Montagem e gravação da sessão
    --------------------------------------------------------- */

    const dataReferencia = obterDataReferenciaSaoPaulo();
    const dataExecucao = obterDataHoraExecucaoSaoPaulo();

    const payloadSessao: SessaoPayload = {
      usuario_id: user.id,
      atividade_id,
      materia_id,
      assunto_id,
      detalhe_id,
      pontuacao,
      acertos,
      total_itens,
      tempo_total_segundos,
      data_execucao: dataExecucao,
    };

    const { data: sessaoSalva, error: erroSessao } = await supabase
      .from("next_sessoes_atividade")
      .insert(payloadSessao)
      .select(
        "id, usuario_id, atividade_id, materia_id, assunto_id, detalhe_id, pontuacao, acertos, total_itens, tempo_total_segundos, data_execucao"
      )
      .single();

    if (erroSessao || !sessaoSalva) {
      registrarErroDev("Erro ao salvar sessão em /api/sessoes:", erroSessao);

      return erroJson(
        "Não foi possível salvar a sessão.",
        500,
        erroSessao?.message
      );
    }

    /* ---------------------------------------------------------
       Concessão de joia da matéria
    --------------------------------------------------------- */

    const resultadoConquista = await processarConquistaJoia({
      supabase,
      usuarioId: user.id,
      materiaId: materia_id,
    });

    /* ---------------------------------------------------------
       Processamento da gamificação geral
    --------------------------------------------------------- */

    try {
      const resultadoGamificacao = await processarGamificacaoAposAtividade({
        supabase,
        usuarioId: user.id,
        materiaId: materia_id,
        atividadeId: atividade_id,
        sessaoAtividadeId: sessaoSalva.id,
        dataReferencia,
        pontuacao,
      });

      return NextResponse.json({
        ok: true,
        data: {
          sessao: sessaoSalva,
          gamificacao: resultadoGamificacao,
          joiaConquistada: resultadoConquista.joiaConquistada,
          mandalaConquistada: resultadoConquista.mandalaConquistada,
        },
      });
    } catch (erroGamificacao) {
      registrarErroDev(
        "Sessão salva, mas houve erro ao processar gamificação:",
        erroGamificacao
      );

      const details =
        erroGamificacao instanceof Error
          ? erroGamificacao.message
          : "Erro desconhecido ao processar gamificação.";

      return NextResponse.json(
        {
          error: "A sessão foi salva, mas houve erro ao processar a gamificação.",
          details,
          data: {
            sessao: sessaoSalva,
            joiaConquistada: resultadoConquista.joiaConquistada,
            mandalaConquistada: resultadoConquista.mandalaConquistada,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    registrarErroDev("Erro interno /api/sessoes:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return erroJson("Usuário não autenticado.", 401);
    }

    return erroJson("Erro interno ao processar a sessão.", 500);
  }
}