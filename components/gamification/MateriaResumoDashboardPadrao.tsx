"use client";

type MateriaResumoDashboardPadraoProps = {
  titulo?: string;
  diasSeguidos: number;
  totalJoias: number;
  nomeJoia: string;
  imagemJoia?: string;
  emojiJoia?: string;
};

export default function MateriaResumoDashboardPadrao({
  titulo = "Meu progresso",
  diasSeguidos,
  totalJoias,
  nomeJoia,
  imagemJoia,
  emojiJoia = "💎",
}: MateriaResumoDashboardPadraoProps) {
  return (
    <section className="w-full">
      {/* Mobile: cards compactos lado a lado */}
      <div className="grid w-full grid-cols-2 gap-2 sm:hidden">
        <div
          className="rounded-[18px] border px-3 py-3"
          style={{
            background:
              "radial-gradient(160px 90px at 10% 0%, rgba(233,137,29,0.18), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), #14110c",
            borderColor: "rgba(233,137,29,0.23)",
            boxShadow:
              "0 8px 18px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.02) inset",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a1908] text-[1.25rem] shadow-[0_0_16px_rgba(233,137,29,0.25)]">
              🔥
            </div>

            <div className="min-w-0">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#f1e6a7]">
                Persistência
              </p>
              <p className="mt-0.5 text-[1.35rem] font-black leading-none text-white">
                {diasSeguidos}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-[18px] border px-3 py-3"
          style={{
            background:
              "radial-gradient(160px 90px at 10% 0%, rgba(93,198,161,0.16), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), #0b1518",
            borderColor: "rgba(93,198,161,0.22)",
            boxShadow:
              "0 8px 18px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.02) inset",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071f23] text-[1.15rem] shadow-[0_0_16px_rgba(93,198,161,0.25)]">
              {imagemJoia ? (
                <img
                  src={imagemJoia}
                  alt={nomeJoia}
                  className="h-7 w-7 object-contain"
                  draggable={false}
                />
              ) : (
                emojiJoia
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#f1e6a7]">
                {nomeJoia}
              </p>
              <p className="mt-0.5 text-[1.35rem] font-black leading-none text-white">
                {totalJoias}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/tablet: dashboard maior */}
      <div className="hidden rounded-[26px] border border-white/10 bg-[#101010] p-4 shadow-[0_0_30px_rgba(0,0,0,0.45)] sm:block">
        <p className="mb-4 text-[12px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
          {titulo}
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#3d7a99]/45 bg-black/25 text-4xl shadow-[0_0_22px_rgba(61,122,153,0.25)]">
                {imagemJoia ? (
                  <img
                    src={imagemJoia}
                    alt={nomeJoia}
                    className="h-14 w-14 object-contain"
                    draggable={false}
                  />
                ) : (
                  emojiJoia
                )}
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
                    {nomeJoia}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}