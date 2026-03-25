"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import GlobeScene from "@/components/geografia/GlobeScene";
import { supabase } from "@/lib/supabaseClient";

type PaisItem = {
  en: string;
  pt: string;
  aliases?: string[];
};

const PAISES_MAP: PaisItem[] = [
  { en: "Canada", pt: "Canadá" },
  {
    en: "USA",
    pt: "Estados Unidos",
    aliases: ["United States", "United States of America"],
  },
  { en: "Mexico", pt: "México" },
];

const PONTUACAO_INICIAL = 3;

const ATIVIDADE_ID = "44444444-4444-4444-4444-444444444001";
const MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";
const ASSUNTO_ID = "cb092890-2955-4eab-a84f-8f6548cb4eb6";
const DETALHE_ID = "44444444-4444-4444-4444-444444444002";

export default function AmericaDoNortePaisesPage() {
  const router = useRouter();

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaPaises, setListaPaises] = useState<PaisItem[]>([]);
  const [pontuacao, setPontuacao] = useState(PONTUACAO_INICIAL);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [inicioJogo, setInicioJogo] = useState<number>(Date.now());
  const [finalizado, setFinalizado] = useState(false);
  const [logoutCarregando, setLogoutCarregando] = useState(false);
  const [salvandoResultado, setSalvandoResultado] = useState(false);

  const [correctCountries, setCorrectCountries] = useState<string[]>([]);
  const [flashingCountries, setFlashingCountries] = useState<string[]>([]);
  const [celebratingCountries, setCelebratingCountries] = useState<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);

  async function handleLogout() {
    if (logoutCarregando) return;

    try {
      setLogoutCarregando(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        setLogoutCarregando(false);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
      setLogoutCarregando(false);
    }
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

  async function finalizarJogo(acertosFinais: number, pontuacaoFinal: number) {
    setFinalizado(true);
    setMensagem("");
    tocarSom("vitoria");

    const tempoTotalSegundos = Math.floor((Date.now() - inicioJogo) / 1000);

    try {
      setSalvandoResultado(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao buscar usuário logado:", userError);
        return;
      }

      if (!user) {
        console.error("Usuário não encontrado para salvar a sessão.");
        return;
      }

      const { error: rpcError } = await supabase.rpc(
        "next_registrar_sessao_e_premiar",
        {
          p_usuario_id: user.id,
          p_atividade_id: ATIVIDADE_ID,
          p_materia_id: MATERIA_ID,
          p_assunto_id: ASSUNTO_ID,
          p_detalhe_id: DETALHE_ID,
          p_pontuacao: pontuacaoFinal,
          p_acertos: acertosFinais,
          p_total_itens: listaPaises.length,
          p_tempo_total_segundos: tempoTotalSegundos,
        }
      );

      if (rpcError) {
        console.error("Erro ao registrar sessão e premiar:", rpcError);
        return;
      }

      console.log("Sessão registrada com sucesso:", {
        usuario_id: user.id,
        atividade_id: ATIVIDADE_ID,
        materia_id: MATERIA_ID,
        assunto_id: ASSUNTO_ID,
        detalhe_id: DETALHE_ID,
        pontuacao: pontuacaoFinal,
        acertos: acertosFinais,
        total_itens: listaPaises.length,
        tempo_total_segundos: tempoTotalSegundos,
      });
    } catch (error) {
      console.error("Erro inesperado ao finalizar jogo:", error);
    } finally {
      setSalvandoResultado(false);
    }
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
    setSalvandoResultado(false);
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
        setTimeout(() => {
          void finalizarJogo(novoTotalAcertos, pontuacao);
        }, 700);
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

      <main className="min-h-[calc(100vh-48px)] flex flex-col px-4 pt-3 sm:pt-4 pb-4">
        <div className="flex flex-col items-center w-full">
          {!finalizado && (
            <div className="text-sm opacity-80 mb-1 sm:mb-2 text-center">
              Clique na região do seguinte país:
            </div>
          )}

          <h1 className="text-3xl font-bold gradient-text mb-1 sm:mb-2 text-center">
            {finalizado ? "Parabéns, você concluiu o jogo!" : paisAtual?.pt}
          </h1>

          {finalizado ? (
            <>
              <div className="text-sm mb-2 text-center">
                Pontuação: {pontuacao} | Progresso: {listaPaises.length}/
                {listaPaises.length}
              </div>

              {salvandoResultado && (
                <div className="text-xs text-center opacity-80 mb-2">
                  Salvando seu resultado...
                </div>
              )}

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
                Pontuação: {pontuacao} | Progresso: {indiceAtual + 1}/
                {listaPaises.length}
              </div>

              <div className="text-sm mb-3 text-center min-h-[24px]">
                {mensagem}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 w-full flex justify-center items-center">
          <div className="w-full max-w-[92vw] sm:max-w-[520px] lg:max-w-[900px] aspect-square max-h-[68vh] sm:max-h-[60vh] lg:max-h-none">
            <GlobeScene
              modo="america-norte"
              onCountryClick={handleCountryClick}
              correctCountries={correctCountries}
              flashingCountries={flashingCountries}
              celebratingCountries={celebratingCountries}
              finalizado={finalizado}
            />
          </div>
        </div>

        <div className="mt-auto pt-4 pb-2 flex justify-center">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}