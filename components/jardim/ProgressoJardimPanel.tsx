"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CarregadorJardim } from "@/lib/gamificacao/jardim/jardim-dados-client";

/* =========================================================
   Tipos
========================================================= */

type ResumoDashboardOracao = {
  minutosHoje: number;
  minutosAno: number;
  metaDiaria: number;
  persistenciaDias: number;
};

type ProgressoJardimPanelProps = {
  onClose: () => void;
  dados: ResumoDashboardOracao;
  totalJoias: number;
  carregando?: boolean;
  carregador: CarregadorJardim;
  revisao: number;
  erroResumo?: boolean;
  onTentarResumo?: () => void;
};

type PeriodoFiltro = "mes" | "ano";

/* =========================================================
   Constantes
========================================================= */

const IMAGEM_JOIA_ESPIRITUAL = "/imagens/joias/joia_red.png";


const NOMES_DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

/* =========================================================
   Datas
========================================================= */

function obterDataSaoPaulo(data: Date): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const get = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatarDataIso(ano: number, mesZeroBased: number, dia: number) {
  return `${ano}-${String(mesZeroBased + 1).padStart(2, "0")}-${String(
    dia,
  ).padStart(2, "0")}`;
}

function obterInicioMesIso(data: Date) {
  return formatarDataIso(data.getFullYear(), data.getMonth(), 1);
}

function obterInicioProximoMesIso(data: Date) {
  const proximo = new Date(data.getFullYear(), data.getMonth() + 1, 1);

  return formatarDataIso(
    proximo.getFullYear(),
    proximo.getMonth(),
    1,
  );
}

function obterInicioAnoIso(data: Date) {
  return `${data.getFullYear()}-01-01`;
}

function obterInicioProximoAnoIso(data: Date) {
  return `${data.getFullYear() + 1}-01-01`;
}

function criarDataMes(ano: number, mesZeroBased: number) {
  return new Date(ano, mesZeroBased, 1);
}

function compararMeses(a: Date, b: Date) {
  const valorA = a.getFullYear() * 12 + a.getMonth();
  const valorB = b.getFullYear() * 12 + b.getMonth();

  return valorA - valorB;
}

/* =========================================================
   Componente
========================================================= */

export default function ProgressoJardimPanel({
  onClose,
  dados,
  carregando = false,
  carregador,
  revisao,
  erroResumo = false,
  onTentarResumo,
}: ProgressoJardimPanelProps) {
  const hoje = useMemo(() => new Date(), []);
  const hojeIso = useMemo(() => obterDataSaoPaulo(hoje), [hoje]);

  // O Progresso não usa o corte de 14/09/2026.
  // Deixamos a navegação livre para consultar todo o histórico disponível.
  const mesMinimo = useMemo(() => criarDataMes(2000, 0), []);

  const mesAtual = useMemo(
    () => criarDataMes(hoje.getFullYear(), hoje.getMonth()),
    [hoje],
  );

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("mes");
  const [mesReferencia, setMesReferencia] = useState(mesAtual);

  const [diasComDiamante, setDiasComDiamante] = useState<Set<string>>(
    () => new Set(),
  );

  const [tempoPeriodoMinutos, setTempoPeriodoMinutos] = useState(0);
  const [diamantesPeriodo, setDiamantesPeriodo] = useState(0);

  const [carregandoCalendario, setCarregandoCalendario] = useState(true);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(true);
  const [erroProgresso, setErroProgresso] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const tituloMes = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(mesReferencia);
  }, [mesReferencia]);

  const podeVoltar = compararMeses(mesReferencia, mesMinimo) > 0;
  const podeAvancar = compararMeses(mesReferencia, mesAtual) < 0;

  const diasCalendario = useMemo(() => {
    const ano = mesReferencia.getFullYear();
    const mes = mesReferencia.getMonth();

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const celulas: Array<
      | null
      | {
          numero: number;
          iso: string;
          disponivel: boolean;
          futuro: boolean;
        }
    > = [];

    for (let i = 0; i < primeiroDiaSemana; i += 1) {
      celulas.push(null);
    }

    for (let dia = 1; dia <= totalDias; dia += 1) {
      const iso = formatarDataIso(ano, mes, dia);

      celulas.push({
        numero: dia,
        iso,
        disponivel: true,
        futuro: iso > hojeIso,
      });
    }

    return celulas;
  }, [mesReferencia, hojeIso]);


  const descricaoPeriodo = useMemo(() => {
    if (periodo === "mes") {
      return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
      }).format(mesReferencia);
    }

    return `em ${mesReferencia.getFullYear()}`;
  }, [periodo, mesReferencia]);

  /* ---------------------------------------------------------
     Intervalo do filtro selecionado
  --------------------------------------------------------- */

  const intervaloPeriodo = useMemo(() => {
    if (periodo === "mes") {
      return {
        inicio: obterInicioMesIso(mesReferencia),
        fimExclusivo: obterInicioProximoMesIso(mesReferencia),
      };
    }

    return {
      inicio: obterInicioAnoIso(mesReferencia),
      fimExclusivo: obterInicioProximoAnoIso(mesReferencia),
    };
  }, [periodo, mesReferencia]);

  /* ---------------------------------------------------------
     Histórico mensal para o calendário
  --------------------------------------------------------- */

  // Calendário e totais mensais compartilham o mesmo preload, inclusive em andamento.
  useEffect(() => {
    let ativo = true;
    // Sincroniza o estado de carregamento no início da tarefa assíncrona.
    queueMicrotask(() => {
      if (!ativo) return;
      setCarregandoCalendario(true);
      setCarregandoPeriodo(true);
      setErroProgresso(false);
    });

    const calendario = carregador.progresso(
      obterInicioMesIso(mesReferencia), obterInicioProximoMesIso(mesReferencia),
    ).then((resultado) => {
      if (ativo) setDiasComDiamante(resultado.diasComDiamante);
    }).catch((error) => {
      console.error("Erro ao carregar calendário espiritual:", error);
      if (ativo) { setDiasComDiamante(new Set()); setErroProgresso(true); }
    }).finally(() => { if (ativo) setCarregandoCalendario(false); });

    const totais = carregador.progresso(intervaloPeriodo.inicio, intervaloPeriodo.fimExclusivo)
      .then((resultado) => {
        if (!ativo) return;
        setTempoPeriodoMinutos(resultado.minutos);
        setDiamantesPeriodo(resultado.diasComDiamante.size);
      }).catch((error) => {
        console.error("Erro ao carregar totais do progresso espiritual:", error);
        if (ativo) {
          setTempoPeriodoMinutos(0);
          setDiamantesPeriodo(0);
          setErroProgresso(true);
        }
      }).finally(() => { if (ativo) setCarregandoPeriodo(false); });

    void Promise.all([calendario, totais]);
    return () => { ativo = false; };
  }, [carregador, mesReferencia, intervaloPeriodo, tentativa, revisao]);

  /* Navegação mensal: mantém os limites e os filtros existentes. */
  function voltarMes() {
    if (!podeVoltar) return;

    setMesReferencia((atual) =>
      criarDataMes(
        atual.getFullYear(),
        atual.getMonth() - 1,
      ),
    );
  }

  function avancarMes() {
    if (!podeAvancar) return;

    setMesReferencia((atual) =>
      criarDataMes(
        atual.getFullYear(),
        atual.getMonth() + 1,
      ),
    );
  }

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */

  return (
    <div
      className="
        absolute inset-0 z-40
        flex items-end justify-center
        bg-black/[0.08]
        px-3 pb-[108px] pt-3
        md:items-start md:pb-[112px] md:pt-[74px]
      "
      onClick={(event) => event.stopPropagation()}
    >
      <section
        className="
          relative w-full max-w-[390px]
          max-h-[calc(100dvh-118px)] overflow-y-auto
          rounded-[26px]
          border border-[#f2cf7a]/25
          bg-gradient-to-br
          from-[#302719]/68 via-[#1d1a14]/58 to-[#201915]/64
          p-3.5 text-white
          shadow-[0_18px_55px_rgba(0,0,0,0.32)]
          backdrop-blur-md
        "
      >
        {(erroProgresso || erroResumo) && (
          <button type="button" onClick={() => {
            setTentativa((valor) => valor + 1);
            if (erroResumo) onTentarResumo?.();
          }}
            className="mb-2 text-sm text-[#ffe4a8] underline" role="alert">
            Não foi possível carregar o progresso. Tentar novamente
          </button>
        )}
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="
            absolute right-3 top-3 z-20
            flex h-8 w-8 items-center justify-center
            rounded-full border border-white/10
            bg-black/25 text-base font-bold text-white/80
            backdrop-blur-md transition
            hover:bg-black/40
          "
          aria-label="Fechar progresso"
        >
          ×
        </button>

        {/* Cabeçalho */}
        <header className="pr-10">
          <h2 className="text-[1.2rem] font-black leading-tight">
            Meu Progresso
          </h2>

          <p className="mt-1 text-[0.68rem] font-medium text-white/62">
            Acompanhe sua constância e seus Diamantes.
          </p>
        </header>

        {/* Calendário em largura total */}
        <div
          aria-busy={carregandoCalendario}
          className="
            mt-2.5 w-full
            rounded-[20px] border border-white/10
            bg-black/18 p-3
            shadow-inner backdrop-blur-sm
          "
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={voltarMes}
              disabled={!podeVoltar}
              className="
                flex h-7 w-7 items-center justify-center rounded-full
                bg-white/[0.07] text-sm text-white/75
                disabled:cursor-default disabled:opacity-25
              "
              aria-label="Mês anterior"
            >
              ‹
            </button>

            <div className="min-w-0 text-center">
              <div className="truncate text-[0.76rem] font-black capitalize text-white/90">
                {tituloMes}
              </div>
            </div>

            <button
              type="button"
              onClick={avancarMes}
              disabled={!podeAvancar}
              className="
                flex h-7 w-7 items-center justify-center rounded-full
                bg-white/[0.07] text-sm text-white/75
                disabled:cursor-default disabled:opacity-25
              "
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
                return (
                  <div
                    key={`vazio-${indice}`}
                    className="h-[36px]"
                  />
                );
              }

              const conquistou = diasComDiamante.has(item.iso);
              const hojeCelula = item.iso === hojeIso;

              return (
                <div
                  key={item.iso}
                  className={`
                    relative flex h-[36px] flex-col items-center justify-start
                    rounded-[9px] pt-[4px]
                    text-[0.6rem] font-bold
                    ${
                      !item.disponivel || item.futuro
                        ? "border border-white/[0.035] text-white/18"
                        : conquistou
                        ? "border border-red-300/30 bg-red-500/[0.09] text-white"
                        : "border border-white/[0.09] bg-white/[0.025] text-white/62"
                    }
                    ${
                      hojeCelula
                        ? "ring-1 ring-[#f2cf7a]/75 ring-offset-1 ring-offset-transparent"
                        : ""
                    }
                  `}
                >
                  <span className="leading-none">
                    {item.numero}
                  </span>

                  <div className="mt-[3px] flex h-[13px] w-full items-center justify-center">
                    {conquistou && (
                      <Image
                        src={IMAGEM_JOIA_ESPIRITUAL}
                        alt="Diamante conquistado"
                        width={13}
                        height={13}
                        className="
                          h-[13px] w-[13px] object-contain
                          drop-shadow-[0_0_5px_rgba(239,68,68,0.9)]
                        "
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Abas */}
        <div
          className="
            mt-3 grid grid-cols-2 gap-1
            rounded-[16px] border border-white/10
            bg-black/18 p-1
          "
        >
          <AbaPeriodo
            ativa={periodo === "mes"}
            onClick={() => setPeriodo("mes")}
          >
            Mês
          </AbaPeriodo>

          <AbaPeriodo
            ativa={periodo === "ano"}
            onClick={() => setPeriodo("ano")}
          >
            Ano
          </AbaPeriodo>
        </div>

        {/* Indicadores alinhados ao filtro */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Indicador
            icone="🔥"
            titulo="Persistência"
            valor={
              carregando
                ? "..."
                : `${dados.persistenciaDias} dias`
            }
            descricao="sequência atual"
            destaque
          />

          <Indicador
            imagemIcone={IMAGEM_JOIA_ESPIRITUAL}
            titulo="Diamantes"
            valor={
              carregandoPeriodo
                ? "..."
                : diamantesPeriodo
            }
            descricao={descricaoPeriodo}
          />

          <Indicador
            icone="🎯"
            titulo="Meta diária"
            valor={
              carregando
                ? "..."
                : `${Math.max(
                    1,
                    dados.metaDiaria,
                  )} min`
            }
            descricao="oração por dia"
          />

          <Indicador
            icone="⏱"
            titulo="Tempo de oração"
            valor={
              carregandoPeriodo
                ? "..."
                : `${tempoPeriodoMinutos} min`
            }
            descricao={descricaoPeriodo}
          />
        </div>

      </section>
    </div>
  );
}

/* =========================================================
   Aba de período
========================================================= */

function AbaPeriodo({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-[12px] px-2 py-2
        text-[0.62rem] font-black transition
        ${
          ativa
            ? "bg-[#e6b73f] text-[#241a0c] shadow-[0_5px_14px_rgba(230,183,63,0.2)]"
            : "text-white/52 hover:bg-white/[0.05]"
        }
      `}
    >
      {children}
    </button>
  );
}

/* =========================================================
   Indicador
========================================================= */

function Indicador({
  icone,
  imagemIcone,
  titulo,
  valor,
  descricao,
  destaque = false,
}: {
  icone?: string;
  imagemIcone?: string;
  titulo: string;
  valor: string | number;
  descricao: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`
        relative min-h-[64px] rounded-[16px] border
        px-3 py-1.5 backdrop-blur-sm
        ${
          destaque
            ? "border-orange-300/20 bg-orange-500/[0.08]"
            : "border-white/10 bg-black/16"
        }
      `}
    >
      <div className="flex min-h-[46px] items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white/40">
            {titulo}
          </div>

          <div className="mt-1 text-[0.9rem] font-black leading-none text-white">
            {valor}
          </div>
        </div>

        {imagemIcone ? (
          <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center">
            <Image
              src={imagemIcone}
              alt=""
              width={64}
              height={64}
              className="
                h-[64px] w-[64px] object-contain
                drop-shadow-[0_0_15px_rgba(239,68,68,0.94)]
              "
            />
          </div>
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center leading-none ${
              icone === "⏱"
                ? "h-[50px] w-[50px] text-[2.55rem]"
                : "h-[50px] w-[50px] text-[2.3rem]"
            }`}
          >
            {icone}
          </div>
        )}
      </div>

      <div className="-mt-0.5 text-[0.48rem] font-medium text-white/35">
        {descricao}
      </div>
    </div>
  );
}
