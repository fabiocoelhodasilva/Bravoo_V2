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
  imagem: string;
};

const minhasConquistas: ConquistaItem[] = [
  {
    type: "flor_roxa",
    nome: "Flor roxa",
    imagem: "/imagens/jardim/itens/flor_roxa.png",
  },
  {
    type: "flor_geranio_roxo",
    nome: "Gerânio roxo",
    imagem: "/imagens/jardim/itens/geranio_roxo.png",
  },
  {
    type: "flor_margarida_branca",
    nome: "Margarida branca",
    imagem: "/imagens/jardim/itens/margarida_branca.png",
  },
  {
    type: "arvore_cerrado",
    nome: "Árvore do cerrado",
    imagem: "/imagens/jardim/itens/arvore_cerrado.png",
  },
  {
    type: "arvore_selva",
    nome: "Árvore da selva",
    imagem: "/imagens/jardim/itens/arvore_selva.png",
  },
  {
    type: "arvore_carvalho",
    nome: "Árvore carvalho",
    imagem: "/imagens/jardim/itens/arvore_carvalho.png",
  },
  {
    type: "arvore_japonesa",
    nome: "Árvore japonesa",
    imagem: "/imagens/jardim/itens/arvore_japonesa.png",
  },
  {
    type: "arvore_vermelha",
    nome: "Árvore vermelha",
    imagem: "/imagens/jardim/itens/arvore_vermelha.png",
  },
];

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
  plantedItemTypes = [],
}: ItensDoJardimPanelProps) {
  function handleResgatarItem(item: ConquistaItem) {
    if (plantedItemTypes.includes(item.type)) return;
    onSelectItem(item.type);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/35 px-3 pb-[78px] pt-[24px] sm:px-4 sm:pt-[28px] md:pt-[32px] lg:pt-[34px]">
      
      <div className="relative w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-4 text-white shadow-2xl max-h-[calc(100dvh-120px)] sm:max-h-[calc(100dvh-130px)]">
        
        {/* BOTÃO FECHAR */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar Meu Jardim"
          className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white transition hover:bg-white/20"
        >
          ×
        </button>

        {/* HEADER */}
        <div className="mb-4 pr-10">
          <h2 className="text-lg font-semibold">Meu Jardim</h2>
          <p className="text-xs text-white/55">
            Escolha uma conquista e plante no jardim.
          </p>
        </div>

        {/* LISTA */}
        <div className="overflow-y-auto pr-1 max-h-[calc(100dvh-210px)] sm:max-h-[calc(100dvh-220px)]">
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
                    {/* IMAGEM */}
                    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-[#f1e6a7]/90 to-[#5dc6a1]/25">
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="h-[92%] w-[92%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]"
                      />
                    </div>

                    {/* TEXTO */}
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