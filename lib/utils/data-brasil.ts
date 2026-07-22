/* =========================================================
   Configuração
========================================================= */

const FUSO_BRASIL = "America/Sao_Paulo";

/* =========================================================
   Tipos
========================================================= */

export type IntervaloDataBrasil = {
  inicio: string;
  fim: string;
};

/* =========================================================
   Funções internas
========================================================= */

function obterPartesDataBrasil(data: Date = new Date()) {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return {
    ano: obter("year"),
    mes: obter("month"),
    dia: obter("day"),
  };
}

/* =========================================================
   Data atual do Brasil
========================================================= */

export function obterHojeBrasil(data: Date = new Date()): string {
  const { ano, mes, dia } = obterPartesDataBrasil(data);

  return `${ano}-${mes}-${dia}`;
}

/* =========================================================
   Intervalos do dia
========================================================= */

export function obterIntervaloDiaBrasil(
  dataReferencia?: string
): IntervaloDataBrasil {
  const data = dataReferencia ?? obterHojeBrasil();

  return {
    inicio: `${data} 00:00:00`,
    fim: `${data} 23:59:59.999`,
  };
}

/* =========================================================
   Conversão estável de YYYY-MM-DD
========================================================= */

export function criarDataLocalPorIso(dataIso: string): Date {
  const [ano, mes, dia] = dataIso.split("-").map(Number);

  return new Date(ano, mes - 1, dia);
}

/* =========================================================
   Formatação YYYY-MM-DD
========================================================= */

export function formatarDataIsoLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =========================================================
   Soma de dias
========================================================= */

export function adicionarDias(data: Date, quantidade: number): Date {
  const novaData = new Date(data);

  novaData.setDate(novaData.getDate() + quantidade);

  return novaData;
}

/* =========================================================
   Intervalo semanal — domingo a sábado
========================================================= */

export function obterIntervaloSemanaBrasil(
  dataReferencia?: string
): IntervaloDataBrasil {
  const dataIso = dataReferencia ?? obterHojeBrasil();
  const data = criarDataLocalPorIso(dataIso);

  const inicioSemana = adicionarDias(data, -data.getDay());
  const fimSemana = adicionarDias(inicioSemana, 6);

  return {
    inicio: formatarDataIsoLocal(inicioSemana),
    fim: formatarDataIsoLocal(fimSemana),
  };
}