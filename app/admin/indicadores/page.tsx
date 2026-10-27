import Link from "next/link";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_CONTA_ID = "b172f971-7b1c-4183-b790-ec6aafae4b9c";

type PessoaConquista = {
  nome: string;
  quantidade: number;
};

type NovoCadastro = {
  id: string;
  nome: string;
  data: string;
};

type ResumoDia = {
  data: string;
  dia_semana: string;
  cadastros_total: number;
  cadastros: Array<{ id: string; nome: string }>;
  joias_total: number;
  joias_por_usuario: PessoaConquista[];
  mandalas_total: number;
  mandalas_por_usuario: PessoaConquista[];
};

type AdminMetrics = {
  usuarios_cadastrados: number;
  mandalas_no_dia: number;
  usuarios_com_joia_no_dia: number;
  novos_cadastros_semana: number;
  novos_cadastros: NovoCadastro[];
  semana_inicio: string;
  semana_fim: string;
  dias: ResumoDia[];
};

const metricasPadrao: AdminMetrics = {
  usuarios_cadastrados: 0,
  mandalas_no_dia: 0,
  usuarios_com_joia_no_dia: 0,
  novos_cadastros_semana: 0,
  novos_cadastros: [],
  semana_inicio: "",
  semana_fim: "",
  dias: [],
};

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor ?? 0);
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarFaixaSemana(inicio: string, fim: string) {
  if (!inicio || !fim) return "Semana atual (domingo a sábado)";
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

function listarNomes(conquistas: PessoaConquista[]) {
  if (!conquistas?.length) return "—";

  return conquistas
    .map(({ nome, quantidade }) =>
      quantidade > 1 ? `${nome} (${quantidade})` : nome
    )
    .join(", ");
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

  // A função SQL também valida auth.uid(); a autorização não depende da interface.
  const clienteRpc = supabase as unknown as {
    rpc: (nome: string) => PromiseLike<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await clienteRpc.rpc(
    "get_bravoo_admin_weekly_metrics"
  );

  const resultado = Array.isArray(data) ? data[0] : data;
  const metricas =
    resultado && typeof resultado === "object"
      ? {
          ...metricasPadrao,
          ...(resultado as Partial<AdminMetrics>),
        }
      : metricasPadrao;

  const hoje = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
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
            Não foi possível carregar os indicadores. Execute a versão
            atualizada do SQL no Supabase e tente novamente.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardMetrica
                titulo="Usuários cadastrados"
                valor={metricas.usuarios_cadastrados}
                detalhe="Perfis registrados no Bravoo"
              />
              <CardMetrica
                titulo="Novos cadastros na semana"
                valor={metricas.novos_cadastros_semana}
                detalhe="De domingo a sábado"
              />
              <CardMetrica
                titulo="Mandalas de hoje"
                valor={metricas.mandalas_no_dia}
                detalhe="Mandalas conquistadas hoje"
              />
              <CardMetrica
                titulo="Usuários com joia hoje"
                valor={metricas.usuarios_com_joia_no_dia}
                detalhe="Cada usuário contado uma vez"
              />
            </div>

            <section className="mt-8 rounded-2xl border border-white/10 bg-[#101114] p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">Novos cadastros</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Pessoas que criaram perfil nesta semana
                  </p>
                </div>
                <span className="text-sm text-white/45">
                  {formatarFaixaSemana(
                    metricas.semana_inicio,
                    metricas.semana_fim
                  )}
                </span>
              </div>

              {metricas.novos_cadastros.length === 0 ? (
                <p className="mt-5 text-sm text-white/45">
                  Nenhum novo cadastro nesta semana.
                </p>
              ) : (
                <ul className="mt-5 divide-y divide-white/[0.07]">
                  {metricas.novos_cadastros.map((cadastro) => (
                    <li
                      key={cadastro.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="font-medium text-white/85">
                        {cadastro.nome}
                      </span>
                      <time className="shrink-0 text-sm text-white/45">
                        {formatarData(cadastro.data)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8">
              <div className="mb-3">
                <h2 className="text-xl font-bold">Atividade por dia</h2>
                <p className="mt-1 text-sm text-white/45">
                  {formatarFaixaSemana(
                    metricas.semana_inicio,
                    metricas.semana_fim
                  )} — joias e mandalas conquistadas, com os nomes dos usuários.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#101114]">
                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-white/50">
                    <tr>
                      <th className="px-4 py-3">Dia</th>
                      <th className="px-4 py-3">Novos cadastros</th>
                      <th className="px-4 py-3">Joias conquistadas</th>
                      <th className="px-4 py-3">Mandalas conquistadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.dias.map((dia) => (
                      <tr
                        key={dia.data}
                        className="border-t border-white/[0.07] align-top"
                      >
                        <th className="whitespace-nowrap px-4 py-4 font-semibold text-white/85">
                          {dia.dia_semana}
                          <span className="mt-1 block text-xs font-normal text-white/40">
                            {formatarData(dia.data)}
                          </span>
                        </th>
                        <td className="px-4 py-4">
                          <strong className="text-[#f0a33f]">
                            {formatarNumero(dia.cadastros_total)}
                          </strong>
                          <p className="mt-1 max-w-[220px] text-xs leading-5 text-white/55">
                            {dia.cadastros.map((pessoa) => pessoa.nome).join(", ") || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <strong className="text-[#f0a33f]">
                            {formatarNumero(dia.joias_total)}
                          </strong>
                          <p className="mt-1 max-w-[260px] text-xs leading-5 text-white/55">
                            {listarNomes(dia.joias_por_usuario)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <strong className="text-[#f0a33f]">
                            {formatarNumero(dia.mandalas_total)}
                          </strong>
                          <p className="mt-1 max-w-[260px] text-xs leading-5 text-white/55">
                            {listarNomes(dia.mandalas_por_usuario)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
