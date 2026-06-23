"use client";

const IMAGEM_JOIA_MEU_DIA = "/imagens/joias/joia_or.png";

type MeuDiaResumoDashboardProps = {
  diasSeguidos?: number;
  totalJoias: number;
};

export default function MeuDiaResumoDashboard({
  diasSeguidos = 0,
  totalJoias,
}: MeuDiaResumoDashboardProps) {
  return (
    <section className="w-full rounded-[26px] border border-white/10 bg-[#101010] p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)]">
      <p className="mb-4 text-center text-[12px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
        Meu progresso
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex min-h-[106px] items-center gap-4 rounded-2xl border border-[#e9891d]/20 bg-[#e9891d]/10 px-4 py-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#e9891d]/25 bg-black/25 text-4xl shadow-[0_0_18px_rgba(233,137,29,0.18)]">
            🔥
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-white">
              Persistência
            </p>

            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-black leading-none text-white">
                {diasSeguidos}
              </span>

              <span className="pb-[6px] text-sm font-bold text-white/70">
                dias seguidos
              </span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[106px] overflow-hidden rounded-2xl border border-[#3d7a99]/35 bg-gradient-to-br from-[#3d7a99]/35 via-[#1d4f7a]/18 to-black/20 px-4 py-3">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#3d7a99]/25 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#3d7a99]/45 bg-black/25 shadow-[0_0_22px_rgba(61,122,153,0.25)]">
              <img
                src={IMAGEM_JOIA_MEU_DIA}
                alt="Topázios"
                className="h-14 w-14 object-contain"
                draggable={false}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-wide text-white">
                Joias
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black leading-none text-white">
                  {totalJoias}
                </span>

                <span className="pb-[6px] text-sm font-bold text-white/70">
                  Topázios
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}