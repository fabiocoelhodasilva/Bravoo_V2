"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

interface HeaderProps {
  extraItems?: Array<{
    label: string;
    href: string;
    show?: boolean;
  }>;

  onLogoutClick?: () => void | Promise<void>;
}

export default function Header({
  extraItems = [],
  onLogoutClick,
}: HeaderProps) {
  const { perfilAtivoId, perfilAtivo, perfis, legado } = useAuth();

  function obterSiglaPerfil(nome?: string | null) {
    const primeiroNome = nome?.trim().split(/\s+/)[0] ?? "";

    if (!primeiroNome) {
      return {
        primeira: "?",
        segunda: "",
      };
    }

    return {
      primeira: primeiroNome.charAt(0).toUpperCase(),
      segunda: primeiroNome.charAt(1).toLowerCase(),
    };
  }

  const siglaPerfilAtivo = obterSiglaPerfil(perfilAtivo?.nome);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuAberto, setMenuAberto] = useState(false);
  const [trocandoPerfilId, setTrocandoPerfilId] =
    useState<string | null>(null);

  const [erroMenu, setErroMenu] = useState("");

  const linkClass =
    "text-[12px] font-semibold no-underline hover:underline transition-all text-[var(--color-2)]";

  /* =========================================================
     Fecha menu ao clicar fora ou apertar ESC
  ========================================================= */

  useEffect(() => {
    function fecharAoClicarFora(event: PointerEvent) {
      const alvo = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(alvo)
      ) {
        setMenuAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
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
     Abrir menu
  ========================================================= */

  function abrirOuFecharMenu() {
    // A lista já foi carregada pelo AuthProvider antes de exibir o header.
    setMenuAberto((aberto) => !aberto);
    setErroMenu("");
  }

  /* =========================================================
     Trocar perfil
  ========================================================= */

  async function trocarPerfil(perfilId: string) {
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
      // estados e caches entre jogadores.
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
     Logout
  ========================================================= */

  async function handleLogout() {
    try {
      if (onLogoutClick) {
        await onLogoutClick();
      } else {
        await encerrarSessao();
      }
    } finally {
      window.location.replace("/login");
    }
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <header className="relative z-40 flex w-full items-center justify-between box-border px-4 py-2.5 sm:px-5">

      {/* =====================================================
          LADO ESQUERDO — MARCA BRAVOO
      ===================================================== */}

      <Link
        href="/aluno"
        aria-label="Página inicial Bravoo"
        className="gradient-text text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90 no-underline"
      >
        Bravoo
      </Link>

      {/* =====================================================
          LADO DIREITO
      ===================================================== */}

      <nav className="flex items-center gap-5">

        {/* Itens extras opcionais */}
        {extraItems
          .filter((item) => item.show !== false)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass}
            >
              {item.label}
            </Link>
          ))}

        {/* ===================================================
            BOTÃO DO PERFIL
        =================================================== */}

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
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e9891d]/70 bg-[#17120c] shadow-[0_0_14px_rgba(233,137,29,0.18)] transition group-hover:border-[#e9891d] group-hover:bg-[#21170c] sm:h-10 sm:w-10">
                <span className="flex items-baseline leading-none text-[#f0a33f]">
                  <span className="text-[0.98rem] font-extrabold">
                    {siglaPerfilAtivo.primeira}
                  </span>
                  {siglaPerfilAtivo.segunda && (
                    <span className="ml-[1px] text-[0.68rem] font-bold">
                      {siglaPerfilAtivo.segunda}
                    </span>
                  )}
                </span>
              </span>

              <ChevronDown
                size={14}
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
              <div className="absolute right-0 top-[calc(100%+8px)] w-[255px] overflow-hidden rounded-[18px] border border-[#e9891d]/25 bg-[#111214]/98 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">

                {/* Perfis */}
                <div className="p-2">

                  {perfis.map((perfil) => {
                      const ativo =
                        perfil.id ===
                        perfilAtivoId;

                      const trocando =
                        trocandoPerfilId ===
                        perfil.id;

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
                          {/* Avatar */}
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                              ativo
                                ? "border-[#e9891d]/60 bg-[#e9891d]/10 text-[#f0a33f]"
                                : "border-white/10 bg-white/[0.04] text-white/55"
                            }`}
                          >
                            {(() => {
                              const sigla = obterSiglaPerfil(perfil.nome);

                              return (
                                <span
                                  className={`flex items-baseline leading-none ${
                                    ativo ? "text-[#f0a33f]" : "text-white/65"
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
                              );
                            })()}
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

                          {/* Perfil atual */}
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

                  {/* Gerenciar perfis */}
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

                  {/* Configurações */}
                  <div
                    className="flex cursor-default items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm text-white/30"
                    title="Configurações em breve"
                  >
                    <Settings size={17} />
                    Configurações
                  </div>

                  {/* Sair */}
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
      </nav>
    </header>
  );
}
