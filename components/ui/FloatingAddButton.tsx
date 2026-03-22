"use client";

import Link from "next/link";

type FloatingAddButtonProps = {
  href: string;
  ariaLabel?: string;
};

export default function FloatingAddButton({
  href,
  ariaLabel = "Adicionar novo item",
}: FloatingAddButtonProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-black shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition active:scale-95"
      style={{
        background: "var(--color-2)",
        boxShadow:
          "0 0 20px rgba(233,137,29,0.35), 0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      <span className="text-[2rem] font-semibold leading-none translate-y-[-1px]">
        +
      </span>
    </Link>
  );
}