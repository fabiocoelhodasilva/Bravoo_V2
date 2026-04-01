import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROTAS_PROTEGIDAS = [
  "/aluno",
  "/geografia",
  "/meu-dia",
  "/objetivos",
  "/professor",
];

const ROTAS_AUTH = ["/login", "/cadastro"];

function isProtectedRoute(pathname: string) {
  return ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
}

function isAuthRoute(pathname: string) {
  return ROTAS_AUTH.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const rotaProtegida = isProtectedRoute(pathname);
  const rotaAuth = isAuthRoute(pathname);

  // bloqueia deslogado
  if (rotaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // bloqueia acesso de aluno ao professor
  if (pathname.startsWith("/professor") && user) {
    const { data: professor } = await supabase
      .from("professores")
      .select("aprovado")
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (!professor || professor.aprovado !== true) {
      const url = request.nextUrl.clone();
      url.pathname = "/aluno";
      return NextResponse.redirect(url);
    }
  }

  // impede logado de entrar em login/cadastro
  if (rotaAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/aluno";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/aluno/:path*",
    "/geografia/:path*",
    "/meu-dia/:path*",
    "/objetivos/:path*",
    "/professor/:path*",
    "/login",
    "/cadastro",
  ],
};