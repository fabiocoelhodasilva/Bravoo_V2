const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { resolve } = require("node:path");

function preparar() {
  let agora = Date.parse("2026-09-22T15:00:00Z");
  let chamadas = 0;
  let responder = async () => ({ pontuacao: 3, hoje: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date(agora)) });
  const eventos = {};
  class Relogio extends Date {
    constructor(...args) { super(...(args.length ? args : [agora])); }
    static now() { return agora; }
  }
  const contexto = {
    exports: {}, Date: Relogio, Intl, Map, Set, Promise, Error,
    window: { addEventListener: (nome, fn) => { eventos[nome] = fn; } },
    localStorage: { setItem() {} },
    require(nome) {
      assert.equal(nome, "./jardim-pontuacao-actions");
      return { buscarEstadoJardim: (id) => { chamadas++; return responder(id); } };
    },
  };
  const codigo = ts.transpileModule(readFileSync(resolve(__dirname, "../lib/gamificacao/jardim/jardim-estado-client.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(codigo, contexto);
  return { api: contexto.exports, eventos, chamadas: () => chamadas,
    avancar: (ms) => { agora += ms; }, responder: (fn) => { responder = fn; } };
}
const perfil = { contaId: "conta", perfilId: "filho" };

test("Home e Jardim compartilham pedido em andamento e resultado pronto", async () => {
  const a = preparar();
  let concluir;
  a.responder(() => new Promise((resolve) => { concluir = resolve; }));
  const pedido = a.api.getEstadoJardimUsuario(perfil);
  assert.equal(pedido, a.api.getEstadoJardimUsuario(perfil));
  concluir({ pontuacao: 3, hoje: "2026-09-22" });
  await pedido;
  assert.equal(a.api.lerEstadoJardim(perfil).pontuacao, 3);
  await a.api.getEstadoJardimUsuario(perfil);
  assert.equal(a.chamadas(), 1);
});

test("cache isolado por conta e perfil; acesso direto e expirado consultam normalmente", async () => {
  const a = preparar();
  assert.equal(a.api.lerEstadoJardim(perfil), null);
  await a.api.getEstadoJardimUsuario(perfil);
  assert.equal(a.api.lerEstadoJardim({ ...perfil, contaId: "outra" }), null);
  assert.equal(a.api.lerEstadoJardim({ ...perfil, perfilId: "outro" }), null);
  a.avancar(9 * 60_000);
  await a.api.getEstadoJardimUsuario(perfil);
  assert.equal(a.chamadas(), 1);
  a.avancar(60_000);
  assert.equal(a.api.lerEstadoJardim(perfil), null);
  await a.api.getEstadoJardimUsuario(perfil);
  assert.equal(a.chamadas(), 2);
});

test("virada do dia de Sao Paulo expira mesmo dentro do TTL", async () => {
  const a = preparar();
  a.avancar(12 * 60 * 60 * 1000 - 1000);
  assert.equal(a.api.tempoAteViradaJardim(), 1000);
  await a.api.getEstadoJardimUsuario(perfil);
  a.avancar(2000);
  assert.equal(a.api.lerEstadoJardim(perfil), null);
});

test("agendamento usa meia-noite de Sao Paulo e eventos nao consultam por si mesmos", async () => {
  const a = preparar();
  assert.equal(a.api.tempoAteViradaJardim(), 12 * 60 * 60 * 1000);
  let avisos = 0;
  const parar = a.api.observarInvalidacaoJardim(() => { avisos++; });
  await a.api.getEstadoJardimUsuario(perfil);
  a.eventos["bravoo:joia-conquistada"]();
  a.eventos.storage({ key: "bravoo:jardim-estado-invalidado" });
  assert.equal(avisos, 2);
  assert.equal(a.chamadas(), 1);
  parar();
  a.api.invalidarEstadoJardim();
  assert.equal(avisos, 2);
});

test("falha permite nova tentativa sem armazenar resultado falso", async () => {
  const a = preparar();
  a.responder(async () => { throw new Error("offline"); });
  await assert.rejects(a.api.getEstadoJardimUsuario(perfil), /offline/);
  a.responder(async () => ({ pontuacao: 4, hoje: "2026-09-22" }));
  assert.equal((await a.api.getEstadoJardimUsuario(perfil)).pontuacao, 4);
  assert.equal(a.chamadas(), 2);
});

test("logout, troca de perfil, joia e sinal de outra aba invalidam", async () => {
  const a = preparar();
  for (const invalidar of [
    () => a.eventos["bravoo:cache-perfil-limpo"](),
    () => a.eventos["bravoo:joia-conquistada"](),
    () => a.eventos.storage({ key: "bravoo:perfil-alterado" }),
    () => a.eventos.storage({ key: "bravoo:jardim-estado-invalidado" }),
    () => a.api.invalidarEstadoJardim(),
  ]) {
    await a.api.getEstadoJardimUsuario(perfil);
    invalidar();
    assert.equal(a.api.lerEstadoJardim(perfil), null);
  }
});

test("consulta antiga nao repovoa cache depois da invalidacao", async () => {
  const a = preparar();
  let concluir;
  a.responder(() => new Promise((resolve) => { concluir = resolve; }));
  const pedido = a.api.getEstadoJardimUsuario(perfil);
  a.api.invalidarEstadoJardim();
  concluir({ pontuacao: 1, hoje: "2026-09-22" });
  await assert.rejects(pedido, /invalidado/);
  assert.equal(a.api.lerEstadoJardim(perfil), null);
});

test("action compacta reutiliza pontuacao e recusa identidade divergente antes da consulta", async () => {
  let consultas = 0;
  const consulta = {};
  for (const nome of ["select", "eq", "gte", "lt"]) consulta[nome] = () => consulta;
  consulta.order = async () => { consultas++; return { data: [], error: null }; };
  const contexto = { exports: {}, Date, Intl, Set, Math, console, Error,
    require(nome) {
      assert.equal(nome, "@/lib/perfis/perfil-server");
      return { requirePerfil: async () => ({
        supabase: { from: () => consulta }, perfilId: perfil.perfilId,
        perfil: { criado_em: "2026-09-14T12:00:00Z" },
        conta: { id: perfil.contaId, created_at: "2026-09-14T12:00:00Z" },
      }) };
    },
  };
  const codigo = ts.transpileModule(readFileSync(resolve(__dirname, "../lib/gamificacao/jardim/jardim-pontuacao-actions.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(codigo, contexto);
  await assert.rejects(contexto.exports.buscarEstadoJardim({ ...perfil, perfilId: "outro" }), /mudou/);
  await assert.rejects(contexto.exports.buscarEstadoJardim({ ...perfil, contaId: "outra" }), /mudou/);
  assert.equal(consultas, 0);
  const completo = await contexto.exports.buscarPontuacaoJardim();
  const compacto = await contexto.exports.buscarEstadoJardim(perfil);
  assert.deepEqual(Object.keys(compacto).sort(), ["hoje", "pontuacao"]);
  assert.equal(compacto.pontuacao, completo.pontuacao);
  assert.equal(compacto.hoje, completo.hoje);
});
