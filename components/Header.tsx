"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface HeaderProps {
  /** Itens extras opcionais (ex.: professor no futuro) */
  extraItems?: Array<{ label: string; href: string; show?: boolean }>;

  /** Callback opcional de logout */
  onLogoutClick?: () => void | Promise<void>;
}

/**
 * Header Bravoo (versão simplificada)
 * - Links extras opcionais
 * - Logout
 */
export default function Header({
  extraItems = [],
  onLogoutClick,
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
    <header className="w-full px-5 py-2.5 flex justify-end items-center box-border">
      <nav className="flex gap-5 items-center">
        {extraItems
          .filter((i) => i.show !== false)
          .map((i) => (
            <Link key={i.href} href={i.href} className={linkClass}>
              {i.label}
            </Link>
          ))}

        <button
          type="button"
          onClick={handleLogout}
          className={`${linkClass} bg-transparent border-0 p-0 cursor-pointer`}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}