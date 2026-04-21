"use client";

import { useRouter } from "next/navigation";

type Props = {
  onLogout: () => void | Promise<void>;
};

export default function HeaderInterno({ onLogout }: Props) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-5 h-[48px] flex items-center justify-between bg-[#050505]/95 backdrop-blur border-b border-white/5">

      {/* lado esquerdo */}
      <div className="flex items-center gap-6">

        <div
          onClick={() => router.push("/")}
          className="gradient-text text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90 cursor-pointer"
        >
          Bravoo
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[var(--color-2)] text-[0.8rem] font-semibold"
        >
          Início
        </button>

      </div>

      {/* lado direito */}
      <button
        type="button"
        onClick={onLogout}
        className="text-[var(--color-2)] text-[0.8rem] font-semibold"
      >
        Logout
      </button>

    </header>
  );
}