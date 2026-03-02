"use client";

import React from "react";

export type SubjectType =
  | "agenda"
  | "biblia"
  | "geografia"
  | "matematica"
  | "virtudes"
  | "relatorios";

interface SubjectButtonProps {
  subject: SubjectType;
  children: React.ReactNode;
  onClick?: () => void;
  show?: boolean;
  className?: string;
}

const subjectColors: Record<SubjectType, string> = {
  agenda: "bg-[var(--color-2)] hover:brightness-110",
  biblia: "bg-[var(--color-1)] hover:brightness-110",
  geografia: "bg-[var(--color-5)] hover:brightness-110",
  matematica: "bg-[var(--color-4)] hover:brightness-110",
  virtudes: "bg-[var(--color-6)] hover:brightness-110",
  relatorios: "bg-[var(--color-7)] hover:brightness-110",
};

export default function SubjectButton({
  subject,
  children,
  onClick,
  show = true,
  className = "",
}: SubjectButtonProps) {
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // layout / tamanho (bem parecido com o seu original)
        "w-full h-[54px] px-5",
        "rounded-2xl text-white font-semibold text-lg",
        "transition-transform duration-200 ease-in-out",
        "active:scale-[0.99] hover:scale-[1.02]",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        subjectColors[subject],
        className,
      ].join(" ")}
      data-testid={`button-${subject}`}
    >
      {children}
    </button>
  );
}