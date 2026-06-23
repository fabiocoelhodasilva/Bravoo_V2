"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buscarSaldoItensJardimHoje,
  buscarStatusSaudeJardim,
} from "@/lib/gamificacao/oracao/oracao-actions";

export type JardimItemTipo =
  | "arvore_cerrado"
  | "arvore_selva"
  | "arvore_carvalho"
  | "arvore_japonesa"
  | "arvore_vermelha"
  | "flor_roxa"
  | "flor_geranio_roxo"
  | "flor_margarida_branca"
  | "jabami_sakura"
  | "japanese_maple"
  | "chinese_jungle_geranium"
  | "banana_tree"
  | "beaked_yucca_1730"
  | "beech_fern_plant"
  | "hibiscus"
  | "lavanda_roxa";

type ItensDoJardimPanelProps = {
  onClose: () => void;
  onSelectItem: (type: JardimItemTipo) => void;
  plantedItemTypes: JardimItemTipo[];
  minutosHojeInicial?: number;
  saldoItensJardimInicial?: number;
  saudeJardimPercentualInicial?: number;
  dadosOracaoPreCarregados?: boolean;
  onDadosOracaoAtualizados?: (dados: {
    minutosHoje: number;
    saldoItensJardim: number;
    saudeJardimPercentual?: number;
  }) => void;
};

type ConquistaItem = {
  type: JardimItemTipo;
  nome: string;
  imagem?: string;
  emoji?: string;
};

type CacheOracaoJardim = {
  minutosHoje: number;
  saldoItensJardim: number;
  saudeJardimPercentual?: number;
  atualizadoEm: number;
};

type EstagioSaudeJardim = {
  chave: "critico" | "cuidados" | "crescendo" | "saudavel" | "radiante";
  titulo: string;
  subtitulo: string;
  faixa: string;
  regra: string;
  cor: string;
  imagem: string;
  min: number;
  max: number;
};

const CACHE_ORACAO_JARDIM_KEY = "cache_oracao_jardim_hoje";
const CACHE_MAX_IDADE_MS = 1000 * 60 * 3;

const estagiosSaudeJardim: EstagioSaudeJardim[] = [
  {
    chave: "critico",
    titulo: "Estado Crítico",
    subtitulo: "Planta muito triste.",
    faixa: "0% a 19%",
    regra: "6+ dias sem orar",
    cor: "#c94a4a",
    imagem: "/imagens/jardim/estagios/critico.png",
    min: 0,
    max: 19,
  },
  {
    chave: "cuidados",
    titulo: "Precisa de Cuidados",
    subtitulo: "Ainda precisa de atenção.",
    faixa: "20% a 39%",
    regra: "1 a 5 dias sem orar",
    cor: "#e9891d",
    imagem: "/imagens/jardim/estagios/cuidados.png",
    min: 20,
    max: 39,
  },
  {
    chave: "crescendo",
    titulo: "Crescendo",
    subtitulo: "Estado intermediário.",
    faixa: "40% a 59%",
    regra: "1 a 5 dias seguidos",
    cor: "#f1c232",
    imagem: "/imagens/jardim/estagios/crescendo.png",
    min: 40,
    max: 59,
  },
  {
    chave: "saudavel",
    titulo: "Saudável",
    subtitulo: "Jardim bem cuidado.",
    faixa: "60% a 79%",
    regra: "6 a 10 dias seguidos",
    cor: "#8bd448",
    imagem: "/imagens/jardim/estagios/saudavel.png",
    min: 60,
    max: 79,
  },
  {
    chave: "radiante",
    titulo: "Radiante",
    subtitulo: "Melhor estágio possível!",
    faixa: "80% a 100%",
    regra: "11+ dias seguidos",
    cor: "#5dc6a1",
    imagem: "/imagens/jardim/estagios/radiante.png",
    min: 80,
    max: 100,
  },
];

const minhasConquistas: ConquistaItem[] = [
  { type: "flor_roxa", nome: "Flor roxa", imagem: "/imagens/jardim/itens/flor_roxa.png" },
  { type: "flor_geranio_roxo", nome: "Gerânio roxo", imagem: "/imagens/jardim/itens/geranio_roxo.png" },
  { type: "flor_margarida_branca", nome: "Margarida branca", imagem: "/imagens/jardim/itens/margarida_branca.png" },
  { type: "arvore_cerrado", nome: "Árvore do cerrado", imagem: "/imagens/jardim/itens/arvore_cerrado.png" },
  { type: "arvore_selva", nome: "Árvore da selva", imagem: "/imagens/jardim/itens/arvore_selva.png" },
  { type: "arvore_carvalho", nome: "Árvore carvalho", imagem: "/imagens/jardim/itens/arvore_carvalho.png" },
  { type: "arvore_japonesa", nome: "Árvore japonesa", imagem: "/imagens/jardim/itens/arvore_japonesa.png" },
  { type: "arvore_vermelha", nome: "Árvore vermelha", imagem: "/imagens/jardim/itens/arvore_vermelha.png" },
  { type: "jabami_sakura", nome: "Sakura japonesa", imagem: "/imagens/jardim/itens/jabami_sakura.png" },
  { type: "japanese_maple", nome: "Maple japonês", imagem: "/imagens/jardim/itens/maple_japones.png" },
  { type: "chinese_jungle_geranium", nome: "Gerânio selvagem", imagem: "/imagens/jardim/itens/geranio_vermelho.png" },
  { type: "banana_tree", nome: "Bananeira", imagem: "/imagens/jardim/itens/bananeira.png" },
  { type: "beaked_yucca_1730", nome: "Yucca", imagem: "/imagens/jardim/itens/yucca.png" },
  { type: "beech_fern_plant", nome: "Samambaia beech", imagem: "/imagens/jardim/itens/samambaia_vermelha.png" },
  { type: "hibiscus", nome: "Hibisco", imagem: "/imagens/jardim/itens/hibisco.png" },
  { type: "lavanda_roxa", nome: "Lavanda roxa", imagem: "/imagens/jardim/itens/lavanda.png" },
];

function lerCacheOracaoJardim(): CacheOracaoJardim | null {
  try {
    const bruto = sessionStorage.getItem(CACHE_ORACAO_JARDIM_KEY);
    if (!bruto) return null;

    const cache = JSON.parse(bruto) as CacheOracaoJardim;

    if (!Number.isFinite(cache.saldoItensJardim)) return null;
    if (!Number.isFinite(cache.atualizadoEm)) return null;

    if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;

    return cache;
  } catch {
    return null;
  }
}

function salvarCacheDadosJardim(
  saldoItensJardim: number,
  saudeJardimPercentual?: number
) {
  try {
    const cacheAtual = lerCacheOracaoJardim();

    const cache: CacheOracaoJardim = {
      minutosHoje: cacheAtual?.minutosHoje ?? 0,
      saldoItensJardim,
      saudeJardimPercentual:
        saudeJardimPercentual ?? cacheAtual?.saudeJardimPercentual,
      atualizadoEm: Date.now(),
    };

    sessionStorage.setItem(CACHE_ORACAO_JARDIM_KEY, JSON.stringify(cache));
  } catch {}
}

function preloadImagem(src: string) {
  const imagem = new Image();
  imagem.src = src;
}

function normalizarPercentual(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

function getEstagioAtualPorPercentual(percentual: number) {
  const percentualNormalizado = normalizarPercentual(percentual);

  return (
    estagiosSaudeJardim.find(
      (estagio) =>
        percentualNormalizado >= estagio.min &&
        percentualNormalizado <= estagio.max
    ) ?? estagiosSaudeJardim[0]
  );
}

function getStatusVisualPorPercentual(percentual: number) {
  const estagio = getEstagioAtualPorPercentual(percentual);

  const descricoes: Record<EstagioSaudeJardim["chave"], string> = {
    critico: "Seu jardim está precisando urgentemente de atenção.",
    cuidados: "Seu jardim precisa de mais momentos de oração.",
    crescendo: "Seu jardim está se desenvolvendo a cada dia.",
    saudavel: "Seu jardim está forte e bem cuidado.",
    radiante: "Seu jardim está cheio de vida e beleza.",
  };

  return {
    titulo: estagio.titulo,
    descricao: descricoes[estagio.chave],
    cor: estagio.cor,
  };
}

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
  plantedItemTypes,
  saldoItensJardimInicial,
  saudeJardimPercentualInicial,
  dadosOracaoPreCarregados = false,
  onDadosOracaoAtualizados,
}: ItensDoJardimPanelProps) {
  const cacheInicial = useMemo(() => {
    if (dadosOracaoPreCarregados) return null;
    return lerCacheOracaoJardim();
  }, [dadosOracaoPreCarregados]);

  const saldoInicial =
    saldoItensJardimInicial ?? cacheInicial?.saldoItensJardim ?? 0;

  const saudeInicial =
    saudeJardimPercentualInicial ?? cacheInicial?.saudeJardimPercentual ?? 30;

  const statusInicial = getStatusVisualPorPercentual(saudeInicial);

  const jaTemDadosIniciais =
    dadosOracaoPreCarregados ||
    typeof saldoItensJardimInicial === "number" ||
    typeof saudeJardimPercentualInicial === "number" ||
    Boolean(cacheInicial);

  const [saldoItensJardim, setSaldoItensJardim] = useState(saldoInicial);
  const [saudeJardim, setSaudeJardim] = useState(saudeInicial);
  const [statusJardim, setStatusJardim] = useState(statusInicial);

  const [carregandoJardim, setCarregandoJardim] =
    useState(!jaTemDadosIniciais);

  const carregamentoInicialRef = useRef(false);
  const painelMontadoRef = useRef(true);

  const itensPlantados = plantedItemTypes.length;
  const podeEscolherItem = saldoItensJardim > 0;
  const percentualSaude = normalizarPercentual(saudeJardim);
  const estagioAtual = getEstagioAtualPorPercentual(percentualSaude);

  useEffect(() => {
    painelMontadoRef.current = true;

    return () => {
      painelMontadoRef.current = false;
    };
  }, []);

  useEffect(() => {
    minhasConquistas.forEach((item) => {
      if (item.imagem) preloadImagem(item.imagem);
    });

    estagiosSaudeJardim.forEach((estagio) => preloadImagem(estagio.imagem));
    preloadImagem("/imagens/jardim/itens/icones/meu_jardim.png");
    preloadImagem("/imagens/jardim/itens/icones/disponiveis.png");
    preloadImagem("/imagens/jardim/itens/icones/plantados.png");
  }, []);

  useEffect(() => {
    if (!dadosOracaoPreCarregados) return;

    if (typeof saldoItensJardimInicial === "number") {
      setSaldoItensJardim(saldoItensJardimInicial);
    }

    if (typeof saudeJardimPercentualInicial === "number") {
      setSaudeJardim(saudeJardimPercentualInicial);
      setStatusJardim(getStatusVisualPorPercentual(saudeJardimPercentualInicial));
    }

    setCarregandoJardim(false);
  }, [
    dadosOracaoPreCarregados,
    saldoItensJardimInicial,
    saudeJardimPercentualInicial,
  ]);

  useEffect(() => {
    if (carregamentoInicialRef.current) return;

    carregamentoInicialRef.current = true;

    async function carregarSaldoJardim() {
      if (dadosOracaoPreCarregados) {
        setCarregandoJardim(false);
        return;
      }

      if (!cacheInicial) {
        setCarregandoJardim(true);
      }

      try {
        const [saldoAtual, saudeAtual] = await Promise.all([
          buscarSaldoItensJardimHoje(),
          buscarStatusSaudeJardim(),
        ]);

        if (!painelMontadoRef.current) return;

        setSaldoItensJardim(saldoAtual);
        setSaudeJardim(saudeAtual.percentual);

        setStatusJardim({
          titulo: saudeAtual.titulo,
          descricao: saudeAtual.descricao,
          cor: saudeAtual.cor,
        });

        salvarCacheDadosJardim(saldoAtual, saudeAtual.percentual);

        onDadosOracaoAtualizados?.({
          minutosHoje: cacheInicial?.minutosHoje ?? 0,
          saldoItensJardim: saldoAtual,
          saudeJardimPercentual: saudeAtual.percentual,
        });
      } catch (error) {
        console.error("Erro ao carregar saldo de itens do jardim:", error);
      } finally {
        if (painelMontadoRef.current) {
          setCarregandoJardim(false);
        }
      }
    }

    void carregarSaldoJardim();
  }, [cacheInicial, dadosOracaoPreCarregados, onDadosOracaoAtualizados]);

  function handleResgatarItem(item: ConquistaItem) {
    if (!podeEscolherItem) {
      alert("Você ainda não tem item disponível para plantar 🌱");
      return;
    }

    onSelectItem(item.type);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/45 px-3 pb-[90px] pt-[24px] backdrop-blur-[2px]">
      <div className="relative max-h-[calc(100dvh-110px)] w-full max-w-[920px] overflow-y-auto rounded-[28px] border border-white/10 bg-[#101514] text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold hover:bg-white/20"
        >
          ×
        </button>

        <div className="p-4 sm:p-5">
          <div className="mb-4 pr-10">
            <h2 className="text-2xl font-bold">Meu Jardim</h2>
          </div>

          <section className="mb-5 overflow-hidden rounded-3xl border border-[#5dc6a1]/25 bg-gradient-to-br from-[#0f2c24] via-[#13201d] to-[#101514] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: estagioAtual.cor }}
                >
                  Saúde do Jardim
                </div>

                <div
                  className="mt-1 text-xl font-black"
                  style={{ color: estagioAtual.cor }}
                >
                  {carregandoJardim ? "Carregando..." : statusJardim.titulo}
                </div>

                <p className="mt-1 max-w-[520px] text-sm font-medium leading-relaxed text-white/75">
                  {carregandoJardim
                    ? "Buscando a saúde atual do seu jardim..."
                    : statusJardim.descricao}
                </p>
              </div>

            </div>

            <div className="relative mt-2 overflow-hidden pb-1">
              <div className="relative px-1 pt-8 sm:min-w-[760px] sm:px-2">
                <div className="absolute left-[8%] right-[8%] top-[98px] h-1.5 rounded-full bg-gradient-to-r from-[#c94a4a] via-[#e9891d] via-[#f1c232] to-[#5dc6a1] sm:top-[135px] sm:h-2" />

                <div className="grid grid-cols-5 gap-3">
                  {estagiosSaudeJardim.map((estagio) => {
                    const ativo = estagio.chave === estagioAtual.chave;

                    return (
                      <div
                        key={estagio.chave}
                        className="relative flex min-h-[132px] flex-col items-center text-center sm:min-h-[172px]"
                      >
                        {ativo && (
                          <div className="absolute -top-3 rounded-full bg-[#8bd448] px-2 py-1 text-[9px] font-black text-[#101514] shadow-[0_0_20px_rgba(139,212,72,0.45)] sm:-top-4 sm:px-3 sm:text-[11px]">
                            Você está aqui
                          </div>
                        )}

                        <div
                          className={`relative mt-5 flex h-[68px] w-[68px] items-end justify-center rounded-full transition sm:mt-7 sm:h-[120px] sm:w-[120px] ${
                            ativo
                              ? "scale-110 border-2 shadow-[0_0_32px_rgba(139,212,72,0.35)]"
                              : "border border-white/0 opacity-80"
                          }`}
                          style={{
                            borderColor: ativo ? estagio.cor : "transparent",
                          }}
                        >
                          {ativo && (
                            <div
                              className="absolute inset-2 rounded-full opacity-25 blur-xl"
                              style={{ backgroundColor: estagio.cor }}
                            />
                          )}

                          <img
                            src={estagio.imagem}
                            alt={estagio.titulo}
                            className={`relative z-10 object-contain ${
                              estagio.chave === "critico" ||
                              estagio.chave === "cuidados"
                                ? "h-[52px] sm:h-[94px]"
                                : estagio.chave === "crescendo"
                                ? "h-[58px] sm:h-[108px]"
                                : "h-[64px] sm:h-[120px]"
                            }`}
                          />
                        </div>

                        <div
                          className="mt-2 text-[10px] font-black leading-tight sm:mt-3 sm:text-sm"
                          style={{ color: estagio.cor }}
                        >
                          {estagio.titulo}
                        </div>

                        <div className="mt-1 whitespace-nowrap text-[7px] font-semibold leading-tight text-white/55 sm:text-[11px]">
                          {estagio.regra}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="flex h-[135px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#5dc6a1]/20 bg-gradient-to-b from-[#0f1715] to-[#0a0f0e] p-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <img
                src="/imagens/jardim/itens/icones/disponiveis.png"
                alt="Disponíveis"
                className="h-[96px] w-[96px] object-contain drop-shadow-[0_0_18px_rgba(93,198,161,0.30)]"
              />

              <div className="mt-1 text-xl font-black">
                {carregandoJardim ? "..." : saldoItensJardim}
              </div>

              <div className="text-xs text-white/55">Disponíveis</div>
            </div>

            <div className="flex h-[135px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#5dc6a1]/20 bg-gradient-to-b from-[#0f1715] to-[#0a0f0e] p-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <img
                src="/imagens/jardim/itens/icones/plantados.png"
                alt="Plantados"
                className="h-[120px] w-[120px] object-contain drop-shadow-[0_0_18px_rgba(93,198,161,0.30)]"
              />

              <div className="mt-1 text-xl font-black">{itensPlantados}</div>

              <div className="text-xs text-white/55">Plantados</div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/85">
              Itens do Jardim
            </h3>

            <span className="text-xs font-semibold text-[#5dc6a1]">
              {carregandoJardim
                ? "Carregando..."
                : saldoItensJardim > 0
                ? `${saldoItensJardim} para plantar`
                : "Nenhum item disponível"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {minhasConquistas.map((item) => {
              const itemDisponivel = podeEscolherItem;
              const jaPlantadoNoJardim = plantedItemTypes.includes(item.type);

              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleResgatarItem(item)}
                  disabled={!itemDisponivel || carregandoJardim}
                  className={`relative rounded-xl border p-3 transition ${
                    itemDisponivel
                      ? "border-[#5dc6a1]/40 hover:bg-[#5dc6a1]/10"
                      : "cursor-not-allowed border-white/10 opacity-45 grayscale"
                  }`}
                >
                  {!itemDisponivel && !carregandoJardim && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] text-white/70">
                      🔒
                    </div>
                  )}

                  {itemDisponivel && (
                    <div className="absolute right-2 top-2 rounded-full bg-[#5dc6a1] px-2 py-1 text-[10px] font-bold text-[#101514]">
                      escolher
                    </div>
                  )}

                  {item.imagem ? (
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="mx-auto h-20 object-contain"
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center text-5xl">
                      {item.emoji ?? "🌱"}
                    </div>
                  )}

                  <div className="mt-2 text-sm">{item.nome}</div>

                  <div className="mt-1 text-[11px] text-white/45">
                    {itemDisponivel
                      ? jaPlantadoNoJardim
                        ? "Já existe no jardim"
                        : "Disponível"
                      : "Indisponível"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
