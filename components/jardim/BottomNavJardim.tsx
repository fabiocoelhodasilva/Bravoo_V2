"use client";

type BottomNavJardimProps = {
  oracaoConcluidaHoje: boolean;
  onVoltar: () => void;
  onOracao: () => void;

  // Deixamos prontos para conectar nas próximas etapas.
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
  oracaoConcluidaHoje,
  onVoltar,
  onOracao,
  onJardins,
  onProgresso,
}: BottomNavJardimProps) {
  const itemClass =
    "flex min-w-0 flex-col items-center justify-center gap-1 text-white/85 transition active:scale-[0.96]";

  return (
    <nav
      className="absolute inset-x-0 z-40 flex justify-center px-3"
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
          className={itemClass}
          aria-label="Voltar"
        >
          <BackIcon />
          <span className="text-[0.72rem] font-medium">Voltar</span>
        </button>

        {/* ORAR - botão principal */}
        <div className="relative flex h-full items-center justify-center">
          <button
            type="button"
            onClick={onOracao}
            className="absolute -top-[20px] flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full border border-[#ffd36a]/75 bg-[#5b3518]/95 text-white shadow-[0_0_26px_rgba(255,184,54,0.48),0_12px_30px_rgba(0,0,0,0.38)] transition active:scale-[0.96]"
            aria-label="Orar"
          >
            <span className="text-[2rem] leading-none">🙏</span>
            <span className="mt-1 text-[0.72rem] font-semibold">Orar</span>
          </button>

          {oracaoConcluidaHoje && (
            <div className="absolute bottom-[3px] rounded-full border border-emerald-300/45 bg-emerald-700/95 px-3 py-[3px] text-[0.65rem] font-semibold text-white shadow-lg">
              Hoje ✓
            </div>
          )}
        </div>

        {/* JARDINS - visual pronto, sem navegação por enquanto */}
        <button
          type="button"
          onClick={() => onJardins?.()}
          className={itemClass}
          aria-label="Jardins"
          title="Jardins"
        >
          <GardenIcon />
          <span className="text-[0.72rem] font-medium">Jardins</span>
        </button>

        {/* PROGRESSO - visual pronto, sem navegação por enquanto */}
        <button
          type="button"
          onClick={() => onProgresso?.()}
          className={itemClass}
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
