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
};

type NomeRegiaoBrasil =
  | "Norte"
  | "Nordeste"
  | "Centro-Oeste"
  | "Sudeste"
  | "Sul";

const TODAS_AS_REGIOES_BRASIL: NomeRegiaoBrasil[] = [
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
];

const ESTADOS_POR_REGIAO: Record<NomeRegiaoBrasil, string[]> = {
  Norte: [
    "Acre",
    "Amapá",
    "Amazonas",
    "Pará",
    "Rondônia",
    "Roraima",
    "Tocantins",
  ],
  Nordeste: [
    "Alagoas",
    "Bahia",
    "Ceará",
    "Maranhão",
    "Paraíba",
    "Pernambuco",
    "Piauí",
    "Rio Grande do Norte",
    "Sergipe",
  ],
  "Centro-Oeste": [
    "Distrito Federal",
    "Goiás",
    "Mato Grosso",
    "Mato Grosso do Sul",
  ],
  Sudeste: [
    "Espírito Santo",
    "Minas Gerais",
    "Rio de Janeiro",
    "São Paulo",
  ],
  Sul: ["Paraná", "Rio Grande do Sul", "Santa Catarina"],
};

function getGeoJsonPathByModo(modo: RegiaoConfig["modoGlobo"]) {
  if (modo === "america-sul") return "/dados/america-sul-simplified.geojson";
  if (modo === "america-central")
    return "/dados/america-central-simplified.geojson";
  if (modo === "america-norte")
    return "/dados/america-norte-simplified.geojson";
  if (modo === "europa") return "/dados/europa-simplified.geojson";
  if (modo === "brasil-regioes")
    return "/dados/brasil-regioes-simplified.geojson";
  if (modo === "brasil-estados")
    return "/dados/brasil-estados-simplified.geojson";

  return "/dados/europa-simplified.geojson";
}

function getTextoInstrucao(modo: RegiaoConfig["modoGlobo"]) {
  if (modo === "brasil-regioes") return "Clique na região:";
  if (modo === "brasil-estados") return "Clique no estado:";
  return "Clique no país:";
}

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

function sortearItem<T>(itens: T[]) {
  return itens[Math.floor(Math.random() * itens.length)];
}

export default function GeografiaPaisesPage({ config }: Props) {
  const router = useRouter();
  const isBrasilEstados = config.slug === "brasil-estados";

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

  const [regioesPendentes, setRegioesPendentes] = useState<NomeRegiaoBrasil[]>(
    []
  );
  const [regiaoAtual, setRegiaoAtual] = useState<NomeRegiaoBrasil | null>(null);
  const [estadosDaRegiaoAtual, setEstadosDaRegiaoAtual] = useState<PaisItem[]>(
    []
  );
  const [indiceEstadoDaRegiao, setIndiceEstadoDaRegiao] = useState(0);

  const audioRef = useRef<AudioContext | null>(null);
  const sessaoJaFinalizadaRef = useRef(false);
  const liberarInteracaoTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const paisesMap = useMemo(() => config.paises, [config.paises]);

  const allowedCountryNames = useMemo(() => {
    return config.paises.flatMap((pais) => [pais.en, ...(pais.aliases ?? [])]);
  }, [config.paises]);

  function traduzir(nome: string) {
    const nomeNormalizado = normalizarTexto(nome);

    const paisEncontrado = paisesMap.find((pais) => {
      const nomes = [pais.en, ...(pais.aliases ?? [])];
      return nomes.some((item) => normalizarTexto(item) === nomeNormalizado);
    });

    return paisEncontrado?.pt || nome;
  }

  function encontrarPaisPorNome(nome: string) {
    const nomeNormalizado = normalizarTexto(nome);

    return paisesMap.find((pais) => {
      const nomes = [pais.en, ...(pais.aliases ?? [])];
      return nomes.some((item) => normalizarTexto(item) === nomeNormalizado);
    });
  }

  function limparTimerInteracao() {
    if (liberarInteracaoTimeoutRef.current) {
      clearTimeout(liberarInteracaoTimeoutRef.current);
      liberarInteracaoTimeoutRef.current = null;
    }
  }

  function iniciarNovaRodadaBrasilEstados(
    regioesDisponiveis: NomeRegiaoBrasil[]
  ) {
    if (regioesDisponiveis.length === 0) return;

    const novaRegiao = sortearItem(regioesDisponiveis);
    const nomesDaRegiao = ESTADOS_POR_REGIAO[novaRegiao];

    const estadosFiltrados = paisesMap.filter((pais) =>
      nomesDaRegiao.some(
        (estado) => normalizarTexto(estado) === normalizarTexto(pais.en)
      )
    );

    const estadosEmbaralhados = embaralharArray(estadosFiltrados);

    setRegiaoAtual(novaRegiao);
    setEstadosDaRegiaoAtual(estadosEmbaralhados);
    setIndiceEstadoDaRegiao(0);
    setMensagem("");
  }

  function iniciarJogo() {
    limparTimerInteracao();

    setIndiceAtual(0);
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

    if (isBrasilEstados) {
      setListaPaises(config.paises);
      setRegioesPendentes(TODAS_AS_REGIOES_BRASIL);
      iniciarNovaRodadaBrasilEstados(TODAS_AS_REGIOES_BRASIL);
    } else {
      setListaPaises(embaralharArray(paisesMap));
      setRegioesPendentes([]);
      setRegiaoAtual(null);
      setEstadosDaRegiaoAtual([]);
      setIndiceEstadoDaRegiao(0);
    }

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
  }, [config.slug, config.pontuacaoInicial, paisesMap, isBrasilEstados]);

  useEffect(() => {
    const path = getGeoJsonPathByModo(config.modoGlobo);

    fetch(path, { cache: "force-cache" }).catch((error) => {
      console.warn("Falha no preload do GeoJSON:", error);
    });
  }, [config.modoGlobo]);

  const paisAtual = listaPaises[indiceAtual];
  const estadoAtualDaRegiao = estadosDaRegiaoAtual[indiceEstadoDaRegiao];

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

  function handleClickBrasilEstados(nome: string) {
    if (finalizado || !regiaoAtual || !estadoAtualDaRegiao) return;

    const paisClicado = encontrarPaisPorNome(nome);
    if (!paisClicado) return;

    const nomesValidos = [
      estadoAtualDaRegiao.en,
      ...(estadoAtualDaRegiao.aliases ?? []),
    ];

    const clicouCorreto = nomesValidos.some(
      (item) => normalizarTexto(item) === normalizarTexto(nome)
    );

    if (!clicouCorreto) {
      play("erro");

      setMensagem(`Quase! Você clicou em ${paisClicado.pt}`);
      setPontuacao((p) => Math.max(0, p - 1));

      setFlashingCountries((prev) =>
        prev.includes(paisClicado.en) ? prev : [...prev, paisClicado.en]
      );

      setTimeout(() => {
        setFlashingCountries((prev) =>
          prev.filter(
            (x) => normalizarTexto(x) !== normalizarTexto(paisClicado.en)
          )
        );
      }, 300);

      return;
    }

    play("acerto");

    const novosAcertos = acertos + 1;
    const nomesDoEstadoCorreto = [
      estadoAtualDaRegiao.en,
      ...(estadoAtualDaRegiao.aliases ?? []),
    ];

    setAcertos(novosAcertos);
    setMensagem("");
    setCelebratingCountries(nomesDoEstadoCorreto);
    setCorrectCountries((prev) => [
      ...new Set([...prev, ...nomesDoEstadoCorreto]),
    ]);

    setTimeout(() => {
      setCelebratingCountries([]);
    }, 350);

    const proximoIndice = indiceEstadoDaRegiao + 1;
    const concluiuRegiao = proximoIndice >= estadosDaRegiaoAtual.length;

    if (!concluiuRegiao) {
      setTimeout(() => {
        setIndiceEstadoDaRegiao(proximoIndice);
      }, 600);
      return;
    }

    const novasPendentes = regioesPendentes.filter(
      (regiao) => regiao !== regiaoAtual
    );

    if (novasPendentes.length === 0) {
      setTimeout(() => {
        void finalizar(novosAcertos, pontuacao);
      }, 700);
      return;
    }

    setMensagem(`Muito bem! Região ${regiaoAtual} concluída.`);

    setTimeout(() => {
      setRegioesPendentes(novasPendentes);
      iniciarNovaRodadaBrasilEstados(novasPendentes);
      setMensagem("");
    }, 900);
  }

  function handleClickPadrao(nome: string) {
    if (finalizado || !paisAtual) return;

    const nomesValidos = [paisAtual.en, ...(paisAtual.aliases ?? [])];
    const ok = nomesValidos.includes(nome);

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

      setMensagem(`Quase! Você clicou em ${traduzir(nome)}`);
      setPontuacao((p) => Math.max(0, p - 1));

      setFlashingCountries((prev) =>
        prev.includes(nome) ? prev : [...prev, nome]
      );

      setTimeout(() => {
        setFlashingCountries((prev) => prev.filter((x) => x !== nome));
      }, 300);
    }
  }

  function handleClick(nome: string) {
    if (!interacaoLiberada) return;
    if (finalizado) return;

    if (isBrasilEstados) {
      handleClickBrasilEstados(nome);
      return;
    }

    handleClickPadrao(nome);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const textoInstrucaoBrasilEstados =
    !finalizado && regiaoAtual
      ? `Na região ${regiaoAtual}, clique no estado:`
      : "";

  const tituloPrincipal = finalizado
    ? config.tituloFinal
    : isBrasilEstados
    ? estadoAtualDaRegiao?.pt || "Brasil"
    : paisAtual?.pt;

  const progressoTotal = isBrasilEstados
    ? config.paises.length
    : listaPaises.length;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <HeaderInterno onLogout={logout} />

      <main className="h-[calc(100vh-48px)] flex flex-col items-center px-4 pt-20 md:pt-10 lg:pt-12 pb-4">
        {!finalizado && !isBrasilEstados && (
          <p className="text-sm text-center mb-1 text-white">
            {getTextoInstrucao(config.modoGlobo)}
          </p>
        )}

        {!finalizado && isBrasilEstados && (
          <p className="text-sm text-center mb-1 text-white">
            {textoInstrucaoBrasilEstados}
          </p>
        )}

        <h1
          className={`text-3xl md:text-[2.1rem] font-bold text-center leading-none mb-2 ${
            finalizado ? "gradient-text" : "text-white"
          }`}
        >
          {tituloPrincipal}
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

        <div className="flex-1 w-full flex items-center justify-center min-h-0">
          <div className="w-full h-full flex items-center justify-center min-h-0">
            <div className="h-full aspect-square max-w-full max-h-full md:w-full md:aspect-auto md:rounded-2xl md:overflow-hidden">
              <GlobeScene
                modo={config.modoGlobo}
                resetKey={config.slug}
                allowedCountryNames={allowedCountryNames}
                onCountryClick={handleClick}
                correctCountries={correctCountries}
                flashingCountries={flashingCountries}
                celebratingCountries={celebratingCountries}
                finalizado={finalizado}
                currentRegion={regiaoAtual || undefined}
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