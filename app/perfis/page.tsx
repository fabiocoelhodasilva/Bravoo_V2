"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  ArrowRight,
  LogOut,
  Plus,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

import {
  definirPerfilAtivo,
  encerrarSessao,
  limparPerfilAtivo,
  obterContextoPerfis,
} from "@/lib/perfis/perfil-client";

import type {
  Perfil,
  ContextoPerfis,
} from "@/lib/perfis/perfis-core";

export default function PerfisPage() {
  const [legado, setLegado] = useState(false);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionando, setSelecionando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const requisicao =
    useRef<Promise<ContextoPerfis> | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        if (!requisicao.current) {
          requisicao.current = (async () => {
            const {
              data: { user: conta },
            } = await supabase.auth.getUser();

            if (!conta) {
              window.location.replace("/login");
              throw new Error("Sessão encerrada.");
            }

            await limparPerfilAtivo();

            return obterContextoPerfis(true);
          })();
        }

        const contexto = await requisicao.current;

        if (ativo) {
          setPerfis(contexto.perfis);
          setLegado(contexto.legado);
          setErro("");
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os perfis."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function escolher(perfilId: string) {
    if (selecionando) return;

    setSelecionando(perfilId);
    setErro("");

    try {
      await definirPerfilAtivo(perfilId);

      // Descarta a árvore e os caches
      // do jogador anterior.
      window.location.replace("/aluno");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível selecionar o perfil."
      );

      setSelecionando(null);
    }
  }

  async function sair() {
    try {
      const { error } = await encerrarSessao();

      if (error) {
        throw error;
      }

      window.location.replace("/login");
    } catch {
      setErro("Não foi possível sair. Tente novamente.");
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#07090d] text-white">
      {/* Fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-[#e9891d]/[0.09] blur-[120px]" />

        <div className="absolute bottom-[-260px] left-[-180px] h-[500px] w-[500px] rounded-full bg-[#3d7a99]/[0.06] blur-[140px]" />

        <div className="absolute bottom-[-260px] right-[-180px] h-[500px] w-[500px] rounded-full bg-[#5dc6a1]/[0.04] blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">

        {/* BRAVOO - MESMO GRADIENTE DO HEADER */}
        <header className="flex justify-center">
          <div className="gradient-text text-[1.4rem] font-semibold tracking-[-0.4px] opacity-90">
            Bravoo
          </div>
        </header>

        {/* Título */}
        <section className="mx-auto mt-10 max-w-2xl text-center sm:mt-14">
          <div className="mb-4 flex items-center justify-center gap-2 text-[#e9891d]">
            <Sparkles size={17} />

            <span className="text-xs font-bold uppercase tracking-[0.22em]">
              Sua jornada começa aqui
            </span>
          </div>

          <h1 className="text-[2rem] font-extrabold tracking-[-0.04em] sm:text-[2.8rem]">
            Quem vai usar a Bravoo?
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/50 sm:text-base">
            Escolha um perfil para continuar ou crie um novo
          </p>
        </section>

        {/* Conteúdo */}
        <section className="mx-auto mt-10 w-full max-w-4xl sm:mt-12">

          {/* Carregamento */}
          {carregando && (
            <div className="flex min-h-[250px] items-center justify-center rounded-[28px] border border-white/[0.07] bg-white/[0.025]">
              <p
                role="status"
                className="text-sm text-white/50"
              >
                Carregando seus perfis...
              </p>
            </div>
          )}

          {/* Sem perfis */}
          {!carregando &&
            !erro &&
            !legado &&
            perfis.length === 0 && (
              <div className="mx-auto max-w-md">
                <a
                  href="/perfis/novo"
                  className="group flex min-h-[310px] flex-col items-center justify-center rounded-[30px] border border-white/[0.09] bg-white/[0.035] px-8 py-10 text-center shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[#e9891d]/50 hover:bg-[#e9891d]/[0.045]"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e9891d]/30 bg-[#e9891d]/10 text-[#e9891d] shadow-[0_0_35px_rgba(233,137,29,0.08)] transition group-hover:scale-105">
                    <Plus
                      size={34}
                      strokeWidth={1.8}
                    />
                  </div>

                  <h2 className="mt-6 text-xl font-bold">
                    Crie seu primeiro perfil
                  </h2>

                  <p className="mt-2 max-w-[290px] text-sm leading-6 text-white/45">
                    Cada pessoa terá sua própria jornada,
                    conquistas, evolução e progresso.
                  </p>
                </a>
              </div>
            )}

          {/* Perfis existentes */}
          {!carregando &&
            !erro &&
            perfis.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                {perfis.map((perfil) => (
                  <button
                    key={perfil.id}
                    type="button"
                    onClick={() =>
                      void escolher(perfil.id)
                    }
                    disabled={selecionando !== null}
                    aria-label={`Entrar como ${perfil.nome}`}
                    className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.03] px-4 py-6 text-center shadow-[0_16px_45px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-[#e9891d]/50 hover:bg-[#e9891d]/[0.045] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e9891d] disabled:cursor-wait disabled:opacity-60"
                  >
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#e9891d]/20 bg-gradient-to-br from-[#e9891d]/20 to-[#3d7a99]/10 text-[#f0a33f] shadow-[0_0_30px_rgba(233,137,29,0.08)]">
                      <UserRound
                        size={34}
                        strokeWidth={1.7}
                      />
                    </div>

                    <span className="mt-5 max-w-full break-words text-lg font-bold">
                      {perfil.nome}
                    </span>

                    <span className="mt-4 flex h-7 items-center justify-center text-xs font-medium text-white/35 transition group-hover:text-[#e9891d]">
                      {selecionando === perfil.id ? (
                        "Entrando..."
                      ) : (
                        <span className="flex items-center gap-1.5">
                          Entrar
                          <ArrowRight size={14} />
                        </span>
                      )}
                    </span>
                  </button>
                ))}

                {/* Adicionar perfil */}
                {!legado &&
                  selecionando === null && (
                    <a
                      href="/perfis/novo"
                      className="group flex min-h-[220px] flex-col items-center justify-center rounded-[26px] border border-dashed border-white/[0.13] bg-white/[0.015] px-4 py-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#e9891d]/45 hover:bg-[#e9891d]/[0.035]"
                    >
                      <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition group-hover:border-[#e9891d]/30 group-hover:bg-[#e9891d]/10 group-hover:text-[#e9891d]">
                        <Plus
                          size={32}
                          strokeWidth={1.6}
                        />
                      </div>

                      <span className="mt-5 text-base font-semibold text-white/60 transition group-hover:text-white">
                        Adicionar perfil
                      </span>

                      <span className="mt-4 text-xs text-white/25">
                        Novo jogador
                      </span>
                    </a>
                  )}
              </div>
            )}

          {/* Erro */}
          {erro && (
            <div
              role="alert"
              className="mx-auto max-w-md rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-4 text-center text-sm text-amber-100"
            >
              <p>{erro}</p>

              <button
                type="button"
                className="mt-3 font-semibold underline underline-offset-4"
                onClick={() => {
                  requisicao.current = null;
                  setCarregando(true);
                  setErro("");

                  setTentativa(
                    (valor) => valor + 1
                  );
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </section>

        {/* Rodapé */}
        <footer className="mt-auto flex justify-center pt-12">
          <button
            type="button"
            onClick={() => void sair()}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/35 transition hover:bg-white/[0.04] hover:text-white/70"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </footer>
      </div>
    </main>
  );
}