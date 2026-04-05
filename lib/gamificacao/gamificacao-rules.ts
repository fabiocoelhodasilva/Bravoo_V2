import type {
  RegistroSequenciaMateria,
  ResultadoAtualizacaoSequencia,
} from "@/lib/gamificacao/gamificacao-types";

/**
 * Regras centrais da gamificação.
 * Ajuste estes valores sem mexer no restante do fluxo.
 */
export const GAMIFICACAO_RULES = {
  MARCO_DIAS_PARA_GANHAR_ESCUDO: 10,
  LIMITE_MAXIMO_ESCUDOS: 2,
} as const;

/**
 * Converte YYYY-MM-DD para Date UTC estável.
 */
function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Diferença em dias entre duas datas YYYY-MM-DD.
 */
export function diffDays(dateA: string, dateB: string): number {
  const a = parseDateOnly(dateA);
  const b = parseDateOnly(dateB);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Calcula quantos escudos devem ser concedidos com base no novo total de dias seguidos.
 * Regras:
 * - ganha 1 escudo a cada 10 dias seguidos
 * - máximo de 2 escudos disponíveis
 * - não premia o mesmo marco duas vezes
 * - só registra ganho real se houver mudança no saldo
 */
function calcularConcessaoEscudo(params: {
  novoDiasSeguidos: number;
  escudosDisponiveisAtuais: number;
  ultimoMarcoEscudoConcedido: number;
}) {
  const {
    novoDiasSeguidos,
    escudosDisponiveisAtuais,
    ultimoMarcoEscudoConcedido,
  } = params;

  const marcoAtual =
    Math.floor(
      novoDiasSeguidos / GAMIFICACAO_RULES.MARCO_DIAS_PARA_GANHAR_ESCUDO
    ) * GAMIFICACAO_RULES.MARCO_DIAS_PARA_GANHAR_ESCUDO;

  if (marcoAtual <= 0 || marcoAtual <= ultimoMarcoEscudoConcedido) {
    return {
      escudosGanhos: 0,
      novosEscudosDisponiveis: escudosDisponiveisAtuais,
      novoUltimoMarcoEscudoConcedido: ultimoMarcoEscudoConcedido,
    };
  }

  if (
    escudosDisponiveisAtuais >= GAMIFICACAO_RULES.LIMITE_MAXIMO_ESCUDOS
  ) {
    return {
      escudosGanhos: 0,
      novosEscudosDisponiveis: escudosDisponiveisAtuais,
      novoUltimoMarcoEscudoConcedido: marcoAtual,
    };
  }

  return {
    escudosGanhos: 1,
    novosEscudosDisponiveis: Math.min(
      escudosDisponiveisAtuais + 1,
      GAMIFICACAO_RULES.LIMITE_MAXIMO_ESCUDOS
    ),
    novoUltimoMarcoEscudoConcedido: marcoAtual,
  };
}

/**
 * Calcula a nova sequência com base no último dia registrado.
 *
 * Regras:
 * - primeira atividade começa com 1 dia seguido e 0 pontos de consistência
 * - mesmo dia não atualiza
 * - dia seguinte continua sequência e soma +1 ponto de consistência
 * - perdeu exatamente 1 dia e tem escudo: consome 1 escudo, avança +1 dia na sequência, não soma consistência
 * - perdeu sem escudo, ou perdeu mais de 1 dia: reinicia em 1 e não soma consistência
 */
export function calcularAtualizacaoSequencia(params: {
  registroAtual: RegistroSequenciaMateria | null;
  dataReferencia: string;
}): ResultadoAtualizacaoSequencia {
  const { registroAtual, dataReferencia } = params;

  if (!registroAtual || !registroAtual.ultima_data_atividade) {
    return {
      deveAtualizar: true,
      motivo: "primeira_atividade",
      novoDiasSeguidos: 1,
      novoMaiorSequencia: 1,
      novaUltimaDataAtividade: dataReferencia,
      pontosGanhos: 0,
      escudoConsumido: false,
      escudosGanhos: 0,
      novosEscudosDisponiveis: registroAtual?.escudos_disponiveis ?? 0,
      novoUltimoMarcoEscudoConcedido:
        registroAtual?.ultimo_marco_escudo_concedido ?? 0,
    };
  }

  const ultimaData = registroAtual.ultima_data_atividade;
  const diferenca = diffDays(ultimaData, dataReferencia);

  if (diferenca === 0) {
    return {
      deveAtualizar: false,
      motivo: "mesmo_dia",
      novoDiasSeguidos: registroAtual.dias_seguidos,
      novoMaiorSequencia: registroAtual.maior_sequencia,
      novaUltimaDataAtividade: ultimaData,
      pontosGanhos: 0,
      escudoConsumido: false,
      escudosGanhos: 0,
      novosEscudosDisponiveis: registroAtual.escudos_disponiveis,
      novoUltimoMarcoEscudoConcedido:
        registroAtual.ultimo_marco_escudo_concedido,
    };
  }

  // Continuidade natural: jogou no dia seguinte.
  if (diferenca === 1) {
    const novoDiasSeguidos = registroAtual.dias_seguidos + 1;
    const novoMaiorSequencia = Math.max(
      registroAtual.maior_sequencia,
      novoDiasSeguidos
    );

    const concessaoEscudo = calcularConcessaoEscudo({
      novoDiasSeguidos,
      escudosDisponiveisAtuais: registroAtual.escudos_disponiveis,
      ultimoMarcoEscudoConcedido:
        registroAtual.ultimo_marco_escudo_concedido,
    });

    return {
      deveAtualizar: true,
      motivo: "sequencia_continua",
      novoDiasSeguidos,
      novoMaiorSequencia,
      novaUltimaDataAtividade: dataReferencia,
      pontosGanhos: 1,
      escudoConsumido: false,
      escudosGanhos: concessaoEscudo.escudosGanhos,
      novosEscudosDisponiveis: concessaoEscudo.novosEscudosDisponiveis,
      novoUltimoMarcoEscudoConcedido:
        concessaoEscudo.novoUltimoMarcoEscudoConcedido,
    };
  }

  // Perdeu exatamente 1 dia e tem escudo:
  // consome o escudo e a sequência continua avançando +1,
  // mas sem ganhar ponto de consistência.
  if (diferenca === 2 && registroAtual.escudos_disponiveis > 0) {
    const novoDiasSeguidos = registroAtual.dias_seguidos + 1;
    const novoMaiorSequencia = Math.max(
      registroAtual.maior_sequencia,
      novoDiasSeguidos
    );

    const concessaoEscudo = calcularConcessaoEscudo({
      novoDiasSeguidos,
      escudosDisponiveisAtuais: registroAtual.escudos_disponiveis - 1,
      ultimoMarcoEscudoConcedido:
        registroAtual.ultimo_marco_escudo_concedido,
    });

    return {
      deveAtualizar: true,
      motivo: "sequencia_continua",
      novoDiasSeguidos,
      novoMaiorSequencia,
      novaUltimaDataAtividade: dataReferencia,
      pontosGanhos: 0,
      escudoConsumido: true,
      escudosGanhos: concessaoEscudo.escudosGanhos,
      novosEscudosDisponiveis: concessaoEscudo.novosEscudosDisponiveis,
      novoUltimoMarcoEscudoConcedido:
        concessaoEscudo.novoUltimoMarcoEscudoConcedido,
    };
  }

  // Quebra real da sequência.
  return {
    deveAtualizar: true,
    motivo: "sequencia_reiniciada",
    novoDiasSeguidos: 1,
    novoMaiorSequencia: Math.max(registroAtual.maior_sequencia, 1),
    novaUltimaDataAtividade: dataReferencia,
    pontosGanhos: 0,
    escudoConsumido: false,
    escudosGanhos: 0,
    novosEscudosDisponiveis: registroAtual.escudos_disponiveis,
    novoUltimoMarcoEscudoConcedido:
      registroAtual.ultimo_marco_escudo_concedido,
  };
}