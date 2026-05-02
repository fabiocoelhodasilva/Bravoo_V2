"use client";

import { useEffect, useState } from "react";
import {
  buscarMinutosOracaoHoje,
  buscarSaldoItensJardimHoje,
  registrarMomentoOracao,
} from "@/lib/gamificacao/oracao/oracao-actions";

export type JardimItemTipo =
  | "arvore_cerrado"
  | "arvore_selva"
  | "arvore_carvalho"
  | "arvore_japonesa"
  | "arvore_vermelha"
  | "flor_roxa"
  | "flor_geranio_roxo"
  | "flor_margarida_branca";

type ItensDoJardimPanelProps = {
  onClose: () => void;
  onSelectItem: (type: JardimItemTipo) => void;
  plantedItemTypes: JardimItemTipo[];
};

type ConquistaItem = {
  type: JardimItemTipo;
  nome: string;
  imagem: string;
};

const minhasConquistas: ConquistaItem[] = [
  { type: "flor_roxa", nome: "Flor roxa", imagem: "/imagens/jardim/itens/flor_roxa.png" },
  { type: "flor_geranio_roxo", nome: "Gerânio roxo", imagem: "/imagens/jardim/itens/geranio_roxo.png" },
  { type: "flor_margarida_branca", nome: "Margarida branca", imagem: "/imagens/jardim/itens/margarida_branca.png" },
  { type: "arvore_cerrado", nome: "Árvore do cerrado", imagem: "/imagens/jardim/itens/arvore_cerrado.png" },
  { type: "arvore_selva", nome: "Árvore da selva", imagem: "/imagens/jardim/itens/arvore_selva.png" },
  { type: "arvore_carvalho", nome: "Árvore carvalho", imagem: "/imagens/jardim/itens/arvore_carvalho.png" },
  { type: "arvore_japonesa", nome: "Árvore japonesa", imagem: "/imagens/jardim/itens/arvore_japonesa.png" },
  { type: "arvore_vermelha", nome: "Árvore vermelha", imagem: "/imagens/jardim/itens/arvore_vermelha.png" },
];

export default function ItensDoJardimPanel({
  onClose,
  onSelectItem,
}: ItensDoJardimPanelProps) {
  const [modalOracaoAberto, setModalOracaoAberto] = useState(false);
  const [minutosHoje, setMinutosHoje] = useState(0);
  const [saldoItensJardim, setSaldoItensJardim] = useState(0);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [salvandoOracao, setSalvandoOracao] = useState(false);
  const [carregandoOracoes, setCarregandoOracoes] = useState(true);

  const metaMinutosDia = 10;

  const progressoOracao = Math.min(
    100,
    Math.round((minutosHoje / metaMinutosDia) * 100)
  );

  const posicaoMarcador = Math.min(96, Math.max(4, progressoOracao));
  const metaConcluida = minutosHoje >= metaMinutosDia;
  const podeEscolherItem = saldoItensJardim > 0;

  useEffect(() => {
    async function carregarDadosOracaoHoje() {
      try {
        setCarregandoOracoes(true);

        const [totalMinutos, saldoAtual] = await Promise.all([
          buscarMinutosOracaoHoje(),
          buscarSaldoItensJardimHoje(),
        ]);

        setMinutosHoje(totalMinutos);
        setSaldoItensJardim(saldoAtual);
      } catch (error) {
        console.error("Erro ao carregar orações do dia:", error);
      } finally {
        setCarregandoOracoes(false);
      }
    }

    carregarDadosOracaoHoje();
  }, []);

  function handleResgatarItem(item: ConquistaItem) {
    if (!podeEscolherItem) {
      alert("Ore hoje para ganhar itens do jardim 🌱");
      return;
    }

    onSelectItem(item.type);
  }

  async function registrarOracao(minutos: number) {
    if (salvandoOracao) return;

    try {
      setSalvandoOracao(true);
      setMensagemSucesso("");

      const saldoAnterior = saldoItensJardim;
      const resultado = await registrarMomentoOracao(minutos);

      const novoTotalMinutos =
        resultado?.resumoJardim?.minutosHoje ?? minutosHoje + minutos;

      const novoSaldo =
        resultado?.resumoJardim?.saldoAtual ??
        (await buscarSaldoItensJardimHoje());

      const creditosNovos =
        resultado?.resumoJardim?.creditosNovos ??
        Math.max(0, novoSaldo - saldoAnterior);

      setMinutosHoje(novoTotalMinutos);
      setSaldoItensJardim(novoSaldo);
      setModalOracaoAberto(false);

      if (creditosNovos > 0) {
        setMensagemSucesso(
          `Oração registrada! Você ganhou ${creditosNovos} item(ns) do jardim 🌱`
        );
      } else {
        setMensagemSucesso(`Oração registrada! +${minutos} minuto(s).`);
      }

      setTimeout(() => setMensagemSucesso(""), 3500);
    } catch (error) {
      console.error("Erro ao registrar oração:", error);
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
                <h3 className="font-bold">Minhas orações do dia</h3>

                <p className="text-xs text-white/65">
                  Registre suas orações e ganhe itens do jardim.
                </p>

                <div className="mt-1 min-h-[18px] text-xs font-semibold text-[#5dc6a1]">
                  {mensagemSucesso}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOracaoAberto(true)}
                disabled={carregandoOracoes}
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
                    ? "Carregando..."
                    : `${minutosHoje}/${metaMinutosDia} min`}
                </span>
              </div>

              <div className="relative mt-4 h-2 rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5dc6a1] to-[#f1e6a7]"
                  style={{ width: `${progressoOracao}%` }}
                />

                {!carregandoOracoes && minutosHoje > 0 && (
                  <div
                    className="absolute -top-5 -translate-x-1/2 text-[11px] font-bold text-[#f1e6a7]"
                    style={{ left: `${posicaoMarcador}%` }}
                  >
                    {Math.min(minutosHoje, metaMinutosDia)} min
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {minhasConquistas.map((item) => {
              const itemDisponivel = podeEscolherItem;

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

                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className="mx-auto h-20"
                  />

                  <div className="mt-2 text-sm">{item.nome}</div>

                  <div className="mt-1 text-[11px] text-white/45">
                    {itemDisponivel ? "Disponível" : "Indisponível"}
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
      </div>
    </div>
  );
}