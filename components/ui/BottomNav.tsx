"use client";

import Link from "next/link";
import { Clock3, Target } from "lucide-react";

type BottomNavProps = {
  active: "objetivos" | "meu-dia";
};

export default function BottomNav({ active }: BottomNavProps) {
  const itemBase =
    "flex flex-col items-center justify-center gap-1 text-[0.72rem] font-medium transition";
  const activeClass = "text-white";
  const inactiveClass = "text-white/60";
  const iconBase = "h-[22px] w-[22px]";

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
          <Target
            className={iconBase}
            strokeWidth={active === "objetivos" ? 2.4 : 2.1}
          />
          <span>Objetivos</span>
        </Link>

        <Link
          href="/meu-dia"
          className={`${itemBase} ${
            active === "meu-dia" ? activeClass : inactiveClass
          }`}
          aria-label="Meu dia"
        >
          <Clock3
            className={iconBase}
            strokeWidth={active === "meu-dia" ? 2.4 : 2.1}
          />
          <span>Meu dia</span>
        </Link>
      </div>
    </nav>
  );
}