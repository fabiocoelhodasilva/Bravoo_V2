"use client";

import { useRouter } from "next/navigation";

type Props = {
  label?: string;
};

export default function BotaoVoltar({ label = "Voltar" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="
        mx-auto mt-8 block
        text-[var(--color-2)]
        text-[0.9rem] font-semibold
        transition
        active:scale-[0.97]
      "
    >
      ← {label}
    </button>
  );
}