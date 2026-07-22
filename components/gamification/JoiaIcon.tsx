"use client";

import Image from "next/image";

/* =========================================================
   Tipos
========================================================= */

export type CorJoia =
  "azul" | "verde" | "verdeclaro" | "vermelha" | "roxa" | "laranja";

export type JoiaConfig = {
  nome: string;
  materia: string;
  imagem: string;
};

type Props = {
  cor: CorJoia;
};

/* =========================================================
   Catálogo oficial de joias da plataforma
========================================================= */

export const JOIAS: Record<CorJoia, JoiaConfig> = {
  laranja: {
    nome: "Topázio",
    materia: "Minha Jornada",
    imagem: "/imagens/joias/joia_or.png",
  },

  vermelha: {
    nome: "Diamante",
    materia: "Espiritual",
    imagem: "/imagens/joias/joia_vermelha.png",
  },

  azul: {
    nome: "Safira",
    materia: "Geografia",
    imagem: "/imagens/joias/joia_azul.png",
  },

  verde: {
    nome: "Esmeralda",
    materia: "Matemática",
    imagem: "/imagens/joias/joia_verde.png",
  },

  /* Mantido por compatibilidade com os componentes existentes. */
  verdeclaro: {
    nome: "Esmeralda",
    materia: "Matemática",
    imagem: "/imagens/joias/joia_verde.png",
  },

  roxa: {
    nome: "Ametista",
    materia: "Virtudes",
    imagem: "/imagens/joias/joia_roxa.png",
  },
};

/* =========================================================
   Utilitário para outros componentes
========================================================= */

export function getJoiaConfig(cor: CorJoia): JoiaConfig {
  return JOIAS[cor];
}

/* =========================================================
   Componente visual
========================================================= */

export default function JoiaIcon({ cor }: Props) {
  const joia = JOIAS[cor];

  return (
    <div className="relative h-[56px] w-[56px] shrink-0">
      <Image
        src={joia.imagem}
        alt={`Joia ${joia.nome}`}
        fill
        priority
        className="
          object-contain
          drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]
        "
      />
    </div>
  );
}