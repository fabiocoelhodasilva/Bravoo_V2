"use client";

import Image from "next/image";
import Link from "next/link";

type CorJoia =
  | "azul"
  | "verde"
  | "verdeclaro"
  | "vermelha"
  | "roxa"
  | "laranja";

type Props = {
  title: string;
  href?: string;
  colorClass: string;
  disabled?: boolean;
  joiaCor?: CorJoia;
  prefetch?: boolean;
  /** Usa uma versão menor somente no celular. Desktop permanece igual. */
  compactMobile?: boolean;
};

const imagensJoias: Record<CorJoia, string> = {
  azul: "/imagens/joias/joia_blue.png",
  verde: "/imagens/joias/joia_verde.png",
  verdeclaro: "/imagens/joias/joia_verde.png",
  vermelha: "/imagens/joias/joia_red.png",
  roxa: "/imagens/joias/joia_purple.png",
  laranja: "/imagens/joias/joia_or.png",
};

export default function HomeFeatureCard({
  title,
  href,
  colorClass,
  disabled = false,
  joiaCor,
  prefetch,
  compactMobile = false,
}: Props) {
  const imagemJoia = joiaCor ? imagensJoias[joiaCor] : null;

  const baseClasses = `
    relative
    overflow-hidden
    w-full
    ${compactMobile ? "h-[44px] rounded-[14px] text-[0.72rem] px-2" : "h-[56px] rounded-[18px] text-[0.92rem] px-3"}
    sm:h-[72px]
    sm:rounded-2xl
    sm:text-[1rem]
    sm:px-4
    text-white
    font-semibold
    flex
    items-center
    justify-center
    transition-all
    duration-200
    active:scale-[0.99]
    hover:scale-[1.02]
    shadow-lg
    ${colorClass}
  `;

  const content = (
    <>
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.20),transparent_35%)]
        "
      />

      {imagemJoia && (
        <div
          className={`
            absolute
            ${compactMobile ? "left-1 h-[36px] w-[36px]" : "left-2 h-[64px] w-[64px]"}
            sm:left-3
            top-1/2
            z-10
            flex
            sm:h-[82px]
            sm:w-[82px]
            -translate-y-1/2
            items-center
            justify-center
            pointer-events-none
          `}
        >
          <div
            className={`
              absolute
              ${compactMobile ? "h-[28px] w-[28px]" : "h-[44px] w-[44px]"}
              sm:h-[58px]
              sm:w-[58px]
              rounded-full
              bg-white/10
              blur-3xl
            `}
          />

          <Image
            src={imagemJoia}
            alt={`Joia de ${title}`}
            width={105}
            height={105}
            priority
            className={`
              ${compactMobile ? "h-[42px] w-[42px]" : "h-[72px] w-[72px]"}
              sm:h-[105px]
              sm:w-[105px]
              object-contain
              bg-transparent
              drop-shadow-[0_0_22px_rgba(255,255,255,0.35)]
            `}
          />
        </div>
      )}

      <span
        className={`
          relative
          z-10
          w-full
          text-center
          leading-tight
          ${compactMobile && imagemJoia ? "pl-7 pr-1 sm:px-0" : ""}
        `}
      >
        {title}
      </span>
    </>
  );

  if (disabled || !href) {
    return (
      <div className={`${baseClasses} cursor-default hover:scale-100`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} className={baseClasses}>
      {content}
    </Link>
  );
}