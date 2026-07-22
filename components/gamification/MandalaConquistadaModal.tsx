"use client";

/* =========================================================
   Tipos
========================================================= */

type MandalaConquistadaModalProps = {
  aberto: boolean;
  onFechar: () => void;
};

/* =========================================================
   Componente
========================================================= */

export default function MandalaConquistadaModal({
  aberto,
  onFechar,
}: MandalaConquistadaModalProps) {
  if (!aberto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-mandala-conquistada"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-[420px] rounded-[28px] border border-white/15 bg-[#111318] p-6 text-center shadow-[0_25px_90px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-black/30 shadow-[0_0_45px_rgba(93,198,161,0.25)]">
          <div className="absolute inset-3 rounded-full border border-white/10" />

          <span
            className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#e9891d] shadow-[0_0_16px_rgba(233,137,29,0.9)]"
            aria-hidden="true"
          />
          <span
            className="absolute right-3 top-[34%] h-4 w-4 rounded-full bg-[#c94a4a] shadow-[0_0_16px_rgba(201,74,74,0.9)]"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-3 right-[25%] h-4 w-4 rounded-full bg-[#3d7a99] shadow-[0_0_16px_rgba(61,122,153,0.9)]"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-3 left-[25%] h-4 w-4 rounded-full bg-[#5dc6a1] shadow-[0_0_16px_rgba(93,198,161,0.9)]"
            aria-hidden="true"
          />
          <span
            className="absolute left-3 top-[34%] h-4 w-4 rounded-full bg-[#a35bdc] shadow-[0_0_16px_rgba(163,91,220,0.9)]"
            aria-hidden="true"
          />

          <span
            className="bg-gradient-to-r from-[#e9891d] via-[#5dc6a1] to-[#a35bdc] bg-clip-text text-6xl font-black text-transparent"
            aria-hidden="true"
          >
            ✦
          </span>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f1e6a7]">
          Conquista diária
        </p>

        <h2
          id="titulo-mandala-conquistada"
          className="mt-2 bg-gradient-to-r from-[#e9891d] via-[#5dc6a1] to-[#a35bdc] bg-clip-text text-3xl font-black text-transparent"
        >
          Mandala completa!
        </h2>

        <p className="mt-5 text-[0.95rem] leading-relaxed text-white/80">
          Parabéns! Você conquistou as cinco joias de hoje e completou sua
          Mandala.
        </p>

        <button
          type="button"
          onClick={onFechar}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#e9891d] via-[#5dc6a1] to-[#a35bdc] px-6 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(93,198,161,0.24)] transition hover:brightness-110 active:scale-[0.98]"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}