"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

type Role = "aluno" | "professor";

type HeaderItem =
  | { key: "ajuda"; label: string; href: string }
  | { key: "escola"; label: string; href: string }
  | { key: "objetivos"; label: string; href: string }
  | { key: "cadastro"; label: string; href: string }
  | { key: "logout"; label: string };

interface HeaderProps {
  role?: Role;

  /** Se true, mostra Ajuda; se false, mostra Escola (como no seu antigo) */
  showHelp?: boolean;

  /** Rotas principais (você ajusta quando criar as páginas) */
  hrefAjuda?: string;
  hrefEscola?: string;
  hrefCadastro?: string;
  hrefObjetivos?: string;

  /** Callback do logout (obrigatório) */
  onLogoutClick: () => void;

  /** Itens extras opcionais (ex: só professor) */
  extraItems?: Array<{ label: string; href: string; show?: boolean }>;
}

/**
 * Header Bravoo (adaptado do seu antigo React)
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
  hrefCadastro = "/cadastro",
  hrefObjetivos = "/objetivos",
  onLogoutClick,
  extraItems = [],
}: HeaderProps) {
  const router = useRouter();

  const linkClass =
    "text-[12px] font-semibold no-underline hover:underline transition-all text-[var(--color-2)]";

  return (
    <header className="w-full px-5 py-2.5 flex justify-between items-center box-border">
      {/* Theme toggle on the left */}
      <ThemeToggle />

      {/* Navigation links on the right */}
      <nav className="flex gap-5 items-center">
        {/* Alterna Ajuda/Escola como no componente antigo */}
        {showHelp ? (
          <Link href={hrefAjuda} className={linkClass} data-testid="link-ajuda">
            Ajuda
          </Link>
        ) : (
          <Link
            href={hrefEscola}
            className={linkClass}
            data-testid="link-escola"
          >
            Escola
          </Link>
        )}

        {/* (opcional) Objetivos fixo, se você quiser */}
        <Link
          href={hrefObjetivos}
          className={linkClass}
          data-testid="link-objetivos"
        >
          Objetivos
        </Link>

        {/* Itens extras (ex.: professor) */}
        {extraItems
          .filter((i) => i.show !== false)
          .map((i) => (
            <Link key={i.href} href={i.href} className={linkClass}>
              {i.label}
            </Link>
          ))}

        {/* Cadastro sempre */}
        <Link
          href={hrefCadastro}
          className={linkClass}
          data-testid="link-cadastro"
        >
          Cadastro
        </Link>

        {/* Logout sempre */}
        <button
          type="button"
          onClick={async () => {
            await onLogoutClick();
            // se seu logout já faz router.push, pode remover esta linha
            router.push("/login");
          }}
          className={`${linkClass} bg-transparent border-0 p-0 cursor-pointer`}
          data-testid="link-logout"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}