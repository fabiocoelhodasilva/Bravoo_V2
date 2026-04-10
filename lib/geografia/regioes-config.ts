export type PaisItem = {
  en: string;
  pt: string;
  aliases?: string[];
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
      {
        en: "Canada",
        pt: "Canadá",
      },
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
    tituloFinal: "Parabéns, você encontrou todas as regiões do Brasil!",
    modoGlobo: "brasil-regioes",
    pontuacaoInicial: 5,
    atividadeId: "22222222-2222-2222-2222-222222222009",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "33333333-3333-3333-3333-333333333011",
    detalheId: "33333333-3333-3333-3333-333333333021",
    paises: [
      { en: "Norte", pt: "Norte" },
      { en: "Nordeste", pt: "Nordeste" },
      { en: "Centro-Oeste", pt: "Centro-Oeste", aliases: ["Centro Oeste"] },
      { en: "Sudeste", pt: "Sudeste" },
      { en: "Sul", pt: "Sul" },
    ],
  },

  /* =================================
     BRASIL — ESTADOS
  ================================= */

  "brasil-estados": {
    slug: "brasil-estados",
    tituloFinal: "Parabéns, você encontrou todos os estados do Brasil!",
    modoGlobo: "brasil-estados",
    pontuacaoInicial: 27,
    atividadeId: "22222222-2222-2222-2222-222222222010",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "33333333-3333-3333-3333-333333333012",
    detalheId: "33333333-3333-3333-3333-333333333022",
    paises: [
      { en: "Acre", pt: "Acre" },
      { en: "Alagoas", pt: "Alagoas" },
      { en: "Amapá", pt: "Amapá", aliases: ["Amapa"] },
      { en: "Amazonas", pt: "Amazonas" },
      { en: "Bahia", pt: "Bahia" },
      { en: "Ceará", pt: "Ceará", aliases: ["Ceara"] },
      { en: "Distrito Federal", pt: "Distrito Federal", aliases: ["DF"] },
      {
        en: "Espírito Santo",
        pt: "Espírito Santo",
        aliases: ["Espirito Santo"],
      },
      { en: "Goiás", pt: "Goiás", aliases: ["Goias"] },
      { en: "Maranhão", pt: "Maranhão", aliases: ["Maranhao"] },
      { en: "Mato Grosso", pt: "Mato Grosso" },
      { en: "Mato Grosso do Sul", pt: "Mato Grosso do Sul" },
      { en: "Minas Gerais", pt: "Minas Gerais" },
      { en: "Pará", pt: "Pará", aliases: ["Para"] },
      { en: "Paraíba", pt: "Paraíba", aliases: ["Paraiba"] },
      { en: "Paraná", pt: "Paraná", aliases: ["Parana"] },
      { en: "Pernambuco", pt: "Pernambuco" },
      { en: "Piauí", pt: "Piauí", aliases: ["Piaui"] },
      { en: "Rio de Janeiro", pt: "Rio de Janeiro" },
      { en: "Rio Grande do Norte", pt: "Rio Grande do Norte" },
      { en: "Rio Grande do Sul", pt: "Rio Grande do Sul" },
      { en: "Rondônia", pt: "Rondônia", aliases: ["Rondonia"] },
      { en: "Roraima", pt: "Roraima" },
      { en: "Santa Catarina", pt: "Santa Catarina" },
      { en: "São Paulo", pt: "São Paulo", aliases: ["Sao Paulo"] },
      { en: "Sergipe", pt: "Sergipe" },
      { en: "Tocantins", pt: "Tocantins" },
    ],
  },

  /* =================================
     BRASIL — CAPITAIS
  ================================= */

  "brasil-capitais": {
    slug: "brasil-capitais",
    tituloFinal: "Parabéns, você encontrou todos os estados pelas capitais!",
    modoGlobo: "brasil-estados",
    pontuacaoInicial: 27,
    atividadeId: "33333333-3333-3333-3333-333333333003",
    materiaId: "d366c6de-2345-4bb2-ac1f-a88747a2248d",
    assuntoId: "33333333-3333-3333-3333-333333333013",
    detalheId: "33333333-3333-3333-3333-333333333023",
    paises: [
      { en: "Acre", pt: "Rio Branco" },
      { en: "Alagoas", pt: "Maceió", aliases: ["Maceio"] },
      { en: "Amapá", pt: "Macapá", aliases: ["Amapa", "Macapa"] },
      { en: "Amazonas", pt: "Manaus" },
      { en: "Bahia", pt: "Salvador" },
      { en: "Ceará", pt: "Fortaleza", aliases: ["Ceara"] },
      {
        en: "Distrito Federal",
        pt: "Brasília",
        aliases: ["DF", "Brasilia"],
      },
      {
        en: "Espírito Santo",
        pt: "Vitória",
        aliases: ["Espirito Santo", "Vitoria"],
      },
      { en: "Goiás", pt: "Goiânia", aliases: ["Goias", "Goiania"] },
      {
        en: "Maranhão",
        pt: "São Luís",
        aliases: ["Maranhao", "Sao Luis"],
      },
      { en: "Mato Grosso", pt: "Cuiabá", aliases: ["Cuiaba"] },
      { en: "Mato Grosso do Sul", pt: "Campo Grande" },
      { en: "Minas Gerais", pt: "Belo Horizonte" },
      { en: "Pará", pt: "Belém", aliases: ["Para", "Belem"] },
      { en: "Paraíba", pt: "João Pessoa", aliases: ["Paraiba"] },
      { en: "Paraná", pt: "Curitiba", aliases: ["Parana"] },
      { en: "Pernambuco", pt: "Recife" },
      { en: "Piauí", pt: "Teresina", aliases: ["Piaui"] },
      { en: "Rio de Janeiro", pt: "Rio de Janeiro" },
      { en: "Rio Grande do Norte", pt: "Natal" },
      { en: "Rio Grande do Sul", pt: "Porto Alegre" },
      {
        en: "Rondônia",
        pt: "Porto Velho",
        aliases: ["Rondonia"],
      },
      { en: "Roraima", pt: "Boa Vista" },
      {
        en: "Santa Catarina",
        pt: "Florianópolis",
        aliases: ["Florianopolis"],
      },
      { en: "São Paulo", pt: "São Paulo", aliases: ["Sao Paulo"] },
      { en: "Sergipe", pt: "Aracaju" },
      { en: "Tocantins", pt: "Palmas" },
    ],
  },
};