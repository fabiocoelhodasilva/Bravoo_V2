"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  ArrowRight,
  LogOut,
  Plus,
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

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-5 py-5 sm:px-8 sm:py-7">

        {/* BRAVOO - MESMO GRADIENTE DO HEADER */}
        <header className="flex justify-center">
          <div className="gradient-text text-[1.4rem] font-semibold tracking-[-0.4px] opacity-90">
            Bravoo
          </div>
        </header>

        {/* Título compacto */}
        <section className="mx-auto mt-7 max-w-2xl text-center sm:mt-9">
          <h1 className="text-[1.35rem] font-bold tracking-[-0.025em] sm:text-[1.7rem]">
            Selecione um perfil ou crie um novo
          </h1>
        </section>

        {/* Conteúdo */}
        <section className="mx-auto mt-6 w-full max-w-xl sm:mt-7">

          {/* Carregamento */}
          {carregando && (
            <div className="flex min-h-[96px] items-center justify-center rounded-[20px] border border-white/[0.07] bg-white/[0.025]">
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
              <div className="mx-auto max-w-xl">
                <a
                  href="/perfis/novo"
                  className="group flex w-full items-center gap-4 rounded-[18px] border border-dashed border-white/[0.12] bg-white/[0.025] px-4 py-3.5 text-left transition duration-200 hover:border-[#e9891d]/45 hover:bg-[#e9891d]/[0.04] active:scale-[0.99]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e9891d]/25 bg-[#e9891d]/10 text-[#e9891d] sm:h-12 sm:w-12">
                    <Plus size={23} strokeWidth={1.7} />
                  </span>

                  <span className="min-w-0 flex-1 text-[0.98rem] font-semibold text-white/80 sm:text-base">
                    Criar primeiro perfil
                  </span>

                  <ArrowRight
                    size={18}
                    className="shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-[#e9891d]"
                  />
                </a>
              </div>
            )}

          {/* Perfis existentes */}
          {!carregando &&
            !erro &&
            perfis.length > 0 && (
              <div className="space-y-2.5">
                {perfis.map((perfil) => (
                  <button
                    key={perfil.id}
                    type="button"
                    onClick={() =>
                      void escolher(perfil.id)
                    }
                    disabled={selecionando !== null}
                    aria-label={`Entrar como ${perfil.nome}`}
                    className="group flex w-full items-center gap-4 rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition duration-200 hover:border-[#e9891d]/45 hover:bg-[#e9891d]/[0.04] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e9891d] disabled:cursor-wait disabled:opacity-60 sm:px-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e9891d]/25 bg-gradient-to-br from-[#e9891d]/20 to-[#3d7a99]/10 text-[#f0a33f] sm:h-12 sm:w-12">
                      <UserRound
                        size={22}
                        strokeWidth={1.7}
                      />
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[0.98rem] font-bold text-white/92 sm:text-base">
                      {perfil.nome}
                    </span>

                    {selecionando === perfil.id ? (
                      <span className="shrink-0 text-xs font-medium text-[#e9891d]">
                        Entrando...
                      </span>
                    ) : (
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-[#e9891d]"
                      />
                    )}
                  </button>
                ))}

                {!legado &&
                  selecionando === null && (
                    <a
                      href="/perfis/novo"
                      className="group flex w-full items-center gap-4 rounded-[18px] border border-dashed border-white/[0.11] bg-white/[0.015] px-4 py-3 text-left transition duration-200 hover:border-[#e9891d]/40 hover:bg-[#e9891d]/[0.03] active:scale-[0.99] sm:px-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/38 transition group-hover:border-[#e9891d]/35 group-hover:bg-[#e9891d]/10 group-hover:text-[#e9891d] sm:h-12 sm:w-12">
                        <Plus
                          size={23}
                          strokeWidth={1.7}
                        />
                      </span>

                      <span className="min-w-0 flex-1 text-[0.98rem] font-semibold text-white/62 transition group-hover:text-white sm:text-base">
                        Adicionar perfil
                      </span>

                      <ArrowRight
                        size={18}
                        className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[#e9891d]"
                      />
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
        <footer className="mt-auto flex justify-center pt-6">
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