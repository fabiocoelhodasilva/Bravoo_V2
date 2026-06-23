"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Target } from "lucide-react";

type BottomNavProps = {
  active: "objetivos" | "livros" | "meu-dia";
};

function BackIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-8 w-8">
      <path
        d="M37 14L19 32L37 50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M22 32H50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  const itemBase =
    "flex flex-col items-center justify-center gap-[6px] transition-all";

  const labelClass =
    "mt-[4px] h-[12px] text-center text-[0.62rem] font-semibold leading-none text-white";

  const iconBase = "h-[26px] w-[26px]";

  function iconCircleClass(tab: BottomNavProps["active"]) {
    const isActive = active === tab;

    return `
      flex h-[48px] w-[48px] items-center justify-center rounded-full
      transition-all duration-300 ease-out transform text-[#e9891d]
      ${
        isActive
          ? "scale-[1.18] border bg-[#103a30]/65"
          : "scale-100 border border-transparent"
      }
    `;
  }

  function getIconCircleStyle(tab: BottomNavProps["active"]) {
    const isActive = active === tab;

    if (!isActive) return undefined;

    return {
      borderColor: "#7df2c299",
      boxShadow: "0 0 18px #7df2c255",
    };
  }

  return (
    <nav className="fixed bottom-4 left-0 z-50 flex w-full justify-center px-4">
      <div className="grid h-[92px] w-full max-w-[620px] grid-cols-4 items-center rounded-[30px] border border-white/10 bg-[#050706]/92 px-4 shadow-[0_15px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.push("/aluno")}
          className="flex flex-col items-center justify-center gap-[6px] text-white/75 transition-all duration-300 hover:scale-110"
          aria-label="Voltar"
        >
          <BackIcon />
          <span className={labelClass}>Voltar</span>
        </button>

        <Link href="/objetivos" className={itemBase} aria-label="Objetivos">
          <div
            className={iconCircleClass("objetivos")}
            style={getIconCircleStyle("objetivos")}
          >
            <Target
              className={iconBase}
              strokeWidth={active === "objetivos" ? 2.6 : 2.2}
            />
          </div>

          <span className={labelClass}>Objetivos</span>
        </Link>

        <Link href="/livros" className={itemBase} aria-label="Livros">
          <div
            className={iconCircleClass("livros")}
            style={getIconCircleStyle("livros")}
          >
            <BookOpen
              className={iconBase}
              strokeWidth={active === "livros" ? 2.6 : 2.2}
            />
          </div>

          <span className={labelClass}>Livros</span>
        </Link>

        <Link href="/meu-dia" className={itemBase} aria-label="Meu dia">
          <div
            className={iconCircleClass("meu-dia")}
            style={getIconCircleStyle("meu-dia")}
          >
            <Clock3
              className={iconBase}
              strokeWidth={active === "meu-dia" ? 2.6 : 2.2}
            />
          </div>

          <span className={labelClass}>Meu dia</span>
        </Link>
      </div>
    </nav>
  );
}