"use client";

type Props = {
  onLogout: () => void | Promise<void>;
};

export default function HeaderInterno({ onLogout }: Props) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-5 h-[48px] flex items-center justify-between bg-[#050505]/95 backdrop-blur border-b border-white/5">
      <div className="gradient-text text-[1.15rem] font-semibold tracking-[-0.4px] opacity-90">
        Bravoo
      </div>

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