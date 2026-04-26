"use client";

export type JardimItemTipo =
  | "arvore_cerrado"
  | "arvore_selva"
  | "arvore_carvalho"
  | "arvore_japonesa"
  | "arvore_vermelha"
  | "flor_roxa"
  | "flor_geranio_roxo"
  | "flor_margarida_branca";

type ItensDoJardimPanelProps = {
  onClose: () => void;
  onSelectItem: (type: JardimItemTipo) => void;
  plantedItemTypes: JardimItemTipo[];
};

type ConquistaItem = {
  type: JardimItemTipo;
  nome: string;
  emoji: string;
};

const minhasConquistas: ConquistaItem[] = [
  { type: "flor_roxa", nome: "Flor roxa", emoji: "🌸" },
  { type: "flor_geranio_roxo", nome: "Gerânio roxo", emoji: "🌷" },
  { type: "flor_margarida_branca", nome: "Margarida branca", emoji: "🌼" },
  { type: "arvore_cerrado", nome: "Árvore do cerrado", emoji: "🌳" },
  { type: "arvore_selva", nome: "Árvore da selva", emoji: "🌴" },
  { type: "arvore_carvalho", nome: "Árvore carvalho", emoji: "🌳" },
  { type: "arvore_japonesa", nome: "Árvore japonesa", emoji: "🌸" },
  { type: "arvore_vermelha", nome: "Árvore vermelha", emoji: "🍁" },
];

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
  plantedItemTypes,
}: ItensDoJardimPanelProps) {
  function handleResgatarItem(item: ConquistaItem) {
    if (plantedItemTypes.includes(item.type)) return;
    onSelectItem(item.type);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/35 px-4 pb-[78px]">
      <div className="max-h-[78vh] w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-4 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Meu Jardim</h2>
            <p className="text-xs text-white/55">
              Escolha uma conquista e plante no jardim.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto pr-1">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#5dc6a1]">
              Conquistas
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {minhasConquistas.map((item) => {
                const jaPlantado = plantedItemTypes.includes(item.type);

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleResgatarItem(item)}
                    disabled={jaPlantado}
                    className={`rounded-xl border p-3 text-left transition ${
                      jaPlantado
                        ? "border-white/5 bg-white/[0.03] opacity-40 grayscale"
                        : "border-[#5dc6a1]/40 bg-[#5dc6a1]/10 hover:bg-[#5dc6a1]/20"
                    }`}
                  >
                    <div className="text-3xl">{item.emoji}</div>
                    <div className="mt-2 font-semibold">{item.nome}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {jaPlantado ? "Já está no jardim" : "Toque para plantar"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}