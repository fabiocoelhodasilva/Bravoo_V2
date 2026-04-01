import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

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

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAuth();
    const body = (await request.json()) as BodyType;

    const atividade_id = body.atividade_id?.trim();
    const materia_id = body.materia_id?.trim();
    const assunto_id = body.assunto_id?.trim();
    const detalhe_id = body.detalhe_id?.trim();

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

    if (!assunto_id) {
      return NextResponse.json(
        { error: "assunto_id é obrigatório." },
        { status: 400 }
      );
    }

    if (!detalhe_id) {
      return NextResponse.json(
        { error: "detalhe_id é obrigatório." },
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

    if (!Number.isInteger(total_itens) || total_itens <= 0) {
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

    if (!Number.isFinite(tempo_total_segundos) || tempo_total_segundos < 0) {
      return NextResponse.json(
        { error: "tempo_total_segundos inválido." },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc("next_registrar_sessao_e_premiar", {
      p_usuario_id: user.id,
      p_atividade_id: atividade_id,
      p_materia_id: materia_id,
      p_assunto_id: assunto_id,
      p_detalhe_id: detalhe_id,
      p_pontuacao: pontuacao,
      p_acertos: acertos,
      p_total_itens: total_itens,
      p_tempo_total_segundos: tempo_total_segundos,
    });

    if (error) {
      console.error("Erro RPC /api/sessoes:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar a sessão." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro interno /api/sessoes:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a sessão." },
      { status: 500 }
    );
  }
}