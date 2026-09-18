import { NextRequest, NextResponse } from "next/server";
import { obterContextoPerfisServidor } from "@/lib/perfis/perfil-server";
import { PERFIL_COOKIE, PERFIL_COOKIE_OPTIONS, serializarPerfil, selecionarPerfilPermitido } from "@/lib/perfis/perfis-core";

export const dynamic = "force-dynamic";

function json(dados: unknown, status = 200) {
  return NextResponse.json(dados, { status, headers: { "Cache-Control": "private, no-store" } });
}

function erroResposta(error: unknown) {
  const mensagem = error instanceof Error ? error.message : "";
  const status = mensagem === "UNAUTHORIZED" ? 401 : mensagem === "PERFIL_NAO_PERMITIDO" ? 403 : 503;
  const resposta = json({ error: status === 401 ? "Sessão encerrada." : status === 403
    ? "Este perfil não está disponível para esta conta." : "Não foi possível carregar os perfis. Tente novamente." }, status);
  if (status === 401) resposta.cookies.set(PERFIL_COOKIE, "", { ...PERFIL_COOKIE_OPTIONS, maxAge: 0 });
  return resposta;
}

/** Lista somente perfis visíveis à conta autenticada e resolve o legado no servidor. */
export async function GET() {
  try {
    const { contaId, perfis, legado, perfilAtivo } = await obterContextoPerfisServidor();
    const resposta = json({ contaId, perfis, legado, perfilAtivo });
    if (perfilAtivo) resposta.cookies.set(PERFIL_COOKIE, serializarPerfil(contaId, perfilAtivo.id), PERFIL_COOKIE_OPTIONS);
    else resposta.cookies.set(PERFIL_COOKIE, "", { ...PERFIL_COOKIE_OPTIONS, maxAge: 0 });
    return resposta;
  } catch (error) { return erroResposta(error); }
}

/** Apenas chamadas da própria origem podem trocar ou limpar a seleção. */
function origemValida(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!origemValida(request)) return json({ error: "Origem não permitida." }, 403);
  try {
    const { perfilId } = await request.json();
    const { contaId, perfis } = await obterContextoPerfisServidor();
    const perfil = selecionarPerfilPermitido(perfis, perfilId);
    const resposta = json({ ok: true });
    resposta.cookies.set(PERFIL_COOKIE, serializarPerfil(contaId, perfil.id), PERFIL_COOKIE_OPTIONS);
    return resposta;
  } catch (error) { return erroResposta(error); }
}

export async function DELETE(request: NextRequest) {
  if (!origemValida(request)) return json({ error: "Origem não permitida." }, 403);
  const resposta = json({ ok: true });
  resposta.cookies.set(PERFIL_COOKIE, "", { ...PERFIL_COOKIE_OPTIONS, maxAge: 0 });
  return resposta;
}
