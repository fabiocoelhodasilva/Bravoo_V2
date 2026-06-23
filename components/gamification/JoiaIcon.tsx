"use client";

import Image from "next/image";

type CorJoia =
  | "azul"
  | "verde"
  | "verdeclaro"
  | "vermelha"
  | "roxa"
  | "laranja";

type Props = {
  cor: CorJoia;
};

const imagens = {
  azul: "/imagens/joias/joia_azul.png",
  verde: "/imagens/joias/joia_verde.png",
  verdeclaro: "/imagens/joias/joia_verde.png",
  vermelha: "/imagens/joias/joia_vermelha.png",
  roxa: "/imagens/joias/joia_roxa.png",
  laranja: "/imagens/joias/joia_laranja.png",
};

export default function JoiaIcon({ cor }: Props) {
  return (
    <div className="relative h-[56px] w-[56px] shrink-0">
      <Image
        src={imagens[cor]}
        alt="Joia"
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