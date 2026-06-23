"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type BottomNavJardimProps = {
  flyMode: boolean;
  saudeJardimPercentual?: number;
  saudeJardimCarregando?: boolean;
  onMenu?: () => void;
  onFly: () => void;
  onItems: () => void;
  onOracao: () => void;
};

type ActiveTab = "movimento" | "orar" | "cuidar";

type EstagioNavJardim = {
  imagem: string;
  cor: string;
  tamanho: number;
  alt: string;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-8 w-8">
      <path
        d="M37 14L19 32L37 50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M22 32H50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizarPercentualSaude(valor?: number) {
  if (!Number.isFinite(valor)) return 30;
  return Math.min(100, Math.max(0, Math.round(Number(valor))));
}

function getEstagioNavJardim(percentual?: number): EstagioNavJardim {
  const saude = normalizarPercentualSaude(percentual);

  if (saude <= 19) {
    return {
      imagem: "/imagens/jardim/estagios/critico.png",
      cor: "#c94a4a",
      tamanho: 40,
      alt: "Jardim em estado crítico",
    };
  }

  if (saude <= 39) {
    return {
      imagem: "/imagens/jardim/estagios/cuidados.png",
      cor: "#e9891d",
      tamanho: 42,
      alt: "Jardim precisa de cuidados",
    };
  }

  if (saude <= 59) {
    return {
      imagem: "/imagens/jardim/estagios/crescendo.png",
      cor: "#f1c232",
      tamanho: 44,
      alt: "Jardim crescendo",
    };
  }

  if (saude <= 79) {
    return {
      imagem: "/imagens/jardim/estagios/saudavel.png",
      cor: "#8bd448",
      tamanho: 46,
      alt: "Jardim saudável",
    };
  }

  return {
    imagem: "/imagens/jardim/estagios/radiante.png",
    cor: "#5dc6a1",
    tamanho: 48,
    alt: "Jardim radiante",
  };
}

export default function BottomNavJardim({
  flyMode,
  saudeJardimPercentual,
  saudeJardimCarregando = false,
  onFly,
  onItems,
  onOracao,
}: BottomNavJardimProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("movimento");

  const estagioJardim = getEstagioNavJardim(saudeJardimPercentual);

  const itemBase =
    "flex flex-col items-center justify-center gap-[6px] transition-all";

  function iconCircleClass(tab: ActiveTab) {
    const isActive = activeTab === tab;

    return `
      flex h-[48px] w-[48px] items-center justify-center rounded-full
      transition-all duration-300 ease-out transform
      ${
        isActive
          ? `scale-[1.18] border bg-[#103a30]/65`
          : `scale-100 border border-transparent`
      }
    `;
  }

  function getIconCircleStyle(tab: ActiveTab) {
    const isActive = activeTab === tab;
    const corAtiva = tab === "cuidar" ? estagioJardim.cor : "#7df2c2";

    if (!isActive) return undefined;

    return {
      borderColor: `${corAtiva}99`,
      boxShadow: `0 0 18px ${corAtiva}55`,
    };
  }

  const labelClass =
    "mt-[4px] h-[12px] text-center text-[0.62rem] font-semibold leading-none text-white";

  return (
    <nav
      className="fixed bottom-4 left-0 z-50 flex w-full justify-center px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid h-[92px] w-full max-w-[620px] grid-cols-4 items-center rounded-[30px] border border-white/10 bg-[#050706]/92 px-4 shadow-[0_15px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.back();
          }}
          className="flex flex-col items-center justify-center gap-[6px] text-white/75 transition-all duration-300 hover:scale-110"
          aria-label="Voltar"
        >
          <BackIcon />
          <span className={labelClass}>Voltar</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("movimento");
            onFly();
          }}
          className={itemBase}
          aria-pressed={activeTab === "movimento"}
        >
          <div className={iconCircleClass("movimento")} style={getIconCircleStyle("movimento")}>
            <Image
              src="/imagens/jardim/itens/icones/movimento.png"
              alt="Movimento"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <span className={labelClass}>Movimento</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("orar");
            onOracao();
          }}
          className={itemBase}
          aria-pressed={activeTab === "orar"}
        >
          <div className={iconCircleClass("orar")} style={getIconCircleStyle("orar")}>
            <Image
              src="/imagens/jardim/itens/icones/orar.png"
              alt="Orar"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <span className={labelClass}>Orar</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("cuidar");
            onItems();
          }}
          className={itemBase}
          aria-pressed={activeTab === "cuidar"}
        >
          <div className={iconCircleClass("cuidar")} style={getIconCircleStyle("cuidar")}>
            {saudeJardimCarregando ? (
              <div className="h-6 w-6 animate-pulse rounded-full bg-[#5dc6a1]/60" />
            ) : (
              <Image
                src={estagioJardim.imagem}
                alt={estagioJardim.alt}
                width={estagioJardim.tamanho}
                height={estagioJardim.tamanho}
                className="object-contain drop-shadow-[0_0_8px_rgba(93,198,161,0.45)]"
                priority
              />
            )}
          </div>
          <span className={labelClass}>Meu Jardim</span>
        </button>
      </div>
    </nav>
  );
}
