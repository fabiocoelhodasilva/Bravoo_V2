"use client";

import { Trash2 } from "lucide-react";

type DeleteIconButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
};

export default function DeleteIconButton({
  onClick,
  disabled = false,
  title = "Excluir",
  ariaLabel = "Excluir item",
  className = "",
}: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Trash2 className="h-[17px] w-[17px]" strokeWidth={2.1} />
    </button>
  );
}