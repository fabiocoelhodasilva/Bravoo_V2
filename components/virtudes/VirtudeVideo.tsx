"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useRef, useState } from "react";

/* =========================================================
   Tipos
========================================================= */

type VirtudeVideoProps = {
  titulo: string;
  youtubeVideoId: string;
  posterUrl: string | null;
  onVideoConcluido?: () => void;
};

type YouTubePlayerState = {
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YouTubePlayerEvent = {
  target: YouTubePlayer;
  data: number;
};

type YouTubePlayerConstructor = new (
  elemento: HTMLElement,
  opcoes: {
    videoId: string;
    playerVars: Record<string, number>;
    events: {
      onReady: (event: YouTubePlayerEvent) => void;
      onStateChange: (event: YouTubePlayerEvent) => void;
      onError: () => void;
    };
  },
) => YouTubePlayer;

type JanelaComYouTube = typeof window & {
  YT?: {
    Player: YouTubePlayerConstructor;
    PlayerState: YouTubePlayerState;
  };
  onYouTubeIframeAPIReady?: () => void;
};

/* =========================================================
   Constantes
========================================================= */

const PERCENTUAL_MINIMO = 80;
const INTERVALO_VERIFICACAO_MS = 1000;
const LIMITE_SALTO_SEGUNDOS = 2.5;

/* =========================================================
   Funções auxiliares
========================================================= */

function obterImagemVideo(
  posterUrl: string | null,
  youtubeVideoId: string,
) {
  if (posterUrl) {
    return posterUrl;
  }

  return `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
}

function carregarApiYouTube(): Promise<void> {
  return new Promise((resolve, reject) => {
    const janela = window as JanelaComYouTube;

    if (janela.YT?.Player) {
      resolve();
      return;
    }

    const scriptExistente = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const callbackAnterior = janela.onYouTubeIframeAPIReady;

    janela.onYouTubeIframeAPIReady = () => {
      callbackAnterior?.();
      resolve();
    };

    if (scriptExistente) {
      scriptExistente.addEventListener("error", () => {
        reject(new Error("Não foi possível carregar a API do YouTube."));
      });

      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    script.onerror = () => {
      reject(new Error("Não foi possível carregar a API do YouTube."));
    };

    document.head.appendChild(script);
  });
}

/* =========================================================
   Componente
========================================================= */

export default function VirtudeVideo({
  titulo,
  youtubeVideoId,
  posterUrl,
  onVideoConcluido,
}: VirtudeVideoProps) {
  const [videoAberto, setVideoAberto] = useState(false);
  const [playerPronto, setPlayerPronto] = useState(false);
  const [videoConcluido, setVideoConcluido] = useState(false);
  const [percentualAssistido, setPercentualAssistido] = useState(0);
  const [erroVideo, setErroVideo] = useState("");

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoTempoRef = useRef<number | null>(null);
  const segundosAssistidosRef = useRef(0);
  const conclusaoNotificadaRef = useRef(false);

  const imagemVideo = obterImagemVideo(posterUrl, youtubeVideoId);

  /* =========================================================
     Encerra a verificação periódica
  ========================================================= */

  function pararVerificacao() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    ultimoTempoRef.current = null;
  }

  /* =========================================================
     Confirma o vídeo ao atingir o percentual mínimo
  ========================================================= */

  function confirmarConclusao() {
    if (conclusaoNotificadaRef.current) {
      return;
    }

    conclusaoNotificadaRef.current = true;
    setVideoConcluido(true);
    setPercentualAssistido((valorAtual) =>
      Math.max(valorAtual, PERCENTUAL_MINIMO),
    );
    onVideoConcluido?.();
  }

  /* =========================================================
     Mede o tempo realmente reproduzido
  ========================================================= */

  function verificarProgresso(player: YouTubePlayer) {
    const duracao = player.getDuration();
    const tempoAtual = player.getCurrentTime();

    if (!Number.isFinite(duracao) || duracao <= 0) {
      return;
    }

    const ultimoTempo = ultimoTempoRef.current;

    if (ultimoTempo !== null) {
      const diferenca = tempoAtual - ultimoTempo;

      /*
       * Só soma tempo contínuo de reprodução.
       * Saltos grandes para frente, causados por avanço manual,
       * não contam como tempo assistido.
       */
      if (diferenca > 0 && diferenca <= LIMITE_SALTO_SEGUNDOS) {
        segundosAssistidosRef.current = Math.min(
          duracao,
          segundosAssistidosRef.current + diferenca,
        );
      }
    }

    ultimoTempoRef.current = tempoAtual;

    const percentual = Math.min(
      100,
      Math.floor((segundosAssistidosRef.current / duracao) * 100),
    );

    setPercentualAssistido(percentual);

    if (percentual >= PERCENTUAL_MINIMO) {
      confirmarConclusao();
      pararVerificacao();
    }
  }

  /* =========================================================
     Inicia a verificação enquanto o vídeo está reproduzindo
  ========================================================= */

  function iniciarVerificacao(player: YouTubePlayer) {
    pararVerificacao();
    ultimoTempoRef.current = player.getCurrentTime();

    intervaloRef.current = setInterval(() => {
      verificarProgresso(player);
    }, INTERVALO_VERIFICACAO_MS);
  }

  /* =========================================================
     Cria o player pela YouTube IFrame Player API
  ========================================================= */

  useEffect(() => {
    if (!videoAberto || !playerContainerRef.current) {
      return;
    }

    let cancelado = false;

    async function criarPlayer() {
      try {
        setErroVideo("");
        await carregarApiYouTube();

        if (cancelado || !playerContainerRef.current) {
          return;
        }

        const janela = window as JanelaComYouTube;

        if (!janela.YT?.Player) {
          throw new Error("A API do YouTube não ficou disponível.");
        }

        playerRef.current = new janela.YT.Player(
          playerContainerRef.current,
          {
            videoId: youtubeVideoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onReady: () => {
                if (!cancelado) {
                  setPlayerPronto(true);
                }
              },
              onStateChange: (event) => {
                const estados = janela.YT?.PlayerState;

                if (!estados) {
                  return;
                }

                if (event.data === estados.PLAYING) {
                  iniciarVerificacao(event.target);
                  return;
                }

                if (
                  event.data === estados.PAUSED ||
                  event.data === estados.BUFFERING ||
                  event.data === estados.CUED ||
                  event.data === estados.ENDED
                ) {
                  verificarProgresso(event.target);
                  pararVerificacao();
                }
              },
              onError: () => {
                pararVerificacao();
                setErroVideo(
                  "Não foi possível reproduzir este vídeo. Atualize a página e tente novamente.",
                );
              },
            },
          },
        );
      } catch (error) {
        console.error("Erro ao carregar player do YouTube:", error);

        if (!cancelado) {
          setErroVideo(
            "Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.",
          );
        }
      }
    }

    void criarPlayer();

    return () => {
      cancelado = true;
      pararVerificacao();
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerPronto(false);
    };
  }, [videoAberto, youtubeVideoId]);

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <section className="mt-6">
      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/10 bg-[#111] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
        {!videoAberto ? (
          <button
            type="button"
            onClick={() => setVideoAberto(true)}
            className="group relative block aspect-[9/16] w-full overflow-hidden"
            aria-label={`Assistir ao vídeo ${titulo}`}
          >
            <img
              src={imagemVideo}
              alt={titulo}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              draggable={false}
            />

            <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/65 pl-1 text-2xl text-white shadow-xl backdrop-blur-sm transition group-hover:scale-110 sm:h-20 sm:w-20 sm:text-3xl">
                ▶
              </span>
            </div>

            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
              Assistir vídeo
            </span>
          </button>
        ) : (
          <div className="relative aspect-[9/16] w-full">
            <div ref={playerContainerRef} className="h-full w-full" />

            {!playerPronto && !erroVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#111] text-sm text-white/55">
                Carregando vídeo...
              </div>
            )}
          </div>
        )}
      </div>

      {videoAberto && !erroVideo && (
        <div className="mx-auto mt-3 w-full max-w-[430px]">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--color-6)] transition-[width] duration-500"
              style={{ width: `${percentualAssistido}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span
              className={
                videoConcluido
                  ? "font-semibold text-emerald-300"
                  : "text-white/45"
              }
            >
              {videoConcluido
                ? "✓ Vídeo assistido. Agora envie sua resposta."
                : "Assista ao vídeo e depois responda à pergunta."}
            </span>

          </div>
        </div>
      )}

      {erroVideo && (
        <div className="mx-auto mt-3 w-full max-w-[430px] rounded-[14px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {erroVideo}
        </div>
      )}
    </section>
  );
}