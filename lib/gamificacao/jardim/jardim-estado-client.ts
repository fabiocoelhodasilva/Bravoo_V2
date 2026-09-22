"use client";

import { buscarEstadoJardim } from "./jardim-pontuacao-actions";

type Identidade = { contaId: string; perfilId: string };
type Estado = Awaited<ReturnType<typeof buscarEstadoJardim>>;
const VALIDADE_MS = 10 * 60_000;
const EVENTO = "bravoo:jardim-estado-invalidado";
const cache = new Map<string, { estado: Estado; atualizadoEm: number }>();
const pendentes = new Map<string, Promise<Estado>>();
let geracao = 0;
const observadores = new Set<() => void>();

export function observarInvalidacaoJardim(atualizar: () => void) {
  observadores.add(atualizar);
  return () => { observadores.delete(atualizar); };
}

function chave(id: Identidade) { return `${id.contaId}:${id.perfilId}`; }
function hoje(data = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(data);
}

/** Agenda somente a próxima mudança de data local, sem polling ou offset fixo. */
export function tempoAteViradaJardim() {
  const agora = Date.now();
  const dia = hoje(new Date(agora));
  let inicio = agora;
  let fim = agora + 27 * 60 * 60 * 1000;
  while (fim - inicio > 1) {
    const meio = Math.floor((inicio + fim) / 2);
    if (hoje(new Date(meio)) === dia) inicio = meio;
    else fim = meio;
  }
  return fim - agora;
}

function limpar() {
  geracao++;
  cache.clear();
  pendentes.clear();
}

export function invalidarEstadoJardim() {
  limpar();
  observadores.forEach((atualizar) => atualizar());
  // Outras abas também descartam a posição anterior após uma gravação.
  try { localStorage.setItem(EVENTO, String(Date.now())); } catch { /* Cache apenas em memória. */ }
}

if (typeof window !== "undefined") {
  window.addEventListener("bravoo:cache-perfil-limpo", limpar);
  window.addEventListener("bravoo:joia-conquistada", invalidarEstadoJardim);
  window.addEventListener("storage", (event) => {
    if (event.key === EVENTO || event.key === "bravoo:perfil-alterado") limpar();
    if (event.key === EVENTO) observadores.forEach((atualizar) => atualizar());
  });
}

export function lerEstadoJardim(id: Identidade): Estado | null {
  const valor = cache.get(chave(id));
  if (!valor) return null;
  if (Date.now() - valor.atualizadoEm >= VALIDADE_MS || valor.estado.hoje !== hoje()) {
    cache.delete(chave(id));
    return null;
  }
  return valor.estado;
}

/** Preload e abertura compartilham a mesma consulta, inclusive ainda em andamento. */
export function getEstadoJardimUsuario(id: Identidade): Promise<Estado> {
  const salvo = lerEstadoJardim(id);
  if (salvo) return Promise.resolve(salvo);
  const key = chave(id);
  const existente = pendentes.get(key);
  if (existente) return existente;
  const versao = geracao;
  const pedido = buscarEstadoJardim(id).then((estado) => {
    if (versao !== geracao) throw new Error("Estado do jardim invalidado durante a consulta.");
    cache.set(key, { estado, atualizadoEm: Date.now() });
    return estado;
  }).finally(() => {
    if (pendentes.get(key) === pedido) pendentes.delete(key);
  });
  pendentes.set(key, pedido);
  return pedido;
}
