"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/lib/supabaseClient";

type Role = "aluno" | "professor";

interface HeaderProps {
  role?: Role;

  /** Se true, mostra Ajuda; se false, mostra Escola (como no seu antigo) */
  showHelp?: boolean;

  /** Rotas principais (você ajusta quando criar as páginas) */
  hrefAjuda?: string;
  hrefEscola?: string;
  hrefCadastro?: string;
  hrefObjetivos?: string;

  /** Callback do logout (AGORA OPCIONAL) */
  onLogoutClick?: () => void | Promise<void>;

  /** Itens extras opcionais (ex: só professor) */
  extraItems?: Array<{ label: string; href: string; show?: boolean }>;
}

/**
 * Header Bravoo
 * - ThemeToggle à esquerda
 * - Links à direita
 * - Ajuda/Escola alternando por showHelp
 * - Cadastro + Logout sempre
 * - Extras opcionais (ex.: Banco de Questões/Listas para professor)
 */
export default function Header({
  role,
  showHelp = false,
  hrefAjuda = "/ajuda",
  hrefEscola = "/escola",
  // 👇 troquei o default para uma rota que você já citou/usa no fluxo
  hrefCadastro = "/cadastro-complementar",
  hrefObjetivos = "/objetivos",
  onLogoutClick,
  extraItems = [],
}: HeaderProps) {
  const router = useRouter();

  const linkClass =
    "text-[12px] font-semibold no-underline hover:underline transition-all text-[var(--color-2)]";

  async function handleLogout() {
    try {
      if (onLogoutClick) {
        await onLogoutClick();
      } else {
        await supabase.auth.signOut();
      }
    } finally {
      router.replace("/login");
    }
  }

  return (
    <header className="w-full px-5 py-2.5 flex justify-between items-center box-border">
      {/* Theme toggle on the left */}
      <ThemeToggle />

      {/* Navigation links on the right */}
      <nav className="flex gap-5 items-center">
        {/* Alterna Ajuda/Escola */}
        {showHelp ? (
          <Link href={hrefAjuda} className={linkClass} data-testid="link-ajuda">
            Ajuda
          </Link>
        ) : (
          <Link href={hrefEscola} className={linkClass} data-testid="link-escola">
            Escola
          </Link>
        )}

        <Link
          href={hrefObjetivos}
          className={linkClass}
          data-testid="link-objetivos"
        >
          Objetivos
        </Link>

        {/* Itens extras */}
        {extraItems
          .filter((i) => i.show !== false)
          .map((i) => (
            <Link key={i.href} href={i.href} className={linkClass}>
              {i.label}
            </Link>
          ))}

        <Link
          href={hrefCadastro}
          className={linkClass}
          data-testid="link-cadastro"
        >
          Cadastro
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`${linkClass} bg-transparent border-0 p-0 cursor-pointer`}
          data-testid="link-logout"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}