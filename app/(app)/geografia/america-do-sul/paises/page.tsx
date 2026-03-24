"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import GlobeScene from "@/components/geografia/GlobeScene";

type CapitalItem = {
  countryEn: string;
  countryPt: string;
  capital: string;
  aliases?: string[];
};

type CountryLabel = {
  name: string;
  lat: number;
  lng: number;
};

const CAPITAIS_AMERICA_SUL: CapitalItem[] = [
  { countryEn: "Argentina", countryPt: "Argentina", capital: "Buenos Aires" },
  { countryEn: "Bolivia", countryPt: "Bolívia", capital: "Sucre" },
  { countryEn: "Brazil", countryPt: "Brasil", capital: "Brasília" },
  { countryEn: "Chile", countryPt: "Chile", capital: "Santiago" },
  { countryEn: "Colombia", countryPt: "Colômbia", capital: "Bogotá" },
  { countryEn: "Ecuador", countryPt: "Equador", capital: "Quito" },
  { countryEn: "Guyana", countryPt: "Guiana", capital: "Georgetown" },
  { countryEn: "Paraguay", countryPt: "Paraguai", capital: "Assunção" },
  { countryEn: "Peru", countryPt: "Peru", capital: "Lima" },
  { countryEn: "Suriname", countryPt: "Suriname", capital: "Paramaribo" },
  { countryEn: "Uruguay", countryPt: "Uruguai", capital: "Montevidéu" },
  { countryEn: "Venezuela", countryPt: "Venezuela", capital: "Caracas" },
  {
    countryEn: "French Guiana",
    countryPt: "Guiana Francesa",
    capital: "Caiena",
    aliases: ["France"],
  },
];

const LABELS_AMERICA_SUL: CountryLabel[] = [
  { name: "Colômbia", lat: 4.5, lng: -73.5 },
  { name: "Venezuela", lat: 7.0, lng: -66.0 },
  { name: "Guiana", lat: 5.2, lng: -58.9 },
  { name: "Suriname", lat: 4.2, lng: -55.9 },
  { name: "Guiana Francesa", lat: 4.0, lng: -52.8 },
  { name: "Equador", lat: -1.3, lng: -78.3 },
  { name: "Peru", lat: -9.5, lng: -75.0 },
  { name: "Brasil", lat: -10.0, lng: -53.0 },
  { name: "Bolívia", lat: -16.7, lng: -64.5 },
  { name: "Paraguai", lat: -23.3, lng: -58.4 },
  { name: "Chile", lat: -30.0, lng: -71.0 },
  { name: "Argentina", lat: -37.0, lng: -64.0 },
  { name: "Uruguai", lat: -32.8, lng: -56.0 },
];

const PONTUACAO_INICIAL = 13;

export default function AmericaDoSulCapitaisPage() {
  const router = useRouter();

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaCapitais, setListaCapitais] = useState<CapitalItem[]>([]);
  const [pontuacao, setPontuacao] = useState(PONTUACAO_INICIAL);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [inicioJogo, setInicioJogo] = useState<number>(Date.now());
  const [finalizado, setFinalizado] = useState(false);

  const [correctCountries, setCorrectCountries] = useState<string[]>([]);
  const [flashingCountries, setFlashingCountries] = useState<string[]>([]);
  const [celebratingCountries, setCelebratingCountries] = useState<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  function handleLogout() {
    router.push("/");
  }

  function embaralharCapitais() {
    return [...CAPITAIS_AMERICA_SUL].sort(() => Math.random() - 0.5);
  }

  function traduzirPais(nome: string) {
    const pais = CAPITAIS_AMERICA_SUL.find((p) =>
      [p.countryEn, ...(p.aliases ?? [])].includes(nome)
    );
    return pais?.countryPt || nome;
  }

  useEffect(() => {
    setListaCapitais(embaralharCapitais());
    setInicioJogo(Date.now());
  }, []);

  const itemAtual = listaCapitais[indiceAtual];

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

    console.log("Resultado final - capitais:", {
      pontuacao: pontuacaoFinal,
      acertos: acertosFinais,
      total_itens: listaCapitais.length,
      tempo_total_segundos: Math.floor((Date.now() - inicioJogo) / 1000),
    });
  }

  function piscarErro(nomePais: string) {
    setFlashingCountries((prev) =>
      prev.includes(nomePais) ? prev : [...prev, nomePais]
    );

    setTimeout(() => {
      setFlashingCountries((prev) => prev.filter((item) => item !== nomePais));
    }, 320);
  }

  function animarAcerto(nomes: string[]) {
    setCelebratingCountries(nomes);

    setTimeout(() => {
      setCelebratingCountries([]);
    }, 360);
  }

  function reiniciarJogo() {
    setListaCapitais(embaralharCapitais());
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
    if (finalizado || !itemAtual) return;

    const nomesAceitos = [itemAtual.countryEn, ...(itemAtual.aliases ?? [])];
    const acertou = nomesAceitos.includes(nome);

    if (acertou) {
      const novoTotalAcertos = acertos + 1;

      setMensagem("✅ Parabéns!");
      setAcertos(novoTotalAcertos);
      tocarSom("acerto");
      animarAcerto(nomesAceitos);

      setCorrectCountries((prev) => [...new Set([...prev, ...nomesAceitos])]);

      if (indiceAtual + 1 >= listaCapitais.length) {
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

      <main className="min-h-[calc(100vh-48px)] flex flex-col items-center px-4 pt-3 sm:pt-4 pb-6">
        {!finalizado && (
          <div className="text-sm opacity-80 mb-1 sm:mb-2 text-center">
            Clique no país correspondente à seguinte capital:
          </div>
        )}

        <h1 className="text-3xl font-bold gradient-text mb-1 sm:mb-2 text-center">
          {finalizado
            ? "Parabéns, você concluiu o jogo!"
            : itemAtual?.capital || "Carregando..."}
        </h1>

        {finalizado ? (
          <>
            <div className="text-sm mb-2 text-center">
              Pontuação: {pontuacao} | Progresso: {listaCapitais.length}/{listaCapitais.length}
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
            <div className="text-sm mb-2 text-center">
              Pontuação: {pontuacao} | Progresso: {indiceAtual + 1}/{listaCapitais.length}
            </div>

            <div className="text-sm mb-3 text-center min-h-[24px]">
              {mensagem}
            </div>
          </>
        )}

        <div className="w-full flex justify-center">
          <div className="w-full max-w-[320px] sm:max-w-[520px] lg:max-w-[900px] aspect-square max-h-[48vh] sm:max-h-[60vh] lg:max-h-none">
            <GlobeScene
              modo="america-sul"
              onCountryClick={handleCountryClick}
              correctCountries={correctCountries}
              flashingCountries={flashingCountries}
              celebratingCountries={celebratingCountries}
              finalizado={finalizado}
              countryLabels={LABELS_AMERICA_SUL}
            />
          </div>
        </div>

        <div className="mt-5 mb-2">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}