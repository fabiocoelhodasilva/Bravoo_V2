import Link from "next/link";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_CONTA_ID = "b172f971-7b1c-4183-b790-ec6aafae4b9c";

type AdminMetrics = {
  usuarios_cadastrados: number;
  mandalas_no_dia: number;
  usuarios_com_joia_no_dia: number;
};

const metricasPadrao: AdminMetrics = {
  usuarios_cadastrados: 0,
  mandalas_no_dia: 0,
  usuarios_com_joia_no_dia: 0,
};

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function CardMetrica({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101114] p-5 shadow-lg shadow-black/20">
      <p className="text-sm font-medium text-white/60">{titulo}</p>
      <p className="mt-3 text-4xl font-extrabold tracking-tight text-[#f0a33f]">
        {formatarNumero(valor)}
      </p>
      <p className="mt-2 text-xs text-white/40">{detalhe}</p>
    </section>
  );
}

export default async function AdminIndicadoresPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id !== ADMIN_CONTA_ID) {
    redirect("/aluno");
  }

  // A função SQL também verifica auth.uid() antes de retornar as métricas.
  const clienteRpc = supabase as unknown as {
    rpc: (nome: string) => PromiseLike<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await clienteRpc.rpc(
    "get_bravoo_admin_daily_metrics",
  );

  const primeiroResultado = Array.isArray(data) ? data[0] : data;
  const metricas =
    primeiroResultado && typeof primeiroResultado === "object"
      ? {
          ...metricasPadrao,
          ...(primeiroResultado as Partial<AdminMetrics>),
        }
      : metricasPadrao;

  const hoje = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/aluno"
          className="text-sm font-semibold text-[#f0a33f] transition hover:text-[#ffc36b]"
        >
          ← Voltar ao Bravoo
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0a33f]/75">
            Área restrita
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Indicadores do Bravoo
          </h1>
          <p className="mt-2 text-sm capitalize text-white/50">{hoje}</p>
        </header>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-950/20 p-5 text-sm text-red-200">
            Não foi possível carregar os indicadores. Confira se a função SQL
            `get_bravoo_admin_daily_metrics` já foi instalada no Supabase.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardMetrica
              titulo="Usuários cadastrados"
              valor={metricas.usuarios_cadastrados}
              detalhe="Perfis registrados no Bravoo"
            />
            <CardMetrica
              titulo="Mandalas de hoje"
              valor={metricas.mandalas_no_dia}
              detalhe="Mandalas conquistadas hoje"
            />
            <CardMetrica
              titulo="Usuários com joia hoje"
              valor={metricas.usuarios_com_joia_no_dia}
              detalhe="Cada usuário contado uma única vez"
            />
          </div>
        )}
      </div>
    </main>
  );
}