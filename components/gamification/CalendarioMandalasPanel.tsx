"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CalendarioMandalasPanelProps = {
  datasComMandala: string[];
  onClose: () => void;
};

const IMAGEM_MANDALA = "/imagens/joias/mandala_5.png";
const NOMES_DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

function obterHojeIsoSaoPaulo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function criarDataMes(ano: number, mes: number) {
  return new Date(ano, mes, 1);
}

function compararMeses(a: Date, b: Date) {
  return a.getFullYear() * 12 + a.getMonth() -
    (b.getFullYear() * 12 + b.getMonth());
}

function formatarDataIso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function CalendarioMandalasPanel({
  datasComMandala,
  onClose,
}: CalendarioMandalasPanelProps) {
  const hojeIso = useMemo(obterHojeIsoSaoPaulo, []);
  const [anoHoje, mesHoje] = hojeIso.split("-").map(Number);
  const mesAtual = useMemo(
    () => criarDataMes(anoHoje, mesHoje - 1),
    [anoHoje, mesHoje],
  );
  const [mesReferencia, setMesReferencia] = useState(mesAtual);
  const diasConquistados = useMemo(
    () => new Set(datasComMandala),
    [datasComMandala],
  );

  const tituloMes = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(mesReferencia),
    [mesReferencia],
  );

  const podeAvancar = compararMeses(mesReferencia, mesAtual) < 0;

  const diasCalendario = useMemo(() => {
    const ano = mesReferencia.getFullYear();
    const mes = mesReferencia.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const celulas: Array<null | { numero: number; iso: string; futuro: boolean }> = [];

    for (let indice = 0; indice < primeiroDiaSemana; indice += 1) {
      celulas.push(null);
    }

    for (let dia = 1; dia <= totalDias; dia += 1) {
      const iso = formatarDataIso(ano, mes, dia);
      celulas.push({ numero: dia, iso, futuro: iso > hojeIso });
    }

    return celulas;
  }, [mesReferencia, hojeIso]);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fecharComEsc);

    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [onClose]);

  function navegarMes(direcao: -1 | 1) {
    setMesReferencia((atual) => criarDataMes(
      atual.getFullYear(),
      atual.getMonth() + direcao,
    ));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/[0.08] px-3 py-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Calendário mensal de Mandalas"
        className="relative max-h-[min(90dvh,680px)] w-[min(84vw,390px)] overflow-y-auto rounded-[26px] border border-[#f2cf7a]/25 bg-gradient-to-br from-[#302719]/68 via-[#1d1a14]/58 to-[#201915]/64 p-3.5 text-white shadow-[0_18px_55px_rgba(0,0,0,0.32)] backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-lg font-bold text-white/80 transition hover:bg-black/55"
          aria-label="Fechar calendário"
        >
          ×
        </button>

        <header className="pr-10">
          <h2 className="text-xl font-black leading-tight">Minhas Mandalas</h2>
          <p className="mt-1 text-xs font-medium text-white/65">
            Dias em que você completou as cinco joias.
          </p>
        </header>

        <div className="mt-3 rounded-[20px] border border-white/10 bg-black/18 p-3 shadow-inner backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navegarMes(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-xl text-white/80 transition hover:bg-white/[0.13]"
              aria-label="Mês anterior"
            >
              ‹
            </button>

            <h3 className="text-center text-sm font-black capitalize text-white/90 sm:text-base">
              {tituloMes}
            </h3>

            <button
              type="button"
              onClick={() => navegarMes(1)}
              disabled={!podeAvancar}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-xl text-white/80 transition hover:bg-white/[0.13] disabled:cursor-default disabled:opacity-25"
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-x-1 gap-y-1">
            {NOMES_DIAS.map((dia, indice) => (
              <div
                key={`${dia}-${indice}`}
                className="text-center text-[0.5rem] font-bold text-white/35"
              >
                {dia}
              </div>
            ))}

            {diasCalendario.map((item, indice) => {
              if (!item) {
                return <div key={`vazio-${indice}`} className="h-[36px]" />;
              }

              const conquistou = diasConquistados.has(item.iso);
              const hoje = item.iso === hojeIso;

              return (
                <div
                  key={item.iso}
                  aria-label={`${item.numero}${conquistou ? ", Mandala conquistada" : ""}`}
                  className={`relative flex h-[36px] flex-col items-center justify-start gap-0.5 rounded-[9px] border pt-[4px] text-[0.6rem] font-bold ${
                    item.futuro
                      ? "border-white/[0.04] bg-white/[0.015] text-white/25"
                      : conquistou
                        ? "border-[#f2cf7a]/40 bg-[#e9891d]/[0.12] text-white shadow-[inset_0_0_14px_rgba(233,137,29,0.08)]"
                        : "border-white/[0.09] bg-white/[0.025] text-white/65"
                  } ${hoje ? "ring-1 ring-[#f2cf7a]/80 ring-offset-1 ring-offset-transparent" : ""}`}
                >
                  <span className="leading-none">{item.numero}</span>
                  {conquistou && (
                    <Image
                      src={IMAGEM_MANDALA}
                      alt="Mandala conquistada"
                      width={17}
                      height={17}
                      className="h-[17px] w-[17px] object-contain drop-shadow-[0_0_5px_rgba(242,207,122,0.8)]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
