"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type GamificationBarProps = {
  constancyCount: number;
  coins: number;
  constancyRank: number;
  coinsRank: number;
};

export default function GamificationBar({
  constancyCount,
  coins,
  constancyRank,
  coinsRank,
}: GamificationBarProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  function goToRanking() {
    router.push("/ranking");
  }

  function togglePopover(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm mb-6">
      <div
        className="
          w-full rounded-[24px]
          border border-white/10
          bg-[linear-gradient(180deg,rgba(24,24,24,0.98),rgba(10,10,10,0.98))]
          px-4 py-[11px]
          shadow-[0_10px_26px_rgba(0,0,0,0.45)]
        "
      >
        <div className="flex items-stretch">
          
          {/* ESQUERDA */}
          <button
            type="button"
            onClick={togglePopover}
            onMouseEnter={() => setOpen(true)}
            className="w-1/2 pr-3"
          >
            <div className="flex h-full flex-col">
              
              <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Minhas conquistas
              </div>

              <div className="flex items-center justify-between gap-2">
                
                <div className="flex-1 flex flex-col items-center">
                  <GemIcon type="weekly" size={24} />
                  <div className="mt-1 text-[12px] font-semibold text-white/90">
                    {constancyCount}
                  </div>
                </div>

                <div className="h-9 w-px bg-white/10" />

                <div className="flex-1 flex flex-col items-center">
                  <BravooCoinIcon size={24} />
                  <div className="mt-1 text-[12px] font-semibold text-white/90">
                    {coins}
                  </div>
                </div>

              </div>
            </div>
          </button>

          {/* DIVISÃO */}
          <div className="w-px bg-white/10" />

          {/* DIREITA */}
          <button
            type="button"
            onClick={goToRanking}
            className="w-1/2 pl-3"
          >
            <div className="flex h-full flex-col">
              
              <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Ranking
              </div>

              <div className="flex items-center justify-between gap-2">

                <div className="flex-1 flex flex-col items-center">
                  <StackedGems />
                  <div className="mt-1 text-[12px] font-semibold text-white/90">
                    #{constancyRank}
                  </div>
                </div>

                <div className="h-9 w-px bg-white/10" />

                <div className="flex-1 flex flex-col items-center">
                  <BravooCoinIcon size={28} />
                  <div className="mt-1 text-[12px] font-semibold text-white/90">
                    #{coinsRank}
                  </div>
                </div>

              </div>
            </div>
          </button>
        </div>
      </div>

      {/* POPOVER */}
      <div
        className={`absolute left-1/2 top-full z-40 mt-3 w-[300px] -translate-x-1/2 rounded-[18px] border border-white/10 bg-[#0f0f0f] p-2.5 shadow-xl transition-all ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="mb-1.5 text-center text-[11px] font-bold text-white/60">
          Pedras Preciosas
        </div>

        <div className="space-y-1">
          <RuleRow icon={<GemIcon type="weekly" size={20} />} title="Safira" rule="7 dias" />
          <RuleRow icon={<GemIcon type="monthly" size={20} />} title="Rubi" rule="30 dias" />
          <RuleRow icon={<GemIcon type="yearly" size={20} />} title="Diamante" rule="365 dias" />
        </div>

        <div className="my-2 h-px bg-white/10" />

        <div className="text-center text-[11px] text-white/60 mb-1">
          Bravoo Coins
        </div>

        <div className="flex items-center justify-center gap-2 text-[12px] text-white/80">
          <BravooCoinIcon size={18} />
          1 ponto = 1 Bravoo Coin
        </div>
      </div>
    </div>
  );
}

function RuleRow({ icon, title, rule }: any) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      {icon}
      <div>
        <div className="text-[12px] font-semibold text-white">{title}</div>
        <div className="text-[10px] text-white/55">{rule}</div>
      </div>
    </div>
  );
}

function StackedGems() {
  return (
    <div className="relative h-[28px] w-[48px]">
      <div className="absolute left-0 top-[5px]">
        <GemIcon type="weekly" size={18} />
      </div>
      <div className="absolute left-[13px] top-0">
        <GemIcon type="monthly" size={22} />
      </div>
      <div className="absolute left-[26px] top-[5px]">
        <GemIcon type="yearly" size={18} />
      </div>
    </div>
  );
}

function GemIcon({ type, size = 30 }: any) {
  const colors =
    type === "weekly"
      ? "from-cyan-300 to-blue-500"
      : type === "monthly"
      ? "from-red-400 to-pink-600"
      : "from-white to-sky-200";

  return (
    <div
      className={`rotate-45 rounded-sm bg-gradient-to-br ${colors} shadow-md`}
      style={{ width: size, height: size }}
    />
  );
}

function BravooCoinIcon({ size = 30 }: any) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-bold text-[#6a4300]">B</span>
    </div>
  );
}