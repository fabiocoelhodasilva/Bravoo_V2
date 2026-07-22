"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useState } from "react";
import JoiaConquistadaModal, {
  type CorModalJoia,
} from "@/components/gamification/JoiaConquistadaModal";
import MandalaConquistadaModal from "@/components/gamification/MandalaConquistadaModal";
import {
  EVENTO_RECOMPENSA_SESSAO_CONQUISTADA,
  type RecompensaSessaoConquistada,
} from "@/lib/sessoes/sessoes-service";

/* =========================================================
   Tipos
========================================================= */

type EtapaModal = "joia" | "mandala" | null;

type ConfiguracaoJoiaMateria = {
  nomeJoia: string;
  nomeMateria: string;
  imagemJoia: string;
  mensagem: string;
  cor: CorModalJoia;
};

/* =========================================================
   Configuração das joias por matéria
========================================================= */

const MATERIA_GEOGRAFIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";
const MATERIA_MATEMATICA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";

const CONFIGURACOES_POR_MATERIA: Record<
  string,
  ConfiguracaoJoiaMateria
> = {
  [MATERIA_GEOGRAFIA_ID]: {
    nomeJoia: "Safira",
    nomeMateria: "Geografia",
    imagemJoia: "/imagens/joias/joia_blue.png",
    mensagem: "Parabéns! Você ganhou a Safira da área Geografia.",
    cor: "azul",
  },

  [MATERIA_MATEMATICA_ID]: {
    nomeJoia: "Esmeralda",
    nomeMateria: "Matemática",
    imagemJoia: "/imagens/joias/joia_verde.png",
    mensagem: "Parabéns! Você ganhou a Esmeralda da área Matemática.",
    cor: "verde",
  },
};

/* =========================================================
   Componente global
========================================================= */

export default function RecompensaSessaoModalGlobal() {
  const [fila, setFila] = useState<RecompensaSessaoConquistada[]>([]);
  const [recompensaAtual, setRecompensaAtual] =
    useState<RecompensaSessaoConquistada | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaModal>(null);

  /* ---------------------------------------------------------
     Escuta as recompensas emitidas pelo serviço de sessões
  --------------------------------------------------------- */

  useEffect(() => {
    function receberRecompensa(event: Event) {
      const customEvent = event as CustomEvent<RecompensaSessaoConquistada>;
      const recompensa = customEvent.detail;

      if (!recompensa) return;
      if (!CONFIGURACOES_POR_MATERIA[recompensa.materiaId]) return;
      if (!recompensa.joiaConquistada && !recompensa.mandalaConquistada) return;

      setFila((filaAtual) => [...filaAtual, recompensa]);
    }

    window.addEventListener(
      EVENTO_RECOMPENSA_SESSAO_CONQUISTADA,
      receberRecompensa
    );

    return () => {
      window.removeEventListener(
        EVENTO_RECOMPENSA_SESSAO_CONQUISTADA,
        receberRecompensa
      );
    };
  }, []);

  /* ---------------------------------------------------------
     Abre a próxima recompensa da fila
  --------------------------------------------------------- */

  useEffect(() => {
    if (recompensaAtual || fila.length === 0) return;

    const proximaRecompensa = fila[0];

    setRecompensaAtual(proximaRecompensa);
    setEtapaAtual(
      proximaRecompensa.joiaConquistada ? "joia" : "mandala"
    );
    setFila((filaAtual) => filaAtual.slice(1));
  }, [fila, recompensaAtual]);

  const configuracaoAtual = recompensaAtual
    ? CONFIGURACOES_POR_MATERIA[recompensaAtual.materiaId]
    : null;

  function finalizarRecompensaAtual() {
    setEtapaAtual(null);
    setRecompensaAtual(null);
  }

  function fecharModalJoia() {
    if (recompensaAtual?.mandalaConquistada) {
      setEtapaAtual("mandala");
      return;
    }

    finalizarRecompensaAtual();
  }

  function fecharModalMandala() {
    finalizarRecompensaAtual();
  }

  if (!recompensaAtual || !configuracaoAtual) {
    return null;
  }

  return (
    <>
      <JoiaConquistadaModal
        aberto={etapaAtual === "joia"}
        nomeJoia={configuracaoAtual.nomeJoia}
        nomeMateria={configuracaoAtual.nomeMateria}
        imagemJoia={configuracaoAtual.imagemJoia}
        mensagem={configuracaoAtual.mensagem}
        cor={configuracaoAtual.cor}
        onFechar={fecharModalJoia}
      />

      <MandalaConquistadaModal
        aberto={etapaAtual === "mandala"}
        onFechar={fecharModalMandala}
      />
    </>
  );
}