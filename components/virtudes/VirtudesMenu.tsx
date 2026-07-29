"use client";

/* =========================================================
   Imports
========================================================= */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import VirtudesResumoDashboard from "@/components/gamification/VirtudesResumoDashboard";
import { supabase } from "@/lib/supabase/client";
import { carregarJoiasSemana } from "@/lib/gamificacao/geral/carregar-joias-semana";

/* =========================================================
   Constantes da matéria e do calendário
========================================================= */

const MATERIA_VIRTUDES_ID = "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";
const IMAGEM_JOIA_VIRTUDES = "/imagens/joias/joia_purple.png";

const LABELS_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* =========================================================
   Tipos
========================================================= */

type AssuntoVirtude = {
  nome: string;
  ordem_exibicao: number;
};

type Virtude = {
  id: string;
  assunto_id: string;
  titulo: string;
  descricao: string | null;
  youtube_video_id: string;
  poster_url: string | null;
  pergunta_audio: string;
  ativo: boolean;
  destaque: boolean;
  ordem_exibicao: number;
  criado_em: string;
  atualizado_em: string;
  assunto: AssuntoVirtude | AssuntoVirtude[] | null;
};

type RegistroVisualizacaoVirtude = {
  virtude_id: string;
  concluido_em: string | null;
};

/* =========================================================
   Funções auxiliares
========================================================= */

function parseIsoDateLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatIsoDateLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function addDays(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + quantidade);
  return novaData;
}

function getStartOfWeekSunday(data: Date) {
  return addDays(data, -data.getDay());
}

function obterHojeLocalIso() {
  return formatIsoDateLocal(new Date());
}

function obterNomeAssunto(virtude: Virtude) {
  if (!virtude.assunto) {
    return "Virtudes";
  }

  if (Array.isArray(virtude.assunto)) {
    return virtude.assunto[0]?.nome ?? "Virtudes";
  }

  return virtude.assunto.nome ?? "Virtudes";
}

function obterImagemVirtude(virtude: Virtude) {
  if (virtude.poster_url) {
    return virtude.poster_url;
  }

  return `https://img.youtube.com/vi/${virtude.youtube_video_id}/maxresdefault.jpg`;
}

function formatarDataVisualizacao(dataIso: string) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");

  if (!ano || !mes || !dia) {
    return dataIso;
  }

  return `${dia}/${mes}/${ano}`;
}

/* =========================================================
   Componente principal
========================================================= */

export default function VirtudesMenu() {
  const router = useRouter();

  const [virtudes, setVirtudes] = useState<Virtude[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(obterHojeLocalIso());
  const [joiasSemana, setJoiasSemana] = useState<Record<string, string>>({});
  const [ultimasVisualizacoes, setUltimasVisualizacoes] = useState<
    Record<string, string[]>
  >({});

  const dataAtual = useMemo(
    () => parseIsoDateLocal(dataSelecionada),
    [dataSelecionada],
  );

  const inicioSemana = useMemo(
    () => getStartOfWeekSunday(dataAtual),
    [dataAtual],
  );

  const fimSemana = useMemo(() => addDays(inicioSemana, 6), [inicioSemana]);

  const diasDaSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const data = addDays(inicioSemana, index);

      return {
        iso: formatIsoDateLocal(data),
        diaNumero: data.getDate(),
        diaCurto: LABELS_DIAS_CURTOS[data.getDay()],
      };
    });
  }, [inicioSemana]);

  const hojeIso = useMemo(() => obterHojeLocalIso(), []);

  /* =========================================================
     Carrega conteúdos de Virtudes
  ========================================================= */

  const carregarVirtudes = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("next_virtudes")
        .select(
          `
          id,
          assunto_id,
          titulo,
          descricao,
          youtube_video_id,
          poster_url,
          pergunta_audio,
          ativo,
          destaque,
          ordem_exibicao,
          criado_em,
          atualizado_em,
          assunto:next_assuntos (
            nome,
            ordem_exibicao
          )
        `,
        )
        .eq("ativo", true)
        .order("ordem_exibicao", { ascending: true })
        .order("criado_em", { ascending: false });

      if (error) {
        throw error;
      }

      setVirtudes((data ?? []) as Virtude[]);
    } catch (error) {
      console.error("Erro ao carregar conteúdos de Virtudes:", error);
      setVirtudes([]);
      setErro("Não foi possível carregar os conteúdos de Virtudes.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarVirtudes();
  }, [carregarVirtudes]);

  /* =========================================================
     Busca as ametistas conquistadas na semana
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarAmetistasSemana() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (!cancelado) setJoiasSemana({});
          return;
        }

        const resultado = await carregarJoiasSemana({
          supabase,
          usuarioId: user.id,
          materiaId: MATERIA_VIRTUDES_ID,
          dataInicio: formatIsoDateLocal(inicioSemana),
          dataFim: formatIsoDateLocal(fimSemana),
          imagemJoia: IMAGEM_JOIA_VIRTUDES,
        });

        if (!cancelado) setJoiasSemana(resultado);
      } catch (error) {
        console.error("Erro ao carregar ametistas da semana:", error);
        if (!cancelado) setJoiasSemana({});
      }
    }

    void carregarAmetistasSemana();

    return () => {
      cancelado = true;
    };
  }, [inicioSemana, fimSemana]);

  /* =========================================================
     Busca as três últimas respostas de cada virtude

     Para esta tela, uma resposta registrada indica que o
     usuário assistiu ao vídeo e concluiu a reflexão.
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarUltimasVisualizacoes() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (erroUsuario || !user) {
          if (!cancelado) {
            setUltimasVisualizacoes({});
          }

          return;
        }

        const { data, error } = await supabase
          .from("next_virtudes_respostas")
          .select("virtude_id, concluido_em")
          .eq("usuario_id", user.id)
          .not("concluido_em", "is", null)
          .order("concluido_em", { ascending: false });

        if (error) {
          throw error;
        }

        const historico: Record<string, string[]> = {};

        for (const registro of (data ?? []) as RegistroVisualizacaoVirtude[]) {
          const virtudeId = registro.virtude_id;
          const concluidoEm = registro.concluido_em;

          if (
            typeof virtudeId !== "string" ||
            virtudeId.length === 0 ||
            typeof concluidoEm !== "string"
          ) {
            continue;
          }

          const dataFormatada = formatarDataVisualizacao(concluidoEm);
          const datasDaVirtude = historico[virtudeId] ?? [];

          /*
           * Mostra no máximo três dias diferentes.
           * Assim, duas respostas no mesmo dia não repetem a data.
           */
          if (
            datasDaVirtude.length < 3 &&
            !datasDaVirtude.includes(dataFormatada)
          ) {
            datasDaVirtude.push(dataFormatada);
            historico[virtudeId] = datasDaVirtude;
          }
        }

        if (!cancelado) {
          setUltimasVisualizacoes(historico);
        }
      } catch (error) {
        console.error("Erro ao carregar últimas visualizações:", error);

        if (!cancelado) {
          setUltimasVisualizacoes({});
        }
      }
    }

    void carregarUltimasVisualizacoes();

    return () => {
      cancelado = true;
    };
  }, []);

  /* =========================================================
     Agrupamento por assunto
  ========================================================= */

  const gruposPorAssunto = useMemo(() => {
    const grupos = new Map<
      string,
      {
        ordem: number;
        itens: Virtude[];
      }
    >();

    for (const virtude of virtudes) {
      const assunto = obterNomeAssunto(virtude);

      const dadosAssunto = Array.isArray(virtude.assunto)
        ? virtude.assunto[0]
        : virtude.assunto;

      const ordem = dadosAssunto?.ordem_exibicao ?? 999;

      if (!grupos.has(assunto)) {
        grupos.set(assunto, {
          ordem,
          itens: [],
        });
      }

      grupos.get(assunto)!.itens.push(virtude);
    }

    return Array.from(grupos.entries())
      .map(([assunto, dados]) => ({
        assunto,
        ordem: dados.ordem,
        itens: dados.itens,
      }))
      .sort((grupoA, grupoB) => {
        if (grupoA.ordem !== grupoB.ordem) {
          return grupoA.ordem - grupoB.ordem;
        }

        return grupoA.assunto.localeCompare(grupoB.assunto, "pt-BR");
      });
  }, [virtudes]);

  /* =========================================================
     Navegação
  ========================================================= */

  function navegarSemana(direcao: -1 | 1) {
    const novaData = addDays(dataAtual, direcao * 7);
    setDataSelecionada(formatIsoDateLocal(novaData));
  }

  function abrirVirtude(virtudeId: string) {
    router.push(`/virtudes/${virtudeId}`);
  }

  /* =========================================================
     Logout
  ========================================================= */

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
    }
  }

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="pb-10">
        {/* =====================================================
            Título, calendário e gamificação
        ===================================================== */}

        <section className="px-4 pb-4 pt-4 sm:px-6 sm:pt-8">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
            <h1 className="mb-3 text-center text-[1.55rem] font-bold leading-tight gradient-text sm:mb-6 sm:text-4xl">
              Virtudes
            </h1>

            <section
              className="mb-3 w-full max-w-sm rounded-[22px] px-2 py-3 sm:px-3 lg:max-w-none lg:px-5"
              style={{
                background:
                  "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 10px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset",
              }}
            >
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => navegarSemana(-1)}
                  aria-label="Semana anterior"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
                  style={{
                    borderColor: "#7df2c299",
                    boxShadow: "0 0 18px #7df2c255",
                  }}
                >
                  ‹
                </button>

                <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5 sm:gap-2">
                  {diasDaSemana.map((dia) => {
                    const selecionado = dia.iso === dataSelecionada;
                    const hoje = dia.iso === hojeIso;
                    const imagemJoiaDia = joiasSemana[dia.iso];

                    return (
                      <button
                        key={dia.iso}
                        type="button"
                        onClick={() => setDataSelecionada(dia.iso)}
                        className="flex min-w-0 flex-col items-center justify-center rounded-[14px] px-0.5 py-1 transition active:scale-[0.97] sm:py-2"
                      >
                        <span
                          className={`mb-1 text-[0.58rem] font-semibold sm:mb-2 sm:text-[0.72rem] ${
                            hoje
                              ? "text-[var(--color-2)]"
                              : selecionado
                              ? "text-white"
                              : "text-white/42"
                          }`}
                        >
                          {dia.diaCurto}
                        </span>

                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[0.78rem] font-bold transition sm:h-10 sm:w-10 sm:text-[0.95rem] ${
                            hoje
                              ? "scale-[1.06] text-[var(--color-2)]"
                              : selecionado
                              ? "scale-[1.06] text-[var(--color-5)]"
                              : "text-white/88"
                          }`}
                          style={{
                            background: hoje
                              ? "rgba(233,137,29,0.22)"
                              : selecionado
                              ? "rgba(61,122,153,0.22)"
                              : "transparent",
                            borderColor: hoje
                              ? "rgba(233,137,29,0.9)"
                              : selecionado
                              ? "rgba(61,122,153,0.8)"
                              : "transparent",
                            boxShadow: hoje
                              ? "0 0 18px rgba(233,137,29,0.48)"
                              : selecionado
                              ? "0 0 18px rgba(61,122,153,0.45)"
                              : "none",
                          }}
                        >
                          {dia.diaNumero}
                        </span>

                        <span className="mt-0.5 flex h-4 items-center justify-center sm:h-5">
                          {imagemJoiaDia && (
                            <img
                              src={imagemJoiaDia}
                              alt="Ametista conquistada"
                              className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4"
                              draggable={false}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => navegarSemana(1)}
                  aria-label="Próxima semana"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#103a30]/65 text-[1.25rem] text-white/80 transition hover:bg-white/[0.06] active:scale-[0.96] sm:h-9 sm:w-9"
                  style={{
                    borderColor: "#7df2c299",
                    boxShadow: "0 0 18px #7df2c255",
                  }}
                >
                  ›
                </button>
              </div>
            </section>

            <div className="w-full [&>div]:!max-w-none">
              <VirtudesResumoDashboard />
            </div>
          </div>
        </section>

        {/* =====================================================
            Carregamento
        ===================================================== */}

        {carregando && (
          <div className="px-4 py-8 text-center text-sm text-white/60">
            Carregando jornadas...
          </div>
        )}

        {/* =====================================================
            Erro
        ===================================================== */}

        {!carregando && erro && (
          <div className="mx-auto w-[calc(100%-2rem)] max-w-[700px] rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        {/* =====================================================
            Nenhum conteúdo
        ===================================================== */}

        {!carregando && !erro && virtudes.length === 0 && (
          <div className="mx-auto w-[calc(100%-2rem)] max-w-[700px] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm text-white/60">
            Nenhum conteúdo de Virtudes está disponível no momento.
          </div>
        )}

        {/* =====================================================
            Trilhas horizontais por assunto
        ===================================================== */}

        {!carregando && !erro && gruposPorAssunto.length > 0 && (
          <section className="mt-2 flex flex-col gap-9 sm:mt-4">
            {gruposPorAssunto.map((grupo) => (
              <div key={grupo.assunto}>
                <div className="mx-auto mb-4 w-full max-w-[1200px] px-4 sm:px-6">
                  <h3 className="text-[1.15rem] font-bold text-white sm:text-[1.45rem]">
                    {grupo.assunto}
                  </h3>
                </div>

                <div className="mx-auto w-full max-w-[1240px] overflow-x-auto px-4 pb-4 sm:px-6">
                  <div className="flex w-max items-start gap-3 sm:gap-5">
                    {grupo.itens.map((virtude) => {
                      const visualizacoes =
                        ultimasVisualizacoes[virtude.id] ?? [];

                      const jaAssistiu = visualizacoes.length > 0;

                      return (
                        <button
                          key={virtude.id}
                          type="button"
                          onClick={() => abrirVirtude(virtude.id)}
                          className="group flex w-[182px] shrink-0 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#111] text-left shadow-[0_14px_34px_rgba(0,0,0,0.42)] transition duration-300 active:scale-[0.98] sm:w-[235px] sm:hover:-translate-y-1 sm:hover:border-[var(--color-6)]/40"
                        >
                          {/* Imagem sempre colorida */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#111]">
                            <img
                              src={obterImagemVirtude(virtude)}
                              alt={virtude.titulo}
                              className="h-full w-full object-cover transition duration-500 sm:group-hover:scale-[1.05]"
                              draggable={false}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
                              <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-6)] sm:text-[0.7rem]">
                                {obterNomeAssunto(virtude)}
                              </span>

                              <h4 className="mt-1 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-[1.08rem]">
                                {virtude.titulo}
                              </h4>
                            </div>

                            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-[0.8rem] text-white shadow-lg backdrop-blur-sm transition sm:group-hover:scale-110">
                              ▶
                            </div>
                          </div>

                          {/* Histórico abaixo do vídeo */}
                          <div className="flex min-h-[150px] w-full flex-1 flex-col p-3.5 sm:min-h-[166px] sm:p-4">
                            <p className="text-[0.61rem] font-black uppercase tracking-[0.12em] text-white/48 sm:text-[0.68rem]">
                              Últimas 3 visualizações
                            </p>

                            {jaAssistiu ? (
                              <div className="mt-2.5 flex flex-col gap-1.5">
                                {visualizacoes.map((dataVisualizacao) => (
                                  <div
                                    key={dataVisualizacao}
                                    className="flex items-center gap-2 text-[0.76rem] font-semibold text-white/78 sm:text-[0.84rem]"
                                  >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-6)] shadow-[0_0_8px_rgba(163,91,220,0.65)]" />
                                    <span>{dataVisualizacao}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2.5 text-[0.76rem] font-semibold leading-relaxed text-white/38 sm:text-[0.84rem]">
                                Você ainda não assistiu a esta jornada.
                              </p>
                            )}

                            <div
                              className={`mt-auto pt-3 text-[0.72rem] font-black sm:text-[0.8rem] ${
                                jaAssistiu
                                  ? "text-[#5dc6a1]"
                                  : "text-[var(--color-6)]"
                              }`}
                            >
                              {jaAssistiu
                                ? "Assistir novamente →"
                                : "Assistir agora →"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* =====================================================
            Botão voltar
        ===================================================== */}

        <div className="mb-4 mt-10 flex justify-center sm:mt-14">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}