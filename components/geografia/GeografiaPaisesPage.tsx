"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import { supabase } from "@/lib/supabaseClient";
import type { RegiaoConfig, PaisItem } from "@/lib/geografia/regioes-config";

const GlobeScene = dynamic(() => import("@/components/geografia/GlobeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
      <div className="text-sm opacity-80">Carregando globo...</div>
    </div>
  ),
});

type Props = {
  config: RegiaoConfig;
};

type GlobeModoNormalizado =
  | "america-do-sul"
  | "america-central"
  | "america-do-norte"
  | "europa-ocidental"
  | "europa-oriental";

function normalizarModoGlobo(modo: string): GlobeModoNormalizado {
  switch (modo) {
    case "america-sul":
    case "america-do-sul":
      return "america-do-sul";

    case "america-central":
      return "america-central";

    case "america-norte":
    case "america-do-norte":
      return "america-do-norte";

    case "europa-oriental":
      return "europa-oriental";

    case "europa":
    case "europa-ocidental":
    default:
      return "europa-ocidental";
  }
}

function getGeoJsonPathByModo(modo: string) {
  const modoNormalizado = normalizarModoGlobo(modo);

  if (modoNormalizado === "america-do-sul") {
    return "/dados/america-sul-simplified.geojson";
  }

  if (modoNormalizado === "america-central") {
    return "/dados/america-central-simplified.geojson";
  }

  if (modoNormalizado === "america-do-norte") {
    return "/dados/america-norte-simplified.geojson";
  }

  if (modoNormalizado === "europa-oriental") {
    return "/dados/countries.geojson";
  }

  return "/dados/europa-ocidental-simplified.geojson";
}

export default function GeografiaPaisesPage({ config }: Props) {
  const router = useRouter();

  const modoGlobo = useMemo(
    () => normalizarModoGlobo(config.modoGlobo),
    [config.modoGlobo]
  );

  const paisesMap = useMemo(() => config.paises, [config.paises]);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [listaPaises, setListaPaises] = useState<PaisItem[]>([]);
  const [pontuacao, setPontuacao] = useState(config.pontuacaoInicial);
  const [acertos, setAcertos] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [inicioJogo, setInicioJogo] = useState(Date.now());
  const [finalizado, setFinalizado] = useState(false);

  const [correctCountries, setCorrectCountries] = useState<string[]>([]);
  const [flashingCountries, setFlashingCountries] = useState<string[]>([]);
  const [celebratingCountries, setCelebratingCountries] = useState<string[]>(
    []
  );

  const audioRef = useRef<AudioContext | null>(null);

  const embaralhar = useCallback(() => {
    return [...paisesMap].sort(() => Math.random() - 0.5);
  }, [paisesMap]);

  const traduzir = useCallback(
    (nome: string) => {
      const p = paisesMap.find((x) =>
        [x.en, ...(x.aliases || [])].includes(nome)
      );
      return p?.pt || nome;
    },
    [paisesMap]
  );

  const reset = useCallback(() => {
    setListaPaises(embaralhar());
    setIndiceAtual(0);
    setPontuacao(config.pontuacaoInicial);
    setAcertos(0);
    setMensagem("");
    setInicioJogo(Date.now());
    setFinalizado(false);
    setCorrectCountries([]);
    setFlashingCountries([]);
    setCelebratingCountries([]);
  }, [embaralhar, config.pontuacaoInicial]);

  useEffect(() => {
    reset();
  }, [reset, modoGlobo]);

  useEffect(() => {
    const path = getGeoJsonPathByModo(modoGlobo);

    fetch(path, { cache: "force-cache" }).catch((error) => {
      console.warn("Falha no preload do GeoJSON:", error);
    });
  }, [modoGlobo]);

  const paisAtual = listaPaises[indiceAtual];

  const play = useCallback((tipo: "acerto" | "erro" | "vitoria") => {
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

    osc.type = tipo === "acerto" ? "sine" : "triangle";
    osc.frequency.value =
      tipo === "acerto" ? 600 : tipo === "vitoria" ? 760 : 200;

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  const finalizar = useCallback(
    async (acertosFinais: number, pontuacaoFinal: number) => {
      setFinalizado(true);
      play("vitoria");
      setMensagem("");

      const tempo = Math.floor((Date.now() - inicioJogo) / 1000);

      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!user) return;

        await supabase.rpc("next_registrar_sessao_e_premiar", {
          p_usuario_id: user.id,
          p_atividade_id: config.atividadeId,
          p_materia_id: config.materiaId,
          p_assunto_id: config.assuntoId,
          p_detalhe_id: config.detalheId,
          p_pontuacao: pontuacaoFinal,
          p_acertos: acertosFinais,
          p_total_itens: listaPaises.length,
          p_tempo_total_segundos: tempo,
        });
      } catch (e) {
        console.error("Erro ao salvar sessão:", e);
      }
    },
    [
      config.atividadeId,
      config.materiaId,
      config.assuntoId,
      config.detalheId,
      inicioJogo,
      listaPaises.length,
      play,
    ]
  );

  const handleClick = useCallback(
    (nome: string) => {
      if (finalizado || !paisAtual) return;

      const nomesValidos = [paisAtual.en, ...(paisAtual.aliases || [])];
      const ok = nomesValidos.includes(nome);

      if (ok) {
        play("acerto");

        const novosAcertos = acertos + 1;

        setMensagem("");
        setAcertos(novosAcertos);
        setCelebratingCountries(nomesValidos);
        setCorrectCountries((prev) => [...new Set([...prev, ...nomesValidos])]);

        window.setTimeout(() => {
          setCelebratingCountries([]);
        }, 350);

        if (indiceAtual + 1 >= listaPaises.length) {
          window.setTimeout(() => {
            void finalizar(novosAcertos, pontuacao);
          }, 600);
        } else {
          window.setTimeout(() => {
            setIndiceAtual((i) => i + 1);
            setMensagem("");
          }, 600);
        }
      } else {
        play("erro");

        setMensagem(`Quase! Você clicou em ${traduzir(nome)}`);
        setPontuacao((p) => Math.max(0, p - 1));

        setFlashingCountries((prev) =>
          prev.includes(nome) ? prev : [...prev, nome]
        );

        window.setTimeout(() => {
          setFlashingCountries((prev) => prev.filter((x) => x !== nome));
        }, 300);
      }
    },
    [
      acertos,
      finalizado,
      finalizar,
      indiceAtual,
      listaPaises.length,
      paisAtual,
      play,
      pontuacao,
      traduzir,
    ]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <HeaderInterno onLogout={logout} />

      <main className="h-[calc(100vh-48px)] flex flex-col items-center px-4 pt-20 md:pt-10 lg:pt-12 pb-4">
        {!finalizado && (
          <p className="text-sm text-center mb-1 text-white">
            Clique no país:
          </p>
        )}

        <h1
          className={`text-3xl md:text-[2.1rem] font-bold text-center leading-none mb-2 ${
            finalizado ? "gradient-text" : "text-white"
          }`}
        >
          {finalizado ? "Parabens, jogo concluído!" : paisAtual?.pt}
        </h1>

        <p className="text-sm text-center mb-1">
          Pontuação: {pontuacao} | Progresso {acertos}/{listaPaises.length}
        </p>

        {finalizado && (
          <button
            onClick={reset}
            className="mt-2 text-sm underline hover:opacity-80 transition"
          >
            Jogar novamente
          </button>
        )}

        <p className="text-sm min-h-[20px] text-center mb-2">{mensagem}</p>

        <div className="flex-1 w-full flex items-center justify-center min-h-0">
          <div className="w-full h-full flex items-center justify-center min-h-0">
            <div className="h-full aspect-square max-w-full max-h-full md:w-full md:aspect-auto md:rounded-2xl md:overflow-hidden">
              <GlobeScene
                modo={modoGlobo}
                onCountryClick={handleClick}
                correctCountries={correctCountries}
                flashingCountries={flashingCountries}
                celebratingCountries={celebratingCountries}
                finalizado={finalizado}
              />
            </div>
          </div>
        </div>

        <div className="h-10 flex items-center justify-center">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}