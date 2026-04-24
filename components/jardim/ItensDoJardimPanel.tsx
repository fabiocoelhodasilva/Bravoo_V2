"use client";

export type JardimItemTipo =
  | "arvore_cerrado"
  | "arvore_selva"
  | "arvore_carvalho"
  | "flor_roxa"
  | "flor_branca";

type ItensDoJardimPanelProps = {
  onClose: () => void;
  onSelectItem: (type: JardimItemTipo) => void;
};

const itens = [
  {
    type: "arvore_cerrado" as const,
    nome: "Árvore do cerrado",
    emoji: "🌳",
  },
  {
    type: "flor_roxa" as const,
    nome: "Flor roxa",
    emoji: "🌸",
  },
  {
    type: "flor_branca" as const,
    nome: "Flor branca",
    emoji: "🤍",
  },
  {
    type: "arvore_selva" as const,
    nome: "Árvore da selva",
    emoji: "🌴",
  },
  {
    type: "arvore_carvalho" as const,
    nome: "Árvore carvalho",
    emoji: "🌳",
  },
];

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
}: ItensDoJardimPanelProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/35 px-4 pb-[78px]">
      <div className="max-h-[72vh] w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-4 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Itens do Jardim</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white"
          >
            Fechar
          </button>
        </div>

        <div className="grid max-h-[58vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
          {itens.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelectItem(item.type)}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="mt-2 font-semibold">{item.nome}</div>
              <div className="text-xs text-white/60">Desbloqueado</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}