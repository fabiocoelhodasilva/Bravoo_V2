export type PaisItem = {
  en: string;
  pt: string;
  aliases?: string[];
};

export type GlobeMode =
  | "america-sul"
  | "america-central"
  | "america-norte"
  | "europa";

export type RegiaoConfig = {
  slug: string;
  tituloFinal: string;
  modoGlobo: GlobeMode;
  pontuacaoInicial: number;
  atividadeId: string;
  materiaId: string;
  assuntoId: string;
  detalheId: string;
  paises: PaisItem[];
};

export const REGIOES_CONFIG: Record<string, RegiaoConfig> = {

  /* =================================
     AMÉRICA DO SUL
  ================================= */

  "america-do-sul": {
    slug: "america-do-sul",
    tituloFinal: "Parabéns, você concluiu o jogo!",
    modoGlobo: "america-sul",
    pontuacaoInicial: 13,
    atividadeId: "22222222-2222-2222-2222-222222222001",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "cb092890-2955-4eab-a84f-8f6548cb4eb6",
    detalheId: "bbbd11be-a755-4816-ab2f-99b2d225b8b0",
    paises: [
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
      { en: "French Guiana", pt: "Guiana Francesa", aliases: ["France"] }
    ],
  },

  /* =================================
     AMÉRICA CENTRAL
  ================================= */

  "america-central": {
    slug: "america-central",
    tituloFinal: "Parabéns, você concluiu o jogo!",
    modoGlobo: "america-central",
    pontuacaoInicial: 7,
    atividadeId: "22222222-2222-2222-2222-222222222002",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310001",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320001",
    paises: [
      { en: "Belize", pt: "Belize" },
      { en: "Costa Rica", pt: "Costa Rica" },
      { en: "El Salvador", pt: "El Salvador" },
      { en: "Guatemala", pt: "Guatemala" },
      { en: "Honduras", pt: "Honduras" },
      { en: "Nicaragua", pt: "Nicarágua" },
      { en: "Panama", pt: "Panamá" }
    ],
  },

  /* =================================
     AMÉRICA DO NORTE
  ================================= */

  "america-do-norte": {
    slug: "america-do-norte",
    tituloFinal: "Parabéns, você concluiu o jogo!",
    modoGlobo: "america-norte",
    pontuacaoInicial: 3,
    atividadeId: "22222222-2222-2222-2222-222222222003",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310002",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320002",
    paises: [
      { en: "Canada", pt: "Canadá" },
      { en: "United States of America", pt: "Estados Unidos", aliases: ["USA", "US"] },
      { en: "Mexico", pt: "México" }
    ],
  },

  /* =================================
     EUROPA — FASE 1
  ================================= */

  "europa-fase-1": {
    slug: "europa-fase-1",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 7,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320003",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "France", pt: "França" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" }
    ],
  },

  /* =================================
     EUROPA — FASE 2
  ================================= */

  "europa-fase-2": {
    slug: "europa-fase-2",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 15,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320004",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "France", pt: "França" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },

      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Croatia", pt: "Croácia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Iceland", pt: "Islândia" }
    ],
  },

  /* =================================
     EUROPA — FALLBACK (EUROPA COMPLETA)
  ================================= */

  "europa": {
    slug: "europa",
    tituloFinal: "Parabéns, você concluiu a Europa!",
    modoGlobo: "europa",
    pontuacaoInicial: 15,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320004",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "France", pt: "França" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Croatia", pt: "Croácia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Iceland", pt: "Islândia" }
    ],
  },

};