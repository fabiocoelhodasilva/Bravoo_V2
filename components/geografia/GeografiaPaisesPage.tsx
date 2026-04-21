"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import { supabase } from "@/lib/supabase/client";
import { salvarSessaoAtividade } from "@/lib/sessoes/sessoes-service";
import type { RegiaoConfig, PaisItem } from "@/lib/geografia/regioes-config";

const GlobeScene = dynamic(
  () => import("@/components/geografia/GlobeScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando globo.</div>
      </div>
    ),
  }
);

type Props = {
  config: RegiaoConfig;
  children?: React.ReactNode;
};

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function embaralharArray<T>(lista: T[]) {
  return [...lista].sort(() => Math.random() - 0.5);
}

function montarListaBrasilEstadosPorRegiao(lista: PaisItem[]) {
  const grupos = new Map<string, PaisItem[]>();

  lista.forEach((item) => {
    const regiao = item.regiao || "Sem região";

    if (!grupos.has(regiao)) {
      grupos.set(regiao, []);
    }

    grupos.get(regiao)!.push(item);
  });

  const ordemRegioes = embaralharArray(Array.from(grupos.keys()));
  const resultado: PaisItem[] = [];

  ordemRegioes.forEach((regiao) => {
    const estadosDaRegiao = grupos.get(regiao) || [];
    resultado.push(...embaralharArray(estadosDaRegiao));
  });

  return resultado;
}

export default function GeografiaPaisesPage({ config, children }: Props) {
  const router = useRouter();

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaPaises, setListaPaises] = useState<PaisItem[]>([]);
  const [pontuacao, setPontuacao] = useState(config.pontuacaoInicial);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [inicioJogo, setInicioJogo] = useState(Date.now());
  const [finalizado, setFinalizado] = useState(false);
  const [interacaoLiberada, setInteracaoLiberada] = useState(false);

  const [correctCountries, setCorrectCountries] = useState<string[]>([]);
  const [flashingCountries, setFlashingCountries] = useState<string[]>([]);
  const [celebratingCountries, setCelebratingCountries] = useState<string[]>(
    []
  );

  const audioRef = useRef<AudioContext | null>(null);
  const sessaoJaFinalizadaRef = useRef(false);
  const liberarInteracaoTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const paisesMap = useMemo(() => config.paises, [config.paises]);

  const allowedCountryNames = useMemo(() => {
    return config.paises.flatMap((pais) => [pais.en, ...(pais.aliases ?? [])]);
  }, [config.paises]);

  const mostrarBotaoVoltarPadrao = !config.slug.startsWith("europa-fase-");

  function encontrarPaisPorNome(nome: string) {
    const nomeNormalizado = normalizarTexto(nome);

    return paisesMap.find((pais) => {
      const nomes = [pais.en, ...(pais.aliases ?? [])];
      return nomes.some((item) => normalizarTexto(item) === nomeNormalizado);
    });
  }

  function traduzir(nome: string) {
    const paisEncontrado = encontrarPaisPorNome(nome);

    if (!paisEncontrado) return nome;

    if (config.modoGlobo === "brasil-capitais") {
      return paisEncontrado.estadoNome || paisEncontrado.en;
    }

    return paisEncontrado.pt || nome;
  }

  function limparTimerInteracao() {
    if (liberarInteracaoTimeoutRef.current) {
      clearTimeout(liberarInteracaoTimeoutRef.current);
      liberarInteracaoTimeoutRef.current = null;
    }
  }

  function montarListaInicial() {
    if (
      config.modoGlobo === "brasil-estados" ||
      config.modoGlobo === "brasil-capitais"
    ) {
      return montarListaBrasilEstadosPorRegiao(paisesMap);
    }

    return embaralharArray(paisesMap);
  }

  function iniciarJogo() {
    limparTimerInteracao();

    setIndiceAtual(0);
    setListaPaises(montarListaInicial());
    setPontuacao(config.pontuacaoInicial);
    setAcertos(0);
    setMensagem("");
    setInicioJogo(Date.now());
    setFinalizado(false);
    setInteracaoLiberada(false);
    setCorrectCountries([]);
    setFlashingCountries([]);
    setCelebratingCountries([]);
    sessaoJaFinalizadaRef.current = false;

    liberarInteracaoTimeoutRef.current = setTimeout(() => {
      setInteracaoLiberada(true);
      liberarInteracaoTimeoutRef.current = null;
    }, 800);
  }

  useEffect(() => {
    iniciarJogo();

    return () => {
      limparTimerInteracao();
    };
  }, [config.slug, config.pontuacaoInicial, paisesMap]);

  const paisAtual = listaPaises[indiceAtual];

  function play(tipo: "acerto" | "erro" | "vitoria") {
    if (typeof window === "undefined") return;

    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtor) return;

    if (!audioRef.current) {
      audioRef.current = new AudioCtor();
    }

    const ctx = audioRef.current;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tipo === "erro" ? "sine" : "triangle";
    osc.frequency.value =
      tipo === "acerto" ? 600 : tipo === "vitoria" ? 760 : 200;

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  async function finalizar(acertosFinais: number, pontuacaoFinal: number) {
    if (sessaoJaFinalizadaRef.current) {
      return;
    }

    sessaoJaFinalizadaRef.current = true;

    setFinalizado(true);
    play("vitoria");
    setMensagem("");

    const tempo = Math.floor((Date.now() - inicioJogo) / 1000);

    try {
      await salvarSessaoAtividade({
        atividade_id: config.atividadeId,
        materia_id: config.materiaId,
        assunto_id: config.assuntoId,
        detalhe_id: config.detalheId,
        pontuacao: pontuacaoFinal,
        acertos: acertosFinais,
        total_itens: config.paises.length,
        tempo_total_segundos: tempo,
      });
    } catch (e) {
      console.error("Erro ao salvar sessão:", e);
      setMensagem("Erro ao salvar sessão.");
    }
  }

  function handleClick(nome: string) {
    if (!interacaoLiberada) return;
    if (finalizado || !paisAtual) return;

    const nomesValidos = [paisAtual.en, ...(paisAtual.aliases ?? [])];
    const nomeClicadoNormalizado = normalizarTexto(nome);

    const ok = nomesValidos.some(
      (item) => normalizarTexto(item) === nomeClicadoNormalizado
    );

    if (ok) {
      play("acerto");

      const novosAcertos = acertos + 1;

      setMensagem("");
      setAcertos(novosAcertos);
      setCelebratingCountries(nomesValidos);
      setCorrectCountries((prev) => [...new Set([...prev, ...nomesValidos])]);

      setTimeout(() => {
        setCelebratingCountries([]);
      }, 350);

      if (
        indiceAtual + 1 >= listaPaises.length &&
        !sessaoJaFinalizadaRef.current
      ) {
        setTimeout(() => {
          void finalizar(novosAcertos, pontuacao);
        }, 600);
      } else {
        setTimeout(() => {
          setIndiceAtual((i) => i + 1);
          setMensagem("");
        }, 600);
      }
    } else {
      play("erro");

      if (config.modoGlobo === "brasil-capitais") {
        const paisClicado = encontrarPaisPorNome(nome);
        const estadoClicado = paisClicado?.estadoNome || traduzir(nome);
        const capitalClicada = paisClicado?.pt || "";

        setMensagem(
          `Você clicou em ${estadoClicado}, onde a capital é ${capitalClicada}.`
        );
      } else {
        setMensagem(`Quase! Você clicou em ${traduzir(nome)}`);
      }

      setPontuacao((p) => Math.max(0, p - 1));

      setFlashingCountries((prev) =>
        prev.includes(nome) ? prev : [...prev, nome]
      );

      setTimeout(() => {
        setFlashingCountries((prev) => prev.filter((x) => x !== nome));
      }, 300);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const tituloPrincipal = finalizado ? config.tituloFinal : paisAtual?.pt;
  const progressoTotal = listaPaises.length;

  const frasePergunta =
    !finalizado &&
    config.modoGlobo === "brasil-capitais" &&
    paisAtual?.regiao &&
    paisAtual?.pt ? (
      <>
        No {paisAtual.regiao},{" "}
        <span className="font-bold text-4xl md:text-[2.4rem]">
          {paisAtual.pt}
        </span>{" "}
        é a capital de qual estado?
      </>
    ) : !finalizado &&
      config.modoGlobo === "brasil-estados" &&
      paisAtual?.regiao &&
      paisAtual?.pt ? (
      `Na região ${paisAtual.regiao}, clique no seguinte estado: ${paisAtual.pt}`
    ) : !finalizado &&
      config.modoGlobo === "brasil-regioes" &&
      paisAtual?.pt ? (
      `Clique na região: ${paisAtual.pt}`
    ) : !finalizado && paisAtual?.pt ? (
      `Clique no país: ${paisAtual.pt}`
    ) : null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <HeaderInterno onLogout={logout} />

      <main className="h-[calc(100vh-48px)] flex flex-col items-center px-4 pt-20 md:pt-10 lg:pt-12 pb-4">
        <h1
          className={`text-3xl md:text-[2.1rem] font-bold text-center leading-none mb-2 ${
            finalizado ? "gradient-text" : "text-white"
          }`}
        >
          {frasePergunta || tituloPrincipal}
        </h1>

        <p className="text-sm text-center mb-3">
          Pontuação: {pontuacao} | Progresso {acertos}/{progressoTotal}
        </p>

        {finalizado && (
          <button
            onClick={iniciarJogo}
            className="mt-1 mb-2 text-sm underline hover:opacity-80 transition"
          >
            Jogar novamente
          </button>
        )}

        <p className="text-sm min-h-[20px] text-center mb-2">{mensagem}</p>

        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-[1400px]">
            <div className="relative overflow-hidden rounded-2xl h-[70vh] min-h-[360px] max-h-[700px] md:h-[60vh]">
              <GlobeScene
                modo={config.modoGlobo}
                resetKey={config.slug}
                allowedCountryNames={allowedCountryNames}
                onCountryClick={handleClick}
                correctCountries={correctCountries}
                flashingCountries={flashingCountries}
                celebratingCountries={celebratingCountries}
                finalizado={finalizado}
                activeRegion={
                  config.modoGlobo === "brasil-estados" ||
                  config.modoGlobo === "brasil-capitais"
                    ? paisAtual?.regiao
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-2 md:mt-3 w-full">{children}</div>

        {mostrarBotaoVoltarPadrao && (
          <div className="mt-6 mb-4">
            <BotaoVoltar />
          </div>
        )}
      </main>
    </div>
  );
}