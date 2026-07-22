"use client";

/* =========================================================
   Tipos
========================================================= */

export type CorModalJoia =
  | "laranja"
  | "vermelha"
  | "azul"
  | "verde"
  | "roxa";

type JoiaConquistadaModalProps = {
  aberto: boolean;
  nomeJoia: string;
  nomeMateria: string;
  imagemJoia?: string;
  mensagem?: string;
  cor?: CorModalJoia;
  onFechar: () => void;
};

/* =========================================================
   Configuração visual
========================================================= */

const estilosPorCor: Record<
  CorModalJoia,
  {
    corPrincipal: string;
    corFundoSuave: string;
    corSombra: string;
    corBotao: string;
  }
> = {
  laranja: {
    corPrincipal: "#e9891d",
    corFundoSuave: "rgba(233, 137, 29, 0.15)",
    corSombra: "rgba(233, 137, 29, 0.35)",
    corBotao: "#e9891d",
  },

  vermelha: {
    corPrincipal: "#c94a4a",
    corFundoSuave: "rgba(201, 74, 74, 0.15)",
    corSombra: "rgba(201, 74, 74, 0.35)",
    corBotao: "#c94a4a",
  },

  azul: {
    corPrincipal: "#3d7a99",
    corFundoSuave: "rgba(61, 122, 153, 0.15)",
    corSombra: "rgba(61, 122, 153, 0.35)",
    corBotao: "#3d7a99",
  },

  verde: {
    corPrincipal: "#5dc6a1",
    corFundoSuave: "rgba(93, 198, 161, 0.15)",
    corSombra: "rgba(93, 198, 161, 0.35)",
    corBotao: "#5dc6a1",
  },

  roxa: {
    corPrincipal: "#a35bdc",
    corFundoSuave: "rgba(163, 91, 220, 0.15)",
    corSombra: "rgba(163, 91, 220, 0.35)",
    corBotao: "#a35bdc",
  },
};

/* =========================================================
   Componente
========================================================= */

export default function JoiaConquistadaModal({
  aberto,
  nomeJoia,
  nomeMateria,
  imagemJoia,
  mensagem,
  cor = "laranja",
  onFechar,
}: JoiaConquistadaModalProps) {
  if (!aberto) {
    return null;
  }

  const estilo = estilosPorCor[cor];

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/75 px-4
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-joia-conquistada"
      onClick={onFechar}
    >
      <div
        className="
          w-full max-w-[420px]
          rounded-[28px]
          border border-white/15
          bg-[#17131f]
          p-6 text-center
          shadow-[0_25px_80px_rgba(0,0,0,0.55)]
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* Joia */}

        <div
          className="
            mx-auto flex h-28 w-28
            items-center justify-center
            rounded-full border
          "
          style={{
            borderColor: estilo.corPrincipal,
            backgroundColor: estilo.corFundoSuave,
            boxShadow: `0 0 35px ${estilo.corSombra}`,
          }}
        >
          {imagemJoia ? (
            <img
              src={imagemJoia}
              alt={`Joia ${nomeJoia}`}
              className="h-20 w-20 object-contain"
            />
          ) : (
            <span className="text-6xl" aria-hidden="true">
              💎
            </span>
          )}
        </div>

        {/* Identificação */}

        <p
          className="
            mt-5 text-xs font-bold uppercase
            tracking-[0.18em]
          "
          style={{
            color: estilo.corPrincipal,
          }}
        >
          Nova joia conquistada
        </p>

        <h2
          id="titulo-joia-conquistada"
          className="mt-2 text-3xl font-black text-white"
        >
          {nomeJoia}
        </h2>

        <p className="mt-2 text-sm text-white/65">
          Matéria: {nomeMateria}
        </p>

        {/* Mensagem */}

        <p className="mt-5 text-[0.95rem] leading-relaxed text-white/80">
          {mensagem ??
            "Parabéns! Sua dedicação de hoje foi reconhecida."}
        </p>

        {/* Botão */}

        <button
          type="button"
          onClick={onFechar}
          className="
            mt-6 flex min-h-[48px] w-full
            items-center justify-center
            rounded-full px-6 py-3
            text-sm font-bold text-white
            transition
            hover:brightness-110
            active:scale-[0.98]
          "
          style={{
            backgroundColor: estilo.corBotao,
            boxShadow: `0 10px 28px ${estilo.corSombra}`,
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}