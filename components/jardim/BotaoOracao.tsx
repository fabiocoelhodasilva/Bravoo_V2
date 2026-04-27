"use client";

type BotaoOracaoProps = {
  onClick: () => void;
};

export default function BotaoOracao({ onClick }: BotaoOracaoProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Registrar oração"
      className="
        fixed
        bottom-[90px] right-4
        z-50
        h-[64px] w-[64px]
        rounded-full
        flex items-center justify-center
        transition
        hover:scale-105
        active:scale-95
      "
    >
      <img
        src="/imagens/jardim/itens/botao_oracao.png"
        alt="Orar"
        className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]"
      />
    </button>
  );
}