"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  LogOut,
  Settings,
  UsersRound,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  definirPerfilAtivo,
  encerrarSessao,
} from "@/lib/perfis/perfil-client";

type Props = {
  /**
   * Mantido apenas por compatibilidade com as páginas
   * que já usam <HeaderInterno onLogout={...} />.
   *
   * O logout agora é centralizado em encerrarSessao()
   * dentro do menu do perfil.
   */
  onLogout?: () => void | Promise<void>;
};

export default function HeaderInterno(_props: Props) {
  const router = useRouter();

  const { perfilAtivoId, perfilAtivo, perfis, legado } = useAuth();

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuAberto, setMenuAberto] = useState(false);
  const [trocandoPerfilId, setTrocandoPerfilId] =
    useState<string | null>(null);
  const [erroMenu, setErroMenu] = useState("");

  /* =========================================================
     Sigla visual do perfil
     Ex.: Lucas -> Lu | Elon -> El | Ester -> Es
  ========================================================= */

  function obterSiglaPerfil(nome?: string | null) {
    const primeiroNome =
      nome?.trim().split(/\s+/)[0] ?? "";

    if (!primeiroNome) {
      return {
        primeira: "?",
        segunda: "",
      };
    }

    return {
      primeira: primeiroNome
        .charAt(0)
        .toUpperCase(),

      segunda: primeiroNome
        .charAt(1)
        .toLowerCase(),
    };
  }

  const siglaPerfilAtivo =
    obterSiglaPerfil(perfilAtivo?.nome);

  /* =========================================================
     Fecha o menu ao clicar fora ou apertar ESC
  ========================================================= */

  useEffect(() => {
    function fecharAoClicarFora(
      event: PointerEvent
    ) {
      const alvo = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(alvo)
      ) {
        setMenuAberto(false);
      }
    }

    function fecharComEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      fecharAoClicarFora
    );

    document.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        fecharAoClicarFora
      );

      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, []);

  /* =========================================================
     Abrir / fechar menu do perfil
  ========================================================= */

  function abrirOuFecharMenu() {
    // A lista já foi carregada pelo AuthProvider antes de exibir o header.
    setMenuAberto((aberto) => !aberto);
    setErroMenu("");
  }

  /* =========================================================
     Trocar perfil
  ========================================================= */

  async function trocarPerfil(
    perfilId: string
  ) {
    if (trocandoPerfilId) {
      return;
    }

    if (perfilId === perfilAtivoId) {
      setMenuAberto(false);
      return;
    }

    try {
      setTrocandoPerfilId(perfilId);
      setErroMenu("");

      await definirPerfilAtivo(perfilId);

      // Recarrega toda a aplicação para não misturar
      // estado e caches de jogadores diferentes.
      window.location.replace("/aluno");
    } catch (error) {
      setErroMenu(
        error instanceof Error
          ? error.message
          : "Não foi possível trocar de perfil."
      );

      setTrocandoPerfilId(null);
    }
  }

  /* =========================================================
     Logout centralizado
  ========================================================= */

  async function handleLogout() {
    try {
      await encerrarSessao();
    } finally {
      window.location.replace("/login");
    }
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <header className="fixed top-0 left-0 z-50 flex h-[48px] w-full items-center justify-between border-b border-white/5 bg-[#050505]/95 px-4 backdrop-blur sm:px-5">

      {/* =====================================================
          LADO ESQUERDO
      ===================================================== */}

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="gradient-text cursor-pointer text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90"
        >
          Bravoo
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[0.8rem] font-semibold text-[var(--color-2)]"
        >
          Início
        </button>
      </div>

      {/* =====================================================
          LADO DIREITO — PERFIL
      ===================================================== */}

      {perfilAtivoId && (
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              void abrirOuFecharMenu()
            }
            aria-label="Abrir menu do perfil"
            aria-expanded={menuAberto}
            className="group flex items-center gap-1 rounded-full bg-transparent p-0.5 text-[#f0a33f] transition active:scale-[0.97]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e9891d]/70 bg-[#17120c] shadow-[0_0_14px_rgba(233,137,29,0.18)] transition group-hover:border-[#e9891d] group-hover:bg-[#21170c] sm:h-9 sm:w-9">
              <span className="flex items-baseline leading-none text-[#f0a33f]">
                <span className="text-[0.9rem] font-extrabold">
                  {siglaPerfilAtivo.primeira}
                </span>

                {siglaPerfilAtivo.segunda && (
                  <span className="ml-[1px] text-[0.62rem] font-bold">
                    {siglaPerfilAtivo.segunda}
                  </span>
                )}
              </span>
            </span>

            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${
                menuAberto
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* =================================================
              DROPDOWN
          ================================================= */}

          {menuAberto && (
            <div className="absolute right-0 top-[calc(100%+7px)] w-[255px] overflow-hidden rounded-[18px] border border-[#e9891d]/25 bg-[#111214]/98 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">

              {/* Perfis */}
              <div className="p-2">
                {perfis.map((perfil) => {
                    const ativo =
                      perfil.id ===
                      perfilAtivoId;

                    const trocando =
                      trocandoPerfilId ===
                      perfil.id;

                    const sigla =
                      obterSiglaPerfil(
                        perfil.nome
                      );

                    return (
                      <button
                        key={perfil.id}
                        type="button"
                        onClick={() =>
                          void trocarPerfil(
                            perfil.id
                          )
                        }
                        disabled={Boolean(
                          trocandoPerfilId
                        )}
                        className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${
                          ativo
                            ? "bg-[#e9891d]/10"
                            : "hover:bg-white/[0.05]"
                        } disabled:cursor-wait disabled:opacity-60`}
                      >
                        {/* Sigla do perfil */}
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                            ativo
                              ? "border-[#e9891d]/60 bg-[#e9891d]/10"
                              : "border-white/10 bg-white/[0.04]"
                          }`}
                        >
                          <span
                            className={`flex items-baseline leading-none ${
                              ativo
                                ? "text-[#f0a33f]"
                                : "text-white/65"
                            }`}
                          >
                            <span className="text-[0.86rem] font-extrabold">
                              {sigla.primeira}
                            </span>

                            {sigla.segunda && (
                              <span className="ml-[1px] text-[0.6rem] font-bold">
                                {sigla.segunda}
                              </span>
                            )}
                          </span>
                        </span>

                        {/* Nome */}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white/90">
                            {perfil.nome}
                          </span>

                          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-white/30">
                            {trocando
                              ? "Trocando..."
                              : ativo
                              ? "Perfil atual"
                              : "Entrar neste perfil"}
                          </span>
                        </span>

                        {/* Perfil ativo */}
                        {ativo && (
                          <Check
                            size={17}
                            strokeWidth={2.2}
                            className="shrink-0 text-[#e9891d]"
                          />
                        )}
                      </button>
                    );
                  })}

                {erroMenu && (
                  <div className="px-3 py-3 text-xs leading-5 text-amber-200">
                    {erroMenu}
                  </div>
                )}
              </div>

              {/* =================================================
                  MENU INFERIOR
              ================================================= */}

              <div className="border-t border-white/[0.07] p-2">

                {!legado && (
                  <Link
                    href="/perfis"
                    onClick={() =>
                      setMenuAberto(false)
                    }
                    className="flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <UsersRound size={17} />
                    Gerenciar perfis
                  </Link>
                )}

                <div
                  className="flex cursor-default items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-white/30"
                  title="Configurações em breve"
                >
                  <Settings size={17} />
                  Configurações
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleLogout()
                  }
                  className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-[#c94a4a]/10 hover:text-[#ff8585]"
                >
                  <LogOut size={17} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
