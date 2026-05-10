"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buscarMinutosOracaoHoje,
  buscarSaldoItensJardimHoje,
  registrarMomentoOracao,
} from "@/lib/gamificacao/oracao/oracao-actions";
import RegrasJardimModal from "./RegrasJardimModal";

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

  /**
   * Dados opcionais para permitir que o GardenScene pré-carregue as informações
   * antes do painel abrir. Se não forem enviados, este painel continua buscando
   * sozinho, preservando o comportamento atual.
   */
  minutosHojeInicial?: number;
  saldoItensJardimInicial?: number;
  dadosOracaoPreCarregados?: boolean;
  onDadosOracaoAtualizados?: (dados: {
    minutosHoje: number;
    saldoItensJardim: number;
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
  atualizadoEm: number;
};

const CACHE_ORACAO_JARDIM_KEY = "cache_oracao_jardim_hoje";
const CACHE_MAX_IDADE_MS = 1000 * 60 * 3;

const minhasConquistas: ConquistaItem[] = [
  {
    type: "flor_roxa",
    nome: "Flor roxa",
    imagem: "/imagens/jardim/itens/flor_roxa.png",
  },
  {
    type: "flor_geranio_roxo",
    nome: "Gerânio roxo",
    imagem: "/imagens/jardim/itens/geranio_roxo.png",
  },
  {
    type: "flor_margarida_branca",
    nome: "Margarida branca",
    imagem: "/imagens/jardim/itens/margarida_branca.png",
  },
  {
    type: "arvore_cerrado",
    nome: "Árvore do cerrado",
    imagem: "/imagens/jardim/itens/arvore_cerrado.png",
  },
  {
    type: "arvore_selva",
    nome: "Árvore da selva",
    imagem: "/imagens/jardim/itens/arvore_selva.png",
  },
  {
    type: "arvore_carvalho",
    nome: "Árvore carvalho",
    imagem: "/imagens/jardim/itens/arvore_carvalho.png",
  },
  {
    type: "arvore_japonesa",
    nome: "Árvore japonesa",
    imagem: "/imagens/jardim/itens/arvore_japonesa.png",
  },
  {
    type: "arvore_vermelha",
    nome: "Árvore vermelha",
    imagem: "/imagens/jardim/itens/arvore_vermelha.png",
  },

  {
    type: "jabami_sakura",
    nome: "Sakura japonesa",
    imagem: "/imagens/jardim/itens/jabami_sakura.png",
  },
  {
    type: "japanese_maple",
    nome: "Maple japonês",
    imagem: "/imagens/jardim/itens/maple_japones.png",
  },
  {
    type: "chinese_jungle_geranium",
    nome: "Gerânio selvagem",
    imagem: "/imagens/jardim/itens/geranio_vermelho.png",
  },
  {
    type: "banana_tree",
    nome: "Bananeira",
    imagem: "/imagens/jardim/itens/bananeira.png",
  },
  {
    type: "beaked_yucca_1730",
    nome: "Yucca",
    imagem: "/imagens/jardim/itens/yucca.png",
  },
  {
    type: "beech_fern_plant",
    nome: "Samambaia beech",
    imagem: "/imagens/jardim/itens/samambaia_vermelha.png",
  },
  {
    type: "hibiscus",
    nome: "Hibisco",
    imagem: "/imagens/jardim/itens/hibisco.png",
  },
  {
    type: "lavanda_roxa",
    nome: "Lavanda roxa",
    imagem: "/imagens/jardim/itens/lavanda.png",
  },
];

function salvarCacheOracaoJardim(minutosHoje: number, saldoItensJardim: number) {
  try {
    const cache: CacheOracaoJardim = {
      minutosHoje,
      saldoItensJardim,
      atualizadoEm: Date.now(),
    };

    sessionStorage.setItem(CACHE_ORACAO_JARDIM_KEY, JSON.stringify(cache));
  } catch {}
}

function lerCacheOracaoJardim(): CacheOracaoJardim | null {
  try {
    const bruto = sessionStorage.getItem(CACHE_ORACAO_JARDIM_KEY);

    if (!bruto) return null;

    const cache = JSON.parse(bruto) as CacheOracaoJardim;

    if (!Number.isFinite(cache.minutosHoje)) return null;
    if (!Number.isFinite(cache.saldoItensJardim)) return null;
    if (!Number.isFinite(cache.atualizadoEm)) return null;

    const cacheAindaUtil = Date.now() - cache.atualizadoEm <= CACHE_MAX_IDADE_MS;

    if (!cacheAindaUtil) return null;

    return cache;
  } catch {
    return null;
  }
}

function preloadImagem(src: string) {
  const imagem = new Image();
  imagem.src = src;
}

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
  plantedItemTypes,
  minutosHojeInicial,
  saldoItensJardimInicial,
  dadosOracaoPreCarregados = false,
  onDadosOracaoAtualizados,
}: ItensDoJardimPanelProps) {
  const cacheInicial = useMemo(() => {
    if (dadosOracaoPreCarregados) return null;

    return lerCacheOracaoJardim();
  }, [dadosOracaoPreCarregados]);

  const minutosIniciais =
    minutosHojeInicial ?? cacheInicial?.minutosHoje ?? 0;

  const saldoInicial =
    saldoItensJardimInicial ?? cacheInicial?.saldoItensJardim ?? 0;

  const jaTemDadosIniciais =
    dadosOracaoPreCarregados ||
    typeof minutosHojeInicial === "number" ||
    typeof saldoItensJardimInicial === "number" ||
    Boolean(cacheInicial);

  const [modalOracaoAberto, setModalOracaoAberto] = useState(false);
  const [modalRegrasAberto, setModalRegrasAberto] = useState(false);
  const [minutosHoje, setMinutosHoje] = useState(minutosIniciais);
  const [saldoItensJardim, setSaldoItensJardim] = useState(saldoInicial);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [salvandoOracao, setSalvandoOracao] = useState(false);
  const [carregandoOracoes, setCarregandoOracoes] =
    useState(!jaTemDadosIniciais);

  const carregamentoInicialRef = useRef(false);
  const painelMontadoRef = useRef(true);

  const metaMinutosDia = 10;

  const progressoOracao = Math.min(
    100,
    Math.round((minutosHoje / metaMinutosDia) * 100)
  );

  const posicaoMarcador = Math.min(96, Math.max(4, progressoOracao));
  const metaConcluida = minutosHoje >= metaMinutosDia;
  const podeEscolherItem = saldoItensJardim > 0;

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

    preloadImagem("/imagens/jardim/itens/botao_oracao.png");
  }, []);

  useEffect(() => {
    if (!dadosOracaoPreCarregados) return;
    if (typeof minutosHojeInicial === "number") {
      setMinutosHoje(minutosHojeInicial);
    }
    if (typeof saldoItensJardimInicial === "number") {
      setSaldoItensJardim(saldoItensJardimInicial);
    }

    setCarregandoOracoes(false);
  }, [
    dadosOracaoPreCarregados,
    minutosHojeInicial,
    saldoItensJardimInicial,
  ]);

  useEffect(() => {
    if (carregamentoInicialRef.current) return;

    carregamentoInicialRef.current = true;

    async function carregarDadosOracaoHoje() {
      if (dadosOracaoPreCarregados) {
        setCarregandoOracoes(false);
        return;
      }

      if (!cacheInicial) {
        setCarregandoOracoes(true);
      }

      try {
        const [totalMinutos, saldoAtual] = await Promise.all([
          buscarMinutosOracaoHoje(),
          buscarSaldoItensJardimHoje(),
        ]);

        if (!painelMontadoRef.current) return;

        setMinutosHoje(totalMinutos);
        setSaldoItensJardim(saldoAtual);
        salvarCacheOracaoJardim(totalMinutos, saldoAtual);
        onDadosOracaoAtualizados?.({
          minutosHoje: totalMinutos,
          saldoItensJardim: saldoAtual,
        });
      } catch (error) {
        console.error("Erro ao carregar orações do dia:", error);
      } finally {
        if (painelMontadoRef.current) {
          setCarregandoOracoes(false);
        }
      }
    }

    void carregarDadosOracaoHoje();
  }, [cacheInicial, dadosOracaoPreCarregados, onDadosOracaoAtualizados]);

  function handleResgatarItem(item: ConquistaItem) {
    if (!podeEscolherItem) {
      alert("Ore hoje para ganhar itens do jardim 🌱");
      return;
    }

    onSelectItem(item.type);
  }

  async function registrarOracao(minutos: number) {
    if (salvandoOracao) return;

    const minutosAntes = minutosHoje;
    const saldoAntes = saldoItensJardim;
    const minutosOtimista = minutosAntes + minutos;

    try {
      setSalvandoOracao(true);
      setMensagemSucesso("");
      setModalOracaoAberto(false);
      setMinutosHoje(minutosOtimista);

      const resultado = await registrarMomentoOracao(minutos);

      const novoTotalMinutos =
        resultado?.resumoJardim?.minutosHoje ?? minutosOtimista;

      const novoSaldo =
        resultado?.resumoJardim?.saldoAtual ??
        (await buscarSaldoItensJardimHoje());

      const creditosNovos =
        resultado?.resumoJardim?.creditosNovos ??
        Math.max(0, novoSaldo - saldoAntes);

      setMinutosHoje(novoTotalMinutos);
      setSaldoItensJardim(novoSaldo);
      salvarCacheOracaoJardim(novoTotalMinutos, novoSaldo);
      onDadosOracaoAtualizados?.({
        minutosHoje: novoTotalMinutos,
        saldoItensJardim: novoSaldo,
      });

      if (creditosNovos > 0) {
        setMensagemSucesso(
          `Oração registrada! Você ganhou ${creditosNovos} item(ns) do jardim 🌱`
        );
      } else {
        setMensagemSucesso(`Oração registrada! +${minutos} minuto(s).`);
      }

      setTimeout(() => {
        if (painelMontadoRef.current) setMensagemSucesso("");
      }, 3500);
    } catch (error) {
      console.error("Erro ao registrar oração:", error);

      setMinutosHoje(minutosAntes);
      setSaldoItensJardim(saldoAntes);
      salvarCacheOracaoJardim(minutosAntes, saldoAntes);
      onDadosOracaoAtualizados?.({
        minutosHoje: minutosAntes,
        saldoItensJardim: saldoAntes,
      });

      alert("Não foi possível registrar a oração. Tente novamente.");
    } finally {
      setSalvandoOracao(false);
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/45 px-3 pb-[90px] pt-[24px] backdrop-blur-[2px]">
      <style jsx>{`
        .pulse-local {
          animation: pulseLocal 2s ease-in-out infinite;
        }

        @keyframes pulseLocal {
          0% {
            box-shadow: 0 0 0 0 rgba(93, 198, 161, 0.6);
            transform: scale(1);
          }

          50% {
            box-shadow: 0 0 0 10px rgba(93, 198, 161, 0);
            transform: scale(1.05);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(93, 198, 161, 0);
            transform: scale(1);
          }
        }
      `}</style>

      <div className="relative max-h-[calc(100dvh-110px)] w-full max-w-[720px] overflow-y-auto rounded-[28px] border border-white/10 bg-[#101514] text-white shadow-2xl">
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

          <div className="mb-5 rounded-3xl border border-[#5dc6a1]/25 bg-gradient-to-br from-[#f1e6a7]/15 via-[#5dc6a1]/10 to-[#3d7a99]/15 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#f1e6a7] to-[#bfe8a8]">
                <img
                  src="/imagens/jardim/itens/botao_oracao.png"
                  alt="Oração"
                  className="h-[70px]"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-bold">Minhas orações</h3>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setModalRegrasAberto(true);
                  }}
                  className="mt-0.5 text-xs font-semibold text-[#5dc6a1] underline underline-offset-4 hover:text-[#f1e6a7]"
                >
                  Regras
                </button>

                <div className="mt-1 min-h-[18px] text-xs font-semibold text-[#5dc6a1]">
                  {mensagemSucesso}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOracaoAberto(true)}
                disabled={carregandoOracoes || salvandoOracao}
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#5dc6a1] text-3xl font-bold text-[#101514] disabled:opacity-50 ${
                  !metaConcluida && !carregandoOracoes ? "pulse-local" : ""
                }`}
              >
                +
              </button>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/60">
                <span>Meta diária = {metaMinutosDia} minutos</span>
                <span>
                  {carregandoOracoes
                    ? "Atualizando..."
                    : `${minutosHoje}/${metaMinutosDia} min`}
                </span>
              </div>

              <div className="relative mt-4 h-2 rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5dc6a1] to-[#f1e6a7] transition-all duration-700 ease-out"
                  style={{ width: `${progressoOracao}%` }}
                />

                {!carregandoOracoes && minutosHoje > 0 && (
                  <div
                    className="absolute -top-5 -translate-x-1/2 text-[11px] font-bold text-[#f1e6a7] transition-all duration-700 ease-out"
                    style={{ left: `${posicaoMarcador}%` }}
                  >
                    {Math.min(minutosHoje, metaMinutosDia)} min
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs font-semibold text-[#5dc6a1]">
                {carregandoOracoes
                  ? "Verificando itens disponíveis..."
                  : saldoItensJardim > 0
                  ? `${saldoItensJardim} item(ns) disponível(is) para plantar`
                  : "Nenhum item disponível para plantar agora"}
              </div>
            </div>
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
                  disabled={!itemDisponivel || carregandoOracoes}
                  className={`relative rounded-xl border p-3 transition ${
                    itemDisponivel
                      ? "border-[#5dc6a1]/40 hover:bg-[#5dc6a1]/10"
                      : "cursor-not-allowed border-white/10 opacity-45 grayscale"
                  }`}
                >
                  {!itemDisponivel && !carregandoOracoes && (
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
                      className="mx-auto h-20"
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

        {modalOracaoAberto && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-[320px] rounded-3xl bg-[#111] p-6 text-center">
              <div className="mb-2 text-4xl">🙏</div>

              <h3 className="text-lg font-bold">Oração realizada</h3>

              <p className="mb-4 text-sm text-white/60">
                Quanto tempo durou esta oração?
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[1, 3, 5, 10].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => registrarOracao(m)}
                    disabled={salvandoOracao}
                    className={`rounded-xl bg-[#5dc6a1]/10 p-4 hover:bg-[#5dc6a1]/20 ${
                      salvandoOracao ? "cursor-wait opacity-50" : ""
                    }`}
                  >
                    <div className="text-xl font-bold text-[#5dc6a1]">
                      {m}
                    </div>
                    <div className="text-xs text-white/60">min</div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setModalOracaoAberto(false)}
                disabled={salvandoOracao}
                className="mt-4 w-full rounded-xl bg-white/10 py-2"
              >
                {salvandoOracao ? "Salvando..." : "Cancelar"}
              </button>
            </div>
          </div>
        )}

        {modalRegrasAberto && (
          <RegrasJardimModal onClose={() => setModalRegrasAberto(false)} />
        )}
      </div>
    </div>
  );
}
