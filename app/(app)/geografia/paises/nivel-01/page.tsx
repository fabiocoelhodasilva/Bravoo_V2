"use client";

import { useEffect, useState } from "react";
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
    aliases: ["France"], // aceita clique vindo como France
  },
];

export default function Nivel01PaisesPage() {
  const router = useRouter();

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaPaises, setListaPaises] = useState<PaisItem[]>([]);
  const [pontuacao, setPontuacao] = useState(10);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [ultimoClique, setUltimoClique] = useState("");
  const [inicioJogo, setInicioJogo] = useState<number>(Date.now());
  const [finalizado, setFinalizado] = useState(false);

  function handleLogout() {
    router.push("/");
  }

  useEffect(() => {
    const embaralhados = [...PAISES_MAP].sort(() => Math.random() - 0.5);
    setListaPaises(embaralhados);
    setInicioJogo(Date.now());
  }, []);

  const paisAtual = listaPaises[indiceAtual];

  function finalizarJogo() {
    const tempoTotalSegundos = Math.floor((Date.now() - inicioJogo) / 1000);

    setFinalizado(true);
    setMensagem("🎉 Parabéns! Você concluiu a fase.");

    console.log("Resultado final:", {
      pontuacao,
      acertos,
      total_itens: listaPaises.length,
      tempo_total_segundos: tempoTotalSegundos,
    });

    // Próximo passo: salvar no Supabase
  }

  function handleCountryClick(nomePaisEmIngles: string) {
    if (finalizado || !paisAtual) return;

    setUltimoClique(nomePaisEmIngles);

    const nomesAceitos = [paisAtual.en, ...(paisAtual.aliases ?? [])];

    if (nomesAceitos.includes(nomePaisEmIngles)) {
      const novoTotalAcertos = acertos + 1;
      const proximoIndice = indiceAtual + 1;

      setMensagem(`✅ Acertou! Você encontrou ${paisAtual.pt}.`);
      setAcertos(novoTotalAcertos);

      if (proximoIndice >= listaPaises.length) {
        setTimeout(() => {
          finalizarJogo();
        }, 700);
      } else {
        setTimeout(() => {
          setIndiceAtual(proximoIndice);
          setMensagem("");
          setUltimoClique("");
        }, 700);
      }
    } else {
      setMensagem("❌ Continue tentando, não foi dessa vez.");
      setPontuacao((valorAtual) => Math.max(0, valorAtual - 1));
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex min-h-[calc(100vh-48px)] flex-col items-center px-4 pt-4 pb-6">
        <div className="text-center mb-2 text-sm opacity-80">
          Clique na região do seguinte país:
        </div>

        <h1 className="text-center text-3xl font-bold gradient-text mb-2">
          {paisAtual?.pt || "Carregando..."}
        </h1>

        <div className="text-sm mb-1">
          Pontuação: <span className="font-semibold">{pontuacao}</span>
        </div>

        <div className="text-sm mb-1 min-h-[24px] text-center">
          {mensagem}
        </div>

        <div className="text-xs mb-4 opacity-70 min-h-[18px] text-center">
          {ultimoClique ? `Você clicou em: ${ultimoClique}` : ""}
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-full max-w-[900px] aspect-square max-h-[70vh] sm:max-h-[72vh]">
            <GlobeScene
              modo="america-sul"
              onCountryClick={handleCountryClick}
            />
          </div>
        </div>

        {finalizado && (
          <div className="mt-4 text-center">
            <p className="text-base font-semibold mb-1">
              Fase concluída!
            </p>
            <p className="text-sm opacity-90">
              Acertos: {acertos} de {listaPaises.length}
            </p>
            <p className="text-sm opacity-90">
              Pontuação final: {pontuacao}
            </p>
          </div>
        )}

        <div className="mt-4">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}