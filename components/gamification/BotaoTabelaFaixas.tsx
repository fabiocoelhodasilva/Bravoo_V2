"use client";

type BotaoTabelaFaixasProps = {
  onClick: () => void;
};

export default function BotaoTabelaFaixas({
  onClick,
}: BotaoTabelaFaixasProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center justify-center
        rounded-full
        border border-white/8
        bg-white/[0.04]
        px-3 py-1
        text-[10px]
        font-bold
        uppercase
        tracking-[0.08em]
        text-white/78
        transition
        hover:bg-white/[0.07]
        hover:text-white
      "
    >
      Faixas
    </button>
  );
}