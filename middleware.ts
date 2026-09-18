import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { obterPerfisDaConta, resolverPerfilAtivo, serializarPerfil, PERFIL_COOKIE, PERFIL_COOKIE_OPTIONS } from "@/lib/perfis/perfis-core";

const ROTAS_PERFIL = ["/aluno", "/geografia", "/matematica", "/jardim", "/meu-dia", "/objetivos", "/livros", "/virtudes"];
const pertence = (path: string, rota: string) => path === rota || path.startsWith(rota + "/");

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    } },
  );
  // Redirecionamentos preservam também cookies de renovação da sessão.
  function redirecionar(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const destino = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => destino.cookies.set(cookie));
    return destino;
  }
  function limparSelecao() {
    request.cookies.delete(PERFIL_COOKIE);
    response.cookies.set(PERFIL_COOKIE, "", { ...PERFIL_COOKIE_OPTIONS, maxAge: 0 });
  }
  const { data: { user: conta } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const rotaAuth = pathname === "/login" || pathname === "/cadastro";
  if (!conta) {
    limparSelecao();
    return rotaAuth ? response : redirecionar("/login");
  }
  if (rotaAuth) return redirecionar("/");

  // Professor continua associado à conta; não depende de perfil infantil.
  if (pertence(pathname, "/professor")) {
    const { data: professor } = await supabase.from("professores").select("aprovado")
      .eq("usuario_id", conta.id).maybeSingle();
    return professor?.aprovado ? response : redirecionar("/aluno");
  }
  if (!ROTAS_PERFIL.some((rota) => pertence(pathname, rota))) return response;

  try {
    const { perfis } = await obterPerfisDaConta(supabase, conta.id);
    const perfil = resolverPerfilAtivo(conta.id, perfis, request.cookies.get(PERFIL_COOKIE)?.value);
    if (!perfil) {
      limparSelecao();
      return redirecionar("/perfis");
    }
    const valor = serializarPerfil(conta.id, perfil.id);
    request.cookies.set(PERFIL_COOKIE, valor);
    const cookiesSessao = response.cookies.getAll();
    response = NextResponse.next({ request });
    cookiesSessao.forEach((cookie) => response.cookies.set(cookie));
    response.cookies.set(PERFIL_COOKIE, valor, PERFIL_COOKIE_OPTIONS);
    return response;
  } catch {
    // Falha de consulta não autoriza usar silenciosamente o ID do responsável.
    return redirecionar("/perfis");
  }
}

export const config = {
  matcher: ["/aluno/:path*", "/geografia/:path*", "/matematica/:path*", "/jardim/:path*",
    "/meu-dia/:path*", "/objetivos/:path*", "/livros/:path*", "/virtudes/:path*",
    "/professor/:path*", "/perfis/:path*", "/login", "/cadastro"],
};
