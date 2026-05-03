"use client";

type RegrasJardimModalProps = {
  onClose: () => void;
};

export default function RegrasJardimModal({ onClose }: RegrasJardimModalProps) {
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/65 px-4">
      <div className="w-full max-w-[360px] rounded-3xl border border-[#5dc6a1]/30 bg-[#111] p-5 text-white shadow-2xl">
        
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#f1e6a7]">
            Regras do Jardim
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-bold hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <p className="mb-4 text-sm text-white/75">
          Ganhe itens para seu jardim orando.
        </p>

        <div className="space-y-3 text-sm">
          <div className="rounded-2xl bg-[#5dc6a1]/10 p-3">
            <strong className="text-[#5dc6a1]">1 minuto de oração</strong> = 1 item
          </div>

          <div className="rounded-2xl bg-[#5dc6a1]/10 p-3">
            <strong className="text-[#5dc6a1]">5 minutos de oração</strong> = 2 itens
          </div>

          <div className="rounded-2xl bg-[#5dc6a1]/10 p-3">
            <strong className="text-[#5dc6a1]">10 minutos de oração</strong> = 3 itens
          </div>
        </div>
      </div>
    </div>
  );
}