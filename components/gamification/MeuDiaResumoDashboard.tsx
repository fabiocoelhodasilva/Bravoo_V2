"use client";

import MateriaResumoDashboardPadrao from "@/components/gamification/MateriaResumoDashboardPadrao";

const IMAGEM_JOIA_MEU_DIA = "/imagens/joias/joia_or.png";

type MeuDiaResumoDashboardProps = {
  diasSeguidos?: number;
  totalJoias: number;
};

export default function MeuDiaResumoDashboard({
  diasSeguidos = 0,
  totalJoias,
}: MeuDiaResumoDashboardProps) {
  return (
    <MateriaResumoDashboardPadrao
      titulo="Meu progresso"
      diasSeguidos={diasSeguidos}
      totalJoias={totalJoias}
      nomeJoia="Topázios"
      imagemJoia={IMAGEM_JOIA_MEU_DIA}
    />
  );
}