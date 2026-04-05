import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { processarGamificacaoAposAtividade } from "@/lib/gamificacao/gamificacao-actions";

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

function obterDataReferenciaSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function obterDataHoraExecucaoSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    partes.find((parte) => parte.type === type)?.value ?? "";

  const ano = get("year");
  const mes = get("month");
  const dia = get("day");
  const hora = get("hour");
  const minuto = get("minute");
  const segundo = get("second");

  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

export async function POST(request: Request) {
  try {
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

    if (!atividade_id) {
      return NextResponse.json(
        { error: "atividade_id é obrigatório." },
        { status: 400 }
      );
    }

    if (!materia_id) {
      return NextResponse.json(
        { error: "materia_id é obrigatório." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(pontuacao) || pontuacao < 0) {
      return NextResponse.json(
        { error: "pontuacao inválida." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(acertos) || acertos < 0) {
      return NextResponse.json(
        { error: "acertos inválido." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(total_itens) || total_itens < 0) {
      return NextResponse.json(
        { error: "total_itens inválido." },
        { status: 400 }
      );
    }

    if (acertos > total_itens) {
      return NextResponse.json(
        { error: "acertos não pode ser maior que total_itens." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(tempo_total_segundos) || tempo_total_segundos < 0) {
      return NextResponse.json(
        { error: "tempo_total_segundos inválido." },
        { status: 400 }
      );
    }

    const dataReferencia = obterDataReferenciaSaoPaulo();
    const dataExecucao = obterDataHoraExecucaoSaoPaulo();

    const payloadSessao = {
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
      .select()
      .single();

    if (erroSessao) {
      console.error("Erro ao salvar sessão em /api/sessoes:", erroSessao);

      return NextResponse.json(
        {
          error: "Não foi possível salvar a sessão.",
          details: erroSessao.message,
        },
        { status: 500 }
      );
    }

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
        },
      });
    } catch (erroGamificacao) {
      console.error(
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
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro interno /api/sessoes:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao processar a sessão." },
      { status: 500 }
    );
  }
}