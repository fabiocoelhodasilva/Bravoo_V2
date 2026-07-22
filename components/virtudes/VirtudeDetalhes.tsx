"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import VirtudeVideo from "@/components/virtudes/VirtudeVideo";
import VirtudeRespostaTexto from "@/components/virtudes/VirtudeRespostaTexto";
import VirtudeHistorico from "@/components/virtudes/VirtudeHistorico";
import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Tipos
========================================================= */

type VirtudeDetalhesProps = {
  virtudeId: string;
};

type AssuntoVirtude = {
  nome: string;
};

type Virtude = {
  id: string;
  titulo: string;
  descricao: string | null;
  youtube_video_id: string;
  poster_url: string | null;
  pergunta_audio: string;
  assunto: AssuntoVirtude | AssuntoVirtude[] | null;
};

/* =========================================================
   Funções auxiliares
========================================================= */

function obterNomeAssunto(virtude: Virtude) {
  if (!virtude.assunto) {
    return "Virtudes";
  }

  if (Array.isArray(virtude.assunto)) {
    return virtude.assunto[0]?.nome ?? "Virtudes";
  }

  return virtude.assunto.nome ?? "Virtudes";
}

/* =========================================================
   Componente principal
========================================================= */

export default function VirtudeDetalhes({
  virtudeId,
}: VirtudeDetalhesProps) {
  const router = useRouter();

  const [virtude, setVirtude] = useState<Virtude | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [videoAssistido, setVideoAssistido] = useState(false);
  const [atualizarHistoricoChave, setAtualizarHistoricoChave] = useState(0);

  /* =========================================================
     Reinicia a validação quando muda a virtude
  ========================================================= */

  useEffect(() => {
    setVideoAssistido(false);
  }, [virtudeId]);

  /* =========================================================
     Busca a virtude no Supabase
  ========================================================= */

  useEffect(() => {
    let cancelado = false;

    async function carregarVirtude() {
      setCarregando(true);
      setErro("");

      try {
        const { data, error } = await supabase
          .from("next_virtudes")
          .select(
            `
            id,
            titulo,
            descricao,
            youtube_video_id,
            poster_url,
            pergunta_audio,
            assunto:next_assuntos (
              nome
            )
          `,
          )
          .eq("id", virtudeId)
          .eq("ativo", true)
          .single();

        if (error) {
          throw error;
        }

        if (!cancelado) {
          setVirtude(data as Virtude);
        }
      } catch (error) {
        console.error("Erro ao carregar virtude:", error);

        if (!cancelado) {
          setVirtude(null);
          setErro("Não foi possível carregar esta virtude.");
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarVirtude();

    return () => {
      cancelado = true;
    };
  }, [virtudeId]);

  /* =========================================================
     Atualiza o histórico após nova conclusão
  ========================================================= */

  function atualizarHistorico() {
    setAtualizarHistoricoChave((valorAtual) => valorAtual + 1);
  }

  /* =========================================================
     Logout
  ========================================================= */

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
    }
  }

  /* =========================================================
     Carregamento
  ========================================================= */

  if (carregando) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderInterno onLogout={handleLogout} />

        <main className="flex min-h-screen items-center justify-center px-4 pt-12">
          <p className="text-sm text-white/60">Carregando virtude...</p>
        </main>
      </div>
    );
  }

  /* =========================================================
     Erro ao carregar
  ========================================================= */

  if (erro || !virtude) {
    return (
      <div className="min-h-screen bg-black text-white">
        <HeaderInterno onLogout={handleLogout} />

        <main className="px-4 pb-10 pt-20">
          <div className="mx-auto max-w-[700px] rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-center text-red-100">
            <p>{erro || "Virtude não encontrada."}</p>
          </div>

          <div className="mt-8 flex justify-center">
            <BotaoVoltar />
          </div>
        </main>
      </div>
    );
  }

  const nomeAssunto = obterNomeAssunto(virtude);

  /* =========================================================
     Renderização principal
  ========================================================= */

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
        <article className="mx-auto w-full max-w-[900px]">
          <span className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.13em] text-[var(--color-6)]">
            {nomeAssunto}
          </span>

          <h1 className="mt-4 text-[2rem] font-black leading-tight text-white sm:text-[3rem]">
            {virtude.titulo}
          </h1>

          <VirtudeVideo
            titulo={virtude.titulo}
            youtubeVideoId={virtude.youtube_video_id}
            posterUrl={virtude.poster_url}
            onVideoConcluido={() => setVideoAssistido(true)}
          />

          <VirtudeRespostaTexto
            virtudeId={virtude.id}
            pergunta={virtude.pergunta_audio}
            videoAssistido={videoAssistido}
            onRespostaConcluida={atualizarHistorico}
          />

          <VirtudeHistorico
            virtudeId={virtude.id}
            atualizarChave={atualizarHistoricoChave}
          />

          <div className="mt-10 flex justify-center">
            <BotaoVoltar />
          </div>
        </article>
      </main>
    </div>
  );
}