export type PaisItem = {
  en: string;
  pt: string;
  aliases?: string[];
  regiao?: string;
};

export type GlobeMode =
  | "america-sul"
  | "america-central"
  | "america-norte"
  | "europa"
  | "brasil-regioes"
  | "brasil-estados";

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
      { en: "French Guiana", pt: "Guiana Francesa", aliases: ["France"] },
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
      { en: "Panama", pt: "Panamá" },
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
      {
        en: "United States of America",
        pt: "Estados Unidos",
        aliases: ["USA", "US"],
      },
      { en: "Mexico", pt: "México" },
    ],
  },

  /* =================================
     EUROPA — FASE 1
  ================================= */

  "europa-fase-1": {
    slug: "europa-fase-1",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 8,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320003",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
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
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Poland", pt: "Polônia" },
    ],
  },

  /* =================================
     EUROPA — FASE 3
  ================================= */

  "europa-fase-3": {
    slug: "europa-fase-3",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 22,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320005",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Poland", pt: "Polônia" },
      { en: "Iceland", pt: "Islândia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Finland", pt: "Finlândia" },
      { en: "Lithuania", pt: "Lituânia" },
      { en: "Latvia", pt: "Letônia" },
      { en: "Estonia", pt: "Estônia" },
    ],
  },

  /* =================================
     EUROPA — FASE 4
  ================================= */

  "europa-fase-4": {
    slug: "europa-fase-4",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 29,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320006",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Poland", pt: "Polônia" },
      { en: "Iceland", pt: "Islândia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Finland", pt: "Finlândia" },
      { en: "Lithuania", pt: "Lituânia" },
      { en: "Latvia", pt: "Letônia" },
      { en: "Estonia", pt: "Estônia" },
      { en: "Belarus", pt: "Belarus" },
      { en: "Ukraine", pt: "Ucrânia" },
      { en: "Slovakia", pt: "Eslováquia" },
      { en: "Hungary", pt: "Hungria" },
      { en: "Moldova", pt: "Moldávia" },
      { en: "Romania", pt: "Romenia" },
      { en: "Slovenia", pt: "Eslovênia" },
    ],
  },

  /* =================================
     EUROPA — FASE 5
  ================================= */

  "europa-fase-5": {
    slug: "europa-fase-5",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 34,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320007",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Poland", pt: "Polônia" },
      { en: "Iceland", pt: "Islândia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Finland", pt: "Finlândia" },
      { en: "Lithuania", pt: "Lituânia" },
      { en: "Latvia", pt: "Letônia" },
      { en: "Estonia", pt: "Estônia" },
      { en: "Belarus", pt: "Belarus" },
      { en: "Ukraine", pt: "Ucrânia" },
      { en: "Slovakia", pt: "Eslováquia" },
      { en: "Hungary", pt: "Hungria" },
      { en: "Moldova", pt: "Moldávia" },
      { en: "Romania", pt: "Romenia" },
      { en: "Slovenia", pt: "Eslovênia" },
      { en: "Croatia", pt: "Croácia" },
      {
        en: "Bosnia and Herzegovina",
        pt: "Bósnia e Herzegovina",
      },
      { en: "Republic of Serbia", pt: "Sérvia", aliases: ["Serbia"] },
      { en: "Bulgaria", pt: "Bulgária" },
      { en: "Montenegro", pt: "Montenegro" },
    ],
  },

  /* =================================
     EUROPA — FASE 6
  ================================= */

  "europa-fase-6": {
    slug: "europa-fase-6",
    tituloFinal: "Parabéns, você concluiu a fase!",
    modoGlobo: "europa",
    pontuacaoInicial: 39,
    atividadeId: "22222222-2222-2222-2222-222222222004",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "a1c4b6d2-7f31-4f5e-9c11-2a8d8f310003",
    detalheId: "c1d4b6d2-7f31-4f5e-9c11-2a8d8f320008",
    paises: [
      { en: "Portugal", pt: "Portugal" },
      { en: "Spain", pt: "Espanha" },
      { en: "France", pt: "França" },
      { en: "Belgium", pt: "Bélgica" },
      { en: "Luxembourg", pt: "Luxemburgo" },
      { en: "Netherlands", pt: "Países Baixos" },
      { en: "Ireland", pt: "Irlanda" },
      { en: "England", pt: "Reino Unido" },
      { en: "Italy", pt: "Itália" },
      { en: "Switzerland", pt: "Suíça" },
      { en: "Germany", pt: "Alemanha" },
      { en: "Denmark", pt: "Dinamarca" },
      { en: "Czech Republic", pt: "Tchequia", aliases: ["Czechia"] },
      { en: "Austria", pt: "Áustria" },
      { en: "Poland", pt: "Polônia" },
      { en: "Iceland", pt: "Islândia" },
      { en: "Norway", pt: "Noruega" },
      { en: "Sweden", pt: "Suécia" },
      { en: "Finland", pt: "Finlândia" },
      { en: "Lithuania", pt: "Lituânia" },
      { en: "Latvia", pt: "Letônia" },
      { en: "Estonia", pt: "Estônia" },
      { en: "Belarus", pt: "Belarus" },
      { en: "Ukraine", pt: "Ucrânia" },
      { en: "Slovakia", pt: "Eslováquia" },
      { en: "Hungary", pt: "Hungria" },
      { en: "Moldova", pt: "Moldávia" },
      { en: "Romania", pt: "Romenia" },
      { en: "Slovenia", pt: "Eslovênia" },
      { en: "Croatia", pt: "Croácia" },
      {
        en: "Bosnia and Herzegovina",
        pt: "Bósnia e Herzegovina",
      },
      { en: "Republic of Serbia", pt: "Sérvia", aliases: ["Serbia"] },
      { en: "Bulgaria", pt: "Bulgária" },
      { en: "Montenegro", pt: "Montenegro" },
      { en: "Albania", pt: "Albânia" },
      { en: "Macedonia", pt: "Macedônia do Norte" },
      { en: "Greece", pt: "Grécia" },
      { en: "Kosovo", pt: "Kosovo" },
      { en: "Cyprus", pt: "Chipre" },
    ],
  },

  /* =================================
     BRASIL — REGIÕES
  ================================= */

  "brasil-regioes": {
    slug: "brasil-regioes",
    tituloFinal: "Parabéns, você concluiu o jogo!",
    modoGlobo: "brasil-regioes",
    pontuacaoInicial: 5,
    atividadeId: "22222222-2222-2222-2222-222222222009",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "33333333-3333-3333-3333-333333333011",
    detalheId: "33333333-3333-3333-3333-333333333021",
    paises: [
      { en: "Norte", pt: "Norte", aliases: ["N"] },
      { en: "Nordeste", pt: "Nordeste", aliases: ["NE"] },
      {
        en: "Centro-Oeste",
        pt: "Centro-Oeste",
        aliases: ["CO", "Centro Oeste"],
      },
      { en: "Sudeste", pt: "Sudeste", aliases: ["SE"] },
      { en: "Sul", pt: "Sul", aliases: ["S"] },
    ],
  },

  /* =================================
     BRASIL — ESTADOS
  ================================= */

  "brasil-estados": {
    slug: "brasil-estados",
    tituloFinal: "Parabéns, você concluiu o jogo!",
    modoGlobo: "brasil-estados",
    pontuacaoInicial: 27,
    atividadeId: "22222222-2222-2222-2222-222222222010",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "33333333-3333-3333-3333-333333333012",
    detalheId: "33333333-3333-3333-3333-333333333022",
    paises: [
      { en: "Acre", pt: "Acre", regiao: "Norte" },
      { en: "Amapá", pt: "Amapá", regiao: "Norte", aliases: ["Amapa"] },
      { en: "Amazonas", pt: "Amazonas", regiao: "Norte" },
      { en: "Pará", pt: "Pará", regiao: "Norte", aliases: ["Para"] },
      { en: "Rondônia", pt: "Rondônia", regiao: "Norte", aliases: ["Rondonia"] },
      { en: "Roraima", pt: "Roraima", regiao: "Norte" },
      { en: "Tocantins", pt: "Tocantins", regiao: "Norte" },

      { en: "Alagoas", pt: "Alagoas", regiao: "Nordeste" },
      { en: "Bahia", pt: "Bahia", regiao: "Nordeste" },
      { en: "Ceará", pt: "Ceará", regiao: "Nordeste", aliases: ["Ceara"] },
      { en: "Maranhão", pt: "Maranhão", regiao: "Nordeste", aliases: ["Maranhao"] },
      { en: "Paraíba", pt: "Paraíba", regiao: "Nordeste", aliases: ["Paraiba"] },
      { en: "Pernambuco", pt: "Pernambuco", regiao: "Nordeste" },
      { en: "Piauí", pt: "Piauí", regiao: "Nordeste", aliases: ["Piaui"] },
      {
        en: "Rio Grande do Norte",
        pt: "Rio Grande do Norte",
        regiao: "Nordeste",
      },
      { en: "Sergipe", pt: "Sergipe", regiao: "Nordeste" },

      { en: "Distrito Federal", pt: "Distrito Federal", regiao: "Centro-Oeste" },
      { en: "Goiás", pt: "Goiás", regiao: "Centro-Oeste", aliases: ["Goias"] },
      { en: "Mato Grosso", pt: "Mato Grosso", regiao: "Centro-Oeste" },
      { en: "Mato Grosso do Sul", pt: "Mato Grosso do Sul", regiao: "Centro-Oeste" },

      {
        en: "Espírito Santo",
        pt: "Espírito Santo",
        regiao: "Sudeste",
        aliases: ["Espirito Santo"],
      },
      { en: "Minas Gerais", pt: "Minas Gerais", regiao: "Sudeste" },
      { en: "Rio de Janeiro", pt: "Rio de Janeiro", regiao: "Sudeste" },
      { en: "São Paulo", pt: "São Paulo", regiao: "Sudeste", aliases: ["Sao Paulo"] },

      { en: "Paraná", pt: "Paraná", regiao: "Sul", aliases: ["Parana"] },
      { en: "Rio Grande do Sul", pt: "Rio Grande do Sul", regiao: "Sul" },
      { en: "Santa Catarina", pt: "Santa Catarina", regiao: "Sul" },
    ],
  },
};