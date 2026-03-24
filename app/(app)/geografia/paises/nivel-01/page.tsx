"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import GlobeScene from "@/components/geografia/GlobeScene";

type PaisItem = {
  en: string;
  pt: string;
  aliases?: string[];
};

const PAISES_MAP: PaisItem[] = [
  { en: "Argentina", pt: "Argentina" },
  { en: "Bolivia", pt: "Bolívia" },
  { en: "Brazil", pt: "Brasil" },
  { en: "Chile", pt: "Chile" },
  { en: "Colombia", pt: "Colômbia" },
  { en: "Ecuador", pt: "Equador" },
  { en: "Guyana", pt: "Guiana" },
  { en: "Paraguay", pt: "Paraguai" },
  { en: "Peru", pt: "Peru" },
  { en: "Suriname", pt: "Suriname" },
  { en: "Uruguay", pt: "Uruguai" },
  { en: "Venezuela", pt: "Venezuela" },
  {
    en: "French Guiana",
    pt: "Guiana Francesa",
    aliases: ["France"],
  },
];

const PONTUACAO_INICIAL = 13;

export default function Nivel01PaisesPage() {
  const router = useRouter();

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaPaises, setListaPaises] = useState<PaisItem[]>([]);
  const [pontuacao, setPontuacao] = useState(PONTUACAO_INICIAL);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [inicioJogo, setInicioJogo] = useState<number>(Date.now());
  const [finalizado, setFinalizado] = useState(false);

  const [correctCountries, setCorrectCountries] = useState<string[]>([]);
  const [flashingCountries, setFlashingCountries] = useState<string[]>([]);
  const [celebratingCountries, setCelebratingCountries] = useState<string[]>(
    []
  );

  const audioContextRef = useRef<AudioContext | null>(null);

  function handleLogout() {
    router.push("/");
  }

  function embaralharPaises() {
    return [...PAISES_MAP].sort(() => Math.random() - 0.5);
  }

  function traduzirPais(nome: string) {
    const pais = PAISES_MAP.find((p) =>
      [p.en, ...(p.aliases ?? [])].includes(nome)
    );
    return pais?.pt || nome;
  }

  useEffect(() => {
    setListaPaises(embaralharPaises());
    setInicioJogo(Date.now());
  }, []);

  const paisAtual = listaPaises[indiceAtual];

  function garantirAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioCtx) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  function tocarSom(tipo: "acerto" | "erro" | "vitoria") {
    const ctx = garantirAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = tipo === "acerto" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(
      tipo === "acerto" ? 640 : 220,
      ctx.currentTime
    );

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  }

  function finalizarJogo(acertosFinais: number, pontuacaoFinal: number) {
    setFinalizado(true);
    setMensagem("");
    tocarSom("vitoria");

    console.log("Resultado final:", {
      pontuacao: pontuacaoFinal,
      acertos: acertosFinais,
      total_itens: listaPaises.length,
      tempo_total_segundos: Math.floor((Date.now() - inicioJogo) / 1000),
    });
  }

  function piscarErro(nomePais: string) {
    setFlashingCountries((prev) => [...prev, nomePais]);

    setTimeout(() => {
      setFlashingCountries((prev) =>
        prev.filter((item) => item !== nomePais)
      );
    }, 320);
  }

  function animarAcerto(nomes: string[]) {
    setCelebratingCountries(nomes);

    setTimeout(() => {
      setCelebratingCountries([]);
    }, 360);
  }

  function reiniciarJogo() {
    setListaPaises(embaralharPaises());
    setIndiceAtual(0);
    setPontuacao(PONTUACAO_INICIAL);
    setAcertos(0);
    setMensagem("");
    setInicioJogo(Date.now());
    setFinalizado(false);
    setCorrectCountries([]);
    setFlashingCountries([]);
    setCelebratingCountries([]);
  }

  function handleCountryClick(nome: string) {
    if (finalizado || !paisAtual) return;

    const nomesAceitos = [paisAtual.en, ...(paisAtual.aliases ?? [])];
    const acertou = nomesAceitos.includes(nome);

    if (acertou) {
      const novoTotalAcertos = acertos + 1;

      setMensagem("✅ Parabéns!");
      setAcertos(novoTotalAcertos);
      tocarSom("acerto");
      animarAcerto(nomesAceitos);

      setCorrectCountries((prev) => [...new Set([...prev, ...nomesAceitos])]);

      if (indiceAtual + 1 >= listaPaises.length) {
        setTimeout(() => finalizarJogo(novoTotalAcertos, pontuacao), 700);
      } else {
        setTimeout(() => {
          setIndiceAtual((i) => i + 1);
          setMensagem("");
        }, 700);
      }
    } else {
      const nomePt = traduzirPais(nome);
      setMensagem(`Quase! Você clicou em ${nomePt}, continue tentando.`);
      setPontuacao((p) => Math.max(0, p - 1));
      tocarSom("erro");
      piscarErro(nome);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-4 pt-4 pb-6">
        {!finalizado && (
          <div className="text-sm opacity-80 mb-2">
            Clique na região do seguinte país:
          </div>
        )}

        <h1 className="text-3xl font-bold gradient-text mb-2 text-center">
          {finalizado
            ? "Parabéns, você concluiu o jogo!"
            : paisAtual?.pt}
        </h1>

        {finalizado ? (
          <>
            <div className="text-sm mb-2 text-center">
              Pontuação: {pontuacao} | Progresso: {listaPaises.length}/{listaPaises.length}
            </div>

            <div className="text-sm text-center">
              <button
                onClick={reiniciarJogo}
                className="underline hover:text-sky-300 transition"
              >
                Jogar novamente?
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm mb-2">
              Pontuação: {pontuacao} | Progresso: {indiceAtual + 1}/{listaPaises.length}
            </div>

            <div className="text-sm mb-3 text-center min-h-[24px]">
              {mensagem}
            </div>
          </>
        )}

        <div className="w-full max-w-[900px] aspect-square">
          <GlobeScene
            modo="america-sul"
            onCountryClick={handleCountryClick}
            correctCountries={correctCountries}
            flashingCountries={flashingCountries}
            celebratingCountries={celebratingCountries}
            finalizado={finalizado}
          />
        </div>

        <div className="mt-4">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}