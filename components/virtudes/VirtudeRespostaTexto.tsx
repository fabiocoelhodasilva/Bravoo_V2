"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useRef, useState } from "react";

import JoiaConquistadaModal from "@/components/gamification/JoiaConquistadaModal";
import { supabase } from "@/lib/supabase/client";
import { processarGamificacaoAposAtividade } from "@/lib/gamificacao/geral/gamificacao-actions";
import { concederJoiaVirtudeDiaria } from "@/lib/gamificacao/virtudes/virtudes-joias-actions";

/* =========================================================
   Constantes e funções auxiliares
========================================================= */

const VIRTUDES_MATERIA_ID = "c9b9d5e2-3d8b-4d75-8c3d-6d2b7f9a4c11";

function obterDataAtualSaoPaulo(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* =========================================================
   Tipos
========================================================= */

type VirtudeRespostaTextoProps = {
  virtudeId: string;
  pergunta: string;
  videoAssistido: boolean;
  onRespostaConcluida?: () => void;
};

type ResultadoReconhecimento = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type EventoResultadoReconhecimento = Event & {
  resultIndex: number;
  results: ArrayLike<ResultadoReconhecimento>;
};

type EventoErroReconhecimento = Event & {
  error: string;
};

type ReconhecimentoVoz = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: EventoResultadoReconhecimento) => void) | null;
  onerror: ((event: EventoErroReconhecimento) => void) | null;
  onend: (() => void) | null;
};

type ConstrutorReconhecimentoVoz = new () => ReconhecimentoVoz;

type JanelaComReconhecimentoVoz = typeof window & {
  SpeechRecognition?: ConstrutorReconhecimentoVoz;
  webkitSpeechRecognition?: ConstrutorReconhecimentoVoz;
};

/* =========================================================
   Componente
========================================================= */

export default function VirtudeRespostaTexto({
  virtudeId,
  pergunta,
  videoAssistido,
  onRespostaConcluida,
}: VirtudeRespostaTextoProps) {
  const [respostaTexto, setRespostaTexto] = useState("");
  const [salvandoResposta, setSalvandoResposta] = useState(false);
  const [erroResposta, setErroResposta] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [joiaConquistada, setJoiaConquistada] = useState(false);

  const [suportaVoz, setSuportaVoz] = useState(false);
  const [gravandoVoz, setGravandoVoz] = useState(false);
  const [mensagemVoz, setMensagemVoz] = useState("");

  const reconhecimentoRef = useRef<ReconhecimentoVoz | null>(null);


  /* =========================================================
     Interrompe o microfone caso o vídeo ainda não esteja liberado
  ========================================================= */

  useEffect(() => {
    if (videoAssistido) {
      return;
    }

    reconhecimentoRef.current?.abort();
    setGravandoVoz(false);
    setMensagemVoz("");
  }, [videoAssistido]);

  /* =========================================================
     Configura o reconhecimento de voz
  ========================================================= */

  useEffect(() => {
    const navegador = window as JanelaComReconhecimentoVoz;

    const Reconhecimento =
      navegador.SpeechRecognition ||
      navegador.webkitSpeechRecognition;

    if (!Reconhecimento) {
      setSuportaVoz(false);
      return;
    }

    setSuportaVoz(true);

    const reconhecimento = new Reconhecimento();

    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;

    reconhecimento.onstart = () => {
      setGravandoVoz(true);
      setErroResposta("");
      setMensagemSucesso("");
      setMensagemVoz("Ouvindo... fale sua resposta com calma.");
    };

    reconhecimento.onresult = (event) => {
      let textoReconhecido = "";

      for (
        let indice = event.resultIndex;
        indice < event.results.length;
        indice += 1
      ) {
        textoReconhecido += event.results[indice][0].transcript;
      }

      const transcricao = textoReconhecido.trim();

      if (!transcricao) {
        return;
      }

      setRespostaTexto((textoAtual) => {
        const separador =
          textoAtual.trim().length > 0 &&
          !textoAtual.trimEnd().endsWith(" ")
            ? " "
            : "";

        return `${textoAtual}${separador}${transcricao}`.slice(0, 2000);
      });

      setMensagemVoz(
        "Transcrição concluída. Revise o texto antes de salvar.",
      );
    };

    reconhecimento.onerror = (event) => {
      setGravandoVoz(false);

      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          setMensagemVoz("");
          setErroResposta(
            "O acesso ao microfone foi bloqueado. Autorize o microfone no navegador e tente novamente.",
          );
          break;

        case "no-speech":
          setMensagemVoz("");
          setErroResposta(
            "Nenhuma fala foi identificada. Tente novamente falando mais perto do microfone.",
          );
          break;

        case "audio-capture":
          setMensagemVoz("");
          setErroResposta(
            "Não foi possível acessar o microfone deste dispositivo.",
          );
          break;

        case "network":
          setMensagemVoz("");
          setErroResposta(
            "O reconhecimento de voz encontrou um problema de conexão. Tente novamente.",
          );
          break;

        case "aborted":
          setMensagemVoz("");
          break;

        default:
          setMensagemVoz("");
          setErroResposta(
            "Não foi possível reconhecer sua fala. Você ainda pode escrever a resposta.",
          );
      }
    };

    reconhecimento.onend = () => {
      setGravandoVoz(false);
    };

    reconhecimentoRef.current = reconhecimento;

    return () => {
      reconhecimento.onstart = null;
      reconhecimento.onresult = null;
      reconhecimento.onerror = null;
      reconhecimento.onend = null;
      reconhecimento.abort();
      reconhecimentoRef.current = null;
    };
  }, []);

  /* =========================================================
     Inicia ou encerra a gravação
  ========================================================= */

  function alternarGravacaoVoz() {
    if (!videoAssistido) {
      setErroResposta(
        "Assista ao vídeo antes de mandar seu áudio.",
      );
      return;
    }

    const reconhecimento = reconhecimentoRef.current;

    if (!reconhecimento) {
      setErroResposta(
        "O reconhecimento de voz não está disponível neste navegador.",
      );
      return;
    }

    setErroResposta("");
    setMensagemSucesso("");

    if (gravandoVoz) {
      setMensagemVoz("Finalizando transcrição...");
      reconhecimento.stop();
      return;
    }

    try {
      reconhecimento.start();
    } catch (error) {
      console.error("Erro ao iniciar reconhecimento de voz:", error);

      setMensagemVoz("");
      setGravandoVoz(false);
      setErroResposta(
        "Não foi possível iniciar o microfone. Aguarde um instante e tente novamente.",
      );
    }
  }

  /* =========================================================
     Atualiza resposta e limpa mensagens
  ========================================================= */

  function handleAlterarResposta(valor: string) {
    setRespostaTexto(valor);

    if (erroResposta) {
      setErroResposta("");
    }

    if (mensagemSucesso) {
      setMensagemSucesso("");
    }

    if (mensagemVoz) {
      setMensagemVoz("");
    }
  }

  /* =========================================================
     Salva a reflexão em texto
  ========================================================= */

  async function concluirReflexao() {
    const respostaNormalizada = respostaTexto.trim();

    setErroResposta("");
    setMensagemSucesso("");

    if (!videoAssistido) {
      setErroResposta(
        "Assista ao vídeo antes de enviar sua resposta.",
      );
      return;
    }

    if (!respostaNormalizada) {
      setErroResposta("Digite sua resposta antes de concluir.");
      return;
    }

    if (respostaNormalizada.length < 3) {
      setErroResposta("Escreva uma resposta um pouco mais completa.");
      return;
    }

    if (gravandoVoz) {
      reconhecimentoRef.current?.stop();
    }

    setSalvandoResposta(true);

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario) {
        throw erroUsuario;
      }

      if (!user) {
        setErroResposta(
          "Sua sessão não foi encontrada. Entre novamente na plataforma.",
        );
        return;
      }

      const { error: erroInsert } = await supabase
        .from("next_virtudes_respostas")
        .insert({
          usuario_id: user.id,
          virtude_id: virtudeId,
          tipo_resposta: "texto",
          resposta_texto: respostaNormalizada,
          audio_path: null,
          duracao_audio_segundos: null,
          video_path: null,
        });

      if (erroInsert) {
        throw erroInsert;
      }

      /* =====================================================
         Atualiza a persistência da matéria Virtudes

         A resposta já foi salva. Portanto, uma eventual falha
         na gamificação não deve fazer o usuário reenviar a resposta.
      ===================================================== */

      try {
        await processarGamificacaoAposAtividade({
          supabase,
          usuarioId: user.id,
          materiaId: VIRTUDES_MATERIA_ID,
          atividadeId: virtudeId,
          dataReferencia: obterDataAtualSaoPaulo(),
        });
      } catch (erroGamificacao) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Resposta salva, mas ocorreu um erro ao atualizar a persistência de Virtudes:",
            erroGamificacao,
          );
        }
      }

      /* =====================================================
         Concede a joia diária de Virtudes

         A resposta já foi salva. Portanto, uma eventual falha
         na concessão da joia não deve bloquear a conclusão.
      ===================================================== */

      try {
        const ganhouNovaJoia = await concederJoiaVirtudeDiaria({
          supabase,
          usuarioId: user.id,
          materiaId: VIRTUDES_MATERIA_ID,
        });

        if (ganhouNovaJoia) {
          setJoiaConquistada(true);
        }
      } catch (erroJoia) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "Resposta salva, mas ocorreu um erro ao conceder a joia diária de Virtudes:",
            erroJoia,
          );
        }
      }

      setRespostaTexto("");
      setMensagemVoz("");
      setMensagemSucesso("Resposta enviada com sucesso!");

      onRespostaConcluida?.();
    } catch (error) {
      console.error("Erro ao salvar reflexão:", error);

      setErroResposta(
        "Não foi possível enviar sua resposta. Tente novamente.",
      );
    } finally {
      setSalvandoResposta(false);
    }
  }

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <section className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--color-6)]">
        Sobre o vídeo:
      </p>

      <h2 className="mt-3 text-[1.2rem] font-bold leading-relaxed text-white sm:text-[1.4rem]">
        {pergunta}
      </h2>

      {!videoAssistido && (
        <div className="mt-5 rounded-[14px] border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm leading-relaxed text-amber-100/85">
          🔒 Assista ao vídeo e depois responda à pergunta.
        </div>
      )}

      <div className="relative mt-4">
        {suportaVoz && (
          <button
            type="button"
            onClick={alternarGravacaoVoz}
            disabled={!videoAssistido || salvandoResposta}
            aria-pressed={gravandoVoz}
            className={`absolute right-3 top-3 z-10 inline-flex min-h-[36px] items-center justify-center rounded-full border px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              gravandoVoz
                ? "border-red-400/60 bg-red-500/20 text-red-200 hover:bg-red-500/25"
                : "border-[var(--color-6)]/55 bg-black/75 text-[var(--color-6)] hover:bg-[var(--color-6)]/15"
            }`}
          >
            {gravandoVoz
              ? "⏹️ Parar áudio"
              : "🎙️ Mandar áudio"}
          </button>
        )}

        <textarea
          id="resposta-virtude"
          value={respostaTexto}
          onChange={(event) =>
            handleAlterarResposta(event.target.value)
          }
          disabled={!videoAssistido || salvandoResposta || gravandoVoz}
          rows={5}
          maxLength={2000}
          placeholder={
            videoAssistido
              ? "Escreva aqui sua resposta..."
              : "Assista ao vídeo para liberar este campo."
          }
          className="min-h-[140px] w-full resize-y rounded-[18px] border border-white/12 bg-black/35 px-4 pb-4 pt-16 text-[0.95rem] leading-relaxed text-white outline-none transition placeholder:text-white/30 focus:border-[var(--color-6)] focus:ring-2 focus:ring-[var(--color-6)]/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {mensagemVoz && (
        <div
          aria-live="polite"
          className="mt-3 rounded-[14px] border border-[var(--color-6)]/25 bg-[var(--color-6)]/10 px-4 py-3 text-sm text-white/80"
        >
          {gravandoVoz && (
            <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
          )}

          {mensagemVoz}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-white/35">
          Sua resposta será registrada na sua jornada.
        </span>

        <span className="shrink-0 text-xs text-white/35">
          {respostaTexto.length}/2000
        </span>
      </div>

      {erroResposta && (
        <div className="mt-4 rounded-[14px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {erroResposta}
        </div>
      )}

      {mensagemSucesso && (
        <div className="mt-4 rounded-[14px] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          🏅 {mensagemSucesso}
        </div>
      )}

      <button
        type="button"
        onClick={concluirReflexao}
        disabled={
          !videoAssistido ||
          salvandoResposta ||
          gravandoVoz ||
          respostaTexto.trim().length < 3
        }
        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[var(--color-6)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(163,91,220,0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {salvandoResposta
          ? "Enviando resposta..."
          : "Enviar resposta"}
      </button>

      <JoiaConquistadaModal
        aberto={joiaConquistada}
        nomeJoia="Ametista"
        nomeMateria="Virtudes"
        imagemJoia="/imagens/joias/joia_purple.png"
        cor="roxa"
        mensagem="Parabéns! Sua dedicação de hoje foi reconhecida."
        onFechar={() => setJoiaConquistada(false)}
      />
    </section>
  );
}