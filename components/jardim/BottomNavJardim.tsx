"use client";

type BottomNavJardimProps = {
  ativo: "oracao" | "jardins" | "progresso";
  oracaoConcluidaHoje: boolean;
  onVoltar: () => void;
  onOracao: () => void;

  // A navegação é controlada pelo estado único da área Espiritual.
  onJardins?: () => void;
  onProgresso?: () => void;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-7 w-7">
      <path
        d="M27 12L15 24L27 36"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 24H36"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GardenIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
      <path
        d="M24 39V24"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M24 27C17 27 12 22 12 15C19 15 24 20 24 27Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 24C24 17 29 12 36 12C36 19 31 24 24 24Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
      <path
        d="M12 35V27"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M24 35V20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M36 35V12"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomNavJardim({
  ativo,
  oracaoConcluidaHoje,
  onVoltar,
  onOracao,
  onJardins,
  onProgresso,
}: BottomNavJardimProps) {
  const itemClass = (item?: BottomNavJardimProps["ativo"]) =>
    `flex h-[76px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[20px] border transition active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[#ffe49c] ${
      ativo === item
        ? "border-[#ffd36a]/45 bg-[#79501f]/40 text-[#ffe49c] shadow-[inset_0_0_14px_rgba(255,184,54,0.12)]"
        : "border-transparent text-white/85 hover:bg-white/5"
    }`;

  return (
    <nav
      className="absolute inset-x-0 z-50 flex justify-center px-3"
      aria-label="Navegação do jardim"
      style={{
        bottom: "max(10px, env(safe-area-inset-bottom))",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grid h-[92px] w-full max-w-[620px] grid-cols-4 items-center rounded-[28px] border border-white/15 bg-[#1a120d]/88 px-2 shadow-[0_18px_55px_rgba(0,0,0,0.48)] backdrop-blur-xl">
        {/* VOLTAR */}
        <button
          type="button"
          onClick={onVoltar}
          className={itemClass()}
          aria-label="Voltar"
        >
          <BackIcon />
          <span className="text-[0.72rem] font-medium">Voltar</span>
        </button>

        {/* Todos os itens permanecem dentro da barra, inclusive Orar. */}
          <button
            type="button"
            onClick={onOracao}
            className={itemClass("oracao")}
            aria-label={oracaoConcluidaHoje ? "Orar. Meta de hoje concluída" : "Orar"}
            aria-current={ativo === "oracao" ? "page" : undefined}
          >
            <span className="text-[2rem] leading-none">🙏</span>
            <span className="text-[0.72rem] font-medium">Orar{oracaoConcluidaHoje ? " ✓" : ""}</span>
          </button>

        {/* JARDINS */}
        <button
          type="button"
          onClick={() => onJardins?.()}
          className={itemClass("jardins")}
          aria-current={ativo === "jardins" ? "page" : undefined}
          aria-label="Jardins"
          title="Jardins"
        >
          <GardenIcon />
          <span className="text-[0.72rem] font-medium">Jardins</span>
        </button>

        {/* PROGRESSO */}
        <button
          type="button"
          onClick={() => onProgresso?.()}
          className={itemClass("progresso")}
          aria-current={ativo === "progresso" ? "page" : undefined}
          aria-label="Progresso"
          title="Progresso"
        >
          <ProgressIcon />
          <span className="text-[0.72rem] font-medium">Progresso</span>
        </button>
      </div>
    </nav>
  );
}
