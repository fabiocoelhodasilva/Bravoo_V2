const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Executa o carregador real com respostas controladas, sem acessar dados de alunos.
function preparar() {
  const chamadas = { auth: 0, resumo: 0, pontuacao: 0, consultas: [] };
  let falhar = false;
  let numeroResumo = 1;
  const supabase = {
    from(tabela) {
      const consulta = { tabela, filtros: [] };
      const builder = {};
      for (const metodo of ["select", "eq", "gte", "lt", "order"]) {
        builder[metodo] = (...args) => {
          consulta.filtros.push([metodo, ...args]);
          return builder;
        };
      }
      builder.then = (resolvePromise, rejectPromise) => {
        chamadas.consultas.push(consulta);
        return Promise.resolve({
          error: falhar ? new Error("offline") : null,
          data: tabela === "next_sessoes_atividade"
            ? [{ tempo_total_segundos: 119 }, { tempo_total_segundos: 61 }]
            : [
                { data_conquista: "2026-09-15T03:00:00Z" },
                { data_conquista: "2026-09-16T02:59:00Z" },
                { data_conquista: "2026-09-16T03:00:00Z" },
              ],
        }).then(resolvePromise, rejectPromise);
      };
      return builder;
    },
  };
  const mocks = {
    "@/lib/perfis/perfil-client": { async obterPerfilAtivoId() {
      chamadas.auth++;
      return "aluno-teste";
    } },
    "@/lib/supabase/client": { supabase },
    "@/lib/gamificacao/oracao/oracao-dashboard-client": {
      async buscarResumoDashboardOracao(usuarioId) {
        assert.equal(usuarioId, "aluno-teste");
        chamadas.resumo++;
        if (falhar) throw new Error("offline");
        return { minutosHoje: numeroResumo };
      },
    },
    "./jardim-pontuacao-actions": {
      async buscarPontuacaoJardim() {
        chamadas.pontuacao++;
        if (falhar) throw new Error("offline");
        return { pontuacao: numeroResumo };
      },
    },
  };
  const codigo = ts.transpileModule(readFileSync(resolve(__dirname,
    "../lib/gamificacao/jardim/jardim-dados-client.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const contexto = { exports: {}, require: (nome) => {
    assert.ok(mocks[nome], `Dependência inesperada: ${nome}`);
    return mocks[nome];
  }, Intl, Date, Promise, Map, Set, Error };
  vm.runInNewContext(codigo, contexto);
  return {
    criar: contexto.exports.criarCarregadorJardim,
    chamadas,
    falhar: (valor) => { falhar = valor; },
    atualizar: () => { numeroResumo++; },
  };
}

test("preload e clique compartilham requests em andamento e resultados", async () => {
  const ambiente = preparar();
  const dados = ambiente.criar();
  const resumo = dados.resumo();
  assert.equal(resumo, dados.resumo());
  assert.equal(dados.pontuacao(), dados.pontuacao());
  const calendario = dados.progresso("2026-09-01", "2026-10-01");
  assert.equal(calendario, dados.progresso("2026-09-01", "2026-10-01"));
  const [resultado] = await Promise.all([calendario, resumo]);
  assert.equal(resultado.minutos, 3);
  assert.deepEqual([...resultado.diasComDiamante], ["2026-09-15", "2026-09-16"]);
  await dados.progresso("2026-09-01", "2026-10-01");
  assert.equal(ambiente.chamadas.auth, 1);
  assert.equal(ambiente.chamadas.resumo, 1);
  assert.equal(ambiente.chamadas.pontuacao, 1);
  assert.equal(ambiente.chamadas.consultas.length, 2);
  for (const consulta of ambiente.chamadas.consultas) {
    assert.ok(consulta.filtros.some(([operador, , valor]) => operador === "gte" && valor === "2026-09-01T00:00:00-03:00"));
    assert.ok(consulta.filtros.some(([operador, , valor]) => operador === "lt" && valor === "2026-10-01T00:00:00-03:00"));
  }
});

test("preload antecipa mês e ano sem repetir consultas ao reabrir", async () => {
  const ambiente = preparar();
  const dados = ambiente.criar();
  await Promise.all([dados.preloadProgresso(), dados.preloadProgresso()]);
  assert.equal(ambiente.chamadas.consultas.length, 4);
  assert.equal(ambiente.chamadas.auth, 1);
});

test("falhas de preload não impedem uma nova tentativa", async () => {
  const ambiente = preparar();
  const dados = ambiente.criar();
  ambiente.falhar(true);
  await assert.rejects(dados.resumo());
  await assert.rejects(dados.pontuacao());
  const falhas = await dados.preloadProgresso();
  assert.ok(falhas.every((resultado) => resultado.status === "rejected"));
  ambiente.falhar(false);
  await dados.resumo();
  await dados.pontuacao();
  const sucesso = await dados.preloadProgresso();
  assert.ok(sucesso.every((resultado) => resultado.status === "fulfilled"));
});

test("gravações invalidam resultados e cada visita tem seu próprio cache", async () => {
  const ambiente = preparar();
  const dados = ambiente.criar();
  assert.equal((await dados.resumo()).minutosHoje, 1);
  await dados.preloadProgresso();
  ambiente.atualizar();
  dados.invalidar();
  assert.equal((await dados.resumo()).minutosHoje, 2);
  await dados.preloadProgresso();
  assert.equal(ambiente.chamadas.consultas.length, 8);
  await ambiente.criar().resumo();
  assert.equal(ambiente.chamadas.auth, 2);
  assert.equal(ambiente.chamadas.resumo, 3);
});
