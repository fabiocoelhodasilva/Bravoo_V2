"use client";

import Link from "next/link";

type BottomNavProps = {
  active: "objetivos" | "meu-dia";
};

export default function BottomNav({ active }: BottomNavProps) {
  const itemBase =
    "flex flex-col items-center justify-center gap-1 text-[0.72rem] font-medium transition";
  const activeClass = "text-white";
  const inactiveClass = "text-white/60";

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-[#111]/95 backdrop-blur">
      <div className="mx-auto grid h-[64px] max-w-[1100px] grid-cols-2 px-6">
        <Link
          href="/objetivos"
          className={`${itemBase} ${
            active === "objetivos" ? activeClass : inactiveClass
          }`}
          aria-label="Objetivos"
        >
          <span className="text-[1rem] leading-none">◎</span>
          <span>Objetivos</span>
        </Link>

        <Link
          href="/meu-dia"
          className={`${itemBase} ${
            active === "meu-dia" ? activeClass : inactiveClass
          }`}
          aria-label="Meu dia"
        >
          <span className="text-[1rem] leading-none">◷</span>
          <span>Meu dia</span>
        </Link>
      </div>
    </nav>
  );
}